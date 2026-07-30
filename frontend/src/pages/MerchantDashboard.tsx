import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';
import ConversionEstimate from '../components/ConversionEstimate';
import StatTile from '../components/StatTile';
import PositionnementGauge from '../components/PositionnementGauge';
import AvisRecusSection from '../components/AvisRecusSection';

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
        <p className="section-title section-objectif">Objectif mensuel</p>
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
        <p className="section-title section-objectif" style={{ marginBottom: 8 }}>Objectif mensuel</p>
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
  const meterClass = objectifMeterClass(percent);

  return (
    <div className="card">
      <div className="topbar" style={{ marginBottom: 10 }}>
        <p className="section-title section-objectif" style={{ margin: 0 }}>
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
        <div className={`meter-fill ${meterClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MessageRelanceSection() {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [defaultMessage, setDefaultMessage] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await apiFetch('/merchant/profil');
      if (res.ok) {
        const data = await res.json();
        const fallback = `Bonjour, voici le récapitulatif de ${data.nom} !`;
        setDefaultMessage(fallback);
        setValue(data.messageRelance || fallback);
      }
    }
    load();
  }, []);

  async function handleSave() {
    await apiFetch('/merchant/message-relance', {
      method: 'PUT',
      body: JSON.stringify({ message: value }),
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="topbar" style={{ marginBottom: 8 }}>
        <p className="section-title" style={{ margin: 0 }}>
          Message de vos emails récapitulatifs
        </p>
        {!editing && (
          <button className="btn-link" onClick={() => setEditing(true)}>
            Modifier
          </button>
        )}
      </div>
      {editing ? (
        <>
          <textarea
            className="input"
            style={{ minHeight: 80, fontFamily: 'inherit' }}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            Enregistrer
          </button>{' '}
          <button className="btn btn-sm" onClick={() => setEditing(false)}>
            Annuler
          </button>
        </>
      ) : (
        <p className="subtitle">{value || defaultMessage}</p>
      )}
      {saved && <p style={{ color: 'var(--success)', fontSize: 13 }}>Enregistré ✓</p>}
    </div>
  );
}

function MerchantDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [avis, setAvis] = useState<AvisHistorique | null>(null);
  const [positionnement, setPositionnement] = useState<Positionnement | null>(null);
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

  async function loadPositionnement() {
    const res = await apiFetch('/merchant/positionnement');
    if (res.ok) {
      setPositionnement(await res.json());
    }
  }

  useEffect(() => {
    loadStats();
    loadAvis();
    loadPositionnement();
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

      <div style={{ marginBottom: 16 }}>
        <ObjectifSection
          thisMonth={stats.thisMonth}
          objectifMensuel={stats.objectifMensuel}
          onChanged={loadStats}
        />
      </div>

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

      <AvisRecusSection />

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

      <MessageRelanceSection />
    </div>
  );
}

export default MerchantDashboard;
