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

    const url = 'https://dino.degen.today';

    const { turn } = game;

    const time = Date.now();

    const fcMetadata: Record<string, string> = {
        "fc:frame": "vNext",
        "fc:frame:post_url": `${url}/api/vote?id=${id}&date=${time}&viewStatus=true`,
        "fc:frame:image": `${url}/api/image?id=${id}&date=${time}`,
        "fc:frame:button:2": "Start New Game",
        "fc:frame:button:2:action": "post_redirect",
        "fc:frame:button:1": "View Status",
    };

    return {
        title: id,
        openGraph: {
            title: id,
            images: [`/api/image?id=${id}&date${time}`],
        },
        other: {
            ...fcMetadata,
        },
        metadataBase: new URL(url)
    }
}


export default async function Page({params}: { params: {id: string}}) {
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