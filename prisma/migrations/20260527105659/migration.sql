/*
  Warnings:

  - The primary key for the `IdempotencyKey` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `key` on the `IdempotencyKey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[keyHash]` on the table `IdempotencyKey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `IdempotencyKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyHash` to the `IdempotencyKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IdempotencyKey" DROP CONSTRAINT "IdempotencyKey_pkey",
DROP COLUMN "key",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "keyHash" TEXT NOT NULL,
ADD COLUMN     "responseBody" JSONB,
ADD COLUMN     "statusCode" INTEGER,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "IdempotencyKey_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_keyHash_key" ON "IdempotencyKey"("keyHash");
