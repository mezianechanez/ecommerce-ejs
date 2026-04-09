const express = require('express');
const router = express.Router();

const Product = require('../models/Product');

// middleware simple pour vérifier connexion
function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
}

// afficher la liste
router.get('/', async (req, res) => {
    const products = await Product.findAll();
    res.render('products/index', { products, error: null });
});

// afficher formulaire ajout
router.get('/add', isAuthenticated, (req, res) => {
    res.render('products/add', { error: null });
});

// ajouter produit
router.post('/add', isAuthenticated, async (req, res) => {
    const { name, price } = req.body;

    if (!name || name.trim() === '') {
        return res.render('products/add', { error: 'Le nom du produit est obligatoire.' });
    }

    if (!price || price <= 0) {
        return res.render('products/add', { error: 'Le prix doit être supérieur à 0.' });
    }

    await Product.create({
        name: name.trim(),
        price: price
    });

    res.redirect('/products');
});

// afficher formulaire modification
router.get('/edit/:id', isAuthenticated, async (req, res) => {
    const product = await Product.findByPk(req.params.id);
    res.render('products/edit', { product, error: null });
});

// modifier produit
router.post('/edit/:id', isAuthenticated, async (req, res) => {
    const { name, price } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!name || name.trim() === '') {
        return res.render('products/edit', {
            product,
            error: 'Le nom du produit est obligatoire.'
        });
    }

    if (!price || price <= 0) {
        return res.render('products/edit', {
            product,
            error: 'Le prix doit être supérieur à 0.'
        });
    }

    product.name = name.trim();
    product.price = price;

    await product.save();

    res.redirect('/products');
});

// supprimer produit
router.get('/delete/:id', isAuthenticated, async (req, res) => {
    const product = await Product.findByPk(req.params.id);

    await product.destroy();

    res.redirect('/products');
});

module.exports = router;