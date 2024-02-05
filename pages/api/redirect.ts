import { NextRequest, NextResponse } from 'next/server';

const url = 'https://dino.degen.today';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  return NextResponse.redirect(`${url}/redirect`, {status: 302});
}

export default async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';