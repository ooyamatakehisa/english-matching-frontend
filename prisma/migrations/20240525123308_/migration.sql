/*
  Warnings:

  - You are about to drop the `MatchingQueue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "MatchingQueue";

-- CreateTable
CREATE TABLE "WaitlistedUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "WaitlistedUser_pkey" PRIMARY KEY ("id")
);
