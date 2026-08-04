const express = require('express');
const { sendContactNotification } = require('../lib/email');

const router = express.Router();

router.post('/', async (req, res) => {
  const nom = typeof req.body?.nom === 'string' ? req.body.nom.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!nom || !email || !message) {
    return res.status(400).json({ error: 'Merci de remplir tous les champs.' });
  }
  if (!email.includes('@') || email.length > 200) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }
  if (nom.length > 200 || message.length > 5000) {
    return res.status(400).json({ error: 'Message trop long.' });
  }

  try {
    await sendContactNotification({ nom, email, message });
    res.json({ status: 'ok' });
  } catch (err) {
    console.error("Échec de l'envoi du message de contact:", err);
    res.status(500).json({ error: "Erreur lors de l'envoi. Réessaie dans un instant." });
  }
});

module.exports = router;
