interface DayCount {
  date: string;
  count: number;
}

function barPath(x: number, yTop: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, height / 2, width / 2);
  const yBottom = yTop + height;

  if (height <= 0) return '';

  return `
    M ${x} ${yBottom}
    L ${x} ${yTop + r}
    Q ${x} ${yTop} ${x + r} ${yTop}
    L ${x + width - r} ${yTop}
    Q ${x + width} ${yTop} ${x + width} ${yTop + r}
    L ${x + width} ${yBottom}
    Z
  `;
}

function formatDay(dateStr: string) {
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

function BarChart({ data }: { data: DayCount[] }) {
  const width = 700;
  const height = 220;
  const paddingTop = 24;
  const paddingBottom = 24;
  const chartHeight = height - paddingTop - paddingBottom;
  const max = Math.max(1, ...data.map((d) => d.count));

  const slotWidth = width / data.length;
  const barWidth = Math.min(24, slotWidth - 3);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[0, 0.5, 1].map((fraction) => {
        const y = paddingTop + chartHeight * (1 - fraction);
        return (
          <line
            key={fraction}
            x1={0}
            x2={width}
            y1={y}
            y2={y}
            stroke="var(--gridline)"
            strokeWidth={1}
          />
        );
      })}
      <text x={4} y={paddingTop - 8} fontSize="11" fill="var(--text-muted)">
        {max}
      </text>

      {data.map((d, i) => {
        const barHeight = (d.count / max) * chartHeight;
        const x = i * slotWidth + (slotWidth - barWidth) / 2;
        const yTop = paddingTop + (chartHeight - barHeight);
        const showLabel = i % 5 === 0 || i === data.length - 1;

        return (
          <g key={d.date}>
            <path d={barPath(x, yTop, barWidth, barHeight, 4)} fill="var(--brand)">
              <title>{`${formatDay(d.date)} : ${d.count} scan${d.count > 1 ? 's' : ''}`}</title>
            </path>
            {showLabel && (
              <text
                x={i * slotWidth + slotWidth / 2}
                y={height - 4}
                fontSize="10"
                textAnchor="middle"
                fill="var(--text-muted)"
              >
                {formatDay(d.date)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default BarChart;
