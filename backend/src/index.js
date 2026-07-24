require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ status: 'ok', db_time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.listen(port, () => {
  console.log(`Backend en écoute sur http://localhost:${port}`);
});
