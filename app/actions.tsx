"use server";

import { kv } from "@vercel/kv";
import { revalidatePath } from "next/cache";
import {Poll} from "./types";
import {redirect} from "next/navigation";
import { gameState } from "@/pages/api/store";
import { z } from "zod";

export async function saveGame(
  dinoId1: string | null,
  dinoId2: string | null
) { 
  const schema = z.object({
    dinoId1: z.string().min(1).max(10000).nullable().default("6600"),
    dinoId2: z.string().min(1).max(10000).nullable().default("763"),
  });
  const parse = schema.safeParse({
    dinoId1,
    dinoId2
  });

  if (!parse.success) {
    console.log(parse.error)
    return { message: "unable to make game"}
  }

  const data = parse.data;

  const time = new Date().getTime();

  const id = await gameState.startGame(time, data.dinoId1 ?? undefined, data.dinoId2 ?? undefined);
  await kv.zadd("games_by_date", {
    score: Number(time),
    member: id
  });

  revalidatePath("/games");
  redirect(`/games/${id}`);

  return { message: "game made successfully"}
}

export async function votePoll(poll: Poll, optionIndex: number) {
  revalidatePath(`/games/${poll.id}`);
  redirect(`/games/${poll.id}?results=true`);
}

export async function redirectToGames() {
  redirect("/games");
}