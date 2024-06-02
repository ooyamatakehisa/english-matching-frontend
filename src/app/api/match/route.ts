import prisma from '@/lib/prisma';
import { type NextRequest } from 'next/server'
import { postChannel } from './post_channel';

export async function POST(req: Request) {
    const res = await req.json()
    const channel = await postChannel(res.unauthenticatedUserId);
    if (!channel) {
        return Response.json({ message: 'Failed to create channel' }, { status: 404 });
    }

    return Response.json(channel, { status: 201 });
}

export async function GET(req: NextRequest) {
    const waitId = req.nextUrl.searchParams.get('waitId')
    if (!waitId) {
        return Response.json({ message: 'Bad request' }, { status: 400 });
    }

    const channel = await prisma.channel.findFirst({
        where: { OR: [{ waitId1: waitId }, { waitId2: waitId }] },
    });
    if (!channel) {
        return Response.json({ message: 'Not found' }, { status: 404 });
    }
    return Response.json(channel);
}
