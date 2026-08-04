const { Resend } = require('resend');

function echapperHtml(texte) {
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendEmail({ to, subject, html, replyTo }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY absente — email non envoyé (destinataire: ${to}, sujet: ${subject})`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: `avisplaque <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    ...(replyTo ? { reply_to: replyTo } : {}),
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

async function sendContactNotification({ nom, email, message }) {
  await sendEmail({
    to: 'mathiscazalis@gmail.com',
    subject: `Nouveau message de contact — ${nom}`,
    replyTo: email,
    html: `
      <p><strong>Nom :</strong> ${echapperHtml(nom)}</p>
      <p><strong>Email :</strong> ${echapperHtml(email)}</p>
      <p><strong>Message :</strong></p>
      <p>${echapperHtml(message).replace(/\n/g, '<br>')}</p>
    `,
  });
}

module.exports = { sendEmail, sendInvitationEmail, sendContactNotification };
