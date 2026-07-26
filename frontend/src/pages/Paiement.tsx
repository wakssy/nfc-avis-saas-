import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

function Paiement() {
  const { token } = useParams();
  const [nom, setNom] = useState<string | null>(null);
  const [dejaPaye, setDejaPaye] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`/paiement/${token}`);
      if (res.ok) {
        const data = await res.json();
        setNom(data.nom);
        setDejaPaye(data.dejaPaye);
      } else {
        const data = await res.json();
        setError(data.error || 'Lien invalide');
      }
      setLoading(false);
    }
    load();
  }, [token]);

  async function handleChoice(offre: 'plaque' | 'abonnement') {
    setRedirecting(true);
    setError('');

    const res = await apiFetch(`/paiement/${token}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ offre }),
    });

    if (res.ok) {
      const data = await res.json();
      window.location.href = data.url;
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur lors de la création du paiement');
      setRedirecting(false);
    }
  }

  return (
    <div className="center-page">
      <div className="container-narrow" style={{ width: '100%', maxWidth: 480 }}>
        <div className="card">
          <div className="logo-mark">
            avis<span>plaque</span>
          </div>

          {loading ? (
            <p className="subtitle">Chargement...</p>
          ) : error && !nom ? (
            <p className="error-text">{error}</p>
          ) : dejaPaye ? (
            <p className="subtitle" style={{ marginTop: 12 }}>
              Le paiement pour <strong style={{ color: 'var(--text-primary)' }}>{nom}</strong> a déjà été
              effectué. Si besoin, contacte-nous directement.
            </p>
          ) : (
            <>
              <p className="subtitle" style={{ marginTop: 12, marginBottom: 20 }}>
                Choisissez votre offre pour <strong style={{ color: 'var(--text-primary)' }}>{nom}</strong>
              </p>

              <div className="card" style={{ marginBottom: 12 }}>
                <p className="section-title section-scans">Plaque seule</p>
                <p style={{ fontSize: 24, fontWeight: 700, margin: '4px 0' }}>45 €</p>
                <p className="subtitle" style={{ marginBottom: 12 }}>
                  Achat unique, aucun abonnement.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={redirecting}
                  onClick={() => handleChoice('plaque')}
                >
                  Payer 45 €
                </button>
              </div>

              <div className="card">
                <p className="section-title section-avis">Plaque + abonnement</p>
                <p style={{ fontSize: 24, fontWeight: 700, margin: '4px 0' }}>
                  14,99 € <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>/mois</span>
                </p>
                <p className="subtitle" style={{ marginBottom: 12 }}>
                  Plaque offerte. Engagement minimum de 2 mois.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={redirecting}
                  onClick={() => handleChoice('abonnement')}
                >
                  S'abonner
                </button>
              </div>

              {error && <p className="error-text">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Paiement;
