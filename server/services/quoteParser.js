import { v4 as uuidv4 } from 'uuid';

/**
 * Intelligent regex and NLP heuristic parser for contractor quote responses
 */
export function parseQuoteText(rawText, metadata = {}) {
  const quote = {
    id: uuidv4(),
    jobId: metadata.jobId || '',
    providerId: metadata.providerId || '',
    providerName: metadata.providerName || 'Contractor',
    rawResponse: rawText,
    diagnosticFee: 0,
    diagnosticCredited: false,
    estimatedLaborMin: 0,
    estimatedLaborMax: 0,
    estimatedTotalMin: 0,
    estimatedTotalMax: 0,
    earliestAvailability: 'Within 24-48 hours',
    warrantyLabor: '30 days standard',
    warrantyParts: '1 year manufacturer',
    promoApplied: '',
    parsedAt: new Date().toISOString()
  };

  const textLower = rawText.toLowerCase();

  // 1. Detect Diagnostic / Service Call Fee
  const diagMatch = rawText.match(/(?:diagnostic|service call|trip fee|dispatch fee)[\s:]*(?:is\s*)?\$?(\d+)/i) ||
                    rawText.match(/\$(\d+)\s*(?:diagnostic|service fee|dispatch)/i);
  if (diagMatch) {
    quote.diagnosticFee = parseInt(diagMatch[1], 10);
  } else if (textLower.includes('free estimate') || textLower.includes('no service fee') || textLower.includes('$0 diagnostic')) {
    quote.diagnosticFee = 0;
  }

  // 2. Detect if Diagnostic Fee is waived / credited toward repair
  if (
    textLower.includes('waived') ||
    textLower.includes('credited') ||
    textLower.includes('applied toward') ||
    textLower.includes('applies to repair') ||
    textLower.includes('goes towards')
  ) {
    quote.diagnosticCredited = true;
  }

  // 3. Detect Total or Repair Estimate Range
  const totalRangeMatch = rawText.match(/\$(\d+)\s*(?:-|to)\s*\$?(\d+)/);
  if (totalRangeMatch) {
    quote.estimatedTotalMin = parseInt(totalRangeMatch[1], 10);
    quote.estimatedTotalMax = parseInt(totalRangeMatch[2], 10);
  } else {
    const singlePriceMatch = rawText.match(/(?:estimate|quote|total|repair cost)[\s:]*(?:is\s*)?\$(\d+)/i);
    if (singlePriceMatch) {
      const price = parseInt(singlePriceMatch[1], 10);
      quote.estimatedTotalMin = price;
      quote.estimatedTotalMax = price;
    }
  }

  // 4. Detect Earliest Availability
  const availMatch = rawText.match(/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s*(?:morning|afternoon|evening|at\s*\d+:\d+|\s*between\s*\d+-\d+)?)/i);
  if (availMatch) {
    quote.earliestAvailability = availMatch[0].trim();
  } else if (textLower.includes('within 2 hours') || textLower.includes('same day')) {
    quote.earliestAvailability = 'Same-Day / Within 2-4 Hours';
  }

  // 5. Detect Warranty
  const warrantyMatch = rawText.match(/(\d+)\s*(?:month|year|day)s?\s*(?:warranty|guarantee)/i);
  if (warrantyMatch) {
    quote.warrantyLabor = warrantyMatch[0].trim();
  }

  // 6. Detect Promotions Applied
  if (metadata.promo) {
    quote.promoApplied = metadata.promo.title;
  } else if (textLower.includes('discount') || textLower.includes('coupon') || textLower.includes('special')) {
    const discountMatch = rawText.match(/\$(\d+)\s*(?:off|discount|coupon)/i);
    if (discountMatch) {
      quote.promoApplied = `$${discountMatch[1]} Promotional Discount`;
    }
  }

  return quote;
}
