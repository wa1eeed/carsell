-- Add car_public_id column: platform-wide unique human-readable ID
-- Format: CS + YY (2-digit year) + 6-digit sequence = 10 chars
-- Example: CS26000001

ALTER TABLE "cars" ADD COLUMN "car_public_id" TEXT;

-- Backfill existing cars: sequential within each year, ordered by creation date
WITH ranked AS (
  SELECT
    id,
    'CS' ||
    SUBSTRING(EXTRACT(YEAR FROM "createdAt")::TEXT, 3, 2) ||
    LPAD(ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(YEAR FROM "createdAt")
      ORDER BY "createdAt", id
    )::TEXT, 6, '0') AS pid
  FROM cars
)
UPDATE cars SET "car_public_id" = ranked.pid FROM ranked WHERE cars.id = ranked.id;

-- Unique index (allows NULL during transition, enforces uniqueness once set)
CREATE UNIQUE INDEX "cars_car_public_id_key" ON "cars"("car_public_id");
