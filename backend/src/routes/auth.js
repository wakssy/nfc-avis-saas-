const express = require('express');
const pool = require('../db');
const { verifyPassword, hashPassword } = require('../lib/password');
const { getOrCreatePaiementToken } = require('../lib/paiementToken');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email et mot de passe requis' });
  }

  const result = await pool.query(
    'SELECT id, nom, password_hash FROM etablissements WHERE email = $1',
    [email]
  );
  const etablissement = result.rows[0];

  if (!etablissement || !etablissement.password_hash) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const valid = await verifyPassword(password, etablissement.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  req.session.etablissementId = etablissement.id;
  res.json({ status: 'ok', nom: etablissement.nom });
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ status: 'ok' });
});

router.get('/me', (req, res) => {
  res.json({ loggedIn: Boolean(req.session && req.session.etablissementId) });
});

router.get('/invitation/:token', async (req, res) => {
  const result = await pool.query(
    'SELECT nom, invitation_expires_at FROM etablissements WHERE invitation_token = $1',
    [req.params.token]
  );
  const etablissement = result.rows[0];

  if (!etablissement || new Date(etablissement.invitation_expires_at) < new Date()) {
    return res.status(410).json({ error: 'Ce lien d\'invitation est invalide ou a expiré' });
  }

  res.json({ nom: etablissement.nom });
});

router.post('/invitation/:token', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'mot de passe requis' });
  }

  const result = await pool.query(
    'SELECT id, invitation_expires_at, abonnement_statut FROM etablissements WHERE invitation_token = $1',
    [req.params.token]
  );
  const etablissement = result.rows[0];

  if (!etablissement || new Date(etablissement.invitation_expires_at) < new Date()) {
    return res.status(410).json({ error: 'Ce lien d\'invitation est invalide ou a expiré' });
  }

  const passwordHash = await hashPassword(password);

  await pool.query(
    'UPDATE etablissements SET password_hash = $1, invitation_token = NULL, invitation_expires_at = NULL WHERE id = $2',
    [passwordHash, etablissement.id]
  );

  req.session.etablissementId = etablissement.id;

  const dejaPaye = etablissement.abonnement_statut === 'actif' || etablissement.abonnement_statut === 'plaque_seule';
  const paiementToken = dejaPaye ? null : await getOrCreatePaiementToken(etablissement.id);
  res.json({ status: 'ok', paiementToken });
});

module.exports = router;
