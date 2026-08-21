const { getAvisHistorique } = require('./avisStats');
const { getPositionnement } = require('./concurrents');

const PLAFOND_AVIS = 50;

async function getScoreVisibilite(etablissementId) {
  const avis = await getAvisHistorique(etablissementId);
  if (avis.noteMoyenneActuelle === null) return null;

  const positionnement = await getPositionnement(etablissementId);
  const avecPositionnement = Boolean(positionnement && positionnement.total > 1);
  const nombreAvis = avis.nombreAvisActuel || 0;

  const poidsNote = avecPositionnement ? 40 : 65;
  const poidsVolume = avecPositionnement ? 20 : 35;
  const poidsPosition = avecPositionnement ? 40 : 0;

  const scoreNote = (avis.noteMoyenneActuelle / 5) * poidsNote;
  const scoreVolume = Math.min(nombreAvis / PLAFOND_AVIS, 1) * poidsVolume;
  const scorePosition = avecPositionnement
    ? ((positionnement.total - positionnement.rang) / (positionnement.total - 1)) * poidsPosition
    : 0;

  const score = Math.round(Math.min(100, Math.max(0, scoreNote + scoreVolume + scorePosition)));

  let niveau;
  if (score >= 80) niveau = 'Excellent';
  else if (score >= 60) niveau = 'Bon';
  else if (score >= 40) niveau = 'Moyen';
  else niveau = 'À améliorer';

  return { score, niveau, avecPositionnement };
}

module.exports = { getScoreVisibilite };
