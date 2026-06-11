-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLATFORM_ADMIN', 'SHOWROOM_OWNER', 'SHOWROOM_MANAGER', 'SHOWROOM_STAFF');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'SHOWROOM', 'AGENCY', 'COMPANY');

-- CreateEnum
CREATE TYPE "IdType" AS ENUM ('CITIZEN', 'RESIDENT', 'VISITOR');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'TRIAL');

-- CreateEnum
CREATE TYPE "VatMethod" AS ENUM ('FULL_PRICE', 'PROFIT_MARGIN');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('SUV', 'SEDAN', 'PICKUP', 'COUPE', 'HATCHBACK', 'VAN', 'CONVERTIBLE', 'WAGON');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateEnum
CREATE TYPE "CarType" AS ENUM ('NEW', 'USED', 'USED_QUALIFIED');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('DRAFT', 'FOR_SALE', 'AUCTION', 'RESERVED', 'SOLD');

-- CreateEnum
CREATE TYPE "DisplayMode" AS ENUM ('FIXED_PRICE', 'SOUM', 'AUCTION');

-- CreateEnum
CREATE TYPE "PlateType" AS ENUM ('PRIVATE', 'TAXI', 'TRANSPORT', 'DIPLOMAT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('INSPECTION', 'PURCHASE_INVOICE', 'INSURANCE', 'REGISTRATION', 'PREVIOUS_INVOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('CAR_CREATED', 'FIELD_UPDATED', 'STATUS_CHANGED', 'FILE_UPLOADED', 'FILE_DELETED', 'SALE_REGISTERED', 'PRICE_CHANGED', 'NOTE_ADDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'FINANCING', 'TRADE_IN', 'MIXED');

-- CreateEnum
CREATE TYPE "CarDataSource" AS ENUM ('MANUAL', 'VDM_VIN', 'VDM_ABSHER');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuctionType" AS ENUM ('NONE', 'PUBLIC', 'PRIVATE', 'SOUM');

-- CreateEnum
CREATE TYPE "TradeInCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'SALARY', 'UTILITIES', 'MARKETING', 'MAINTENANCE', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('INDIVIDUAL', 'AUCTION', 'DEALER', 'AGENCY');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('WORKSHOP_FIXED', 'WORKSHOP_MOBILE', 'INSPECTION_CENTER', 'TRANSPORT', 'FINANCING_PROVIDER');

-- CreateTable
CREATE TABLE "showrooms" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "tagline" TEXT,
    "coverImageUrl" TEXT,
    "showPrices" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "vatNumber" TEXT,
    "zatcaRegistered" BOOLEAN NOT NULL DEFAULT false,
    "profitMarginApproved" BOOLEAN NOT NULL DEFAULT false,
    "vatMethod" "VatMethod" NOT NULL DEFAULT 'FULL_PRICE',
    "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'BASIC',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "city" TEXT,
    "logoUrl" TEXT,
    "marketplaceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "commissionPct" DECIMAL(5,2),
    "gatewayAccountId" TEXT,
    "gatewayOnboardingStatus" TEXT,
    "activityType" TEXT,
    "district" TEXT,
    "whatsapp" TEXT,
    "instagramUrl" TEXT,
    "commercialReg" TEXT,
    "commercialRegDoc" TEXT,
    "commercialRegVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "showrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showroom_users" (
    "id" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'SHOWROOM_STAFF',
    "accountType" "AccountType" NOT NULL DEFAULT 'SHOWROOM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "city" TEXT,
    "dateOfBirth" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerifiedAt" TIMESTAMP(3),
    "nationalId" TEXT,
    "idType" "IdType",
    "idExpiryDate" TEXT,
    "nafathVerified" BOOLEAN NOT NULL DEFAULT false,
    "nafathVerifiedAt" TIMESTAMP(3),
    "nafathRawData" JSONB,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'NONE',
    "kycSubmittedAt" TIMESTAMP(3),
    "kycApprovedAt" TIMESTAMP(3),
    "kycDocFront" TEXT,
    "kycDocBack" TEXT,
    "kycRejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "showroom_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "bodyType" "BodyType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "models" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cars" (
    "id" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "carType" "CarType" NOT NULL DEFAULT 'USED',
    "colorExt" TEXT,
    "colorInt" TEXT,
    "fuelType" "FuelType",
    "transmission" "Transmission",
    "odometer" INTEGER,
    "vin" TEXT,
    "bodyType" "BodyType",
    "status" "CarStatus" NOT NULL DEFAULT 'DRAFT',
    "displayMode" "DisplayMode" NOT NULL DEFAULT 'FIXED_PRICE',
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "sellPrice" DECIMAL(12,2),
    "extraCosts" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "plateNumber" TEXT,
    "plateType" "PlateType",
    "notes" TEXT,
    "listedOnMarket" BOOLEAN NOT NULL DEFAULT false,
    "dataSource" "CarDataSource" NOT NULL DEFAULT 'MANUAL',
    "vdmLastSyncAt" TIMESTAMP(3),
    "vdmRawData" JSONB,
    "marketPrice" DECIMAL(12,2),
    "supplierId" TEXT,
    "vdmSequenceNumber" TEXT,
    "registrationExpiry" TIMESTAMP(3),
    "inspectionExpiry" TIMESTAMP(3),
    "insuranceExpiry" TIMESTAMP(3),
    "insuranceCompany" TEXT,
    "insurancePolicyNo" TEXT,
    "engineSize" TEXT,
    "mojazRequestId" TEXT,
    "mojazLastReportAt" TIMESTAMP(3),
    "mojazReportUrl" TEXT,
    "mojazRawData" JSONB,
    "numberOfOwners" INTEGER,
    "accidentsLastCheckAt" TIMESTAMP(3),
    "accidentsCount" INTEGER,
    "accidentsCheckYears" INTEGER,
    "accidentsRawData" JSONB,
    "minAcceptedPrice" DECIMAL(12,2),
    "auctionType" "AuctionType",
    "auctionSlug" TEXT,
    "auctionStartAt" TIMESTAMP(3),
    "auctionEndsAt" TIMESTAMP(3),
    "auctionOpeningPrice" DECIMAL(12,2),
    "auctionBuyNowPrice" DECIMAL(12,2),
    "auctionDepositAmount" DECIMAL(10,2),
    "createdBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_images" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_documents" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "docType" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_expenses" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_timeline" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "TimelineEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "idNumber" TEXT,
    "email" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sellPrice" DECIMAL(12,2) NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "extraCosts" DECIMAL(12,2) NOT NULL,
    "vatAmount" DECIMAL(10,2) NOT NULL,
    "netProfit" DECIMAL(12,2) NOT NULL,
    "vatMethodUsed" "VatMethod" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "notes" TEXT,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "commissionPct" DECIMAL(5,2) NOT NULL,
    "commissionAmt" DECIMAL(10,2) NOT NULL,
    "netToShowroom" DECIMAL(12,2) NOT NULL,
    "gatewayRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'held',
    "heldAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'held',
    "notes" TEXT,
    "saleId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_payments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_ins" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "brandId" TEXT,
    "categoryId" TEXT,
    "modelId" TEXT,
    "year" INTEGER,
    "colorExt" TEXT,
    "odometer" INTEGER,
    "vin" TEXT,
    "condition" "TradeInCondition" NOT NULL DEFAULT 'GOOD',
    "estimatedValue" DECIMAL(12,2) NOT NULL,
    "agreedValue" DECIMAL(12,2) NOT NULL,
    "addedToInventory" BOOLEAN NOT NULL DEFAULT false,
    "inventoryCarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_config" (
    "id" TEXT NOT NULL DEFAULT 'platform',
    "defaultCommissionPct" DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    "minCommissionPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "maxCommissionPct" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "vatPct" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "activePaymentGateway" TEXT NOT NULL DEFAULT 'moyasar',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showroom_expenses" (
    "id" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "showroom_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SupplierType" NOT NULL DEFAULT 'INDIVIDUAL',
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rating" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "providerId" TEXT,
    "serviceType" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "fee" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "appliesTo" TEXT NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL,
    "appliesTo" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "vatIncluded" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "showroomId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "isWinning" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "showrooms_slug_key" ON "showrooms"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "showroom_users_email_key" ON "showroom_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "showroom_users_nationalId_key" ON "showroom_users"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "cars_auctionSlug_key" ON "cars"("auctionSlug");

-- CreateIndex
CREATE UNIQUE INDEX "sales_carId_key" ON "sales"("carId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_saleId_key" ON "payment_transactions"("saleId");

-- CreateIndex
CREATE INDEX "deposits_carId_idx" ON "deposits"("carId");

-- CreateIndex
CREATE INDEX "deposits_showroomId_status_idx" ON "deposits"("showroomId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "trade_ins_saleId_key" ON "trade_ins"("saleId");

-- CreateIndex
CREATE INDEX "showroom_expenses_showroomId_expenseDate_idx" ON "showroom_expenses"("showroomId", "expenseDate");

-- CreateIndex
CREATE INDEX "service_providers_city_type_idx" ON "service_providers"("city", "type");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_createdAt_idx" ON "wallet_transactions"("walletId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_rules_key_key" ON "pricing_rules"("key");

-- CreateIndex
CREATE INDEX "bids_carId_amount_idx" ON "bids"("carId", "amount");

-- CreateIndex
CREATE INDEX "bids_carId_createdAt_idx" ON "bids"("carId", "createdAt");

-- AddForeignKey
ALTER TABLE "showroom_users" ADD CONSTRAINT "showroom_users_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "showroom_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_documents" ADD CONSTRAINT "car_documents_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_documents" ADD CONSTRAINT "car_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "showroom_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_expenses" ADD CONSTRAINT "car_expenses_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_timeline" ADD CONSTRAINT "car_timeline_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_timeline" ADD CONSTRAINT "car_timeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "showroom_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "showroom_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "showroom_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_ins" ADD CONSTRAINT "trade_ins_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_ins" ADD CONSTRAINT "trade_ins_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showroom_expenses" ADD CONSTRAINT "showroom_expenses_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showroom_expenses" ADD CONSTRAINT "showroom_expenses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "showroom_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "showroom_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
