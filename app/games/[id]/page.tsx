import {kv} from "@vercel/kv";
import Head from "next/head";
import {Metadata, ResolvingMetadata} from "next";
import { IGameState, Turn } from "@/pages/api/store";

async function getGame(id: string): Promise<IGameState | null> {
    try {
        let gameStr: IGameState | null = await kv.get(id);

        console.log(gameStr)

        if (!gameStr) {
            return null;
        }

        return gameStr;
    } catch (error) {
        console.error(error);
        return null;
    }
}

type Props = {
    params: { id: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // read route params
    const id = params.id
    const game = await getGame(id)

    if (!game) {
        return {}
    }

    const url = process.env['HOST'] || 'https://dino.degen.today';
    console.log(url)

    const { turn } = game;

    const fcMetadata: Record<string, string> = {
        "fc:frame": "vNext",
        "fc:frame:post_url": `${url}/api/vote?id=${id}`,
        "fc:frame:image": `${url}/api/image?id=${id}`,
    };

    switch (turn) {
        case Turn.PLAYER1:
        case Turn.PLAYER2: {
            const currentPlayerDino = game?.turn === Turn.PLAYER1 ? game.player1Dino : game?.player2Dino;

            if (currentPlayerDino?.attacks) {
                currentPlayerDino?.attacks.map((option, index) => {
                    fcMetadata[`fc:frame:button:${index + 1}`] = option.name;
                })
            }
        }
        break;
        case Turn.SEEKING_OPPONENT:
        case Turn.SEEKING_PLAYER:
            fcMetadata[`fc:frame:button:1`] = "Join Up!";
        break;
        default:
            fcMetadata[`fc:frame:button:1`] = "Start new game";
            fcMetadata[`fc:frame:post_url`] = `${process.env['HOST']}/api/redirect`;
            fcMetadata[`fc:frame:button:1:action`] = `post_redirect`;

    }

    return {
        title: id,
        openGraph: {
            title: id,
            images: [`/api/image?id=${id}`],
        },
        other: {
            ...fcMetadata,
        },
        metadataBase: new URL(url)
    }
}


export default async function Page({params}: { params: {id: string}}) {
    const game = await getGame(params.id);
    console.log("game", game)

    return(
        <>
            <div className="flex flex-col items-center justify-center min-h-screen py-2">
                <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
                    Copy this link into warpcast and enjoy!
                </main>
            </div>
        </>
    );

}