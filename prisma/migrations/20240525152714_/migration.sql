/*
  Warnings:

  - Added the required column `updatedAt` to the `WaitlistedUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WaitlistedUser" ADD COLUMN     "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ(3) NOT NULL;

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "waitId1" TEXT NOT NULL,
    "waitId2" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);
