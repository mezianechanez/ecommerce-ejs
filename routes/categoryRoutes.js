const express = require('express');
const router = express.Router();

const Category = require('../models/Category');

function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
}

// afficher la liste
router.get('/', async (req, res) => {
    const categories = await Category.findAll();
    res.render('categories/index', { categories, error: null });
});

// afficher formulaire ajout
router.get('/add', isAuthenticated, (req, res) => {
    res.render('categories/add', { error: null });
});

// ajouter catégorie
router.post('/add', isAuthenticated, async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.render('categories/add', { error: 'Le nom de la catégorie est obligatoire.' });
    }

    await Category.create({
        name: name.trim()
    });

    res.redirect('/categories');
});

// afficher formulaire modification
router.get('/edit/:id', isAuthenticated, async (req, res) => {
    const category = await Category.findByPk(req.params.id);
    res.render('categories/edit', { category, error: null });
});

// modifier catégorie
router.post('/edit/:id', isAuthenticated, async (req, res) => {
    const { name } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (!name || name.trim() === '') {
        return res.render('categories/edit', {
            category,
            error: 'Le nom de la catégorie est obligatoire.'
        });
    }

    category.name = name.trim();
    await category.save();

    res.redirect('/categories');
});

// supprimer catégorie
router.get('/delete/:id', isAuthenticated, async (req, res) => {
    const category = await Category.findByPk(req.params.id);
    await category.destroy();

    res.redirect('/categories');
});

module.exports = router;