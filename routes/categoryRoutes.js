const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const Category = require('../models/Category');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// afficher la liste (tout le monde)
router.get('/', async (req, res) => {
    const categories = await Category.findAll();
    res.render('categories/index', { categories, errors: [] });
});

// afficher formulaire ajout (connecté)
router.get('/add', requireAuth, (req, res) => {
    res.render('categories/add', { errors: [] });
});

// ajouter catégorie (connecté)
router.post('/add', requireAuth, [
    body('name')
        .trim()
        .notEmpty().withMessage('Le nom de la catégorie est obligatoire.')
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('categories/add', { errors: errors.array() });
    }

    await Category.create({
        name: req.body.name.trim()
    });

    req.flash('success', 'Catégorie ajoutée avec succès.');
    res.redirect('/categories');
});

// afficher formulaire modification (admin seulement)
router.get('/edit/:id', requireAdmin, async (req, res) => {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
        req.flash('error', 'Catégorie introuvable.');
        return res.redirect('/categories');
    }
    res.render('categories/edit', { category, errors: [] });
});

// modifier catégorie (admin seulement) - PUT
router.put('/edit/:id', requireAdmin, [
    body('name')
        .trim()
        .notEmpty().withMessage('Le nom de la catégorie est obligatoire.')
], async (req, res) => {
    const errors = validationResult(req);
    const category = await Category.findByPk(req.params.id);

    if (!category) {
        req.flash('error', 'Catégorie introuvable.');
        return res.redirect('/categories');
    }

    if (!errors.isEmpty()) {
        return res.render('categories/edit', { category, errors: errors.array() });
    }

    category.name = req.body.name.trim();
    await category.save();

    req.flash('success', 'Catégorie modifiée avec succès.');
    res.redirect('/categories');
});

// supprimer catégorie (admin seulement) - DELETE
router.delete('/delete/:id', requireAdmin, async (req, res) => {
    const category = await Category.findByPk(req.params.id);

    if (category) {
        await category.destroy();
        req.flash('success', 'Catégorie supprimée avec succès.');
    } else {
        req.flash('error', 'Catégorie introuvable.');
    }

    res.redirect('/categories');
});

module.exports = router;