const { Pool, types } = require('pg');

// Le type DATE (OID 1082) est renvoyé par défaut comme un objet Date interprété
// dans le fuseau horaire local du serveur, ce qui décale la date d'un jour selon
// l'heure. On le garde en chaîne "YYYY-MM-DD" brute pour éviter toute conversion.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
