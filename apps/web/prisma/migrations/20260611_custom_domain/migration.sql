ALTER TABLE "showrooms" ADD COLUMN "customDomain" TEXT;
ALTER TABLE "showrooms" ADD COLUMN "customDomainVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "showrooms" ADD COLUMN "customDomainToken" TEXT;
CREATE UNIQUE INDEX "showrooms_customDomain_key" ON "showrooms"("customDomain");
