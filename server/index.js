import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js';
import * as db from './db.js';
import { discoverProviders } from './services/discoveryService.js';
import { sendRFQEmail, generateRFQEmail } from './services/emailService.js';
import { parseQuoteText } from './services/quoteParser.js';
import { rankAndCompareQuotes } from './services/scoringEngine.js';

const app = express();
app.use(cors());
app.use(express.json());

// Health check & environment status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    phase: 'Phase 1 - Discovery, Deals, Email Outreach & Comparison',
    emailConfigured: config.email.isConfigured,
    emailService: config.email.service,
    googlePlacesEnabled: Boolean(config.googlePlacesApiKey)
  });
});

// 1. Jobs API
app.get('/api/jobs', (req, res) => {
  const jobs = db.getJobs();
  res.json(jobs);
});

app.post('/api/jobs', (req, res) => {
  const { title, serviceType, zipCode, symptoms, unitDetails, urgency, contactName, contactPhone, contactEmail } = req.body;
  if (!serviceType || !zipCode) {
    return res.status(400).json({ error: 'Service Type and ZIP code are required.' });
  }

  const newJob = {
    id: uuidv4(),
    title: title || `${serviceType} - ${zipCode}`,
    serviceType,
    zipCode,
    symptoms: symptoms || '',
    unitDetails: unitDetails || '',
    urgency: urgency || 'Standard (24-48 hrs)',
    contactName: contactName || '',
    contactPhone: contactPhone || '',
    contactEmail: contactEmail || '',
    status: 'open'
  };

  db.saveJob(newJob);
  res.status(201).json(newJob);
});

app.get('/api/jobs/:id', (req, res) => {
  const job = db.getJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.delete('/api/jobs/:id', (req, res) => {
  db.deleteJob(req.params.id);
  res.json({ success: true });
});

// 2. Multi-Source Discovery & Promo Scout
app.post('/api/jobs/:id/discover', async (req, res) => {
  const job = db.getJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  try {
    const { providers, discoveryLinks } = await discoverProviders(job);
    db.saveProviders(providers);
    res.json({
      jobId: job.id,
      providers,
      discoveryLinks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jobs/:id/providers', (req, res) => {
  const providers = db.getProvidersByJob(req.params.id);
  res.json(providers);
});

// 3. Email Outreach (Phase 1)
app.post('/api/jobs/:id/outreach/preview', (req, res) => {
  const job = db.getJobById(req.params.id);
  const { providerId } = req.body;
  const providers = db.getProvidersByJob(req.params.id);
  const provider = providers.find(p => p.id === providerId);

  if (!job || !provider) {
    return res.status(404).json({ error: 'Job or Provider not found' });
  }

  const preview = generateRFQEmail(job, provider);
  res.json(preview);
});

app.post('/api/jobs/:id/outreach/send', async (req, res) => {
  const job = db.getJobById(req.params.id);
  const { providerId } = req.body;
  const providers = db.getProvidersByJob(req.params.id);
  const provider = providers.find(p => p.id === providerId);

  if (!job || !provider) {
    return res.status(404).json({ error: 'Job or Provider not found' });
  }

  const result = await sendRFQEmail(job, provider);
  
  // Update provider status in DB
  db.updateProvider(provider.id, {
    status: 'contacted',
    contactedAt: new Date().toISOString(),
    outreachMode: result.mode
  });

  res.json(result);
});

// 4. Quote Ingestion & Normalizer
app.post('/api/jobs/:id/quotes/parse', (req, res) => {
  const job = db.getJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const { providerId, rawText } = req.body;
  const providers = db.getProvidersByJob(req.params.id);
  const provider = providers.find(p => p.id === providerId) || {};

  const parsedQuote = parseQuoteText(rawText, {
    jobId: job.id,
    providerId: provider.id || '',
    providerName: provider.name || 'Contractor',
    promo: (provider.promotions && provider.promotions[0]) || null
  });

  db.saveQuote(parsedQuote);

  if (provider.id) {
    db.updateProvider(provider.id, { status: 'quoted' });
  }

  res.json(parsedQuote);
});

// 5. Comparison Matrix & Reasoning Engine
app.get('/api/jobs/:id/matrix', (req, res) => {
  const quotes = db.getQuotesByJob(req.params.id);
  const providers = db.getProvidersByJob(req.params.id);

  const rankedMatrix = rankAndCompareQuotes(quotes, providers);
  res.json({
    jobId: req.params.id,
    totalQuotes: quotes.length,
    matrix: rankedMatrix
  });
});

app.listen(config.port, () => {
  console.log(`[BestQuoteFinder] Backend running at http://localhost:${config.port}`);
});
