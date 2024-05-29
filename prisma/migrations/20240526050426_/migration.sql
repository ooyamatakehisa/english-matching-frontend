/*
  Warnings:

  - A unique constraint covering the columns `[waitId1]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[waitId2]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Channel_waitId1_key" ON "Channel"("waitId1");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_waitId2_key" ON "Channel"("waitId2");
