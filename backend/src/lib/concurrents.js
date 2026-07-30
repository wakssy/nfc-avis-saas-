const pool = require('../db');

async function getPositionnement(etablissementId) {
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

module.exports = { getPositionnement };
