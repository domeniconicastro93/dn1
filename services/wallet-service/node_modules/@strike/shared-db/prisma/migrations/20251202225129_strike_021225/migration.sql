/*
  Warnings:

  - A unique constraint covering the columns `[steam_app_id]` on the table `games` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "games" ADD COLUMN     "steam_app_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "games_steam_app_id_key" ON "games"("steam_app_id");
