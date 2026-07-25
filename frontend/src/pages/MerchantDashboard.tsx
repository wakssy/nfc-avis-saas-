import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import BarChart from '../components/BarChart';

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

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, flex: 1 }}>
      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{value}</div>
      <div style={{ color: '#666' }}>{label}</div>
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
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => setEditing(true)}>Définir un objectif mensuel</button>
      </div>
    );
  }

  if (editing) {
    return (
      <div style={{ marginBottom: 24 }}>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nombre de scans visés ce mois-ci"
          style={{ padding: 8, marginRight: 8 }}
        />
        <button onClick={handleSave}>Enregistrer</button>{' '}
        <button onClick={() => setEditing(false)}>Annuler</button>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((thisMonth / (objectifMensuel || 1)) * 100));

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span>
          Objectif du mois : {thisMonth} / {objectifMensuel} scans
        </span>
        <button onClick={() => setEditing(true)}>Modifier</button>
      </div>
      <div style={{ background: '#eee', borderRadius: 8, height: 16, overflow: 'hidden' }}>
        <div
          style={{
            width: `${percent}%`,
            background: percent >= 100 ? '#16a34a' : '#4f46e5',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
}

function MerchantDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
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

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await apiFetch('/auth/logout', { method: 'POST' });
    navigate('/login');
  }

  if (!stats) return <p>Chargement...</p>;

  const isInactive = stats.joursDepuisDernierScan === null || stats.joursDepuisDernierScan >= 8;

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Mes statistiques</h1>
        <button onClick={handleLogout}>Se déconnecter</button>
      </div>

      {isInactive && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: 12, marginBottom: 24 }}>
          {stats.joursDepuisDernierScan === null
            ? "Aucun scan enregistré pour le moment — vérifiez que votre plaque est bien visible et accessible"
            : `Aucun scan enregistré depuis ${stats.joursDepuisDernierScan} jours — vérifiez que votre plaque est bien visible et accessible`}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatTile label="Aujourd'hui" value={stats.today} />
        <StatTile label="Cette semaine" value={stats.last7} />
        <StatTile label="Ce mois-ci" value={stats.last30} />
        <StatTile label="Total" value={stats.total} />
      </div>

      <ObjectifSection
        thisMonth={stats.thisMonth}
        objectifMensuel={stats.objectifMensuel}
        onChanged={loadStats}
      />

      <h2>Scans par jour (30 derniers jours)</h2>
      <BarChart data={stats.daily} />
    </div>
  );
}

export default MerchantDashboard;
