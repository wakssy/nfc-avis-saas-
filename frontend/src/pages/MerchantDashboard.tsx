import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';
import ConversionEstimate from '../components/ConversionEstimate';

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

function ObjectifSection({
  thisMonth,
  objectifMensuel,
  onChanged,
}: {
  thisMonth: number;
  objectifMensuel: number | null;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(objectifMensuel ?? ''));

  async function handleSave() {
    const parsed = value === '' ? null : Number(value);
    await apiFetch('/merchant/objectif', {
      method: 'PUT',
      body: JSON.stringify({ objectif: parsed }),
    });
    setEditing(false);
    onChanged();
  }

  if (objectifMensuel === null && !editing) {
    return (
      <div className="card">
        <p className="subtitle" style={{ marginBottom: 12 }}>
          Fixez-vous un objectif de scans pour ce mois-ci et suivez votre progression.
        </p>
        <button className="btn btn-primary" onClick={() => setEditing(true)}>
          Définir un objectif mensuel
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="card">
        <p className="section-title" style={{ marginBottom: 8 }}>Objectif mensuel</p>
        <div className="field-row">
          <input
            className="input"
            type="number"
            min={0}
            value={value}
            onChange={(ev) => setValue(ev.target.value)}
            placeholder="Nombre de scans visés ce mois-ci"
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleSave}>
            Enregistrer
          </button>
          <button className="btn" onClick={() => setEditing(false)}>
            Annuler
          </button>
        </div>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((thisMonth / (objectifMensuel || 1)) * 100));
  const complete = percent >= 100;

  return (
    <div className="card">
      <div className="topbar" style={{ marginBottom: 10 }}>
        <p className="section-title" style={{ margin: 0 }}>
          Objectif du mois
        </p>
        <button className="btn-link" onClick={() => setEditing(true)}>
          Modifier
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'baseline' }}>
        <span style={{ fontSize: 15 }}>
          <strong>{thisMonth}</strong> / {objectifMensuel} scans
        </span>
        <span style={{ fontSize: 13, color: complete ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 600 }}>
          {complete ? 'Objectif atteint 🎉' : `${percent}%`}
        </span>
      </div>
      <div className="meter">
        <div className={`meter-fill${complete ? ' complete' : ''}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MerchantDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [avis, setAvis] = useState<AvisHistorique | null>(null);
  const navigate = useNavigate();

  async function loadStats() {
    const res = await apiFetch('/merchant/stats');
    if (res.status === 401) {
      navigate('/login');
      return;
    }
    const data = await res.json();
    setStats(data);
  }

  async function loadAvis() {
    const res = await apiFetch('/merchant/avis-historique');
    if (res.ok) {
      setAvis(await res.json());
    }
  }

  useEffect(() => {
    loadStats();
    loadAvis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await apiFetch('/auth/logout', { method: 'POST' });
    navigate('/login');
  }

  if (!stats) {
    return (
      <div className="container">
        <p className="subtitle">Chargement...</p>
      </div>
    );
  }

  const isInactive = stats.joursDepuisDernierScan === null || stats.joursDepuisDernierScan >= 8;

  return (
    <div className="container">
      <div className="topbar">
        <div>
          <div className="logo-mark" style={{ fontSize: 16 }}>
            avis<span>plaque</span>
          </div>
          <h1>Mes statistiques</h1>
        </div>
        <button className="btn" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>

      {isInactive && (
        <div className="alert">
          <span>⚠️</span>
          <span>
            {stats.joursDepuisDernierScan === null
              ? 'Aucun scan enregistré pour le moment — vérifiez que votre plaque est bien visible et accessible.'
              : `Aucun scan enregistré depuis ${stats.joursDepuisDernierScan} jours — vérifiez que votre plaque est bien visible et accessible.`}
          </span>
        </div>
      )}

      <div className="stat-grid">
        <StatTile label="Aujourd'hui" value={stats.today} />
        <StatTile label="Cette semaine" value={stats.last7} />
        <StatTile label="Ce mois-ci" value={stats.last30} />
        <StatTile label="Total" value={stats.total} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <ObjectifSection
          thisMonth={stats.thisMonth}
          objectifMensuel={stats.objectifMensuel}
          onChanged={loadStats}
        />
      </div>

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

      {avis && <ConversionEstimate scans30={stats.last30} avisDaily={avis.daily} />}
    </div>
  );
}

export default MerchantDashboard;
