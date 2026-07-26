const express = require('express');
const pool = require('../db');
const stripe = require('../lib/stripe');

const router = express.Router();

router.get('/:token', async (req, res) => {
  const result = await pool.query(
    'SELECT id, nom, email, abonnement_statut FROM etablissements WHERE paiement_token = $1',
    [req.params.token]
  );
  const etablissement = result.rows[0];

  if (!etablissement) {
    return res.status(404).json({ error: 'Lien de paiement invalide' });
  }

  res.json({
    nom: etablissement.nom,
    dejaPaye: etablissement.abonnement_statut === 'actif' || etablissement.abonnement_statut === 'plaque_seule',
  });
});

router.post('/:token/checkout', async (req, res) => {
  const { offre } = req.body;

  if (offre !== 'plaque' && offre !== 'abonnement') {
    return res.status(400).json({ error: 'Offre invalide' });
  }

  const result = await pool.query(
    'SELECT id, nom, email, stripe_customer_id FROM etablissements WHERE paiement_token = $1',
    [req.params.token]
  );
  const etablissement = result.rows[0];

  if (!etablissement) {
    return res.status(404).json({ error: 'Lien de paiement invalide' });
  }

  const isAbonnement = offre === 'abonnement';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isAbonnement ? 'subscription' : 'payment',
      line_items: [
        {
          price: isAbonnement ? process.env.STRIPE_PRICE_ABONNEMENT : process.env.STRIPE_PRICE_PLAQUE,
          quantity: 1,
        },
      ],
      customer: etablissement.stripe_customer_id || undefined,
      customer_email: etablissement.stripe_customer_id ? undefined : etablissement.email || undefined,
      metadata: { etablissement_id: etablissement.id },
      subscription_data: isAbonnement ? { metadata: { etablissement_id: etablissement.id } } : undefined,
      success_url: `${process.env.FRONTEND_URL}/paiement/${req.params.token}/succes`,
      cancel_url: `${process.env.FRONTEND_URL}/paiement/${req.params.token}`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Échec de la création de la session Stripe:', err);
    res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
});

module.exports = router;
