require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const pool = require('./db');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const merchantRouter = require('./routes/merchant');
const paiementRouter = require('./routes/paiement');
const stripe = require('./lib/stripe');
const { handleStripeEvent } = require('./lib/stripeWebhookHandlers');

const app = express();
const port = process.env.PORT || 3001;

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(cors({ origin: true, credentials: true }));

// Doit être monté AVANT express.json() : Stripe exige le corps brut (non parsé)
// pour vérifier la signature du webhook.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Signature webhook Stripe invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    console.error('Erreur lors du traitement du webhook Stripe:', err);
  }

  res.json({ received: true });
});

app.use(express.json());
app.use(
  cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    secure: isProduction,
    sameSite: 'lax',
  })
);

app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/merchant', merchantRouter);
app.use('/api/paiement', paiementRouter);

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ status: 'ok', db_time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.get('/r/:id', async (req, res) => {
  const { id } = req.params;
  let etablissement;

  try {
    const result = await pool.query(
      'SELECT lien_google_avis FROM etablissements WHERE id = $1',
      [id]
    );
    etablissement = result.rows[0];
  } catch (err) {
    console.error(err);
    return res.status(500).send('Une erreur est survenue.');
  }

  if (!etablissement) {
    return res.status(404).send('Ce lien ne correspond à aucun établissement.');
  }

  try {
    await pool.query('INSERT INTO scans (etablissement_id) VALUES ($1)', [id]);
  } catch (err) {
    console.error("Échec de l'enregistrement du scan:", err);
  }

  res.redirect(302, etablissement.lien_google_avis);
});

app.listen(port, () => {
  console.log(`Backend en écoute sur http://localhost:${port}`);
});
