import prisma from "@/lib/prisma";
import { WaitlistedUser } from "@prisma/client";
import { randomUUID } from "crypto";

export const postMatching = async () => {
    let channel;
    await prisma.$transaction(async (tx) => {
        const res: WaitlistedUser[] | null =
            await tx.$queryRaw`SELECT * FROM "WaitlistedUser" LIMIT 1 FOR UPDATE`;

        if (!res || res.length === 0) {
            return null;
        }

        await tx.waitlistedUser.delete({ where: { waitId: res[0].waitId } });
        channel = {
            id: randomUUID(),
            waitId1: randomUUID(),
            waitId2: res[0].waitId,
        };

        await tx.channel.create({ data: channel });
    });
    return channel;
}
