const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const sequelize = require('./config/database');
const Product = require('./models/Product');
const User = require('./models/User');
const Category = require('./models/Category');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// configuration EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// middleware
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));

// method-override pour PUT et DELETE dans les formulaires
app.use(methodOverride('_method'));

app.use(session({
    secret: 'mon_secret_etudiant',
    resave: false,
    saveUninitialized: false
}));

// connect-flash
app.use(flash());

// variables globales (user + flash messages)
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    next();
});

// routes
app.get('/', (req, res) => {
    res.render('home');
});

app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// sync DB
sequelize.sync({ alter: true })
    .then(() => {
        console.log('Base synchronisée');

        app.listen(3000, () => {
            console.log('Serveur démarré sur http://localhost:3000');
        });
    })
    .catch(err => {
        console.log('Erreur :', err);
    });