interface Position {
  nom: string;
  nombreAvis: number;
  estClient: boolean;
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function PositionnementGauge({ positions }: { positions: Position[] }) {
  const width = 700;
  const paddingX = 32;
  const axisY = 56;

  const max = Math.max(...positions.map((p) => p.nombreAvis), 1) * 1.08;

  const points = positions
    .map((p) => ({
      ...p,
      x: paddingX + (p.nombreAvis / max) * (width - 2 * paddingX),
    }))
    .sort((a, b) => a.x - b.x);

  const labelRows = points.map((p, i) => {
    const prev = points[i - 1];
    const tooClose = prev && p.x - prev.x < 90;
    return tooClose ? 1 : 0;
  });

  const height = 56 + 40 + (labelRows.some((r) => r === 1) ? 16 : 0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1={paddingX} x2={width - paddingX} y1={axisY} y2={axisY} stroke="var(--gridline)" strokeWidth={2} />

      {points.map((p) =>
        p.estClient ? (
          <text
            key={`label-top-${p.nom}`}
            x={p.x}
            y={axisY - 20}
            fontSize="12"
            fontWeight={700}
            textAnchor="middle"
            fill="var(--brand)"
          >
            Vous
          </text>
        ) : null
      )}

      {points.map((p) => (
        <circle
          key={`dot-${p.nom}`}
          cx={p.x}
          cy={axisY}
          r={p.estClient ? 8 : 5.5}
          fill={p.estClient ? 'var(--brand)' : 'var(--text-muted)'}
          stroke="var(--surface)"
          strokeWidth={2}
        />
      ))}

      {points.map((p, i) => (
        <text
          key={`label-bottom-${p.nom}`}
          x={p.x}
          y={axisY + 22 + labelRows[i] * 16}
          fontSize="11"
          textAnchor="middle"
          fill={p.estClient ? 'var(--brand)' : 'var(--text-secondary)'}
          fontWeight={p.estClient ? 600 : 400}
        >
          {p.estClient ? `${p.nombreAvis} avis` : `${truncate(p.nom, 14)} · ${p.nombreAvis}`}
        </text>
      ))}
    </svg>
  );
}

export default PositionnementGauge;
