import type { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import {Poll} from "@/app/types";
import {kv} from "@vercel/kv";
import satori from "satori";
import { join } from 'path';
import * as fs from "fs";
import GameState, { IGameState, Turn } from './store';

const fontPath = join(process.cwd(), 'Roboto-Regular.ttf')
let fontData = fs.readFileSync(fontPath)
const gameState = new GameState();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const gameId = req.query['id']
        // const fid = parseInt(req.query['fid']?.toString() || '')
        if (!gameId || Array.isArray(gameId)) {
            return res.status(400).send('Missing game ID');
        }

        let game: IGameState | null = gameState.getState(gameId);


        if (!game) {
            return res.status(400).send('Missing game ID');
        }

        let svg;

        if (game.turn === Turn.SEEKING_OPPONENT) {
            svg = await satori(
                <div style={{
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    display: 'flex',
                    flexWrap: 'wrap',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'f4f4f4',
                    padding: 20,
                    lineHeight: 1.2,
                    fontSize: 24
                }}>
                    Looking for challenger...
                </div>
                ,
                {
                    width: 600, height: 400, fonts: [{
                        data: fontData,
                        name: 'Roboto',
                        style: 'normal',
                        weight: 400
                    }]
                })
        } else {
            const player1Health = `${game.player1Dino.health}%`;
            const player2Health = `${game.player2Dino?.health}%`;

            svg = await satori(
                <div style={{
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    display: 'flex',
                    flexWrap: 'wrap',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'f4f4f4',
                    padding: 20,
                    lineHeight: 1.2,
                    fontSize: 24,
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: "100%",
                        justifyContent: "space-between"
                    }}>
                        <div style={{
                          borderLeft: "2px solid black",
                          borderBottom: "2px solid black",
                          display: 'flex',
                          flexDirection: "row",
                          height: "50%",
                          padding: "20px 20px"
                        }}>
    
                          <p style={{height: "20px", lineHeight: "20px", marginRight: "16px"}}>{game.turn === Turn.PLAYER1 ? "*" : ""}HP: </p>
                          <div style={{
                              height: "20px",
                              width: "180px",
                              background: "rgba(8,102,220,.2)",
                              boxShadow: "2px 14px 15px -7px rgba(30, 166, 250, 0.36)",
                              borderRadius: "50px"}}
                              >
                            <div style={{width: player1Health, height: "20px", background: "#0866dc", borderBottomLeftRadius: "50px", borderTopLeftRadius: "50px"}}></div>
                          </div>
                        </div>
                        <img src="https://tinydinos.org/transparent/6600.png" width="180" height="180" style={{  transform: "scaleX(-1)"}}/>
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: "100%",
                        justifyContent: "space-between",
                        boxSizing: "border-box",
                        alignItems: "self-end"
                    }}>
                        <img src="https://tinydinos.org/transparent/763.png" width="180" height="180"/>
                        <div style={{
                          borderRight: "2px solid black",
                          borderTop: "2px solid black",
                          display: 'flex',
                          flexDirection: "row",
                          height: "50%",
                          padding: "20px 20px"
                        }}>
    
                          <p style={{height: "20px", lineHeight: "20px", marginRight: "16px"}}>{game.turn === Turn.PLAYER2 ? "*" : ""}HP: </p>
                          <div style={{
                              height: "20px",
                              width: "180px",
                              background: "rgba(8,102,220,.2)",
                              boxShadow: "2px 14px 15px -7px rgba(30, 166, 250, 0.36)",
                              borderRadius: "50px"}}
                              >
                            <div style={{width: player2Health, height: "20px", background: "#0866dc", borderBottomLeftRadius: "50px", borderTopLeftRadius: "50px"}}></div>
                          </div>
                        </div>
                    </div>
                </div>
                ,
                {
                    width: 600, height: 400, fonts: [{
                        data: fontData,
                        name: 'Roboto',
                        style: 'normal',
                        weight: 400
                    }]
                })
        }

        // Convert SVG to PNG using Sharp
        const pngBuffer = await sharp(Buffer.from(svg))
            .toFormat('png')
            .toBuffer();

        // Set the content type to PNG and send the response
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'max-age=10');
        res.send(pngBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating image');
    }
}
