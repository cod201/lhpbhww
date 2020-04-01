'use strict'

/*
function loadScript(url, callback)
{
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;
    // Fire the loading
    head.appendChild(script);
}
loadScript("functions.js", createGameRoom);
*/

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const events = require('events');

function gameRoom(id) {
    this.id = id;
    this.players = [];
    this.wolves = [];
    this.villagers = [];
    this.targets = []; // targets are people that wolves want to kill
    this.victims;
    this.suspects = [];
    this.winner;
    this.time = "night";
}
var takenID = [];
var gameRoomArray = [];

function player (id){
    this.id = id;
    this.name = "player";
    this.alive = true;
    this.role;
    this.room;
    this.admin = false;

}

var globalPlayer = []


app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'vnts0937227240') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text

            if(text == "creategame") {
                createGameRoom(sender);
                // This is a test
                sendTextMessage(sender, "Number of Active Games: " + gameRoomArray.length);
                continue;
            }
            if (text == "image"){
                sendNightOptions(sender);
                continue;
            }

            if (text.substring(0,4) == "eat ") {
                let j;
                var roomid;
                sendTextMessage(sender, text.substring(4,11));
                for(j = 0; j < globalPlayer.length; j++) {
                    if(sender == globalPlayer[j].id) {
                        roomid = globalPlayer[j].room;
                        break;
                    }
                }
                if(gameRoomArray[roomid] && gameRoomArray[roomid].time == "night") {
                    uploadTarget(roomid, text.substring(4,11));
                }
            }


            //end game function **put with other if statements**

            if (text.substring(0,8)== "endgame ") {
                endGame(sender, text.substring(8,11));
                continue;
            }

            if (text == "image"){
                sendNightOptions(sender);
                continue;
            }

            if (text.substring(0,5) == "join "){
                joinGameRoom(sender, text);
                continue;
            }

            if (text.substring(0,6) == "start "){
                startgame(sender, text.substring(6,9));
                turnNightOnce(text.substring(6,9));
                continue;
            }


            if (text.substring(0,7) == "morning")
            {
                printPlayers(sender, globalPlayer);
            }
            sendTextMessage(sender, "Welcome to the world of Werewolf! Use 'creategame' to create a gameroom, use 'join #roomID' to join a current game and use 'help' for help. (" + text.substring(0, 200) + ") is not recognized.")            
        }
        if (event.postback) {
                
                let text = JSON.stringify(event.postback)                     
                sendTextMessage(sender,text.substring(12, text.length -2 ));
                continue;
            }
    }
    res.sendStatus(200)
})

const token = "EAANFAiEgluIBAPzEIlAda2ZAv2lgsHEktSMiLXG92HBeOfKnaeqJx4Blb7Y3ofbuLosrlZCClrjXHx9T9IHR0x21RFHSCiAJRtrWtY1TSvHma9hpRIqRuh6a6ENdkhPTxYbz2mZAJb5j0SZClY4lKzPf66OyjI0ZBTzimnxagwwZDZD"

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function messageEveryone(roomid, text) {
    let i;
    if(gameRoomArray[roomid]) {
        for(i = 0; i < gameRoomArray[roomid].players.length; i++) {
            sendTextMessage(gameRoomArray[roomid].players[i], text);
        }       
    }
    else {
        console.log('Error in callEveryone');
    }
}

function endGame(sender, id) {
    let i;
    if(gameRoomArray[id]){
        if (sender == gameRoomArray[id].players[0]){
                messageEveryone(id,"Sorry! The admin has ended the game prematurely. The room "+id+" is deleted.");
                delete gameRoomArray[id].id;
                delete gameRoomArray[id].players;
                globalPlayer = [];
        }else{
            sendTextMessage(sender, "You are not the admin of the room "+ id);
        }
    } else {
        sendTextMessage(sender, "Invalid Error")
    }
}

function checkID(room){
    var i;
    for(i=0; i<takenID.length; i++){
        if (room == takenID[i]){
            room ="a" + (Math.floor(Math.random()*90000) + 10000);
            checkID(room);
        }
    }
    return room;
}



function createGameRoom (sender){
    //sendTextMessage(sender, "creating");
    let finalid = gameRoomArray.length;
    let test = new gameRoom(finalid);
    test.players.push(sender);
    gameRoomArray.push(test);

    let tempPlayer = new player(sender);
    tempPlayer.room = finalid;
    tempPlayer.name = "player" + finalid;
    
    let startMessage = { text: "You have created a game, your room ID is: "+ finalid };
    sendTextMessage(sender, startMessage);
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: startMessage,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function sendNightOptions(sender) {
    //for(var j = 0; j < globalPlayer.length; j++) {
        //if(globalPlayer[j].role == "villager") {

        //}
        //else if(globalPlayer[j].role == "wolf") {
            let messageData = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": "Night Time",
                            "subtitle": "What action do you want to do?",

                            "buttons": [{
                                "type": "postback",
                                "payload": "You killed someone this turn",
                                "title": "Kill someone",

                            }, {
                                "type": "postback",
                                "payload": "You did nothing this turn",
                                "title": "Do nothing",
                            }],
                        }, 

                        ]
                    }
                }               
            }
            request({
                    url: 'https://graph.facebook.com/v2.6/me/messages',
                    qs: {access_token:token},
                    method: 'POST',
                    json: {
                        recipient: {id:sender},
                        message: messageData,
                    }
                }, function(error, response, body) {
                    if (error) {
                        console.log('Error sending messages: ', error)
                    } else if (response.body.error) {
                        console.log('Error: ', response.body.error)
                    }
             })

        }
    
    


function joinGameRoom(sender,text){
    //var roomIDTaken = require('data');
    if (gameRoomArray[text.substring(5,8)]){
        var alreadyJoined=0;
        if(gameRoomArray[text.substring(5,8)].players){
            for (var j=0;j<gameRoomArray[text.substring(5,8)].players.length;j++){
                if (gameRoomArray[text.substring(5,8)].players[j] == sender){
                    alreadyJoined++;
                }
            }
            if(alreadyJoined == 0){
                gameRoomArray[text.substring(5,8)].players.push(sender);
            }
            sendTextMessage(sender, "Number of players: " + gameRoomArray[text.substring(5,8)].players.length);
            var joinMessage ="you have successfully joined the room: "+ text.substring(5,8);
            sendTextMessage(sender, joinMessage);
        } else {
            sendTextMessage(sender, "Invalid Game Room");

        }
    } else{
        var joinMessage = "room ID invalid";
        sendTextMessage(sender, joinMessage);
    }

}


// Everything from turn 

Array.prototype.randomElement = function () {
    return this[Math.floor(Math.random() * this.length)]
}

function randomsort(a, b) {
    return Math.random()>.5 ? -1 : 1;
}

var arr = [1, 2, 3, 4, 5];
arr.sort(randomsort);


function playerRearrange(sender,roomid) {
    var i;
    //console.log(gameRoomArray);
    if(gameRoomArray[roomid]) {
        for(i = 0; i < gameRoomArray[roomid].players.length; i++) {
            let tempPlayer = new player(gameRoomArray[roomid].players[i]);
            tempPlayer.name = "Player" + i;
            globalPlayer.push(tempPlayer);
        }
    }
    else {
        sendTextMessage(sender, "No Active Player");
    }
}



// if admin == sender, then the game starts
function startgame(sender, roomid){
    var i; 
    if (gameRoomArray[roomid]){ 
        if(gameRoomArray[roomid].players){
            playerRearrange(sender, roomid);

            for (i=0; i < gameRoomArray[roomid].players.length; i++) {

                if (sender == gameRoomArray[roomid].players[0]){
                    //turn(gameRoomArray[roomid].players, turn1text);
                    messageEveryone(roomid, "Admin started game for room "+ roomid + ". Game is starting, please wait while roles are assigned.");
                    messageEveryone(roomid, "Each night, werewolves will kill one Villager. It is up to the Villagers in the morning to vote and hang who they think are the werewolves. Good luck everyone!");

                    generateRole(sender, roomid);
                    var j;
                    for(j = 0; j < globalPlayer.length; j++) {
                        if(globalPlayer[j].role == "wolf") {
                            sendTextMessage(globalPlayer[j].id, gameNightWolfIntroText);
                        }
                        else if(globalPlayer[j].role == "villager") {
                            sendTextMessage(globalPlayer[j].id, gameNightVillagerIntroText);
                        }
                    }
                    //messageEveryone(roomid, "Night time starts!!");
                    //turnNightOnce(roomid);

                    break;

                } else if (i==gameRoomArray[roomid].players.length-1){
                    sendTextMessage(sender, "You are not the admin of the room "+ roomid);
                }
            }
        } else {
            sendTextMessage(sender, "No Active GameRoom")

        }
    } else {

        sendTextMessage(sender, "No Active GameRoom")
    }
}


//function turn(players, turntext){
//    for (i=0; i<players.length;i++){
//        sendTextMessage(players[i], "Welcome");
//        };
//        generateRole(roles);
//}
function askWolvesKill(roomid) {
    var i;
    if(gameRoomArray[roomid]) {
        for(i = 0; i < gameRoomArray[roomid].wolves.length; i++) {
        sendTextMessage(gameRoomArray[roomid].wolves[i], gameNightAskWolfText);
        }
    }
    else {
        console.log('Error in askWolvesKill');
    }
}

function displayWolvesPossibleChoice(roomid) {
    var i;
    if(gameRoomArray[roomid]) {
        for(i = 0; i < gameRoomArray[roomid].wolves.length; i++) {
            sendTextMessage(gameRoomArray[roomid].wolves[i], "The following Players are people who you can eat, enter 'eat #playerName' to eat people. Don't enter the #");
            var j;
            for(j = 0; j < gameRoomArray[roomid].villagers.length; j++) {
                var k;
                for(k = 0; k < globalPlayer.length; k++) {
                    if(globalPlayer[k].id == gameRoomArray[roomid].villagers[j]) {
                        sendTextMessage(gameRoomArray[roomid].wolves[i], globalPlayer[k].name);
                    }
                }
            }
        }
    }
}

function turnNightOnce(roomid) {
    messageEveryone(roomid, "Night time starts!!");
    //handle the wolves' evening thing
    askWolvesKill(roomid);
    displayWolvesPossibleChoice(roomid);
}


// when gameRoomArray[roomid].time = night
// when text.substring(0,4) == "eat " 
// target = text.substring(4,7)
function uploadTarget(roomid, target) {
    if(gameRoomArray[roomid]) {
        var j;
        var targetID;
        for(j = 0; j < globalPlayer.length; j++) {
            if(target == globalPlayer[j].name) {
                targetID = globalPlayer[j].id;
                break;
            }
        }
        gameRoomArray[roomid].targets.push(targetID);
        if(gameRoomArray[roomid].targets.length == gameRoomArray[roomid].wolves.length) {
            let i;
            var tempTargetID = maxElement(gameRoomArray[roomid].targets);
            var tempTarget;
            for(i = 0; i < globalPlayer.length; i++) {
                if(tempTargetID == globalPlayer[i].id) {
                    tempTarget = globalPlayer[i].name;
                }
            }
            for(i = 0; i < gameRoomArray[roomid].wolves.length; i++) {
                sendTextMessage(gameRoomArray[roomid].wolves[i], "Target has been chosen. Your target is " + tempTarget);
            }
            gameRoomArray[roomid].victim = tempTarget;
            gameRoomArray[roomid].time = "morning";
            displayDaytimeResult(roomid);
        }
        else {
            let i;
            for(i = 0; i < gameRoomArray[roomid].wolves.length; i++) {
                sendTextMessage(gameRoomArray[roomid].wolves[i], "Waiting for other wolves :)");
            }
        }
    }
    else {
        console.log('Error in uploadTarget');
    }
    
}

function displayDaytimeResult(roomid) {
    messageEveryone(roomid, "Poor guy " + gameRoomArray[roomid].victim + " was eaten by the wolves. RIP. Discuss who you think is the wolf and use 'lynch PLAYERID' to lynch");
}

// function to find highest occurance element in an array
function maxElement(array)
{
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;  
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}


// sender only for debugging
function generateRole(sender, roomid){
    
    if(gameRoomArray[roomid]) {
        var tempPlayerArray = gameRoomArray[roomid].players;
        var playerCount = tempPlayerArray.length;
        var wolfCount = Math.floor(playerCount / 3);

        var i;
        var tempRandNum = [];
        for(i = 0; i < wolfCount; i++) {
            var rand = Math.floor((Math.random() * playerCount) );
            if(tempRandNum.indexOf(rand) > -1) continue;
            tempRandNum.push(rand);
            
        }
        for(i = 0; i < wolfCount; i++) {
            var wolfUserID = tempPlayerArray[tempRandNum[i]];
            
            var j;
            for(j = 0; j < globalPlayer.length; j++) {
                if(globalPlayer[j].id == wolfUserID) {
                    globalPlayer[j].role = "wolf";
                    gameRoomArray[roomid].wolves.push(globalPlayer[j].id);
                    
                } else {
                    globalPlayer[j].role = "villager";
                    gameRoomArray[roomid].villagers.push(globalPlayer[j].id);
                }
            }
        }
        tempRandNum = [];


    }
    else {
        console.log('Error in generateRole');
    }

}

function printPlayers(sender, playerList){
    sendTextMessage(sender, "Player List: ");
    for (var i = 0; i < playerList.length; i++)
    {
        sendTextMessage(sender, playerList[i] + " ");
    }
}

//displays buttons with player names for day time lynch
// function playerButtons(roomNum)
// {
    
//     let messageData = {
//         "attachment": {
//             "type": "template",
//             "payload": {
//                 "template_type": "generic",
//                 "elements": [{
//                     "title": "Day Time",
//                     "subtitle": "Who do you want to choose to lynch?",

//                     "buttons": 
//                     [{
//                         "type": "postback",
//                         "payload": "You lynched no one this day",
//                         "title": "No One",

//                     }, 

//                     for (var i = 0; i<roomNum; i++)
//                     {                                              
//                             if (roomNum == event.sender.room)
//                             {
//                                 for (var j=0; j < gameRoomArray[i].players.length; j++)
//                                 {
//                                     "type": "postback",
//                                     "payload": "Your vote has been set",
//                                     "title": j //gameRoomArray[i].players[j],
//                                 },
//                             }
                                               
//                     }],
//                 }, 
//                 ]
//             }
//         }
//     }
//     request({
//         url: 'https://graph.facebook.com/v2.6/me/messages',
//         qs: {access_token:token},
//         method: 'POST',
//         json: {
//             recipient: {id:sender},
//             message: messageData,
//         }
//         }, 
//         function(error, response, body) 
//         {
//         if (error) 
//         {
//             console.log('Error sending messages: ', error)
//         } 
//         else if (response.body.error) 
//         {
//             console.log('Error: ', response.body.error)
//         }
//     })
// }



/*********************     TEXT VAR   ****************************************/
/***************** WOLF *****************/
//During the night, tell the wolves their role and their teammate, only once
var gameNightWolfIntroText = "You are a Werewolf! Each night you can choose to kill someone. If a tie occurs in the choosing, one of the selected will be randomly chosen" + "The other wolves are " ;

//During the night, ask the wolf who he wants to eat, ask everynight
var gameNightAskWolfText = "Who do you want to eat"

//when in the night, if a werewolf vote to eat someon, the other werewolf will get the message
//var gameNightWolfEatVoteText = voter.id + " has voted to eat " + victim.id

/***************** Villager *****************/
//when in the night, tell the villagers their role, only once
var gameNightVillagerIntroText = "You are just a normal Villager. Your goal is to survive until the end of the game by lynching the Werewolves."