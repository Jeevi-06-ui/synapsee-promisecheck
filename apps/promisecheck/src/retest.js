/**
 * Retest & Before/After Comparison Engine
 * 
 * Pairs findings for identical carts/journeys across Buggy and Fixed scenarios,
 * highlighting the commercial discrepancies that were corrected.
 */

function buildRetestComparison(findings = []) {
  const journeysMap = new Map();

  for (const item of findings) {
    const jId = item.journeyId;
    if (!journeysMap.has(jId)) {
      journeysMap.set(jId, {
        journeyId: jId,
        journeyName: item.journeyName,
        category: item.category,
        buggy: null,
        fixed: null
      });
    }

    const entry = journeysMap.get(jId);
    if (item.scenario === 'buggy') {
      entry.buggy = item;
    } else if (item.scenario === 'fixed') {
      entry.fixed = item;
    }
  }

  const comparison = [];
  for (const entry of journeysMap.values()) {
    const hasBoth = Boolean(entry.buggy && entry.fixed);
    let resolved = false;

    if (hasBoth) {
      resolved = entry.buggy.verdict === 'MISMATCH' && entry.fixed.verdict === 'PASS';
    }

    comparison.push({
      ...entry,
      hasBoth,
      resolved,
      statusLabel: resolved 
        ? 'CORRECTED IN FIXED SCENARIO' 
        : (hasBoth && entry.fixed.verdict === 'PASS' && entry.buggy.verdict === 'PASS')
          ? 'HONORED IN BOTH'
          : 'STATUS DIVERGENT'
    });
  }

  return comparison;
}

module.exports = {
  buildRetestComparison
};

