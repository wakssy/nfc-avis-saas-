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
        <li>${newAvisToday} ${newAvisToday > 1 ? 'nouveaux' : 'nouvel'} avis Google aujourd'hui</li>
        ${noteMoyenneActuelle !== null ? `<li>Note actuelle : ${noteMoyenneActuelle}/5</li>` : ''}
        ${avisEnAttente > 0 ? `<li>${avisEnAttente} avis en attente de réponse</li>` : ''}
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/dashboard">Voir mon dashboard</a></p>
    `,
  });
}

function formatEvolution(current, previous, label = 'la semaine précédente') {
  if (previous === null || previous === undefined) return '';
  const diff = current - previous;
  if (diff === 0) return ` (stable par rapport à ${label})`;
  const sign = diff > 0 ? '+' : '';
  return ` (${sign}${diff} par rapport à ${label})`;
}

function renderBilanMensuel(bilanMensuel) {
  if (!bilanMensuel) return '';

  const { scansCeMois, scansMoisPrecedent, avisCeMois, noteMoyenneActuelle, avisTraites, avisRecusTotal, positionnementPhrase } =
    bilanMensuel;

  const tempsGagneMinutes = avisTraites * 8;

  return `
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e1e0d9;">
      <p style="font-weight: 600; margin-bottom: 8px;">📅 Bilan du mois écoulé</p>
      <ul>
        <li>${scansCeMois} scan${scansCeMois > 1 ? 's' : ''} ce mois-ci${formatEvolution(scansCeMois, scansMoisPrecedent, 'le mois précédent')}</li>
        ${avisCeMois !== null ? `<li>${avisCeMois} ${avisCeMois > 1 ? 'nouveaux' : 'nouvel'} avis ce mois-ci</li>` : ''}
        ${noteMoyenneActuelle !== null ? `<li>Note actuelle : ${noteMoyenneActuelle}/5</li>` : ''}
        ${avisRecusTotal > 0 ? `<li>${avisTraites}/${avisRecusTotal} avis traités avec une réponse suggérée${avisTraites > 0 ? ` — environ ${tempsGagneMinutes} minutes gagnées` : ''}</li>` : ''}
        ${positionnementPhrase ? `<li>${positionnementPhrase}</li>` : ''}
      </ul>
    </div>
  `;
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
  bilanMensuel,
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
        <li>${avisThisWeek !== null ? `${avisThisWeek} ${avisThisWeek > 1 ? 'nouveaux' : 'nouvel'} avis cette semaine${formatEvolution(avisThisWeek, avisLastWeek)}` : "Pas encore de suivi des avis Google pour cet établissement"}</li>
        ${avisEnAttente > 0 ? `<li>${avisEnAttente} avis en attente de réponse</li>` : ''}
      </ul>
      ${renderBilanMensuel(bilanMensuel)}
      <p><a href="${process.env.FRONTEND_URL}/dashboard">Voir mon dashboard</a></p>
    `,
  });
}

module.exports = { getIntro, sendDailySummary, sendWeeklyReport };
