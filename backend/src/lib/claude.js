const MODELE_PAR_DEFAUT = 'claude-haiku-4-5-20251001';

function tonAttendu(note) {
  if (note >= 4) return 'un remerciement sincère et chaleureux';
  if (note === 3) return 'une réponse nuancée qui reconnaît les points positifs et les points à améliorer';
  return 'une réponse empathique, qui présente des excuses sincères et propose de la contacter directement pour arranger la situation';
}

async function genererReponseAvis({ nomEtablissement, texteAvis, note }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY absente');
  }

  const contenuAvis = texteAvis
    ? `Voici l'avis laissé par le client :\n"${texteAvis}"`
    : "Le client n'a pas laissé de texte, seulement une note.";

  const prompt = `Tu es le propriétaire de l'établissement "${nomEtablissement}". Un client vient de laisser un avis Google noté ${note}/5.

${contenuAvis}

Rédige une réponse à cet avis, à publier telle quelle sur Google. Consignes :
- En français, 2 à 4 phrases maximum.
- Ton attendu : ${tonAttendu(note)}.
- Réponds spécifiquement au contenu de l'avis (ne sois pas générique), sauf s'il n'y a pas de texte.
- Naturelle et humaine, jamais robotique ou formatée comme un email.
- N'ajoute ni guillemets, ni signature, ni formule d'introduction du type "Voici ma réponse". Écris uniquement le texte de la réponse.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || MODELE_PAR_DEFAUT,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API a répondu ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const texte = data.content?.[0]?.text?.trim();
  if (!texte) {
    throw new Error("Réponse vide de l'API Anthropic");
  }

  return texte;
}

module.exports = { genererReponseAvis };
