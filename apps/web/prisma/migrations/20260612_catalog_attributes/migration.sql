-- Category: default car attributes (auto-fill the dealer's add-car form)
ALTER TABLE "categories" ADD COLUMN "fuelTypes" "FuelType"[] DEFAULT ARRAY[]::"FuelType"[];
ALTER TABLE "categories" ADD COLUMN "transmissions" "Transmission"[] DEFAULT ARRAY[]::"Transmission"[];

-- Model: optional production year range
ALTER TABLE "models" ADD COLUMN "yearStart" INTEGER;
ALTER TABLE "models" ADD COLUMN "yearEnd" INTEGER;

-- Helpful indexes for catalog cascade reads
CREATE INDEX "categories_brandId_isActive_idx" ON "categories"("brandId", "isActive");
CREATE INDEX "models_categoryId_isActive_idx" ON "models"("categoryId", "isActive");
