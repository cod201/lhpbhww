import {registerAction} from './registerAction';
import PlayerManager from './PlayerManager';
import Player from './Player';

const BootBot = require('bootbot');

export let playerManager = new PlayerManager();

let express = require('express');
let bodyParser = require('body-parser');


export let bot = new BootBot({
    accessToken: 'EAANFAiEgluIBAIvo0PH2sNnU0eO00uYDCnmxgKjWTIczBdiW6bP5fvaA6toXEA3v6B5wZCM9RaPzflZAiNbB9It0qIg9xHlp2qMCsuWUMKsrqySiDignlyojg2xOpIAzvOGpqlnZASBEb3swH8qZBfxZAdCZBd4rGDqaFFZBHMuXwZDZD',
    verifyToken: 'vnts0937227240',
    appSecret: '77adfd6c33b94de68265d88305ae343c'
});

let app = bot.app;

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    res.send('App is running...');
    res.end();
});

app.get('/getallplayer', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    let listPlayer = playerManager.getPlayers();
    res.send(JSON.stringify(listPlayer) + "\n");
    res.end();
});

app.get('/deleteallplayer', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    playerManager.reset();
    console.log(playerManager);
    let msg = {status: "success"};
    res.send(JSON.stringify(msg) + "\n");
    res.end();
});

app.post('/sendmessage', function (req, res) {
    console.log(req.body);
    res.setHeader('Content-Type', 'application/json');
    bot.say(req.body.id, 'In this game, you are "' + req.body.character + '"');
    let msg = {status: "success"};
    res.send(JSON.stringify(msg) + "\n");
    res.end();
});

app.post('/notify', function (req, res) {
    console.log(req.body);
    playerManager.sendEach(req.body.msg);
    res.setHeader('Content-Type', 'application/json');
    let msg = {status: "success"};
    res.send(JSON.stringify(msg) + "\n");
    res.end();
});

app.post('/postallplayer', function (req, res) {
    console.log(req.params);
});

app.post('/addplayer', function (req, res) {
    console.log("REQUEST POST: -------------------", req.body);
    let player = new Player(req.body.id, req.body.name);
    playerManager.addPlayer(player);
    res.setHeader('Content-Type', 'application/json');
    let msg = {status: "success"};
    res.send(JSON.stringify(msg) + "\n");
    res.end();
    // console.log(playerManager);
});

registerAction(bot);

bot.start();
