const express = require('express');
const pool = require('../db');
const requireMerchant = require('../middleware/requireMerchant');
const { getStatsForEtablissement } = require('../lib/stats');
const { getAvisHistorique } = require('../lib/avisStats');
const { getPositionnement } = require('../lib/concurrents');
const { genererReponseAvis } = require('../lib/claude');

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

router.get('/avis-recus', requireMerchant, async (req, res) => {
  try {
    const etabResult = await pool.query('SELECT lien_google_avis FROM etablissements WHERE id = $1', [
      req.session.etablissementId,
    ]);

    const avisResult = await pool.query(
      `SELECT id, auteur, note, texte_avis, date_avis, reponse_suggeree
       FROM avis_recus
       WHERE etablissement_id = $1 AND reponse_marquee_traitee = false
       ORDER BY date_avis DESC`,
      [req.session.etablissementId]
    );

    res.json({
      lienGoogleAvis: etabResult.rows[0]?.lien_google_avis || null,
      avis: avisResult.rows.map((r) => ({
        id: r.id,
        auteur: r.auteur,
        note: r.note,
        texteAvis: r.texte_avis,
        dateAvis: r.date_avis,
        reponseSuggeree: r.reponse_suggeree,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/avis-recus/:id/regenerer', requireMerchant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ar.auteur, ar.note, ar.texte_avis, e.nom
       FROM avis_recus ar
       JOIN etablissements e ON e.id = ar.etablissement_id
       WHERE ar.id = $1 AND ar.etablissement_id = $2`,
      [req.params.id, req.session.etablissementId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avis introuvable' });
    }

    const avis = result.rows[0];
    const reponseSuggeree = await genererReponseAvis({
      nomEtablissement: avis.nom,
      texteAvis: avis.texte_avis,
      note: avis.note,
    });

    await pool.query('UPDATE avis_recus SET reponse_suggeree = $1 WHERE id = $2', [
      reponseSuggeree,
      req.params.id,
    ]);

    res.json({ reponseSuggeree });
  } catch (err) {
    console.error('Échec de la régénération de la réponse IA:', err);
    res.status(500).json({ error: 'Erreur lors de la génération de la réponse. Réessaie dans un instant.' });
  }
});

router.post('/avis-recus/:id/traite', requireMerchant, async (req, res) => {
  const result = await pool.query(
    'UPDATE avis_recus SET reponse_marquee_traitee = true WHERE id = $1 AND etablissement_id = $2 RETURNING id',
    [req.params.id, req.session.etablissementId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Avis introuvable' });
  }

  res.json({ status: 'ok' });
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
