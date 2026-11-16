import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
const storePath = path.join(dataDir, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial state if store doesn't exist
const initialState = {
  jobs: [],
  providers: [],
  quotes: []
};

// Helper to read database
export function readDB() {
  try {
    if (!fs.existsSync(storePath)) {
      fs.writeFileSync(storePath, JSON.stringify(initialState, null, 2), 'utf-8');
      return initialState;
    }
    const raw = fs.readFileSync(storePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading store.json, resetting to initial:', err.message);
    return initialState;
  }
}

// Helper to write database
export function writeDB(data) {
  try {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing to store.json:', err.message);
    return false;
  }
}

// Job operations
export function getJobs() {
  const db = readDB();
  return db.jobs || [];
}

export function getJobById(id) {
  const db = readDB();
  return (db.jobs || []).find(j => j.id === id) || null;
}

export function saveJob(job) {
  const db = readDB();
  const existingIdx = db.jobs.findIndex(j => j.id === job.id);
  if (existingIdx >= 0) {
    db.jobs[existingIdx] = { ...db.jobs[existingIdx], ...job, updatedAt: new Date().toISOString() };
  } else {
    db.jobs.unshift({
      ...job,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  writeDB(db);
  return job;
}

export function deleteJob(id) {
  const db = readDB();
  db.jobs = db.jobs.filter(j => j.id !== id);
  db.providers = db.providers.filter(p => p.jobId !== id);
  db.quotes = db.quotes.filter(q => q.jobId !== id);
  writeDB(db);
  return true;
}

// Provider operations
export function getProvidersByJob(jobId) {
  const db = readDB();
  return (db.providers || []).filter(p => p.jobId === jobId);
}

export function saveProviders(providers) {
  const db = readDB();
  providers.forEach(newProv => {
    const idx = db.providers.findIndex(p => p.id === newProv.id || (p.jobId === newProv.jobId && p.name.toLowerCase() === newProv.name.toLowerCase()));
    if (idx >= 0) {
      db.providers[idx] = { ...db.providers[idx], ...newProv, updatedAt: new Date().toISOString() };
    } else {
      db.providers.push({
        ...newProv,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });
  writeDB(db);
  return true;
}

export function updateProvider(id, updates) {
  const db = readDB();
  const idx = db.providers.findIndex(p => p.id === id);
  if (idx >= 0) {
    db.providers[idx] = { ...db.providers[idx], ...updates, updatedAt: new Date().toISOString() };
    writeDB(db);
    return db.providers[idx];
  }
  return null;
}

// Quote operations
export function getQuotesByJob(jobId) {
  const db = readDB();
  return (db.quotes || []).filter(q => q.jobId === jobId);
}

export function saveQuote(quote) {
  const db = readDB();
  const idx = db.quotes.findIndex(q => q.id === quote.id);
  if (idx >= 0) {
    db.quotes[idx] = { ...db.quotes[idx], ...quote, updatedAt: new Date().toISOString() };
  } else {
    db.quotes.unshift({
      ...quote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  writeDB(db);
  return quote;
}
