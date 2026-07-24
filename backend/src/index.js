require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const pool = require('./db');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const merchantRouter = require('./routes/merchant');

const app = express();
const port = process.env.PORT || 3001;

const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({ origin: true, credentials: true }));
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
