/*
  Warnings:

  - The primary key for the `WaitlistedUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `WaitlistedUser` table. All the data in the column will be lost.
  - Added the required column `waitId` to the `WaitlistedUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WaitlistedUser" DROP CONSTRAINT "WaitlistedUser_pkey",
DROP COLUMN "id",
ADD COLUMN     "waitId" TEXT NOT NULL,
ADD CONSTRAINT "WaitlistedUser_pkey" PRIMARY KEY ("waitId");
