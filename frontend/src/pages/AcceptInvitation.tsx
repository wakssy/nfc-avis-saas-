import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

function AcceptInvitation() {
  const { token } = useParams();
  const [nom, setNom] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkInvitation() {
      const res = await apiFetch(`/auth/invitation/${token}`);
      if (res.ok) {
        const data = await res.json();
        setNom(data.nom);
      } else {
        const data = await res.json();
        setError(data.error || 'Lien invalide');
      }
      setLoading(false);
    }
    checkInvitation();
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const res = await apiFetch(`/auth/invitation/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      navigate('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur');
    }
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h1>Créer votre accès</h1>
      {nom ? (
        <>
          <p>Bienvenue <strong>{nom}</strong>, choisissez votre mot de passe pour accéder à votre dashboard.</p>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Choisissez un mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{ width: '100%', padding: 8, marginBottom: 8 }}
              autoFocus
            />
            <button type="submit" style={{ width: '100%', padding: 8 }}>
              Valider
            </button>
          </form>
        </>
      ) : (
        <p style={{ color: 'red' }}>{error}</p>
      )}
      {nom && error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default AcceptInvitation;
