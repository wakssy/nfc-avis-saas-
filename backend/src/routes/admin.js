const express = require('express');
const pool = require('../db');
const requireAdmin = require('../middleware/requireAdmin');
const generateId = require('../lib/generateId');

const router = express.Router();

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
    'SELECT id, nom, lien_google_avis, date_creation FROM etablissements ORDER BY date_creation DESC'
  );
  res.json(result.rows);
});

router.post('/etablissements', requireAdmin, async (req, res) => {
  const { nom, lien_google_avis, id } = req.body;

  if (!nom || !lien_google_avis) {
    return res.status(400).json({ error: 'nom et lien_google_avis sont requis' });
  }

  const finalId = id && id.trim() ? id.trim() : generateId();

  try {
    const result = await pool.query(
      'INSERT INTO etablissements (id, nom, lien_google_avis) VALUES ($1, $2, $3) RETURNING id, nom, lien_google_avis, date_creation',
      [finalId, nom, lien_google_avis]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `L'identifiant "${finalId}" est déjà utilisé` });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
