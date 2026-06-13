-- Rename old CarRequestStatus enum values and add new ones
-- Step 1: Create new enum type
CREATE TYPE "CarRequestStatus_new" AS ENUM (
  'PENDING',
  'RESERVED',
  'WAITING_PAYMENT',
  'OWNERSHIP_TRANSFER',
  'COMPLETED',
  'REJECTED',
  'CANCELLED'
);

-- Step 2: Migrate existing data (ACCEPTED → RESERVED)
ALTER TABLE "car_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "car_requests" 
  ALTER COLUMN "status" TYPE "CarRequestStatus_new" 
  USING (
    CASE "status"::text
      WHEN 'ACCEPTED' THEN 'RESERVED'
      ELSE "status"::text
    END
  )::"CarRequestStatus_new";

-- Step 3: Drop old enum, rename new one
DROP TYPE "CarRequestStatus";
ALTER TYPE "CarRequestStatus_new" RENAME TO "CarRequestStatus";

-- Restore default
ALTER TABLE "car_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"CarRequestStatus";

-- Step 4: Add customerId column to car_requests
ALTER TABLE "car_requests" ADD COLUMN "customerId" TEXT;

-- Step 5: Foreign key to customers
ALTER TABLE "car_requests" 
  ADD CONSTRAINT "car_requests_customerId_fkey" 
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;
