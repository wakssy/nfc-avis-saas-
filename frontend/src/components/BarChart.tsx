interface DayCount {
  date: string;
  count: number;
}

function BarChart({ data }: { data: DayCount[] }) {
  const width = 700;
  const height = 180;
  const chartHeight = height - 24;
  const max = Math.max(1, ...data.map((d) => d.count));
  const barWidth = width / data.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
      {data.map((d, i) => {
        const barHeight = (d.count / max) * chartHeight;
        const x = i * barWidth;
        const y = chartHeight - barHeight;
        const showLabel = i % 5 === 0;

        return (
          <g key={d.date}>
            <rect
              x={x + 1}
              y={y}
              width={Math.max(barWidth - 2, 1)}
              height={barHeight}
              fill="#4f46e5"
            >
              <title>{`${d.date}: ${d.count}`}</title>
            </rect>
            {showLabel && (
              <text x={x + barWidth / 2} y={height - 4} fontSize="9" textAnchor="middle">
                {d.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default BarChart;
