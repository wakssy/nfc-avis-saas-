const { getAvisHistorique } = require('./avisStats');
const { getPositionnement } = require('./concurrents');

const PLAFOND_AVIS = 50;

function calculerScore({ noteMoyenne, nombreAvis, positionnement }) {
  const avecPositionnement = Boolean(positionnement && positionnement.total > 1);
  const poidsNote = avecPositionnement ? 40 : 65;
  const poidsVolume = avecPositionnement ? 20 : 35;
  const poidsPosition = avecPositionnement ? 40 : 0;

  const scoreNote = (noteMoyenne / 5) * poidsNote;
  const scoreVolume = Math.min(nombreAvis / PLAFOND_AVIS, 1) * poidsVolume;
  const scorePosition = avecPositionnement
    ? ((positionnement.total - positionnement.rang) / (positionnement.total - 1)) * poidsPosition
    : 0;

  return Math.round(Math.min(100, Math.max(0, scoreNote + scoreVolume + scorePosition)));
}

function niveauPour(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Moyen';
  return 'À améliorer';
}

async function getScoreVisibilite(etablissementId) {
  const avis = await getAvisHistorique(etablissementId);
  if (avis.noteMoyenneActuelle === null) return null;

  const positionnement = await getPositionnement(etablissementId);
  const nombreAvisActuel = avis.nombreAvisActuel || 0;

  const score = calculerScore({
    noteMoyenne: avis.noteMoyenneActuelle,
    nombreAvis: nombreAvisActuel,
    positionnement,
  });

  const ilYa30j = avis.daily[0];
  let evolution = null;

  if (ilYa30j.noteMoyenne !== null && ilYa30j.nombreAvis !== null) {
    const scoreIlYa30j = calculerScore({
      noteMoyenne: ilYa30j.noteMoyenne,
      nombreAvis: ilYa30j.nombreAvis,
      positionnement,
    });

    evolution = {
      diffScore: score - scoreIlYa30j,
      nouveauxAvis: nombreAvisActuel - ilYa30j.nombreAvis,
    };
  }

  return {
    score,
    niveau: niveauPour(score),
    avecPositionnement: Boolean(positionnement && positionnement.total > 1),
    evolution,
  };
}

module.exports = { getScoreVisibilite };
