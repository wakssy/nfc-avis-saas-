import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import Logo from '../components/Logo';

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
      const data = await res.json();
      if (data.paiementToken) {
        navigate(`/paiement/${data.paiementToken}`);
      } else {
        navigate('/dashboard');
      }
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur');
    }
  }

  return (
    <div className="center-page">
      <div className="container-narrow" style={{ width: '100%' }}>
        <div className="card">
          <Logo />
          <h2 style={{ fontSize: 18, margin: '16px 0 8px' }}>Créer votre accès</h2>

          {loading ? (
            <p className="subtitle">Chargement...</p>
          ) : nom ? (
            <>
              <p className="subtitle" style={{ marginBottom: 20 }}>
                Bienvenue <strong style={{ color: 'var(--text-primary)' }}>{nom}</strong>, choisissez votre mot de
                passe pour accéder à votre dashboard.
              </p>
              <form onSubmit={handleSubmit}>
                <input
                  className="input"
                  type="password"
                  placeholder="Choisissez un mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Valider
                </button>
              </form>
              {error && <p className="error-text">{error}</p>}
            </>
          ) : (
            <p className="error-text">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AcceptInvitation;
