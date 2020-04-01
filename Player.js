class Player{
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    getID() {
        return this.id;
    };

    getName() {
        return this.name;
    };

    setName(name){
        this.name = name;
    }
}

module.exports = Player;