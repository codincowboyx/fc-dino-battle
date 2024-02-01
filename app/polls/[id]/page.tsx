import {kv} from "@vercel/kv";
import {Poll} from "@/app/types";
import {PollVoteForm} from "@/app/form";
import Head from "next/head";
import {Metadata, ResolvingMetadata} from "next";
import { IGameState } from "@/pages/api/store";

async function getGame(id: string): Promise<IGameState | null> {
    try {
        let game: IGameState | null = await kv.get(`${id}`);

        if (!game) {
            return null;
        }

        return game;
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

    const fcMetadata: Record<string, string> = {
        "fc:frame": "vNext",
        "fc:frame:post_url": `${process.env['HOST']}/api/vote?id=${id}`,
        "fc:frame:image": `${process.env['HOST']}/api/image?id=${id}`,
    };
    [game.option1, game.option2, game.option3, game.option4].filter(o => o !== "").map((option, index) => {
        fcMetadata[`fc:frame:button:${index + 1}`] = option;
    })


    return {
        title: id,
        openGraph: {
            title: id,
            images: [`/api/image?id=${id}`],
        },
        other: {
            ...fcMetadata,
        },
        metadataBase: new URL(process.env['HOST'] || '')
    }
}


export default async function Page({params}: { params: {id: string}}) {
    const game = await getGame(params.id);

    return(
        <>
            <div className="flex flex-col items-center justify-center min-h-screen py-2">
                <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
                    {game?.turn}
                </main>
            </div>
        </>
    );

}