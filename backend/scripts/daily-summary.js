require('dotenv').config();
const pool = require('../src/db');
const { getAvisHistorique } = require('../src/lib/avisStats');
const { sendDailySummary } = require('../src/lib/emailReports');

async function run() {
  const { rows: etablissements } = await pool.query(
    `SELECT id, nom, email, message_relance FROM etablissements
     WHERE password_hash IS NOT NULL AND email IS NOT NULL`
  );

  const startOfToday = new Date(Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate()
  ));

  console.log(`Récaps quotidiens à évaluer pour ${etablissements.length} établissement(s)...`);

  for (const e of etablissements) {
    try {
      const { rows: scanRows } = await pool.query(
        'SELECT COUNT(*)::int AS count FROM scans WHERE etablissement_id = $1 AND date_scan >= $2',
        [e.id, startOfToday]
      );
      const scansToday = scanRows[0].count;

      const avis = await getAvisHistorique(e.id);
      const daily = avis.daily;
      const avisToday = daily[daily.length - 1].nombreAvis;
      const avisYesterday = daily[daily.length - 2].nombreAvis;
      const newAvisToday = avisToday !== null && avisYesterday !== null ? avisToday - avisYesterday : 0;

      const { rows: avisEnAttenteRows } = await pool.query(
        'SELECT COUNT(*)::int AS count FROM avis_recus WHERE etablissement_id = $1 AND reponse_marquee_traitee = false',
        [e.id]
      );
      const avisEnAttente = avisEnAttenteRows[0].count;

      if (scansToday === 0 && newAvisToday <= 0 && avisEnAttente === 0) {
        console.log(`${e.nom}: aucune activité aujourd'hui, pas d'email`);
        continue;
      }

      await sendDailySummary({
        to: e.email,
        nom: e.nom,
        messageRelance: e.message_relance,
        scansToday,
        newAvisToday: Math.max(0, newAvisToday),
        noteMoyenneActuelle: avis.noteMoyenneActuelle,
        avisEnAttente,
      });

      console.log(`${e.nom}: email envoyé (${scansToday} scans, ${newAvisToday} nouveaux avis)`);
    } catch (err) {
      console.error(`${e.nom}: échec du récap quotidien`, err.message);
    }
  }

  await pool.end();
}

run().catch((err) => {
  console.error('Échec du récap quotidien:', err);
  process.exit(1);
});
