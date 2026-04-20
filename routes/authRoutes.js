const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const User = require('../models/User');

// page inscription
router.get('/register', (req, res) => {
    res.render('auth/register', { errors: [] });
});

// inscription avec validation
router.post('/register', [
    body('name')
        .trim()
        .notEmpty().withMessage('Le nom est obligatoire.'),
    body('email')
        .trim()
        .isEmail().withMessage('Veuillez entrer un email valide.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.')
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('auth/register', { errors: errors.array() });
    }

    const existingUser = await User.findOne({ where: { email: req.body.email } });
    if (existingUser) {
        return res.render('auth/register', {
            errors: [{ msg: 'Cet email est déjà utilisé.' }]
        });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    await User.create({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        role: 'user'
    });

    req.flash('success', 'Inscription réussie ! Vous pouvez maintenant vous connecter.');
    res.redirect('/auth/login');
});

// page connexion
router.get('/login', (req, res) => {
    res.render('auth/login', { errors: [] });
});

// connexion avec validation
router.post('/login', [
    body('email')
        .trim()
        .isEmail().withMessage('Veuillez entrer un email valide.')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Le mot de passe est requis.')
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('auth/login', { errors: errors.array() });
    }

    const user = await User.findOne({
        where: { email: req.body.email }
    });

    if (!user) {
        return res.render('auth/login', {
            errors: [{ msg: 'Utilisateur introuvable.' }]
        });
    }

    const passwordOk = await bcrypt.compare(req.body.password, user.password);

    if (!passwordOk) {
        return res.render('auth/login', {
            errors: [{ msg: 'Mot de passe incorrect.' }]
        });
    }

    req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    req.flash('success', 'Connexion réussie ! Bienvenue ' + user.name + '.');
    res.redirect('/');
});

// page mot de passe oublié
router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', { errors: [] });
});

// réinitialiser le mot de passe
router.post('/forgot-password', [
    body('email')
        .trim()
        .isEmail().withMessage('Veuillez entrer un email valide.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
    body('password_confirm')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Les mots de passe ne correspondent pas.');
            }
            return true;
        })
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('auth/forgot-password', { errors: errors.array() });
    }

    const user = await User.findOne({ where: { email: req.body.email } });

    if (!user) {
        return res.render('auth/forgot-password', {
            errors: [{ msg: 'Aucun compte trouvé avec cet email.' }]
        });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    await user.save();

    req.flash('success', 'Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.');
    res.redirect('/auth/login');
});

// déconnexion
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;