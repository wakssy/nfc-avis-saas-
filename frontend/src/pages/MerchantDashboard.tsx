import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import BarChart from '../components/BarChart';

interface Stats {
  total: number;
  last7: number;
  last30: number;
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

function MerchantDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStats() {
      const res = await apiFetch('/merchant/stats');
      if (res.status === 401) {
        navigate('/login');
        return;
      }
      const data = await res.json();
      setStats(data);
    }
    loadStats();
  }, [navigate]);

  async function handleLogout() {
    await apiFetch('/auth/logout', { method: 'POST' });
    navigate('/login');
  }

  if (!stats) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Mes statistiques</h1>
        <button onClick={handleLogout}>Se déconnecter</button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatTile label="Scans au total" value={stats.total} />
        <StatTile label="7 derniers jours" value={stats.last7} />
        <StatTile label="30 derniers jours" value={stats.last30} />
      </div>

      <h2>Scans par jour (30 derniers jours)</h2>
      <BarChart data={stats.daily} />
    </div>
  );
}

export default MerchantDashboard;
