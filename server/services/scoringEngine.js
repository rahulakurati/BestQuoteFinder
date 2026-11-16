/**
 * Multi-Factor Quote Comparison & Reasoning Engine
 */
export function rankAndCompareQuotes(quotes, providers) {
  if (!quotes || quotes.length === 0) return [];

  const providerMap = new Map(providers.map(p => [p.id, p]));

  const scoredQuotes = quotes.map(quote => {
    const provider = providerMap.get(quote.providerId) || {
      rating: 4.5,
      reviewCount: 30,
      name: quote.providerName || 'Contractor'
    };

    // 1. Calculate Cost Score (0 - 100)
    // Lower diagnostic fee & lower total price gives higher score
    const effectiveDiagnostic = quote.diagnosticCredited ? 0 : quote.diagnosticFee;
    let costScore = 80;
    if (effectiveDiagnostic === 0) costScore += 15;
    else if (effectiveDiagnostic <= 50) costScore += 5;
    else costScore -= Math.min(25, effectiveDiagnostic / 4);

    if (quote.estimatedTotalMax > 0) {
      if (quote.estimatedTotalMax <= 250) costScore += 10;
      else if (quote.estimatedTotalMax > 600) costScore -= 10;
    }
    costScore = Math.max(20, Math.min(100, Math.round(costScore)));

    // 2. Calculate Speed / Availability Score (0 - 100)
    let speedScore = 70;
    const availLower = (quote.earliestAvailability || '').toLowerCase();
    if (availLower.includes('today') || availLower.includes('2-4 hours') || availLower.includes('same-day')) {
      speedScore = 98;
    } else if (availLower.includes('tomorrow')) {
      speedScore = 85;
    } else if (availLower.includes('2-3 days')) {
      speedScore = 60;
    }

    // 3. Calculate Reputation Score (0 - 100)
    const rating = provider.rating || 4.5;
    const reviewCount = provider.reviewCount || 20;
    let reputationScore = Math.round((rating / 5.0) * 85);
    if (reviewCount > 50) reputationScore += 10;
    if (reviewCount > 100) reputationScore += 5;
    reputationScore = Math.max(30, Math.min(100, reputationScore));

    // 4. Warranty & Guarantee Score (0 - 100)
    let warrantyScore = 65;
    const warLower = (quote.warrantyLabor || '').toLowerCase();
    if (warLower.includes('1 year') || warLower.includes('lifetime')) warrantyScore = 95;
    else if (warLower.includes('6 month') || warLower.includes('90 day')) warrantyScore = 80;

    // Overall Weighted Score: 35% Cost + 25% Speed + 25% Reputation + 15% Warranty
    const overallScore = Math.round(
      costScore * 0.35 +
      speedScore * 0.25 +
      reputationScore * 0.25 +
      warrantyScore * 0.15
    );

    return {
      ...quote,
      provider,
      scores: {
        cost: costScore,
        speed: speedScore,
        reputation: reputationScore,
        warranty: warrantyScore,
        overall: overallScore
      },
      badges: []
    };
  });

  // Sort descending by overall score
  scoredQuotes.sort((a, b) => b.scores.overall - a.scores.overall);

  // Assign Badges
  if (scoredQuotes.length > 0) {
    scoredQuotes[0].badges.push({ label: 'Best Overall Value', type: 'gold', icon: 'Trophy' });
  }

  // Find Fastest Fix
  const fastest = [...scoredQuotes].sort((a, b) => b.scores.speed - a.scores.speed)[0];
  if (fastest && !fastest.badges.some(b => b.label === 'Best Overall Value')) {
    fastest.badges.push({ label: 'Fastest Response', type: 'cyan', icon: 'Zap' });
  }

  // Find Lowest Diagnostic
  const lowestDiag = [...scoredQuotes].sort((a, b) => {
    const aFee = a.diagnosticCredited ? 0 : a.diagnosticFee;
    const bFee = b.diagnosticCredited ? 0 : b.diagnosticFee;
    return aFee - bFee;
  })[0];
  if (lowestDiag && !lowestDiag.badges.some(b => b.label === lowestDiag.label)) {
    lowestDiag.badges.push({ label: 'Lowest Diagnostic Fee', type: 'green', icon: 'DollarSign' });
  }

  // Find Highest Rated
  const highestRated = [...scoredQuotes].sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0))[0];
  if (highestRated && highestRated.provider?.rating >= 4.8 && !highestRated.badges.some(b => b.label === 'Best Overall Value')) {
    highestRated.badges.push({ label: 'Top Customer Rating', type: 'purple', icon: 'Star' });
  }

  return scoredQuotes;
}
