import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface Etablissement {
  id: string;
  nom: string;
  lien_google_avis: string;
  email: string | null;
  objectif_mensuel: number | null;
  a_un_compte: boolean;
  invitation_en_attente: boolean;
  date_creation: string;
}

function EtablissementRow({
  e,
  onChanged,
}: {
  e: Etablissement;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [nom, setNom] = useState(e.nom);
  const [lien, setLien] = useState(e.lien_google_avis);
  const [email, setEmail] = useState(e.email || '');
  const [objectif, setObjectif] = useState(String(e.objectif_mensuel ?? ''));
  const [error, setError] = useState('');

  async function handleInvite() {
    const targetEmail = e.email || window.prompt("Email du commerçant pour l'inviter :");
    if (!targetEmail) return;

    const res = await apiFetch(`/admin/etablissements/${e.id}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail }),
    });

    if (res.ok) {
      onChanged();
    } else {
      const data = await res.json();
      alert(data.error || "Erreur lors de l'envoi de l'invitation");
    }
  }

  async function handleSave() {
    setError('');
    const res = await apiFetch(`/admin/etablissements/${e.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nom,
        lien_google_avis: lien,
        email: email || undefined,
        objectif_mensuel: objectif === '' ? null : Number(objectif),
      }),
    });

    if (res.ok) {
      setEditing(false);
      onChanged();
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur lors de la modification');
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Supprimer définitivement "${e.nom}" ? Cette action est irréversible.`)) {
      return;
    }
    const res = await apiFetch(`/admin/etablissements/${e.id}`, { method: 'DELETE' });
    if (res.ok) {
      onChanged();
    } else {
      const data = await res.json();
      alert(data.error || 'Erreur lors de la suppression');
    }
  }

  if (editing) {
    return (
      <tr>
        <td>{e.id}</td>
        <td colSpan={5}>
          <div className="field-row" style={{ marginBottom: 6 }}>
            <input className="input" value={nom} onChange={(ev) => setNom(ev.target.value)} placeholder="Nom" />
            <input
              className="input"
              value={lien}
              onChange={(ev) => setLien(ev.target.value)}
              placeholder="Lien avis Google"
              style={{ minWidth: 220 }}
            />
            <input
              className="input"
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="Email"
            />
            <input
              className="input"
              type="number"
              min={0}
              value={objectif}
              onChange={(ev) => setObjectif(ev.target.value)}
              placeholder="Objectif mensuel"
              style={{ maxWidth: 130 }}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            Enregistrer
          </button>{' '}
          <button className="btn btn-sm" onClick={() => setEditing(false)}>
            Annuler
          </button>
          {error && <p className="error-text">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <code>{e.id}</code>
      </td>
      <td>{e.nom}</td>
      <td>
        <a href={e.lien_google_avis} target="_blank" rel="noreferrer" className="link">
          Voir la fiche
        </a>
      </td>
      <td>
        {e.a_un_compte ? (
          <span className="badge badge-success">Actif · {e.email}</span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="badge badge-muted">
              {e.invitation_en_attente ? 'Invitation envoyée' : 'Aucun accès'}
            </span>
            <button className="btn btn-sm" onClick={handleInvite}>
              {e.invitation_en_attente ? 'Renvoyer' : 'Inviter'}
            </button>
          </div>
        )}
      </td>
      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
        {new Date(e.date_creation).toLocaleDateString('fr-FR')}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          <Link to={`/admin/etablissements/${e.id}`} className="btn btn-sm">
            Stats
          </Link>
          <button className="btn btn-sm" onClick={() => setEditing(true)}>
            Modifier
          </button>
          <button className="btn btn-sm btn-danger" onClick={handleDelete}>
            Supprimer
          </button>
        </div>
      </td>
    </tr>
  );
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
      setError(data.error || 'Erreur lors de la création');
    }
  }

  async function handleLogout() {
    await apiFetch('/admin/logout', { method: 'POST' });
    navigate('/admin/login');
  }

  if (loading) {
    return (
      <div className="container">
        <p className="subtitle">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 1100 }}>
      <div className="topbar">
        <div>
          <div className="logo-mark" style={{ fontSize: 16 }}>
            avis<span>plaque</span>
          </div>
          <h1>Établissements</h1>
        </div>
        <button className="btn" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <p className="section-title">Ajouter un établissement</p>
        <form onSubmit={handleSubmit}>
          <div className="field-row" style={{ marginBottom: 4 }}>
            <input
              className="input"
              placeholder="Nom du commerce"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Lien fiche avis Google"
              value={lienGoogleAvis}
              onChange={(e) => setLienGoogleAvis(e.target.value)}
              required
            />
          </div>
          <div className="field-row" style={{ marginBottom: 12 }}>
            <input
              className="input"
              placeholder="ID personnalisé (optionnel, plaque 1-50)"
              value={idPersonnalise}
              onChange={(e) => setIdPersonnalise(e.target.value)}
            />
            <input
              className="input"
              type="email"
              placeholder="Email du commerçant (envoie une invitation)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Ajouter
          </button>
          {error && <p className="error-text">{error}</p>}
        </form>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Avis Google</th>
              <th>Compte commerçant</th>
              <th>Créé le</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {etablissements.map((e) => (
              <EtablissementRow key={e.id} e={e} onChanged={loadEtablissements} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
