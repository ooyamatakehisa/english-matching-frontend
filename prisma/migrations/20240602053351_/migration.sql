/*
  Warnings:

  - A unique constraint covering the columns `[unauthenticatedUserId]` on the table `WaitlistedUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unauthenticatedUserId1` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unauthenticatedUserId2` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unauthenticatedUserId` to the `WaitlistedUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "unauthenticatedUserId1" TEXT NOT NULL,
ADD COLUMN     "unauthenticatedUserId2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WaitlistedUser" ADD COLUMN     "unauthenticatedUserId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistedUser_unauthenticatedUserId_key" ON "WaitlistedUser"("unauthenticatedUserId");
