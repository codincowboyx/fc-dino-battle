"use server";

import { kv } from "@vercel/kv";
import { revalidatePath } from "next/cache";
import {Poll} from "./types";
import {redirect} from "next/navigation";
import { gameState } from "@/pages/api/store";

export async function saveGame(dinoId1: string, dinoId2: string) {
  const time = new Date().getTime();
  const id = await gameState.startGame(time, dinoId1, dinoId2);
  await kv.zadd("games_by_date", {
    score: Number(time),
    member: id
  });

  revalidatePath("/games");
  redirect(`/games/${id}`);
}

export async function votePoll(poll: Poll, optionIndex: number) {
  revalidatePath(`/games/${poll.id}`);
  redirect(`/games/${poll.id}?results=true`);
}

export async function redirectToGames() {
  redirect("/games");
}