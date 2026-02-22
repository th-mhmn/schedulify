/*
  Warnings:

  - You are about to drop the `RefreshToken` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `refreshToken` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refreshToken" TEXT NOT NULL;

-- DropTable
DROP TABLE "RefreshToken";
