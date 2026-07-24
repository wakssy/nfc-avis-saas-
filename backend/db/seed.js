require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/db');

async function seed() {
  const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  await pool.query(seedSql);
  console.log('Données de test insérées avec succès.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Échec du seed:', err);
  process.exit(1);
});
