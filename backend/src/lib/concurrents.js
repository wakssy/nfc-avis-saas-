const pool = require('../db');
const { getPlaceDetails } = require('./googlePlaces');

async function syncConcurrentHistorique(etablissementId, concurrentPlaceId, concurrentNom) {
  const { rating, userRatingCount } = await getPlaceDetails(concurrentPlaceId);
  if (rating === null || userRatingCount === null) {
    return { success: false };
  }

  await pool.query(
    `INSERT INTO concurrents_historique (etablissement_id, concurrent_place_id, concurrent_nom, date, nombre_avis, note_moyenne)
     VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)
     ON CONFLICT (etablissement_id, concurrent_place_id, date)
     DO UPDATE SET nombre_avis = EXCLUDED.nombre_avis, note_moyenne = EXCLUDED.note_moyenne, concurrent_nom = EXCLUDED.concurrent_nom`,
    [etablissementId, concurrentPlaceId, concurrentNom, userRatingCount, rating]
  );

  return { success: true, rating, userRatingCount };
}

async function getPositionnement(etablissementId) {
  const { rows: etabRows } = await pool.query(
    'SELECT positionnement_active FROM etablissements WHERE id = $1',
    [etablissementId]
  );
  if (etabRows.length === 0 || !etabRows[0].positionnement_active) return null;

  const { rows: concurrents } = await pool.query(
    `SELECT DISTINCT ON (concurrent_place_id) concurrent_place_id, concurrent_nom, nombre_avis
     FROM concurrents_historique
     WHERE etablissement_id = $1
     ORDER BY concurrent_place_id, date DESC`,
    [etablissementId]
  );

  if (concurrents.length === 0) return null;

  const { rows: propreRows } = await pool.query(
    `SELECT nombre_avis FROM avis_historique WHERE etablissement_id = $1 ORDER BY date DESC LIMIT 1`,
    [etablissementId]
  );

  if (propreRows.length === 0) return null;

  const client = { nom: 'Vous', nombreAvis: propreRows[0].nombre_avis, estClient: true };
  const autres = concurrents.map((c) => ({
    nom: c.concurrent_nom,
    nombreAvis: c.nombre_avis,
    estClient: false,
  }));

  const positions = [client, ...autres].sort((a, b) => b.nombreAvis - a.nombreAvis);
  const rang = positions.findIndex((e) => e.estClient) + 1;
  const total = positions.length;

  let phrase;
  if (rang === 1) {
    phrase = 'Vous êtes en tête des établissements comparables autour de vous.';
  } else if (rang === total) {
    phrase = 'Vous avez une marge de progression par rapport aux établissements voisins.';
  } else {
    phrase = `Vous êtes ${rang}ème sur ${total} établissements comparables dans votre zone.`;
  }

  return { positions, rang, total, phrase };
}

module.exports = { getPositionnement, syncConcurrentHistorique };
