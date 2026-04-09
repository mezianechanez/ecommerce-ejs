const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const User = require('../models/User');

// page inscription
router.get('/register', (req, res) => {
    res.render('auth/register');
});

// inscription
router.post('/register', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    await User.create({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        role: 'user'
    });

    res.redirect('/auth/login');
});

// page connexion
router.get('/login', (req, res) => {
    res.render('auth/login');
});

// connexion
router.post('/login', async (req, res) => {
    const user = await User.findOne({
        where: { email: req.body.email }
    });

    if (!user) {
        return res.send('Utilisateur introuvable');
    }

    const passwordOk = await bcrypt.compare(req.body.password, user.password);

    if (!passwordOk) {
        return res.send('Mot de passe incorrect');
    }

    req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    res.redirect('/');
});

// déconnexion
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;