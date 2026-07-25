const express = require('express');
const pool = require('../db');
const requireMerchant = require('../middleware/requireMerchant');
const { getStatsForEtablissement } = require('../lib/stats');
const { getAvisHistorique } = require('../lib/avisStats');

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
