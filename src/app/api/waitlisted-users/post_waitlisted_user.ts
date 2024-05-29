import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

export const postWaitlistedUser = async () => {
    const data = {
        waitId: randomUUID(),
    };
    await prisma.waitlistedUser.create({ data });
    return data;
};
