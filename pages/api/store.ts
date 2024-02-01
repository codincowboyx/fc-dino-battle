import { v4 } from "uuid";

export enum Turn {
    SEEKING_OPPONENT,
    PLAYER1,
    PLAYER2,
    PLAYER1_WON,
    PLAYER2_WON,
}

export interface Attack {
    name: string;
    power: number;
    randomMultMin: number;
    randomMultMax: number;
    defense: number;
    healthBoost: number;
    skipTurns: number;
}

export interface IDino {
    id: string;
    defense: number;
    health: number;
    attacks: Attack[];
}

export interface IGameState {
    player1Fid: string;
    player2Fid?: string;
    turn: Turn;
    player1Dino: IDino;
    player2Dino?: IDino;
}

class GameState {
    state: { [key: string]: IGameState } = {};

    startGame(player1Fid: string) {
        const uuid = v4();

        this.state[uuid] = {
            player1Fid,
            turn: Turn.SEEKING_OPPONENT,
            player1Dino: dino1,
            player2Dino: dino2, 
        }
    }

    play(uuid: string, playFid: string, attackIndex: number) {
        if (!this.state[uuid] || this.state[uuid].turn === Turn.PLAYER1_WON || this.state[uuid].turn === Turn.PLAYER2_WON) {
            throw Error("not a valid game");
        }

        const { player1Fid, player2Fid, turn: currentTurn, player1Dino, player2Dino } = this.state[uuid];
        const isPlayer1 = player1Fid === playFid;
        const isPlayer2 = player2Fid === playFid;

        if (currentTurn === Turn.PLAYER1 && !isPlayer1) {
            throw Error("player 1's turn")
        } 

        if (currentTurn === Turn.PLAYER2 && !isPlayer2) {
            throw Error("player 2's turn")
        }

        const playersDino = isPlayer1 ? player1Dino : player2Dino;
        const attack = playersDino?.attacks[attackIndex];

        let opponentsDino = isPlayer1 ? player2Dino : player1Dino;

        if (!attack || !opponentsDino) {
            throw Error("attack or dino invalid")
        }

        const randomMult = 1;
        const finalPower = randomMult * attack.power;

        opponentsDino = {
            ...opponentsDino,
            health: opponentsDino.health - finalPower,
            defense: opponentsDino.defense - finalPower < 0 ? 0 : opponentsDino.defense - finalPower
        }

        let nextTurn = currentTurn === Turn.PLAYER1 ? Turn.PLAYER2 : Turn.PLAYER1;
        let isGameFinished = false;

        if (opponentsDino.health < 0) {
            if (isPlayer1) {
                nextTurn = Turn.PLAYER1_WON;
            } else {
                nextTurn = Turn.PLAYER2_WON
            }
            isGameFinished = true;
        }

        this.state[uuid] = {
            ...this.state[uuid],
            player1Dino: isPlayer1 ? playersDino : opponentsDino,
            player2Dino: isPlayer2 ? playersDino : opponentsDino,
            turn: nextTurn
        }

        return isGameFinished;
    }

    getState(uuid: string) {
        return this.state[uuid];
    }
}


const dino1: IDino = {
    id: "6600",
    defense: 0,
    health: 100,
    attacks: [
        {
            name: "ice blast",
            power: 50,
            randomMultMax: 2,
            randomMultMin: 1,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
        {
            name: "solidify",
            power: 0,
            randomMultMax: 2,
            randomMultMin: 1,
            defense: 100,
            healthBoost: 100,
            skipTurns: 2
        }
    ]
}

const dino2: IDino = {
    id: "763",
    defense: 0,
    health: 100,
    attacks: [
        {
            name: "grass blast",
            power: 50,
            randomMultMax: 2,
            randomMultMin: 1,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
        {
            name: "cacoon",
            power: 0,
            randomMultMax: 2,
            randomMultMin: 1,
            defense: 100,
            healthBoost: 100,
            skipTurns: 2
        }
    ]
}

export default GameState;