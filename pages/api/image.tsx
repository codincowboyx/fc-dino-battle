import type { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
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
        const errorStr = req.query['error']
        // const fid = parseInt(req.query['fid']?.toString() || '')
        if (!gameId || Array.isArray(gameId)) {
            return res.status(400).send('Missing game ID');
        }

        let game: IGameState | null = await gameState.getState(gameId);
        console.log(game);

        if (!game) {
            return res.status(400).send('Missing game ID');
        }

        let svg = await satori(
            <div style={{
                alignItems: 'center',
                display: 'flex',
                width: '100%',
                height: '100%',
                backgroundColor: '#f4f4f4',
                padding: 20,
                lineHeight: 1.2,
                fontSize: 24,
            }}>
                {errorStr ? errorStr : `Error Occured :/`}
            </div>
            ,
            {
                width: 600, height: 400, fonts: [{
                    data: fontData,
                    name: 'Roboto',
                    style: 'normal',
                    weight: 400
                }]
            });

        try {
            if (errorStr) {
                // do nothing for now
            } else if (game.turn === Turn.SEEKING_OPPONENT || game.turn === Turn.SEEKING_PLAYER) {
                const text = game.turn === Turn.SEEKING_OPPONENT ? "Looking for challenger. Join Now!" : "Ready Player One? Join Now!";
                svg = await satori(
                    <div style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f4f4f4',
                        padding: 20,
                        lineHeight: 1.2,
                        fontSize: 24,
                    }}>
                        {text}
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
            } else if (game) {
                const player1Health = `${game.player1Dino?.health}%`;
                const player2Health = `${game.player2Dino?.health}%`;

                const baseHealthStyle = {
                    borderBottomLeftRadius: "50px", borderTopLeftRadius: "50px"
                }

                const player1HealthBarStyle = {
                    ...baseHealthStyle,
                    borderBottomRightRadius: game.player1Dino?.health === 100 ? "50px" : "0px", 
                    borderTopRightRadius: game.player1Dino?.health === 100 ? "50px" : "0px"
                }

                const player2HealthBarStyle = {
                    ...baseHealthStyle,
                    borderBottomRightRadius: game.player2Dino?.health === 100 ? "50px" : "0px", 
                    borderTopRightRadius: game.player2Dino?.health === 100 ? "50px" : "0px"
                }
                let winnerText = "";

                if (game.turn === Turn.PLAYER1_WON) {
                    winnerText = `Player 1 Won (${game.player1Fid})!`
                } else if (game.turn === Turn.PLAYER2_WON) {
                    winnerText = `Player 2 Won (${game.player2Fid})!`
                }
    
                svg = await satori(
                    <div style={{
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        display: 'flex',
                        flexWrap: 'wrap',
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f4f4f4',
                        padding: 40,
                        lineHeight: 1.2,
                        fontSize: 24,
                        position: "relative"
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            width: "100%",
                            justifyContent: "space-between",
                            boxSizing: "border-box"
                        }}>
                            <div style={{
                              borderLeft: "2px solid black",
                              borderBottom: "2px solid black",
                              display: 'flex',
                              flexDirection: "row",
                              height: "62px",
                              padding: "20px",
                              boxSizing: "border-box"
                            }}>
        
                              <div style={{display: 'flex',height: "20px", lineHeight: "20px", marginRight: "16px"}}>{game.turn === Turn.PLAYER1 ? "*" : ""}HP: </div>
                              <div style={{
                                 display: 'flex',
                                  height: "20px",
                                  width: "180px",
                                  background: "rgba(8,102,220,.2)",
                                  boxShadow: "2px 14px 15px -7px rgba(30, 166, 250, 0.36)",
                                  borderRadius: "50px"}}
                                  >
                                <div style={{ display: 'flex',width: player1Health, height: "20px", background: "#0866dc", ...player1HealthBarStyle}}></div>
                              </div>
                            </div>
                            <img src="https://tinydinos.org/transparent/6600.png" width="160" height="160" style={{  transform: "scaleX(-1)"}}/>
                        </div>
                        <div style={{position: "absolute", display: "flex", justifyContent: "center", width: "100%"}}>{winnerText}</div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            width: "100%",
                            justifyContent: "space-between",
                            boxSizing: "border-box",
                        }}>
                            <img src="https://tinydinos.org/transparent/763.png" width="160" height="160"/>
                            <div style={{
                              borderRight: "2px solid black",
                              borderTop: "2px solid black",
                              display: 'flex',
                              flexDirection: "row",
                              height: "62px",
                              padding: "20px",
                              marginTop: "120px"
                            }}>
        
                              <div style={{display: 'flex',height: "20px", lineHeight: "20px", marginRight: "16px"}}>{game.turn === Turn.PLAYER2 ? "*" : ""}HP: </div>
                              <div style={{
                                display: "flex",
                                  height: "20px",
                                  width: "180px",
                                  background: "rgba(8,102,220,.2)",
                                  boxShadow: "2px 14px 15px -7px rgba(30, 166, 250, 0.36)",
                                  borderRadius: "50px"}}
                                  >
                                <div style={{width: player2Health, height: "20px", background: "#0866dc", ...player2HealthBarStyle, display: 'flex'}}></div>
                              </div>
                            </div>
                        </div>
                    </div>
                    ,
                    {
                        width: 764, height: 400, fonts: [{
                            data: fontData,
                            name: 'Roboto',
                            style: 'normal',
                            weight: 400
                        }]
                    })
            }
        } catch (err) {
            console.error(err);
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
