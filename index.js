const express = require('express');
const cors = require('cors');
const {join} = require("path");
const {readFileSync} = require("fs");

const app = express()

app.use(cors())
app.use(express.json())

app.use('/images', express.static(join(__dirname + '/images')));

app.post('/data', (req, res) => {
    const {id} = req.body;

    const data = (JSON.parse(readFileSync(__dirname + '/quests.json', "utf-8")))[id];

    res.send(data);
})

app.use('/', (req, res) => {
    res.json({message: "hello"})
})




app.listen(3000, () => console.log('Сервер запущен на странице http://localhost:3000'))