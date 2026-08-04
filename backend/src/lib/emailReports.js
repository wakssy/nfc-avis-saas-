const { sendEmail } = require('./email');

function getIntro(nom, messageRelance) {
  return messageRelance || `Bonjour, voici le récapitulatif de <strong>${nom}</strong> !`;
}

async function sendDailySummary({ to, nom, messageRelance, scansToday, newAvisToday, noteMoyenneActuelle, avisEnAttente }) {
  const intro = getIntro(nom, messageRelance);

  await sendEmail({
    to,
    subject: `Récap du jour — ${nom}`,
    html: `
      <p>${intro}</p>
      <ul>
        <li>${scansToday} scan${scansToday > 1 ? 's' : ''} aujourd'hui</li>
        <li>${newAvisToday} nouvel${newAvisToday > 1 ? 's' : ''} avis Google aujourd'hui</li>
        ${noteMoyenneActuelle !== null ? `<li>Note actuelle : ${noteMoyenneActuelle}/5</li>` : ''}
        ${avisEnAttente > 0 ? `<li>${avisEnAttente} avis en attente de réponse</li>` : ''}
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/dashboard">Voir mon dashboard</a></p>
    `,
  });
}

function formatEvolution(current, previous) {
  if (previous === null || previous === undefined) return '';
  const diff = current - previous;
  if (diff === 0) return ' (stable par rapport à la semaine précédente)';
  const sign = diff > 0 ? '+' : '';
  return ` (${sign}${diff} par rapport à la semaine précédente)`;
}

async function sendWeeklyReport({
  to,
  nom,
  messageRelance,
  scansThisWeek,
  scansLastWeek,
  avisThisWeek,
  avisLastWeek,
  avisEnAttente,
}) {
  const intro = getIntro(nom, messageRelance);

  await sendEmail({
    to,
    subject: `Votre rapport hebdomadaire — ${nom}`,
    html: `
      <p>${intro}</p>
      <p>Voici votre rapport pour la semaine écoulée :</p>
      <ul>
        <li>${scansThisWeek} scan${scansThisWeek > 1 ? 's' : ''} cette semaine${formatEvolution(scansThisWeek, scansLastWeek)}</li>
        <li>${avisThisWeek !== null ? `${avisThisWeek} nouvel${avisThisWeek > 1 ? 's' : ''} avis cette semaine${formatEvolution(avisThisWeek, avisLastWeek)}` : "Pas encore de suivi des avis Google pour cet établissement"}</li>
        ${avisEnAttente > 0 ? `<li>${avisEnAttente} avis en attente de réponse</li>` : ''}
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/dashboard">Voir mon dashboard</a></p>
    `,
  });
}

module.exports = { getIntro, sendDailySummary, sendWeeklyReport };
