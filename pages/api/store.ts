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

    async getDinoFromId(dinoId: string | undefined, defaultDino: IDino): Promise<IDino> {
        if (dinoId) {
            const dinoResponse = await fetch(`https://tinydinos.org/${dinoId}.json`);

            if (dinoResponse) {
                const dinoJson = await dinoResponse.json();

                let attacks: Attack[] = [];

                if (dinoJson && dinoJson.attributes) {
                    dinoJson.attributes.forEach((trait: any) => {
                        if (trait.trait_type === "body") {
                            attacks.push(traits.body[trait.value])
                        } else if (trait.trait_type === "chest") {
                            attacks.push(traits.chest[trait.value])
                        } else if (trait.trait_type === "eyes") {
                            attacks.push(traits.eyes[trait.value])
                        } else if (trait.trait_type === "feet") {
                            attacks.push(traits.feet[trait.value])
                        }
                    })
                }

                return {
                    id: dinoId,
                    defense: 0,
                    health: 100,
                    attacks
                }
            }
        }

        return defaultDino;
    }

    async startGame(created_date: number, dinoId1?: string, dinoId2?: string) {
        const uuid = v4();

        const dino1 = await this.getDinoFromId(dinoId1, defaultDino1);
        const dino2 = await this.getDinoFromId(dinoId2, defaultDino2);

        const game = JSON.stringify({
            id: uuid,
            turn: Turn.SEEKING_PLAYER,
            player1Dino: dino1,
            player2Dino: dino2, 
            created_date
        });

        console.log(game)

        await kv.set(uuid, game)

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

        let playersDino = isPlayer1 ? player1Dino! : player2Dino!;
        const attack = playersDino?.attacks[attackIndex];

        let opponentsDino = isPlayer1 ? player2Dino : player1Dino;

        if (!attack || !opponentsDino) {
            throw new GameStateError("attack or dino invalid")
        }

        const randomMult = Math.random() * (attack.randomMultMax - attack.randomMultMin) + attack.randomMultMin;

        // opponent dino affects
        const finalPower = randomMult * attack.power;
        const tempDefense = Math.floor(opponentsDino.defense - finalPower);
        const tempHealth = Math.floor((opponentsDino.health + opponentsDino.defense) - finalPower)

        opponentsDino = {
            ...opponentsDino,
            health: tempHealth > 100 ? 100 : tempHealth,
            defense: tempDefense < 0 ? 0 : tempDefense
        }

        // players dino affects
        const defenseAdd = randomMult * attack.defense;
        const heal = randomMult * attack.healthBoost;
        const temp1Def = Math.floor(playersDino.defense + defenseAdd);
        const temp1Health = Math.floor(playersDino.health + heal);

        playersDino = {
            ...playersDino!,
            defense: temp1Def > 100 ? 100 : temp1Def,
            health: temp1Health > 100 ? 100 : temp1Health
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


const traits: {[key: string]: {[key: string]: Attack}} = {
    body: {
        teal: {
            name: "water gun",
            power: 60,
            randomMultMax: 1.2,
            randomMultMin: 0.3,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
        "lime green": {
            name: "fresh cut",
            power: 65,
            randomMultMax: 1.1,
            randomMultMin: 0.2,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        }, 
        "light green": {
            name: "blade runner",
            power: 70,
            randomMultMax: 1,
            randomMultMin: 0.5,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
        gray: {
            name: "tackle",
            power: 20,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
        green: {
            name: "grass blast",
            power: 50,
            randomMultMax: 1.5,
            randomMultMin: .1,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
        yellow: {
            name: "sunny day",
            power: 20,
            randomMultMax: 5,
            randomMultMin: .1,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
        aqua: {
            name: "aqua mist",
            power: 60,
            randomMultMax: 1,
            randomMultMin: .5,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
        blue: {
            name: "wave",
            power: 60,
            randomMultMax: 1.2,
            randomMultMin: .4,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
        red: {
            name: "fire spin",
            power: 20,
            randomMultMax: 5,
            randomMultMin: 1,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
        purple: {
            name: "purple nurple",
            power: 50,
            randomMultMax: 1,
            randomMultMin: .8,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
        pink: {
            name: "nail polish",
            power: 10,
            randomMultMax: 10,
            randomMultMin: 1,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        },
        "purple linear gradient": {
            name: "royal grab",
            power: 10,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 30,
            healthBoost: 0,
            skipTurns: 0
        },
        "orange linear gradient": {
            name: "orange squeeze",
            power: 10,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 30,
            healthBoost: 0,
            skipTurns: 0
        },
        "yellow linear gradient": {
            name: "lemon squeeze",
            power: 10,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 30,
            healthBoost: 0,
            skipTurns: 0
        },
        "blue linear gradient": {
            name: "blueberry pop",
            power: 10,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 30,
            healthBoost: 0,
            skipTurns: 0
        },
        "pink linear gradient": {
            name: "pinky poke",
            power: 10,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 30,
            healthBoost: 0,
            skipTurns: 0
        },
        "green linear gradient": {
            name: "rad grab",
            power: 10,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 30,
            healthBoost: 0,
            skipTurns: 0
        },
        "grayspace linear gradient": {
            name: "thrust",
            power: 30,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 30,
            healthBoost: 0,
            skipTurns: 0
        },
        rainbow: {
            name: "rainbow punch",
            power: 30,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 30,
            healthBoost: 0,
            skipTurns: 0
        }
    },
    chest: {
        orangered: {
            name: "solidify",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 50,
            healthBoost: 0,
            skipTurns: 0
        },
        "light gray": {
            name: "rock solid",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 50,
            healthBoost: 0,
            skipTurns: 0
        },
        green: {
            name: "cacoon",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 50,
            healthBoost: 0,
            skipTurns: 0
        },
        aqua: {
            name: "water shield",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 50,
            healthBoost: 0,
            skipTurns: 0
        },
        purple: {
            name: "cacoon",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 50,
            healthBoost: 0,
            skipTurns: 0
        },
        blue: {
            name: "water shield",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 50,
            healthBoost: 0,
            skipTurns: 0
        },
        pink: {
            name: "fur coat",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 50,
            healthBoost: 0,
            skipTurns: 0
        },
        "light blue": {
            name: "water shield",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 50,
            healthBoost: 0,
            skipTurns: 0
        },
        gray: {
            name: "rock solid",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 50,
            healthBoost: 0,
            skipTurns: 0
        },
        yellow: {
            name: "sun screen",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 50,
            healthBoost: 0,
            skipTurns: 0
        },
        orange: {
            name: "solidify",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 50,
            healthBoost: 0,
            skipTurns: 0
        }
    },
    eyes: {
        white: {
            name: "tackle",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 20,
            healthBoost: 0,
            skipTurns: 0
        },
        "light gray": {
            name: "tackle",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 20,
            healthBoost: 0,
            skipTurns: 0
        },
        purple: {
            name: "tackle",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 20,
            healthBoost: 0,
            skipTurns: 0
        },
        yellow: {
            name: "tackle",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 20,
            healthBoost: 0,
            skipTurns: 0
        },
        blue: {
            name: "tackle",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 20,
            healthBoost: 0,
            skipTurns: 0
        },
        "dark red": {
            name: "tackle",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 20,
            healthBoost: 0,
            skipTurns: 0
        },
        "dark gray": {
            name: "tackle",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 20,
            healthBoost: 0,
            skipTurns: 0
        },
        green: {
            name: "tackle",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 20,
            healthBoost: 0,
            skipTurns: 0
        },
        orange: {
            name: "tackle",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 20,
            healthBoost: 0,
            skipTurns: 0
        },
        red: {
            name: "tackle",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 20,
            healthBoost: 0,
            skipTurns: 0
        },
        "green red": {
            name: "tackle",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 20,
            healthBoost: 0,
            skipTurns: 0
        },
        "blue yellow": {
            name: "tackle",
            power: 0,
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 20,
            healthBoost: 0,
            skipTurns: 0
        },
        lazer: {
            name: "lazer beam",
            power: 100,
            randomMultMax: 1,
            randomMultMin: .1,
            defense: 0,
            healthBoost: 0,
            skipTurns: 0
        }
    },
    feet: {
        normal: {
            name: "heal",
            power: 0,
            randomMultMax: 1,
            randomMultMin: .1,
            defense: 0,
            healthBoost: 100,
            skipTurns: 0
        },
        "rocket boots": {
            name: "heal",
            power: 0,
            randomMultMax: 1,
            randomMultMin: .1,
            defense: 0,
            healthBoost: 100,
            skipTurns: 0
        },
        hoverboard: {
            name: "heal",
            power: 0,
            randomMultMax: 1,
            randomMultMin: .1,
            defense: 0,
            healthBoost: 100,
            skipTurns: 0
        },
        skateboard: {
            name: "heal",
            power: 0,
            randomMultMax: 1,
            randomMultMin: .1,
            defense: 0,
            healthBoost: 100,
            skipTurns: 0
        }
    }
}

const defaultDino1: IDino = {
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
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 100,
            healthBoost: 0,
            skipTurns: 0
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

const defaultDino2: IDino = {
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
            randomMultMax: 1,
            randomMultMin: 1,
            defense: 100,
            healthBoost: 0,
            skipTurns: 0
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