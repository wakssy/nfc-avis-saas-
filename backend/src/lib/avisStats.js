const pool = require('../db');

async function getAvisHistorique(etablissementId) {
  const { rows } = await pool.query(
    `SELECT date, nombre_avis, note_moyenne FROM avis_historique
     WHERE etablissement_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
     ORDER BY date`,
    [etablissementId]
  );

  const map = new Map(
    rows.map((r) => [r.date, { nombreAvis: r.nombre_avis, noteMoyenne: Number(r.note_moyenne) }])
  );

  const daily = [];
  let lastKnown = null;

  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (map.has(key)) lastKnown = map.get(key);
    daily.push({
      date: key,
      nombreAvis: lastKnown ? lastKnown.nombreAvis : null,
      noteMoyenne: lastKnown ? lastKnown.noteMoyenne : null,
    });
  }

  const dernier = daily[daily.length - 1];

  return {
    daily,
    nombreAvisActuel: dernier.nombreAvis,
    noteMoyenneActuelle: dernier.noteMoyenne,
  };
}

module.exports = { getAvisHistorique };
