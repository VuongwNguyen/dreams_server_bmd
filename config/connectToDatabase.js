const { Sequelize } = require('sequelize');
require('dotenv').config();

const DATABASE_NAME = process.env.DATABASE_NAME || "TestDATN";
const DATABASE_USERNAME = "root";
const DATABASE_PASSWORD = process.env.PASSWORD || "0134";
const DATABASE_HOST = process.env.HOSTNAME || "localhost";
// const DATABASE_PORT = process.env.DATABASE_PORT || "";


const sequelize = new Sequelize(DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD, {
    host: DATABASE_HOST,
    dialect: 'mysql',
    logging: false
});
const sequelizeCheck = new Sequelize('sys', DATABASE_USERNAME, DATABASE_PASSWORD, {
    host: DATABASE_HOST,
    dialect: 'mysql',
    logging: false
});


async function Start() {
    try {
        const [results] = await sequelizeCheck.query(`SHOW DATABASES LIKE '${DATABASE_NAME}'`);
        if (results.length === 0) {
            await sequelizeCheck.query(`CREATE DATABASE ${DATABASE_NAME}`);
            console.log('Database created successfully');
        } else {
            console.log('Database already exists');
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        await sequelize.sync();
    }
};
module.exports = { sequelize, Start };