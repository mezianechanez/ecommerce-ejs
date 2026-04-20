const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// afficher la liste (connecté)
router.get('/', requireAuth, async (req, res) => {
    try {
        const users = await User.findAll();
        res.render('users/index', { users, errors: [] });
    } catch (err) {
        req.flash('error', 'Erreur lors de la récupération des utilisateurs.');
        res.render('users/index', { users: [], errors: [] });
    }
});

// afficher formulaire ajout (admin seulement)
router.get('/add', requireAdmin, (req, res) => {
    res.render('users/add', { errors: [] });
});

// ajouter user (admin seulement)
router.post('/add', requireAdmin, [
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
        return res.render('users/add', { errors: errors.array() });
    }

    try {
        const existingUser = await User.findOne({ where: { email: req.body.email } });
        if (existingUser) {
            return res.render('users/add', { errors: [{ msg: 'Cet email est déjà utilisé.' }] });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        await User.create({
            name: req.body.name.trim(),
            email: req.body.email,
            password: hashedPassword,
            role: req.body.role || 'user'
        });

        req.flash('success', 'Utilisateur créé avec succès.');
        res.redirect('/users');
    } catch (error) {
        res.render('users/add', { errors: [{ msg: 'Erreur lors de la création de l\'utilisateur.' }] });
    }
});

// afficher formulaire modification (admin seulement)
router.get('/edit/:id', requireAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            req.flash('error', 'Utilisateur introuvable.');
            return res.redirect('/users');
        }
        res.render('users/edit', { user_edit: user, errors: [] });
    } catch (err) {
        req.flash('error', 'Erreur.');
        res.redirect('/users');
    }
});

// modifier user (admin seulement) - PUT
router.put('/edit/:id', requireAdmin, [
    body('name')
        .trim()
        .notEmpty().withMessage('Le nom est obligatoire.'),
    body('email')
        .trim()
        .isEmail().withMessage('Veuillez entrer un email valide.')
        .normalizeEmail()
], async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            req.flash('error', 'Utilisateur introuvable.');
            return res.redirect('/users');
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('users/edit', { user_edit: user, errors: errors.array() });
        }

        user.name = req.body.name.trim();
        user.email = req.body.email;
        user.role = req.body.role || 'user';

        if (req.body.new_password && req.body.new_password.trim() !== '') {
            user.password = await bcrypt.hash(req.body.new_password.trim(), 10);
        }

        await user.save();
        req.flash('success', 'Utilisateur modifié avec succès.');
        res.redirect('/users');
    } catch (err) {
        req.flash('error', 'Erreur lors de la modification. Cet email est peut-être déjà utilisé.');
        res.redirect('/users');
    }
});

// supprimer user (admin seulement) - DELETE
router.delete('/delete/:id', requireAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            await user.destroy();
            req.flash('success', 'Utilisateur supprimé avec succès.');
        } else {
            req.flash('error', 'Utilisateur introuvable.');
        }
    } catch (err) {
        req.flash('error', 'Erreur lors de la suppression.');
    }
    res.redirect('/users');
});

module.exports = router;
