require('dotenv').config();
const pool = require('../src/db');
const { syncAvisEtablissement } = require('../src/lib/avisStats');

async function syncAvis() {
  const { rows: etablissements } = await pool.query(
    'SELECT id, nom, place_id FROM etablissements WHERE place_id IS NOT NULL'
  );

  console.log(`Synchronisation des avis pour ${etablissements.length} établissement(s)...`);

  for (const etablissement of etablissements) {
    try {
      const result = await syncAvisEtablissement(etablissement.id, etablissement.place_id);
      if (!result.success) {
        console.warn(`${etablissement.nom}: réponse incomplète de Places API, ignoré`);
        continue;
      }
      console.log(`${etablissement.nom}: ${result.userRatingCount} avis, note ${result.rating}`);
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
