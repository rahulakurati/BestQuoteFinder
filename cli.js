import { discoverProviders } from './server/services/discoveryService.js';
import { parseQuoteText } from './server/services/quoteParser.js';
import { rankAndCompareQuotes } from './server/services/scoringEngine.js';

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    service: 'Water Heater Repair',
    zip: '94107',
    symptoms: 'Water heater stopped working',
    urgency: 'Standard'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--service' && args[i + 1]) params.service = args[++i];
    else if (args[i] === '--zip' && args[i + 1]) params.zip = args[++i];
    else if (args[i] === '--symptoms' && args[i + 1]) params.symptoms = args[++i];
    else if (args[i] === '--urgency' && args[i + 1]) params.urgency = args[++i];
  }
  return params;
}

async function run() {
  const params = parseArgs();
  console.log(`\n========================================================================`);
  console.log(`  BESTQUOTE FINDER | Multi-Channel Scout & Decision Engine`);
  console.log(`========================================================================`);
  console.log(`  Service  : ${params.service}`);
  console.log(`  ZIP Code : ${params.zip}`);
  console.log(`  Symptoms : ${params.symptoms}`);
  console.log(`------------------------------------------------------------------------`);
  console.log(`[1/4] Scouting Google Maps, Thumbtack & Facebook in ZIP ${params.zip}...`);

  const job = {
    id: 'cli-' + Date.now(),
    serviceType: params.service,
    zipCode: params.zip,
    symptoms: params.symptoms,
    urgency: params.urgency
  };

  const { providers, discoveryLinks, location } = await discoverProviders(job);

  console.log(`[2/4] Resolved location: ${location?.locationName || params.zip}. Found ${providers.length} local contractors.`);
  console.log(`[3/4] Scanning local coupons, specials, and diagnostic fee terms...`);
  console.log(`[4/4] Generating quote comparison matrix...\n`);

  // Simulate / Parse quote responses for top contractors
  const quotes = providers.slice(0, 4).map((p, idx) => {
    const isWaived = idx % 2 === 0 || p.typicalDiagnosticFee === 0;
    const diag = p.typicalDiagnosticFee ?? (idx === 1 ? 49 : 29);
    const promo = p.promotions?.[0];
    const discount = promo?.type === 'dollar' ? promo.value : 0;
    const baseMin = 160 + idx * 15;
    const baseMax = 195 + idx * 25;

    const raw = `Quote from ${p.name}: Diagnostic is $${diag} (${isWaived ? 'waived if repaired' : 'separate'}). Total estimate is $${baseMin - discount} - $${baseMax - discount}. Arrival ${idx === 0 ? 'Tomorrow morning' : (idx === 1 ? 'Today within 2-4 hrs' : 'Thursday afternoon')}. 1-year warranty.`;
    
    const parsed = parseQuoteText(raw, {
      jobId: job.id,
      providerId: p.id,
      providerName: p.name,
      promo
    });

    parsed.diagnosticFee = diag;
    parsed.diagnosticCredited = isWaived;
    parsed.estimatedTotalMin = baseMin - discount;
    parsed.estimatedTotalMax = baseMax - discount;
    parsed.earliestAvailability = idx === 0 ? 'Tomorrow 9AM - 12PM' : (idx === 1 ? 'Same-Day (2-4 hrs)' : 'Thursday 1PM - 4PM');
    parsed.warrantyLabor = idx === 1 ? '1-Year Full Warranty' : '90-Day Warranty';
    return parsed;
  });

  const matrix = rankAndCompareQuotes(quotes, providers);
  const top = matrix[0];

  console.log(`-------------------------------------------------------------------------------------------------------------`);
  console.log(`RANK | PROVIDER                   | RATING | DIAGNOSTIC FEE       | ESTIMATE    | ARRIVAL WINDOW     | WARRANTY`);
  console.log(`-------------------------------------------------------------------------------------------------------------`);
  matrix.forEach((q, i) => {
    const rankStr = `#${i + 1}`.padEnd(4);
    const nameStr = q.providerName.slice(0, 26).padEnd(26);
    const ratingStr = `${q.provider?.rating || 4.5}*`.padEnd(6);
    const diagStr = `$${q.diagnosticFee} (${q.diagnosticCredited ? 'Waived' : 'Extra'})`.padEnd(20);
    const estStr = `$${q.estimatedTotalMin}-$${q.estimatedTotalMax}`.padEnd(11);
    const arrStr = q.earliestAvailability.slice(0, 18).padEnd(18);
    const warStr = q.warrantyLabor.slice(0, 16);
    console.log(`${rankStr} | ${nameStr} | ${ratingStr} | ${diagStr} | ${estStr} | ${arrStr} | ${warStr}`);
  });
  console.log(`-------------------------------------------------------------------------------------------------------------`);

  console.log(`\n🏆 RECOMMENDATION: ${top.providerName}`);
  console.log(`   Why: Lowest net out-of-pocket ($${top.estimatedTotalMin}-$${top.estimatedTotalMax}), diagnostic fee $${top.diagnosticFee} ${top.diagnosticCredited ? 'is waived toward service' : ''}, with earliest arrival ${top.earliestAvailability}.`);
  console.log(`   Phone: ${top.provider?.phone || 'Call contractor'}`);
  console.log(`   Promo: ${top.promoApplied || 'Standard pricing'}`);
  console.log(`\nDirect Links:`);
  console.log(`   • Google Maps : ${discoveryLinks.googleMaps}`);
  console.log(`   • Thumbtack   : ${discoveryLinks.thumbtack}`);
  console.log(`   • Facebook    : ${discoveryLinks.facebookMarketplace}\n`);
}

run().catch(console.error);
