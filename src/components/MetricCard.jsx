export default function MetricCard({ label, value, detail, trend, tone = 'default' }) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail"><span className="metric-trend">{trend}</span>{detail}</div>
    </div>
  )
}
