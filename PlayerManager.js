import Player from './Player';
import {bot} from './app';

class PlayerManager {
    constructor() {
        this.listPlayer = [];
    }

    getPlayers() {
        return this.listPlayer;
    };

    isExist (sender_id) {
        for (let i = 0; i < this.listPlayer.length; i++) {
            if (this.listPlayer[i].getID() === sender_id) return true;
        }
        return false;
    };

    addPlayer(player) {
        this.listPlayer.push(player);
    };

    getNumberOfPlayer() {
        return this.listPlayer.length;
    }

    reset() {
        this.listPlayer = [];
    }

    sendEach(msg) {
        this.listPlayer.forEach((player) =>{
           bot.say(player.getID(), msg);
        });
    }
}

module.exports = PlayerManager;