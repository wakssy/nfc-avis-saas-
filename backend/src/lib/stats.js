const pool = require('../db');

async function getStatsForEtablissement(id) {
  const [totalResult, last7Result, last30Result, dailyResult] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM scans WHERE etablissement_id = $1', [id]),
    pool.query(
      "SELECT COUNT(*)::int AS count FROM scans WHERE etablissement_id = $1 AND date_scan >= now() - interval '7 days'",
      [id]
    ),
    pool.query(
      "SELECT COUNT(*)::int AS count FROM scans WHERE etablissement_id = $1 AND date_scan >= now() - interval '30 days'",
      [id]
    ),
    pool.query(
      `SELECT date_scan
       FROM scans
       WHERE etablissement_id = $1 AND date_scan >= now() - interval '30 days'`,
      [id]
    ),
  ]);

  const dailyMap = new Map();
  for (const row of dailyResult.rows) {
    const key = row.date_scan.toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
  }

  const daily = [];
  for (let i = 29; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    daily.push({ date: key, count: dailyMap.get(key) || 0 });
  }

  return {
    total: totalResult.rows[0].count,
    last7: last7Result.rows[0].count,
    last30: last30Result.rows[0].count,
    daily,
  };
}

module.exports = { getStatsForEtablissement };
