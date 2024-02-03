import type { NextApiRequest, NextApiResponse } from 'next';
import {kv} from "@vercel/kv";
import {getSSLHubRpcClient, Message} from "@farcaster/hub-nodejs";
import { IGameState, Turn, gameState } from './store';

const HUB_URL = process.env['HUB_URL'] || "nemes.farcaster.xyz:2283"
const client = getSSLHubRpcClient(HUB_URL);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        // Process the game update
        // For example, let's assume you receive an option in the body
        try {
            const gameId = req.query['id'] as string;
            const results = req.query['results'] === 'true'
            if (!gameId) {
                return res.status(400).send('Missing game ID');
            }

            let validatedMessage : Message | undefined = undefined;
            try {
                const frameMessage = Message.decode(Buffer.from(req.body?.trustedData?.messageBytes || '', 'hex'));
                const result = await client.validateMessage(frameMessage);
                
                if (result.isOk() && result.value.valid) {
                    console.log(result.value.message);
                    validatedMessage = result.value.message;
                }
            } catch (e)  {
                return res.status(400).send(`Failed to validate message: ${e}`);
            }

            let game: IGameState | null = await kv.get(`${gameId}`);

            // Uncomment for local testing
            
            // let validatedMessage : Message | undefined = {
            //     data: {
            //         // @ts-ignore
            //         frameActionBody: {
            //             buttonIndex: 1
            //         },
            //         fid: game?.turn === Turn.PLAYER1 || game?.turn === Turn.SEEKING_PLAYER ? 1234 : 1
            //     }
            // };

            const buttonId = (validatedMessage?.data?.frameActionBody?.buttonIndex || 1) - 1;
            
            const fid = validatedMessage?.data?.fid || 0;
            
            if (buttonId >= 0 && buttonId < 5 && !results && game) {
                if (game.turn === Turn.SEEKING_OPPONENT || game.turn === Turn.SEEKING_PLAYER) {
                    game = await gameState.playerJoin(gameId, fid.toString())
                } else if (game.turn === Turn.PLAYER1 || game.turn === Turn.PLAYER2) {
                    game = await gameState.play(gameId, fid.toString(), buttonId)
                }
            }

            if (!game) {
                return res.status(400).send('Missing game ID');
            }
            const imageUrl = `${process.env['HOST']}/api/image?id=${game.id}&results=${results ? 'false': 'true'}&date=${Date.now()}${ fid > 0 ? `&fid=${fid}` : '' }`;


            const { turn } = game;
            const buttons = [];
            let postUrl = `<meta name="fc:frame:post_url" content="${process.env['HOST']}/api/vote?id=${game.id}&results=${results ? 'false' : 'true'}&date=${Date.now()}${ fid > 0 ? `&fid=${fid}` : '' }">`;

            switch (turn) {
                case Turn.PLAYER1:
                case Turn.PLAYER2: {
                    const currentPlayerDino = game?.turn === Turn.PLAYER1 ? game.player1Dino : game?.player2Dino;
                    const currentPlayer = game.turn === Turn.PLAYER1 ? game.player1Fid : game.player2Fid;
                    const otherPlayer = game.turn === Turn.PLAYER1 ? game.player2Fid : game.player1Fid;

                    if (currentPlayer === fid.toString()) {
                        if (currentPlayerDino?.attacks) {
                            currentPlayerDino?.attacks.map((option, index) => {
                                buttons.push(`<meta name="fc:frame:button:${index + 1}" content="${option.name}">`)
                            })
                        }
                    } else if (otherPlayer === fid.toString()) {
                        buttons.push(`<meta name="fc:frame:button:1" content="Waiting on other player">`)
                    } else {
                        buttons.push(`<meta name="fc:frame:button:1" content="Not a player...Start new game">`);
                        postUrl = `<meta name="fc:frame:post_url" content="${process.env['HOST']}/api/redirect"><meta name="fc:frame:button:1:action" content="post_redirect">`;
                    }
                }
                break;
                case Turn.SEEKING_OPPONENT:
                case Turn.SEEKING_PLAYER:
                    buttons.push(`<meta name="fc:frame:button:1" content="Join Up!">`)
                break;
                default:
                    buttons.push(`<meta name="fc:frame:button:1" content="Start new game">`);
                    postUrl = `<meta name="fc:frame:post_url" content="${process.env['HOST']}/api/redirect"><meta name="fc:frame:button:1:action" content="post_redirect">`;

            }

            // Return an HTML response
            res.setHeader('Content-Type', 'text/html');
            res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Battle Time</title>
          <meta property="og:title" content="Battle Time">
          <meta property="og:image" content="${imageUrl}">
          <meta name="fc:frame" content="vNext">
          <meta name="fc:frame:image" content="${imageUrl}">
          ${postUrl}
          ${buttons.join("")}
        </head>
        <body>
          <p>battle</p>
        </body>
      </html>
    `);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating image');
        }
    } else {
        // Handle any non-POST requests
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
