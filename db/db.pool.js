const {Pool} = require('pg')

module.exports.pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'quiz',
    password: 'root',
    port: 9999,
})