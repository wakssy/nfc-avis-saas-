require('dotenv').config();
const pool = require('../src/db');
const { getAvisHistorique } = require('../src/lib/avisStats');
const { getPositionnement } = require('../src/lib/concurrents');
const { sendWeeklyReport } = require('../src/lib/emailReports');

async function getBilanMensuel(etablissementId) {
  const { rows: scanRows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE date_scan >= now() - interval '30 days')::int AS ce_mois,
       COUNT(*) FILTER (WHERE date_scan >= now() - interval '60 days' AND date_scan < now() - interval '30 days')::int AS mois_precedent
     FROM scans WHERE etablissement_id = $1`,
    [etablissementId]
  );

  const { rows: reponseRows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE reponse_marquee_traitee)::int AS traites
     FROM avis_recus
     WHERE etablissement_id = $1 AND date_creation >= now() - interval '30 days'`,
    [etablissementId]
  );

  const positionnement = await getPositionnement(etablissementId);

  return {
    scansCeMois: scanRows[0].ce_mois,
    scansMoisPrecedent: scanRows[0].mois_precedent,
    avisTraites: reponseRows[0].traites,
    avisRecusTotal: reponseRows[0].total,
    positionnementPhrase: positionnement?.phrase || null,
  };
}

async function run() {
  const isMonday = new Date().getUTCDay() === 1;
  if (!isMonday && process.env.FORCE_WEEKLY !== 'true') {
    console.log("Pas lundi (heure UTC) — rapport hebdomadaire non exécuté aujourd'hui.");
    await pool.end();
    return;
  }

  const isPremierLundiDuMois = new Date().getUTCDate() <= 7;

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
      const avis30dAgo = daily[0].nombreAvis;

      const avisThisWeek = avisToday !== null && avis7dAgo !== null ? avisToday - avis7dAgo : null;
      const avisLastWeek = avis7dAgo !== null && avis14dAgo !== null ? avis7dAgo - avis14dAgo : null;

      const { rows: avisEnAttenteRows } = await pool.query(
        'SELECT COUNT(*)::int AS count FROM avis_recus WHERE etablissement_id = $1 AND reponse_marquee_traitee = false',
        [e.id]
      );

      let bilanMensuel = null;
      if (isPremierLundiDuMois) {
        bilanMensuel = await getBilanMensuel(e.id);
        bilanMensuel.avisCeMois =
          avisToday !== null && avis30dAgo !== null ? avisToday - avis30dAgo : null;
        bilanMensuel.noteMoyenneActuelle = avis.noteMoyenneActuelle;
      }

      await sendWeeklyReport({
        to: e.email,
        nom: e.nom,
        messageRelance: e.message_relance,
        bilanMensuel,
        scansThisWeek,
        scansLastWeek,
        avisThisWeek,
        avisLastWeek,
        avisEnAttente: avisEnAttenteRows[0].count,
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
