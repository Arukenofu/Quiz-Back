const express = require('express');
const cors = require('cors');
const {join} = require("path");
const {pool} = require("./db/db.pool");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const {readFileSync} = fs;
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

        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const {id} = user.rows[0]

        const file = JSON.parse(fs.readFileSync('playerscores.json', 'utf-8'));

        file[id] = {
            0: {
                isCompleted: false,
                score: 0
            },
            1: {
                isCompleted: false,
                score: 0
            },
            2: {
                isCompleted: false,
                score: 0
            },
            3: {
                isCompleted: false,
                score: 0
            },
            4: {
                isCompleted: false,
                score: 0
            },
            5: {
                isCompleted: false,
                score: 0
            }
        }

        fs.writeFileSync('playerscores.json', JSON.stringify(file), 'utf-8');


        res.status(201).json('Success');
    } catch (error) {
        res.status(400).json(error);
    }
}})

app.post('/getUser', async (req, res) => {
    const {id} = req.body;

    try {
        const result = await pool.query('SELECT id, name, nickname, email, gender, avatar, TO_CHAR(date, \'DD.MM.YY\') FROM users WHERE id = $1', [id]);
        res.status(202).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ message: 'Authentication error' });
    }
})

app.post('/check', async (req, res) => {
    const {token} = req.body;

    if (!token) {
        return res.status(401).json({message: "Истекло"})
    }

    jwt.verify(token, process.env.JWT_KEY, (err) => {
        if (err) {
            res.status(401).json({message: "Истекло"})
        }
    })

    res.status(201).json({message: 'OK!'})
})

app.post('/change', async (req, res) => {
    const {id, name, nickname, gender} = req.body;
    console.log(req.body)

    const isUserExist = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!isUserExist.rows[0]) {
        return res.status(404).json({message: 'NONEXIST'});
    }

    if (name.length) {
        pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, id]);
    }
    if (nickname.length) {
        pool.query('UPDATE users SET nickname = $1 WHERE id = $2', [nickname, id]);
    }
    if (gender !== null) {
        let genderEn;
        if (gender === 'Мужской') {
            genderEn = 'male';
        } else {
            genderEn = 'female';
        }
        pool.query('UPDATE users SET gender = $1 WHERE id = $2', [genderEn, id]);
    }

    res.status(201).json({message: 'OK!'})
})

app.post('/scores', async (req, res) => {
    const {id} = req.body;
    const file = fs.readFileSync('playerscores.json', 'utf-8');

    const json = JSON.parse(file);
    console.log(json[id])

    res.status(201).json(json[id])
})

app.post('/setScore', async (req, res) => {
    const {id, score, questId} = req.body;
    const file = JSON.parse(readFileSync('playerscores.json', 'utf-8'));

    file[id][questId].isCompleted = true;
    file[id][questId].score = score;

    fs.writeFileSync('playerscores.json', JSON.stringify(file), 'utf-8');

    res.status(201).json({message: 'OK!'})
})

app.listen(3000, () => console.log('Сервер запущен на странице http://localhost:3000'))