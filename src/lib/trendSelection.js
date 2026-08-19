export function getSelectedVisibleTrend(visibleTrends = [], selectedTrend = {}) {
  return visibleTrends.find((trend) => trend.id === selectedTrend.id) || visibleTrends[0] || selectedTrend
}
