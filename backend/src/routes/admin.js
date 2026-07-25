const express = require('express');
const pool = require('../db');
const requireAdmin = require('../middleware/requireAdmin');
const generateId = require('../lib/generateId');
const { generateInvitationToken } = require('../lib/token');
const { sendInvitationEmail } = require('../lib/email');
const { getStatsForEtablissement } = require('../lib/stats');

const router = express.Router();

const INVITATION_DURATION_MS = 48 * 60 * 60 * 1000;

async function createInvitation(id, email) {
  const token = generateInvitationToken();
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

router.post('/login', (req, res) => {
  const { password } = req.body;

  if (password && password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ status: 'ok' });
  }

  res.status(401).json({ error: 'Mot de passe incorrect' });
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ status: 'ok' });
});

router.get('/me', (req, res) => {
  res.json({ isAdmin: Boolean(req.session && req.session.isAdmin) });
});

router.get('/etablissements', requireAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT id, nom, lien_google_avis, email,
            (password_hash IS NOT NULL) AS a_un_compte,
            (invitation_token IS NOT NULL AND invitation_expires_at > now()) AS invitation_en_attente,
            date_creation
     FROM etablissements ORDER BY date_creation DESC`
  );
  res.json(result.rows);
});

router.get('/etablissements/:id/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await getStatsForEtablissement(req.params.id);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/etablissements', requireAdmin, async (req, res) => {
  const { nom, lien_google_avis, id, email } = req.body;

  if (!nom || !lien_google_avis) {
    return res.status(400).json({ error: 'nom et lien_google_avis sont requis' });
  }

  const finalId = id && id.trim() ? id.trim() : generateId();

  try {
    const result = await pool.query(
      'INSERT INTO etablissements (id, nom, lien_google_avis, email) VALUES ($1, $2, $3, $4) RETURNING id, nom, lien_google_avis, email, date_creation',
      [finalId, nom, lien_google_avis, email || null]
    );

    if (email) {
      const invitationUrl = await createInvitation(finalId, email);
      await trySendInvitationEmail(email, nom, invitationUrl);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `L'identifiant ou l'email est déjà utilisé` });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/etablissements/:id/invite', requireAdmin, async (req, res) => {
  const { email } = req.body;
  const { id } = req.params;

  if (!email) {
    return res.status(400).json({ error: 'email requis' });
  }

  try {
    const existing = await pool.query('SELECT nom FROM etablissements WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Établissement introuvable' });
    }

    const invitationUrl = await createInvitation(id, email);
    await trySendInvitationEmail(email, existing.rows[0].nom, invitationUrl);
    res.json({ status: 'ok' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé par un autre établissement' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
