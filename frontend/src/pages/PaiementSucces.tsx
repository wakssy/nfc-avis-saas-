import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import Logo from '../components/Logo';

function PaiementSucces() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkLogin() {
      const res = await apiFetch('/auth/me');
      if (res.ok) {
        const data = await res.json();
        setLoggedIn(data.loggedIn);
      }
      setLoading(false);
    }
    checkLogin();
  }, []);

  return (
    <div className="center-page">
      <div className="container-narrow" style={{ width: '100%', maxWidth: 480 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <Logo style={{ justifyContent: 'center' }} />
          <p style={{ fontSize: 40, margin: '16px 0 8px' }}>✅</p>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Paiement confirmé</h2>

          {!loading && loggedIn ? (
            <>
              <p className="subtitle" style={{ marginBottom: 20 }}>
                Votre compte est activé. Vous pouvez accéder à votre dashboard dès maintenant.
              </p>
              <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%' }}>
                Accéder à mon dashboard
              </Link>
            </>
          ) : (
            <p className="subtitle">
              Merci ! Vous allez recevoir un email dans quelques instants pour créer votre accès au dashboard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaiementSucces;
