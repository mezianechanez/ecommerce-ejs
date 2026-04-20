const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// afficher la liste (tout le monde)
router.get('/', async (req, res) => {
    const products = await Product.findAll();
    res.render('products/index', { products, errors: [] });
});

// afficher formulaire ajout (connecté)
router.get('/add', requireAuth, (req, res) => {
    res.render('products/add', { errors: [] });
});

// ajouter produit (connecté) — avec upload image
router.post('/add', requireAuth, upload.single('image'), [
    body('name')
        .trim()
        .notEmpty().withMessage('Le nom du produit est obligatoire.'),
    body('price')
        .isFloat({ gt: 0 }).withMessage('Le prix doit être un nombre supérieur à 0.')
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('products/add', { errors: errors.array() });
    }

    await Product.create({
        name: req.body.name.trim(),
        price: req.body.price,
        image: req.file ? '/public/uploads/' + req.file.filename : null
    });

    req.flash('success', 'Produit ajouté avec succès.');
    res.redirect('/products');
});

// afficher formulaire modification (admin seulement)
router.get('/edit/:id', requireAdmin, async (req, res) => {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
        req.flash('error', 'Produit introuvable.');
        return res.redirect('/products');
    }
    res.render('products/edit', { product, errors: [] });
});

// modifier produit (admin seulement) - PUT avec upload image
router.put('/edit/:id', requireAdmin, upload.single('image'), [
    body('name')
        .trim()
        .notEmpty().withMessage('Le nom du produit est obligatoire.'),
    body('price')
        .isFloat({ gt: 0 }).withMessage('Le prix doit être un nombre supérieur à 0.')
], async (req, res) => {
    const errors = validationResult(req);
    const product = await Product.findByPk(req.params.id);

    if (!product) {
        req.flash('error', 'Produit introuvable.');
        return res.redirect('/products');
    }

    if (!errors.isEmpty()) {
        return res.render('products/edit', { product, errors: errors.array() });
    }

    product.name = req.body.name.trim();
    product.price = req.body.price;

    // mettre à jour l'image seulement si une nouvelle est envoyée
    if (req.file) {
        product.image = '/public/uploads/' + req.file.filename;
    }

    await product.save();

    req.flash('success', 'Produit modifié avec succès.');
    res.redirect('/products');
});

// supprimer produit (admin seulement) - DELETE
router.delete('/delete/:id', requireAdmin, async (req, res) => {
    const product = await Product.findByPk(req.params.id);

    if (product) {
        await product.destroy();
        req.flash('success', 'Produit supprimé avec succès.');
    } else {
        req.flash('error', 'Produit introuvable.');
    }

    res.redirect('/products');
});

module.exports = router;