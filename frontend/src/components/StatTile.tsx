interface Trend {
  diff: number;
  label: string;
}

function TrendBadge({ trend }: { trend: Trend }) {
  const direction = trend.diff > 0 ? 'up' : trend.diff < 0 ? 'down' : 'flat';
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '–';
  const sign = trend.diff > 0 ? '+' : '';

  return (
    <span className={`trend trend-${direction}`}>
      {arrow} {sign}
      {trend.diff} {trend.label}
    </span>
  );
}

function StatTile({ label, value, trend }: { label: string; value: number; trend?: Trend }) {
  return (
    <div className="stat-tile">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <div className="value">{value}</div>
        {trend && <TrendBadge trend={trend} />}
      </div>
      <div className="label">{label}</div>
    </div>
  );
}

export default StatTile;
