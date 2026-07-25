import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';

interface Stats {
  total: number;
  today: number;
  last7: number;
  last30: number;
  thisMonth: number;
  objectifMensuel: number | null;
  joursDepuisDernierScan: number | null;
  daily: { date: string; count: number }[];
}

interface AvisHistorique {
  daily: { date: string; nombreAvis: number | null; noteMoyenne: number | null }[];
  nombreAvisActuel: number | null;
  noteMoyenneActuelle: number | null;
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-tile">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}

function AdminEtablissementStats() {
  const { id } = useParams();
  const [stats, setStats] = useState<Stats | null>(null);
  const [avis, setAvis] = useState<AvisHistorique | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStats() {
      const res = await apiFetch(`/admin/etablissements/${id}/stats`);
      if (res.status === 401) {
        navigate('/admin/login');
        return;
      }
      const data = await res.json();
      setStats(data);
    }
    async function loadAvis() {
      const res = await apiFetch(`/admin/etablissements/${id}/avis-historique`);
      if (res.ok) setAvis(await res.json());
    }
    loadStats();
    loadAvis();
  }, [id, navigate]);

  if (!stats) {
    return (
      <div className="container">
        <p className="subtitle">Chargement...</p>
      </div>
    );
  }

  const percent = stats.objectifMensuel
    ? Math.min(100, Math.round((stats.thisMonth / stats.objectifMensuel) * 100))
    : null;

  return (
    <div className="container">
      <Link to="/admin" className="link">
        &larr; Retour à la liste
      </Link>
      <div className="topbar" style={{ marginTop: 8 }}>
        <h1>Stats de {id}</h1>
      </div>

      {(stats.joursDepuisDernierScan === null || stats.joursDepuisDernierScan >= 8) && (
        <div className="alert">
          <span>⚠️</span>
          <span>
            {stats.joursDepuisDernierScan === null
              ? 'Aucun scan enregistré pour le moment.'
              : `Aucun scan enregistré depuis ${stats.joursDepuisDernierScan} jours.`}
          </span>
        </div>
      )}

      <div className="stat-grid">
        <StatTile label="Aujourd'hui" value={stats.today} />
        <StatTile label="Cette semaine" value={stats.last7} />
        <StatTile label="Ce mois-ci" value={stats.last30} />
        <StatTile label="Total" value={stats.total} />
      </div>

      {stats.objectifMensuel !== null && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="section-title" style={{ marginBottom: 8 }}>
            Objectif du mois
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>
              <strong>{stats.thisMonth}</strong> / {stats.objectifMensuel} scans
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{percent}%</span>
          </div>
          <div className="meter">
            <div
              className={`meter-fill${(percent ?? 0) >= 100 ? ' complete' : ''}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="section-title">Scans par jour (30 derniers jours)</p>
        <BarChart data={stats.daily} />
      </div>

      {avis && (
        <div className="card">
          <div className="topbar" style={{ marginBottom: 4 }}>
            <p className="section-title" style={{ margin: 0 }}>
              Évolution des avis Google (30 derniers jours)
            </p>
            {avis.nombreAvisActuel !== null && (
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{avis.nombreAvisActuel}</strong> avis · note{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{avis.noteMoyenneActuelle}</strong>/5
              </span>
            )}
          </div>
          <LineChart data={avis.daily.map((d) => ({ date: d.date, value: d.nombreAvis }))} />
        </div>
      )}
    </div>
  );
}

export default AdminEtablissementStats;
