require('dotenv').config();
const pool = require('../src/db');
const { getPlaceDetails } = require('../src/lib/googlePlaces');

async function syncAvis() {
  const { rows: etablissements } = await pool.query(
    'SELECT id, nom, place_id FROM etablissements WHERE place_id IS NOT NULL'
  );

  console.log(`Synchronisation des avis pour ${etablissements.length} établissement(s)...`);

  for (const etablissement of etablissements) {
    try {
      const { rating, userRatingCount } = await getPlaceDetails(etablissement.place_id);

      if (rating === null || userRatingCount === null) {
        console.warn(`${etablissement.nom}: réponse incomplète de Places API, ignoré`);
        continue;
      }

      await pool.query(
        `INSERT INTO avis_historique (etablissement_id, date, nombre_avis, note_moyenne)
         VALUES ($1, CURRENT_DATE, $2, $3)
         ON CONFLICT (etablissement_id, date)
         DO UPDATE SET nombre_avis = EXCLUDED.nombre_avis, note_moyenne = EXCLUDED.note_moyenne`,
        [etablissement.id, userRatingCount, rating]
      );

      console.log(`${etablissement.nom}: ${userRatingCount} avis, note ${rating}`);
    } catch (err) {
      console.error(`${etablissement.nom}: échec de la synchronisation`, err.message);
    }
  }

  await pool.end();
}

syncAvis().catch((err) => {
  console.error('Échec de la synchronisation des avis:', err);
  process.exit(1);
});
