interface DayValue {
  date: string;
  value: number | null;
}

function formatDay(dateStr: string) {
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

function LineChart({ data }: { data: DayValue[] }) {
  const width = 700;
  const height = 220;
  const paddingTop = 24;
  const paddingBottom = 24;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value).filter((v): v is number => v !== null);

  if (values.length === 0) {
    return (
      <p className="subtitle" style={{ padding: '24px 0' }}>
        Pas encore assez de données — revenez dans quelques jours.
      </p>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);

  const points = data
    .map((d, i) => {
      if (d.value === null) return null;
      const x = (i / (data.length - 1)) * width;
      const y = paddingTop + chartHeight * (1 - (d.value - min) / range);
      return { x, y, value: d.value, date: d.date };
    })
    .filter((p): p is { x: number; y: number; value: number; date: string } => p !== null);

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[0, 0.5, 1].map((fraction) => {
        const y = paddingTop + chartHeight * (1 - fraction);
        return <line key={fraction} x1={0} x2={width} y1={y} y2={y} stroke="var(--gridline)" strokeWidth={1} />;
      })}
      <text x={4} y={paddingTop - 8} fontSize="11" fill="var(--text-muted)">
        {max}
      </text>

      <path d={pathD} fill="none" stroke="var(--brand)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      <circle cx={last.x} cy={last.y} r={4} fill="var(--brand)" stroke="var(--surface)" strokeWidth={2} />
      <text x={Math.min(last.x, width - 24)} y={last.y - 10} fontSize="11" fill="var(--text-primary)" fontWeight={600} textAnchor="end">
        {last.value}
      </text>

      {data.map((d, i) => {
        if (i % 5 !== 0 && i !== data.length - 1) return null;
        const isFirst = i === 0;
        const isLast = i === data.length - 1;
        return (
          <text
            key={d.date}
            x={(i / (data.length - 1)) * width}
            y={height - 4}
            fontSize="10"
            textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
            fill="var(--text-muted)"
          >
            {formatDay(d.date)}
          </text>
        );
      })}
    </svg>
  );
}

export default LineChart;
