import {kv} from "@vercel/kv";
import {Poll} from "@/app/types";
import Link from "next/link";

const SEVEN_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 7;

async function getGames() {
    try {
        let pollIds = await kv.zrange("games_by_date", Date.now(), Date.now() - SEVEN_DAYS_IN_MS, {byScore: true, rev: true});

        if (!pollIds.length) {
            return [];
        }

        let multi = kv.multi();
        pollIds.forEach((id) => {
            multi.hgetall(`${id}`);
        });

        let items: Poll[] = await multi.exec();
        return items.map((item) => {
            return {...item};
        });
    } catch (error) {
        console.error(error);
        return [];
    }
}

export default async function Page() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
                <Link href="/">
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Create a Dino Battle
                    </button>
                </Link>
            </main>
        </div>
    );
}