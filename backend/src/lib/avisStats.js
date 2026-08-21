const pool = require('../db');
const { getPlaceDetails } = require('./googlePlaces');

async function syncAvisEtablissement(etablissementId, placeId) {
  const { rating, userRatingCount } = await getPlaceDetails(placeId);
  if (rating === null || userRatingCount === null) {
    return { success: false };
  }

  await pool.query(
    `INSERT INTO avis_historique (etablissement_id, date, nombre_avis, note_moyenne)
     VALUES ($1, CURRENT_DATE, $2, $3)
     ON CONFLICT (etablissement_id, date)
     DO UPDATE SET nombre_avis = EXCLUDED.nombre_avis, note_moyenne = EXCLUDED.note_moyenne`,
    [etablissementId, userRatingCount, rating]
  );

  return { success: true, rating, userRatingCount };
}

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

module.exports = { getAvisHistorique, syncAvisEtablissement };
