import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';
import ConversionEstimate from '../components/ConversionEstimate';
import StatTile from '../components/StatTile';
import PositionnementGauge from '../components/PositionnementGauge';

interface Stats {
  total: number;
  today: number;
  yesterday: number;
  last7: number;
  last7Previous: number;
  last30: number;
  last30Previous: number;
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

interface Positionnement {
  positions: { nom: string; nombreAvis: number; estClient: boolean }[];
  rang: number;
  total: number;
  phrase: string;
}

function objectifMeterClass(percent: number) {
  if (percent < 30) return 'low';
  if (percent < 70) return 'mid';
  return 'high';
}

function AdminEtablissementStats() {
  const { id } = useParams();
  const [stats, setStats] = useState<Stats | null>(null);
  const [avis, setAvis] = useState<AvisHistorique | null>(null);
  const [positionnement, setPositionnement] = useState<Positionnement | null>(null);
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
    async function loadPositionnement() {
      const res = await apiFetch(`/admin/etablissements/${id}/positionnement`);
      if (res.ok) setPositionnement(await res.json());
    }
    loadStats();
    loadAvis();
    loadPositionnement();
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
        <StatTile
          label="Aujourd'hui"
          value={stats.today}
          trend={{ diff: stats.today - stats.yesterday, label: 'vs hier' }}
        />
        <StatTile
          label="Cette semaine"
          value={stats.last7}
          trend={{ diff: stats.last7 - stats.last7Previous, label: 'vs sem. préc.' }}
        />
        <StatTile
          label="Ce mois-ci"
          value={stats.last30}
          trend={{ diff: stats.last30 - stats.last30Previous, label: 'vs période préc.' }}
        />
        <StatTile label="Total" value={stats.total} />
      </div>

      {stats.objectifMensuel !== null && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="section-title section-objectif" style={{ marginBottom: 8 }}>
            Objectif du mois
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>
              <strong>{stats.thisMonth}</strong> / {stats.objectifMensuel} scans
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{percent}%</span>
          </div>
          <div className="meter">
            <div className={`meter-fill ${objectifMeterClass(percent ?? 0)}`} style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="section-title section-scans">Scans par jour (30 derniers jours)</p>
        <BarChart data={stats.daily} />
      </div>

      {avis && (
        <div className="card">
          <div className="topbar" style={{ marginBottom: 4 }}>
            <p className="section-title section-avis" style={{ margin: 0 }}>
              Évolution des avis Google (30 derniers jours)
            </p>
            {avis.nombreAvisActuel !== null && (
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{avis.nombreAvisActuel}</strong> avis · note{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{avis.noteMoyenneActuelle}</strong>/5
              </span>
            )}
          </div>
          <LineChart
            data={avis.daily.map((d) => ({ date: d.date, value: d.nombreAvis }))}
            color="var(--accent-avis)"
          />
        </div>
      )}

      {avis && <ConversionEstimate scans30={stats.last30} avisDaily={avis.daily} />}

      {positionnement && (
        <div className="card" style={{ marginTop: 16 }}>
          <p className="section-title section-concurrence">Comparaison locale</p>
          <p className="subtitle" style={{ marginBottom: 16 }}>
            {positionnement.phrase}
          </p>
          <PositionnementGauge positions={positionnement.positions} />
        </div>
      )}
    </div>
  );
}

export default AdminEtablissementStats;
