const express = require('express');
const requireMerchant = require('../middleware/requireMerchant');
const { getStatsForEtablissement } = require('../lib/stats');

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

module.exports = router;
