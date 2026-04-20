// Middleware d'authentification
function requireAuth(req, res, next) {
    if (!req.session.user) {
        req.flash('error', 'Vous devez être connecté pour accéder à cette page.');
        return res.redirect('/auth/login');
    }
    next();
}

// Middleware d'autorisation admin
function requireAdmin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', 'Vous devez être connecté pour accéder à cette page.');
        return res.redirect('/auth/login');
    }
    if (req.session.user.role !== 'admin') {
        req.flash('error', 'Accès refusé. Vous devez être administrateur.');
        return res.redirect('/');
    }
    next();
}

module.exports = { requireAuth, requireAdmin };
