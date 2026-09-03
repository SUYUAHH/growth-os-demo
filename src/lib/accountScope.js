export function filterByAccount(items = [], accountId = 'all') {
  if (accountId === 'all') return items
  return items.filter((item) => item.accountId === accountId || item.category === accountId)
}

export function accountSnapshot(account = {}, candidates = [], trends = []) {
  const accountCandidates = candidates.filter((item) => item.accountId === account.id || item.category === account.category)
  const accountTrends = trends.filter((item) => item.category === account.category)
  return { candidateCount: accountCandidates.length, hotspotCount: accountTrends.length, health: account.health || 0, metrics: account.metrics || {} }
}
