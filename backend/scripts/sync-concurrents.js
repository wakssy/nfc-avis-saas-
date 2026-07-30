require('dotenv').config();
const pool = require('../src/db');
const { getPlaceDetails } = require('../src/lib/googlePlaces');

async function syncConcurrents() {
  const { rows: concurrents } = await pool.query(
    'SELECT etablissement_id, concurrent_place_id, concurrent_nom FROM concurrents'
  );

  console.log(`Synchronisation de ${concurrents.length} concurrent(s)...`);

  for (const c of concurrents) {
    try {
      const { rating, userRatingCount } = await getPlaceDetails(c.concurrent_place_id);

      if (rating === null || userRatingCount === null) {
        console.warn(`${c.concurrent_nom}: réponse incomplète de Places API, ignoré`);
        continue;
      }

      await pool.query(
        `INSERT INTO concurrents_historique (etablissement_id, concurrent_place_id, concurrent_nom, date, nombre_avis, note_moyenne)
         VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)
         ON CONFLICT (etablissement_id, concurrent_place_id, date)
         DO UPDATE SET nombre_avis = EXCLUDED.nombre_avis, note_moyenne = EXCLUDED.note_moyenne, concurrent_nom = EXCLUDED.concurrent_nom`,
        [c.etablissement_id, c.concurrent_place_id, c.concurrent_nom, userRatingCount, rating]
      );

      console.log(`${c.concurrent_nom}: ${userRatingCount} avis, note ${rating}`);
    } catch (err) {
      console.error(`${c.concurrent_nom}: échec de la synchronisation`, err.message);
    }
  }

  await pool.end();
}

syncConcurrents().catch((err) => {
  console.error('Échec de la synchronisation des concurrents:', err);
  process.exit(1);
});
