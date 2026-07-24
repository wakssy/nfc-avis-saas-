const express = require('express');
const pool = require('../db');
const { verifyPassword } = require('../lib/password');

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

module.exports = router;
