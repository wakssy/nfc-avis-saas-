import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

function MerchantLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      navigate('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur de connexion');
    }
  }

  return (
    <div className="center-page">
      <div className="container-narrow" style={{ width: '100%' }}>
        <div className="card">
          <div className="logo-mark">
            avis<span>plaque</span>
          </div>
          <p className="subtitle" style={{ marginBottom: 20 }}>
            Connexion à votre dashboard
          </p>
          <form onSubmit={handleSubmit}>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <input
              className="input"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Se connecter
            </button>
          </form>
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default MerchantLogin;
