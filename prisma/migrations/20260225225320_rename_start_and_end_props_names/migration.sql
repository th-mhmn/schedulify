/*
  Warnings:

  - You are about to drop the column `endsAt` on the `AvailabilityBlock` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `AvailabilityBlock` table. All the data in the column will be lost.
  - You are about to drop the column `endsAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `endTime` to the `AvailabilityBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `AvailabilityBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AvailabilityBlock_businessId_startsAt_idx";

-- DropIndex
DROP INDEX "Booking_businessId_startsAt_idx";

-- DropIndex
DROP INDEX "Booking_userId_startsAt_idx";

-- AlterTable
ALTER TABLE "AvailabilityBlock" DROP COLUMN "endsAt",
DROP COLUMN "startsAt",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "endsAt",
DROP COLUMN "startsAt",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "AvailabilityBlock_businessId_startTime_idx" ON "AvailabilityBlock"("businessId", "startTime");

-- CreateIndex
CREATE INDEX "Booking_businessId_startTime_idx" ON "Booking"("businessId", "startTime");

-- CreateIndex
CREATE INDEX "Booking_userId_startTime_idx" ON "Booking"("userId", "startTime");
