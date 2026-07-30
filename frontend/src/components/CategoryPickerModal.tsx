import { useState } from 'react';
import { PLACE_CATEGORIES } from '../lib/placeCategories';

function CategoryPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const [filtre, setFiltre] = useState('');

  const resultats = PLACE_CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(filtre.trim().toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="section-title section-concurrence" style={{ marginBottom: 8 }}>
          Changer la catégorie de recherche
        </p>
        <p className="subtitle" style={{ marginBottom: 12 }}>
          Choisis le type d'activité le plus proche pour retrouver des concurrents pertinents.
        </p>
        <input
          className="input"
          placeholder="Rechercher une catégorie (ex: coiffeur, restaurant...)"
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          autoFocus
        />
        <div className="category-list">
          <button className="category-list-item category-list-item-muted" onClick={() => onSelect('')}>
            Aucune catégorie (recherche plus large)
          </button>
          {resultats.map((c) => (
            <button key={c.value} className="category-list-item" onClick={() => onSelect(c.value)}>
              {c.label}
            </button>
          ))}
          {resultats.length === 0 && (
            <p className="subtitle" style={{ padding: '12px 4px' }}>
              Aucune catégorie ne correspond à cette recherche.
            </p>
          )}
        </div>
        <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={onClose}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default CategoryPickerModal;
