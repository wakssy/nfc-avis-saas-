import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface Etablissement {
  id: string;
  nom: string;
  lien_google_avis: string;
  email: string | null;
  a_un_compte: boolean;
  invitation_en_attente: boolean;
  date_creation: string;
}

function AdminDashboard() {
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [nom, setNom] = useState('');
  const [lienGoogleAvis, setLienGoogleAvis] = useState('');
  const [idPersonnalise, setIdPersonnalise] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function loadEtablissements() {
    const res = await apiFetch('/admin/etablissements');
    if (res.status === 401) {
      navigate('/admin/login');
      return;
    }
    const data = await res.json();
    setEtablissements(data);
    setLoading(false);
  }

  useEffect(() => {
    loadEtablissements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const res = await apiFetch('/admin/etablissements', {
      method: 'POST',
      body: JSON.stringify({
        nom,
        lien_google_avis: lienGoogleAvis,
        id: idPersonnalise || undefined,
        email: email || undefined,
      }),
    });

    if (res.ok) {
      setNom('');
      setLienGoogleAvis('');
      setIdPersonnalise('');
      setEmail('');
      loadEtablissements();
    } else {
      const data = await res.json();
      setError(data.error || "Erreur lors de la création");
    }
  }

  async function handleInvite(id: string, currentEmail: string | null) {
    const targetEmail = currentEmail || window.prompt("Email du commerçant pour l'inviter :");
    if (!targetEmail) return;

    const res = await apiFetch(`/admin/etablissements/${id}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail }),
    });

    if (res.ok) {
      loadEtablissements();
    } else {
      const data = await res.json();
      alert(data.error || "Erreur lors de l'envoi de l'invitation");
    }
  }

  async function handleLogout() {
    await apiFetch('/admin/logout', { method: 'POST' });
    navigate('/admin/login');
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Établissements</h1>
        <button onClick={handleLogout}>Se déconnecter</button>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <h2>Ajouter un établissement</h2>
        <input
          placeholder="Nom du commerce"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <input
          placeholder="Lien fiche avis Google"
          value={lienGoogleAvis}
          onChange={(e) => setLienGoogleAvis(e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <input
          placeholder="ID personnalisé (optionnel, pour une plaque déjà imprimée 1-50)"
          value={idPersonnalise}
          onChange={(e) => setIdPersonnalise(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <input
          type="email"
          placeholder="Email du commerçant (optionnel, envoie une invitation automatiquement)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <button type="submit" style={{ padding: 8 }}>Ajouter</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>ID</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Nom</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Lien avis Google</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Compte commerçant</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Créé le</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}></th>
          </tr>
        </thead>
        <tbody>
          {etablissements.map((e) => (
            <tr key={e.id}>
              <td>{e.id}</td>
              <td>{e.nom}</td>
              <td>
                <a href={e.lien_google_avis} target="_blank" rel="noreferrer">
                  {e.lien_google_avis}
                </a>
              </td>
              <td>
                {e.a_un_compte ? (
                  <span>Actif ({e.email})</span>
                ) : (
                  <>
                    <span>{e.invitation_en_attente ? 'Invitation envoyée' : 'Aucun accès'}</span>
                    {' '}
                    <button onClick={() => handleInvite(e.id, e.email)}>
                      {e.invitation_en_attente ? 'Renvoyer' : 'Inviter'}
                    </button>
                  </>
                )}
              </td>
              <td>{new Date(e.date_creation).toLocaleString('fr-FR')}</td>
              <td>
                <Link to={`/admin/etablissements/${e.id}`}>Voir stats</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
