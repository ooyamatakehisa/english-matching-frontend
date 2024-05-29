import prisma from '@/lib/prisma';
import { type NextRequest } from 'next/server'
import { postMatching } from './post_matching';

export async function POST() {
    const matching = await postMatching();
    return Response.json(matching, { status: 201 });
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
