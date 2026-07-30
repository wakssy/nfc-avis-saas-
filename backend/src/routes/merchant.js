const express = require('express');
const pool = require('../db');
const requireMerchant = require('../middleware/requireMerchant');
const { getStatsForEtablissement } = require('../lib/stats');
const { getAvisHistorique } = require('../lib/avisStats');
const { getPositionnement } = require('../lib/concurrents');

const router = express.Router();

router.get('/stats', requireMerchant, async (req, res) => {
  try {
    const stats = await getStatsForEtablissement(req.session.etablissementId);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/avis-historique', requireMerchant, async (req, res) => {
  try {
    const data = await getAvisHistorique(req.session.etablissementId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/positionnement', requireMerchant, async (req, res) => {
  try {
    const positionnement = await getPositionnement(req.session.etablissementId);
    res.json(positionnement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/profil', requireMerchant, async (req, res) => {
  const result = await pool.query('SELECT nom, message_relance FROM etablissements WHERE id = $1', [
    req.session.etablissementId,
  ]);
  res.json({ nom: result.rows[0].nom, messageRelance: result.rows[0].message_relance });
});

router.put('/message-relance', requireMerchant, async (req, res) => {
  const { message } = req.body;
  const value = message && message.trim() ? message.trim() : null;

  await pool.query('UPDATE etablissements SET message_relance = $1 WHERE id = $2', [
    value,
    req.session.etablissementId,
  ]);

  res.json({ status: 'ok', messageRelance: value });
});

router.put('/objectif', requireMerchant, async (req, res) => {
  const { objectif } = req.body;
  const value = objectif === null ? null : Number(objectif);

  if (value !== null && (!Number.isInteger(value) || value < 0)) {
    return res.status(400).json({ error: 'objectif doit être un nombre entier positif' });
  }

  await pool.query('UPDATE etablissements SET objectif_mensuel = $1 WHERE id = $2', [
    value,
    req.session.etablissementId,
  ]);

  res.json({ status: 'ok', objectif: value });
});

module.exports = router;
