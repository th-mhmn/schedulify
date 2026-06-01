/*
  Warnings:

  - You are about to drop the `IdempotencyKey` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "IdempotencyKey" DROP CONSTRAINT "IdempotencyKey_bookingId_fkey";

-- DropTable
DROP TABLE "IdempotencyKey";
