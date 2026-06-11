-- CreateIndex
CREATE INDEX "car_documents_carId_idx" ON "car_documents"("carId");
-- CreateIndex
CREATE INDEX "car_images_carId_idx" ON "car_images"("carId");
-- CreateIndex
CREATE INDEX "car_timeline_carId_createdAt_idx" ON "car_timeline"("carId", "createdAt");
-- CreateIndex
CREATE INDEX "cars_showroomId_status_deletedAt_idx" ON "cars"("showroomId", "status", "deletedAt");
-- CreateIndex
CREATE INDEX "cars_status_deletedAt_idx" ON "cars"("status", "deletedAt");
-- CreateIndex
CREATE INDEX "cars_brandId_idx" ON "cars"("brandId");
-- CreateIndex
CREATE INDEX "cars_categoryId_idx" ON "cars"("categoryId");
-- CreateIndex
CREATE INDEX "cars_mediaScheduledDeleteAt_mediaDeletedAt_idx" ON "cars"("mediaScheduledDeleteAt", "mediaDeletedAt");
-- CreateIndex
CREATE INDEX "customers_showroomId_idx" ON "customers"("showroomId");
-- CreateIndex
CREATE INDEX "sales_showroomId_soldAt_idx" ON "sales"("showroomId", "soldAt");
