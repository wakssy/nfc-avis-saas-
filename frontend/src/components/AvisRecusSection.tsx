import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface AvisRecu {
  id: number;
  auteur: string;
  note: number;
  texteAvis: string | null;
  dateAvis: string;
  reponseSuggeree: string | null;
}

function etoiles(note: number) {
  return '★'.repeat(note) + '☆'.repeat(5 - note);
}

function AvisRecuCard({
  avis,
  lienGoogleAvis,
  onTraite,
}: {
  avis: AvisRecu;
  lienGoogleAvis: string | null;
  onTraite: (id: number) => void;
}) {
  const [reponse, setReponse] = useState(avis.reponseSuggeree);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function handleCopier() {
    if (!reponse) return;
    try {
      await navigator.clipboard.writeText(reponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copie ce texte :', reponse);
    }
  }

  async function handleRegenerer() {
    setRegenerating(true);
    setError('');
    const res = await apiFetch(`/merchant/avis-recus/${avis.id}/regenerer`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setReponse(data.reponseSuggeree);
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur lors de la génération');
    }
    setRegenerating(false);
  }

  async function handleMarquerTraite() {
    const res = await apiFetch(`/merchant/avis-recus/${avis.id}/traite`, { method: 'POST' });
    if (res.ok) {
      onTraite(avis.id);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <strong>{avis.auteur}</strong>
        <span style={{ color: 'var(--warning)', fontSize: 15 }}>{etoiles(avis.note)}</span>
      </div>
      <p className="subtitle" style={{ marginBottom: 12 }}>
        {avis.texteAvis || <em>Avis sans commentaire écrit.</em>}
      </p>

      <div
        style={{
          background: 'var(--accent-avis-tint)',
          borderRadius: 'var(--radius-control)',
          padding: 12,
          marginBottom: 10,
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-avis)', marginBottom: 4 }}>
          Réponse suggérée
        </p>
        {reponse ? (
          <p style={{ margin: 0, fontSize: 14 }}>{reponse}</p>
        ) : (
          <p className="subtitle" style={{ margin: 0 }}>
            {regenerating ? 'Génération en cours...' : 'Aucune suggestion disponible pour le moment.'}
          </p>
        )}
      </div>

      {error && <p className="error-text" style={{ marginBottom: 8 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className="btn btn-sm btn-primary" onClick={handleCopier} disabled={!reponse}>
          {copied ? 'Copié ✓' : 'Copier la réponse'}
        </button>
        {lienGoogleAvis && (
          <a
            className="btn btn-sm"
            href={lienGoogleAvis}
            target="_blank"
            rel="noreferrer"
          >
            Ouvrir sur Google
          </a>
        )}
        <button className="btn btn-sm" onClick={handleRegenerer} disabled={regenerating}>
          {reponse ? 'Régénérer' : 'Générer une suggestion'}
        </button>
        <button className="btn btn-sm" onClick={handleMarquerTraite}>
          Marquer comme traité
        </button>
      </div>
    </div>
  );
}

function AvisRecusSection() {
  const [avis, setAvis] = useState<AvisRecu[] | null>(null);
  const [lienGoogleAvis, setLienGoogleAvis] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await apiFetch('/merchant/avis-recus');
      if (res.ok) {
        const data = await res.json();
        setAvis(data.avis);
        setLienGoogleAvis(data.lienGoogleAvis);
      }
    }
    load();
  }, []);

  function handleTraite(id: number) {
    setAvis((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));
  }

  if (!avis || avis.length === 0) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <p className="section-title section-avis">Avis récents à traiter</p>
      {avis.map((a) => (
        <AvisRecuCard key={a.id} avis={a} lienGoogleAvis={lienGoogleAvis} onTraite={handleTraite} />
      ))}
    </div>
  );
}

export default AvisRecusSection;
