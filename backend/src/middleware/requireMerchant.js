function requireMerchant(req, res, next) {
  if (!req.session || !req.session.etablissementId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
}

module.exports = requireMerchant;
