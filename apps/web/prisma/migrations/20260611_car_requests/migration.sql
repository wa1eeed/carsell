-- CreateEnum
CREATE TYPE "CarRequestType" AS ENUM ('RESERVATION', 'SOUM_OFFER', 'PURCHASE');

-- CreateEnum
CREATE TYPE "CarRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "car_requests" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "type" "CarRequestType" NOT NULL,
    "status" "CarRequestStatus" NOT NULL DEFAULT 'PENDING',
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "offerAmount" DECIMAL(12,2),
    "message" TEXT,
    "dealerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "car_requests_showroomId_status_createdAt_idx" ON "car_requests"("showroomId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "car_requests_carId_idx" ON "car_requests"("carId");

-- AddForeignKey
ALTER TABLE "car_requests" ADD CONSTRAINT "car_requests_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_requests" ADD CONSTRAINT "car_requests_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

