const { Resend } = require('resend');

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY absente — email non envoyé (destinataire: ${to}, sujet: ${subject})`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

async function sendInvitationEmail({ to, nom, invitationUrl }) {
  await sendEmail({
    to,
    subject: 'Créez votre accès au dashboard avisplaque.fr',
    html: `
      <p>Bonjour,</p>
      <p>Un accès au dashboard de suivi des avis a été créé pour <strong>${nom}</strong>.</p>
      <p><a href="${invitationUrl}">Cliquez ici pour créer votre mot de passe</a></p>
      <p>Ce lien expire dans 48 heures.</p>
    `,
  });
}

module.exports = { sendEmail, sendInvitationEmail };
