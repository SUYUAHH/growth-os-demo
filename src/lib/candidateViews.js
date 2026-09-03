export function filterCandidates(candidates = [], options = {}) {
  const { accountId = 'all', status = 'all', tag = 'all', sortBy = 'addedAt' } = options
  const filtered = candidates.filter((candidate) => {
    const accountMatch = accountId === 'all' || candidate.accountId === accountId || (!candidate.accountId && accountId === 'unassigned')
    const statusMatch = status === 'all' || candidate.status === status
    const tagMatch = tag === 'all' || candidate.tags?.includes(tag)
    return accountMatch && statusMatch && tagMatch
  })
  return filtered.sort((left, right) => {
    if (sortBy === 'likes') return Number(right.metrics?.likes || 0) - Number(left.metrics?.likes || 0)
    if (sortBy === 'comments') return Number(right.metrics?.replies || 0) - Number(left.metrics?.replies || 0)
    if (sortBy === 'followers') return Number(right.author?.followers || 0) - Number(left.author?.followers || 0)
    return new Date(right.addedAt || right.createdAt || 0).getTime() - new Date(left.addedAt || left.createdAt || 0).getTime()
  })
}
