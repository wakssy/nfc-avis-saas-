require('dotenv').config();
const pool = require('../src/db');
const { getPlaceReviews } = require('../src/lib/googlePlaces');
const { genererReponseAvis } = require('../src/lib/claude');

async function syncAvisRecents() {
  const { rows: etablissements } = await pool.query(
    'SELECT id, nom, place_id FROM etablissements WHERE place_id IS NOT NULL'
  );

  console.log(`Recherche de nouveaux avis pour ${etablissements.length} établissement(s)...`);

  for (const etab of etablissements) {
    try {
      const reviews = await getPlaceReviews(etab.place_id);

      for (const r of reviews) {
        const existing = await pool.query(
          'SELECT id FROM avis_recus WHERE etablissement_id = $1 AND auteur = $2 AND date_avis = $3 AND note = $4',
          [etab.id, r.auteur, r.dateAvis, r.note]
        );
        if (existing.rows.length > 0) continue;

        let reponseSuggeree = null;
        try {
          reponseSuggeree = await genererReponseAvis({
            nomEtablissement: etab.nom,
            texteAvis: r.texte,
            note: r.note,
          });
        } catch (err) {
          console.error(`${etab.nom}: échec de la génération de réponse IA pour l'avis de ${r.auteur}:`, err.message);
        }

        await pool.query(
          `INSERT INTO avis_recus (etablissement_id, auteur, note, texte_avis, date_avis, reponse_suggeree)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [etab.id, r.auteur, r.note, r.texte, r.dateAvis, reponseSuggeree]
        );

        console.log(
          `${etab.nom}: nouvel avis de ${r.auteur} (${r.note}/5)${reponseSuggeree ? ' — réponse suggérée générée' : ' — sans réponse (échec IA)'}`
        );
      }
    } catch (err) {
      console.error(`${etab.nom}: échec de la synchronisation des avis récents:`, err.message);
    }
  }

  await pool.end();
}

syncAvisRecents().catch((err) => {
  console.error('Échec de la synchronisation des avis récents:', err);
  process.exit(1);
});
