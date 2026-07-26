const pool = require('../db');

async function getStatsForEtablissement(id) {
  const now = new Date();
  const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    totalResult,
    last7Result,
    last30Result,
    last7PreviousResult,
    last30PreviousResult,
    thisMonthResult,
    dailyResult,
    lastScanResult,
    etablissementResult,
  ] = await Promise.all([
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
        "SELECT COUNT(*)::int AS count FROM scans WHERE etablissement_id = $1 AND date_scan >= now() - interval '14 days' AND date_scan < now() - interval '7 days'",
        [id]
      ),
      pool.query(
        "SELECT COUNT(*)::int AS count FROM scans WHERE etablissement_id = $1 AND date_scan >= now() - interval '60 days' AND date_scan < now() - interval '30 days'",
        [id]
      ),
      pool.query(
        'SELECT COUNT(*)::int AS count FROM scans WHERE etablissement_id = $1 AND date_scan >= $2',
        [id, firstOfMonth]
      ),
      pool.query(
        `SELECT date_scan
         FROM scans
         WHERE etablissement_id = $1 AND date_scan >= now() - interval '30 days'`,
        [id]
      ),
      pool.query('SELECT MAX(date_scan) AS derniere_date FROM scans WHERE etablissement_id = $1', [id]),
      pool.query('SELECT objectif_mensuel FROM etablissements WHERE id = $1', [id]),
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

  const derniereDate = lastScanResult.rows[0].derniere_date;
  const joursDepuisDernierScan = derniereDate
    ? Math.floor((Date.now() - new Date(derniereDate).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  return {
    total: totalResult.rows[0].count,
    today: daily[daily.length - 1].count,
    yesterday: daily[daily.length - 2].count,
    last7: last7Result.rows[0].count,
    last7Previous: last7PreviousResult.rows[0].count,
    last30: last30Result.rows[0].count,
    last30Previous: last30PreviousResult.rows[0].count,
    thisMonth: thisMonthResult.rows[0].count,
    objectifMensuel: etablissementResult.rows[0]?.objectif_mensuel ?? null,
    joursDepuisDernierScan,
    daily,
  };
}

module.exports = { getStatsForEtablissement };
