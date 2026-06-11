-- Add human-readable reference numbers for multi-tenant isolation

-- Showroom platform-wide sequential number (CL-1001, CL-1002...)
ALTER TABLE "showrooms" ADD COLUMN "showroomNumber" INTEGER;
CREATE UNIQUE INDEX "showrooms_showroomNumber_key" ON "showrooms"("showroomNumber");

-- Car sequential number per showroom (independent counters per tenant)
ALTER TABLE "cars" ADD COLUMN "carRefNumber" INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "cars_showroomId_carRefNumber_key" ON "cars"("showroomId", "carRefNumber");
