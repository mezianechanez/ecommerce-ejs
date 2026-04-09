const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('ecommerce_db', 'root', 'root123', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = sequelize;