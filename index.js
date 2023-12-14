const express = require('express');
const cors = require('cors');
const {join} = require("path");
const {readFileSync} = require("fs");
const {pool} = require("./db/db.pool");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express()

app.use(cors())
app.use(express.json())

app.use('/images', express.static(join(__dirname + '/images')));

app.post('/data', (req, res) => {
    const {id} = req.body;

    const data = (JSON.parse(readFileSync(__dirname + '/quests.json', "utf-8")))[id];

    res.send(data);
})

app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Неправильная почта или пароль' });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Incorrect username or password' });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_KEY, {expiresIn: "2h"});

        res.status(201).json({token: token, id: user.id})
    } catch (error) {
        res.status(400).json({ message: 'Authentication error' });
    }
})

app.post('/register', async (req, res) => {{
    const { email, nickname, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await pool.query(
            'INSERT INTO users (email, nickname, password) VALUES ($1, $2, $3) RETURNING id',
            [email, nickname, hashedPassword]
        );
        res.status(201).json('Success');
    } catch (error) {
        res.status(400).json(error);
    }
}})

app.post('/getUser', async (req, res) => {
    const {id} = req.body;

    try {
        const result = await pool.query('SELECT id, name, nickname, email, gender, avatar, TO_CHAR(date, \'DD.MM.YY\') FROM users WHERE id = $1', [id]);
        console.log(result.rows[0])
        res.status(202).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ message: 'Authentication error' });
    }
})

app.listen(3000, () => console.log('Сервер запущен на странице http://localhost:3000'))