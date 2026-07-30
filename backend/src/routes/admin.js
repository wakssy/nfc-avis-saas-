const express = require('express');
const pool = require('../db');
const requireAdmin = require('../middleware/requireAdmin');
const generateId = require('../lib/generateId');
const { getStatsForEtablissement } = require('../lib/stats');
const { getAvisHistorique } = require('../lib/avisStats');
const { resolvePlaceId, getPlaceLocationAndType, searchNearbyCompetitors } = require('../lib/googlePlaces');
const { createInvitation, trySendInvitationEmail } = require('../lib/invitation');
const { getOrCreatePaiementToken } = require('../lib/paiementToken');

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
    `SELECT id, nom, lien_google_avis, email, objectif_mensuel, place_id,
            paiement_token, abonnement_statut, mois_payes,
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

router.get('/etablissements/:id/avis-historique', requireAdmin, async (req, res) => {
  try {
    const data = await getAvisHistorique(req.params.id);
    res.json(data);
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

    try {
      const placeId = await resolvePlaceId(lien_google_avis, nom);
      if (placeId) {
        await pool.query('UPDATE etablissements SET place_id = $1 WHERE id = $2', [placeId, finalId]);
        result.rows[0].place_id = placeId;
      }
    } catch (err) {
      console.error('Échec de la résolution automatique du place_id:', err);
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

router.put('/etablissements/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { nom, lien_google_avis, email, objectif_mensuel, place_id } = req.body;

  if (!nom || !lien_google_avis) {
    return res.status(400).json({ error: 'nom et lien_google_avis sont requis' });
  }

  const objectifValue =
    objectif_mensuel === undefined || objectif_mensuel === null || objectif_mensuel === ''
      ? null
      : Number(objectif_mensuel);

  const placeIdValue = place_id === undefined || place_id === '' ? null : place_id;

  try {
    const result = await pool.query(
      `UPDATE etablissements SET nom = $1, lien_google_avis = $2, email = $3, objectif_mensuel = $4, place_id = $5
       WHERE id = $6
       RETURNING id, nom, lien_google_avis, email, objectif_mensuel, place_id, date_creation`,
      [nom, lien_google_avis, email || null, objectifValue, placeIdValue, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Établissement introuvable' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé par un autre établissement' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/etablissements/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM scans WHERE etablissement_id = $1', [id]);
    await client.query('DELETE FROM avis_historique WHERE etablissement_id = $1', [id]);
    await client.query('DELETE FROM concurrents_historique WHERE etablissement_id = $1', [id]);
    await client.query('DELETE FROM concurrents WHERE etablissement_id = $1', [id]);
    const result = await client.query('DELETE FROM etablissements WHERE id = $1 RETURNING id', [id]);
    await client.query('COMMIT');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Établissement introuvable' });
    }

    res.json({ status: 'ok' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
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

router.post('/etablissements/:id/lien-paiement', requireAdmin, async (req, res) => {
  const token = await getOrCreatePaiementToken(req.params.id);
  if (!token) {
    return res.status(404).json({ error: 'Établissement introuvable' });
  }

  res.json({ url: `${process.env.FRONTEND_URL}/paiement/${token}` });
});

router.get('/etablissements/:id/concurrents', requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT concurrent_place_id, concurrent_nom, date_ajout FROM concurrents WHERE etablissement_id = $1 ORDER BY concurrent_nom',
    [req.params.id]
  );
  res.json(rows);
});

router.post('/etablissements/:id/concurrents/recherche', requireAdmin, async (req, res) => {
  const { id } = req.params;

  const result = await pool.query('SELECT place_id FROM etablissements WHERE id = $1', [id]);
  const etablissement = result.rows[0];

  if (!etablissement) {
    return res.status(404).json({ error: 'Établissement introuvable' });
  }
  if (!etablissement.place_id) {
    return res.status(400).json({ error: "Cet établissement n'a pas encore de fiche Google associée (Place ID)" });
  }

  try {
    const { lat, lng, type } = await getPlaceLocationAndType(etablissement.place_id);
    if (lat === null || lng === null) {
      return res.status(422).json({ error: 'Impossible de localiser cet établissement via Google Places' });
    }

    const concurrents = await searchNearbyCompetitors({ lat, lng, type, excludePlaceId: etablissement.place_id });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM concurrents WHERE etablissement_id = $1', [id]);
      for (const c of concurrents) {
        await client.query(
          'INSERT INTO concurrents (etablissement_id, concurrent_place_id, concurrent_nom) VALUES ($1, $2, $3)',
          [id, c.placeId, c.nom]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ concurrents });
  } catch (err) {
    console.error('Échec de la recherche de concurrents:', err);
    res.status(500).json({ error: 'Erreur lors de la recherche de concurrents' });
  }
});

module.exports = router;
