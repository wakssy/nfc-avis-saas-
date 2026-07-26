require('dotenv').config();
const pool = require('../src/db');
const { getAvisHistorique } = require('../src/lib/avisStats');
const { sendWeeklyReport } = require('../src/lib/emailReports');

async function run() {
  const isMonday = new Date().getUTCDay() === 1;
  if (!isMonday && process.env.FORCE_WEEKLY !== 'true') {
    console.log("Pas lundi (heure UTC) — rapport hebdomadaire non exécuté aujourd'hui.");
    await pool.end();
    return;
  }

  const { rows: etablissements } = await pool.query(
    `SELECT id, nom, email, message_relance FROM etablissements
     WHERE password_hash IS NOT NULL AND email IS NOT NULL`
  );

  console.log(`Rapports hebdomadaires à envoyer pour ${etablissements.length} établissement(s)...`);

  for (const e of etablissements) {
    try {
      const { rows: scanRows } = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE date_scan >= now() - interval '7 days')::int AS this_week,
           COUNT(*) FILTER (WHERE date_scan >= now() - interval '14 days' AND date_scan < now() - interval '7 days')::int AS last_week
         FROM scans WHERE etablissement_id = $1`,
        [e.id]
      );
      const scansThisWeek = scanRows[0].this_week;
      const scansLastWeek = scanRows[0].last_week;

      const avis = await getAvisHistorique(e.id);
      const daily = avis.daily;
      const avisToday = daily[29].nombreAvis;
      const avis7dAgo = daily[22].nombreAvis;
      const avis14dAgo = daily[15].nombreAvis;

      const avisThisWeek = avisToday !== null && avis7dAgo !== null ? avisToday - avis7dAgo : null;
      const avisLastWeek = avis7dAgo !== null && avis14dAgo !== null ? avis7dAgo - avis14dAgo : null;

      await sendWeeklyReport({
        to: e.email,
        nom: e.nom,
        messageRelance: e.message_relance,
        scansThisWeek,
        scansLastWeek,
        avisThisWeek,
        avisLastWeek,
      });

      console.log(`${e.nom}: rapport hebdomadaire envoyé`);
    } catch (err) {
      console.error(`${e.nom}: échec du rapport hebdomadaire`, err.message);
    }
  }

  await pool.end();
}

run().catch((err) => {
  console.error('Échec du rapport hebdomadaire:', err);
  process.exit(1);
});
