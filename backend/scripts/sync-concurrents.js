require('dotenv').config();
const pool = require('../src/db');
const { syncConcurrentHistorique } = require('../src/lib/concurrents');

async function syncConcurrents() {
  const { rows: concurrents } = await pool.query(
    'SELECT etablissement_id, concurrent_place_id, concurrent_nom FROM concurrents'
  );

  console.log(`Synchronisation de ${concurrents.length} concurrent(s)...`);

  for (const c of concurrents) {
    try {
      const result = await syncConcurrentHistorique(c.etablissement_id, c.concurrent_place_id, c.concurrent_nom);
      if (!result.success) {
        console.warn(`${c.concurrent_nom}: réponse incomplète de Places API, ignoré`);
        continue;
      }
      console.log(`${c.concurrent_nom}: ${result.userRatingCount} avis, note ${result.rating}`);
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
