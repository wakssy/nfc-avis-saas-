interface Props {
  scans30: number;
  avisDaily: { date: string; nombreAvis: number | null }[];
}

function ConversionEstimate({ scans30, avisDaily }: Props) {
  const known = avisDaily.filter((d) => d.nombreAvis !== null);

  if (known.length < 28) {
    return null;
  }

  const first = known[0];
  const last = known[known.length - 1];
  const avisIncrease = last.nombreAvis! - first.nombreAvis!;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <p className="section-title">Estimation du taux de conversion</p>
      {scans30 === 0 ? (
        <p className="subtitle">Pas assez de scans sur les 30 derniers jours pour estimer un taux de conversion.</p>
      ) : (
        <p style={{ fontSize: 15, marginBottom: 4 }}>
          <strong>{avisIncrease}</strong> nouvel(aux) avis pour <strong>{scans30}</strong> scans sur les 30 derniers
          jours, soit environ <strong>{Math.round((avisIncrease / scans30) * 100)}%</strong>.
        </p>
      )}
      <p className="subtitle" style={{ fontSize: 12, marginTop: 4 }}>
        Estimation approximative par corrélation — il n'existe aucun lien direct entre un scan précis et un avis
        laissé sur Google.
      </p>
    </div>
  );
}

export default ConversionEstimate;
