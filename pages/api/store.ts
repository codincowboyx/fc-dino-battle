import { kv } from "@vercel/kv";
import { v4 } from "uuid";

export enum Turn {
    SEEKING_PLAYER,
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
    id: string;
    player1Fid?: string;
    player2Fid?: string;
    turn: Turn;
    created_date: number;
    player1Dino?: IDino;
    player2Dino?: IDino;
}

export class GameStateError extends Error {
    constructor(message = "") {
      super(message);
    }
  }

class GameState {
    state: { [key: string]: IGameState } = {};

    async startGame(created_date: number) {
        const uuid = v4();

        await kv.set(uuid, JSON.stringify({
            id: uuid,
            turn: Turn.SEEKING_PLAYER,
            player1Dino: dino1,
            player2Dino: dino2, 
            created_date
        }))

        return uuid;
    }

    async getGame(uuid: string): Promise<IGameState | null> {
        return await kv.get(uuid);
    }

    async playerJoin(uuid: string, fid: string) {
        let game = await this.getGame(uuid);

        if (!game || game.turn === Turn.PLAYER1_WON || game.turn === Turn.PLAYER2_WON) {
            throw new GameStateError("not a valid game");
        }

        const { turn} = game;

        if (turn === Turn.SEEKING_PLAYER) {
            game = {
                ...game,
                player1Fid: fid,
                turn: Turn.SEEKING_OPPONENT
            }
        } else if (turn === Turn.SEEKING_OPPONENT) {
            if (fid === game.player1Fid) {
                throw new GameStateError("can't have same player")
            }

            game = {
                ...game,
                player2Fid: fid,
                turn: Turn.PLAYER1
            }
        }

        await kv.set(uuid, JSON.stringify({ ...game }));

        return game;
    }

    async play(uuid: string, playFid: string, attackIndex: number) {
        const game: IGameState | null = await this.getGame(uuid);

        if (!game || game.turn === Turn.PLAYER1_WON || game.turn === Turn.PLAYER2_WON) {
            throw new GameStateError("not a valid game");
        }

        const { player1Fid, player2Fid, turn: currentTurn, player1Dino, player2Dino } = game;
        const isPlayer1 = player1Fid === playFid;
        const isPlayer2 = player2Fid === playFid;

        if (currentTurn === Turn.PLAYER1 && !isPlayer1) {
            throw new GameStateError("player 1's turn")
        } 

        if (currentTurn === Turn.PLAYER2 && !isPlayer2) {
            throw new GameStateError("player 2's turn")
        }

        const playersDino = isPlayer1 ? player1Dino : player2Dino;
        const attack = playersDino?.attacks[attackIndex];

        let opponentsDino = isPlayer1 ? player2Dino : player1Dino;

        if (!attack || !opponentsDino) {
            throw new GameStateError("attack or dino invalid")
        }

        const randomMult = Math.random() * (attack.randomMultMax - attack.randomMultMin) + attack.randomMultMin;
        const finalPower = randomMult * attack.power;

        opponentsDino = {
            ...opponentsDino,
            health: opponentsDino.health - finalPower,
            defense: opponentsDino.defense - finalPower < 0 ? 0 : opponentsDino.defense - finalPower
        }

        let nextTurn = currentTurn === Turn.PLAYER1 ? Turn.PLAYER2 : Turn.PLAYER1;
        let isGameFinished = false;

        if (opponentsDino.health <= 0) {
            if (isPlayer1) {
                nextTurn = Turn.PLAYER1_WON;
            } else {
                nextTurn = Turn.PLAYER2_WON
            }
            isGameFinished = true;
        }

        const newGame = {
            ...game,
            player1Dino: isPlayer1 ? playersDino : opponentsDino,
            player2Dino: isPlayer2 ? playersDino : opponentsDino,
            turn: nextTurn
        }

        await kv.set(uuid, JSON.stringify({...newGame}));

        return newGame;
    }

    async getState(uuid: string): Promise<IGameState | null> {
        return await this.getGame(uuid);
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
            randomMultMax: 1.5,
            randomMultMin: 0.1,
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
        },
        {
            name: "tackle",
            power: 20,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
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
            randomMultMax: 1.5,
            randomMultMin: 0.1,
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
        },
        {
            name: "tackle",
            power: 20,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
    ]
}

export const gameState = new GameState();

export default GameState;