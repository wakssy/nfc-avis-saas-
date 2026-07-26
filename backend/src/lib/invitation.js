const pool = require('../db');
const { generateToken } = require('./token');
const { sendInvitationEmail } = require('./email');

const INVITATION_DURATION_MS = 48 * 60 * 60 * 1000;

async function createInvitation(id, email) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITATION_DURATION_MS);

  await pool.query(
    'UPDATE etablissements SET email = $1, invitation_token = $2, invitation_expires_at = $3 WHERE id = $4',
    [email, token, expiresAt, id]
  );

  return `${process.env.FRONTEND_URL}/invitation/${token}`;
}

async function trySendInvitationEmail(email, nom, invitationUrl) {
  try {
    await sendInvitationEmail({ to: email, nom, invitationUrl });
  } catch (err) {
    console.error("Échec de l'envoi de l'email d'invitation:", err);
  }
}

module.exports = { createInvitation, trySendInvitationEmail };
