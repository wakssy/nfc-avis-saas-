const pool = require('../db');
const { generateToken } = require('./token');

async function getOrCreatePaiementToken(id) {
  const result = await pool.query('SELECT paiement_token FROM etablissements WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;

  let token = result.rows[0].paiement_token;
  if (!token) {
    token = generateToken();
    await pool.query('UPDATE etablissements SET paiement_token = $1 WHERE id = $2', [token, id]);
  }

  return token;
}

module.exports = { getOrCreatePaiementToken };
