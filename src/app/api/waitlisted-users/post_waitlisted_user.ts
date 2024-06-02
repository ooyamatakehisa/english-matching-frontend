import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

export const postWaitlistedUser = async (unauthenticatedUserId: string) => {
    const data = {
        waitId: randomUUID(),
        unauthenticatedUserId,
    };
    await prisma.waitlistedUser.upsert({
        where: {
            unauthenticatedUserId,
        },
        create: data,
        update: data,
    });
    return data;
};
