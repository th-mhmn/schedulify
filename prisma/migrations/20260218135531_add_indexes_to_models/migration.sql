/*
  Warnings:

  - A unique constraint covering the columns `[businessId,dayOfWeek]` on the table `WorkingHours` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Booking_businessId_startsAt_idx" ON "Booking"("businessId", "startsAt");

-- CreateIndex
CREATE INDEX "Booking_userId_startsAt_idx" ON "Booking"("userId", "startsAt");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Service_businessId_idx" ON "Service"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHours_businessId_dayOfWeek_key" ON "WorkingHours"("businessId", "dayOfWeek");
