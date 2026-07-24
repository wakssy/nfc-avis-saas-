function requireAdmin(req, res, next) {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
}

module.exports = requireAdmin;
