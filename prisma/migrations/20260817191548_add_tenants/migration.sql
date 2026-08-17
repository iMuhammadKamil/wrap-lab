-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL DEFAULT '',
    "tagline" TEXT NOT NULL DEFAULT '',
    "primaryColor" TEXT NOT NULL DEFAULT '#d7b51a',
    "secondaryColor" TEXT NOT NULL DEFAULT '#333333',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "deliveryFee" INTEGER NOT NULL DEFAULT 150,
    "freeDeliveryThreshold" INTEGER NOT NULL DEFAULT 1500,
    "currency" TEXT NOT NULL DEFAULT 'Rs.',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- Seed the existing Wrap Lab tenant (backfill target for all current rows)
INSERT INTO "Tenant" ("id", "slug", "name", "primaryColor", "secondaryColor", "phone", "email", "address", "whatsapp", "deliveryFee", "freeDeliveryThreshold", "currency", "isActive", "createdAt", "updatedAt")
VALUES ('cmsxm6ayke42e18a88e43d650', 'wraplab', 'Wrap Lab', '#d7b51a', '#333333', '03155008056', 'wraplab.pk@gmail.com', 'Ground Floor, Pakland Vista, I-8 Markaz, Islamabad', '03155008056', 150, 1500, 'Rs.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============ User ============

-- AlterTable
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;

-- Backfill existing rows to Wrap Lab
UPDATE "User" SET "tenantId" = 'cmsxm6ayke42e18a88e43d650' WHERE "tenantId" IS NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;

-- DropIndex
DROP INDEX "User_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============ Category ============

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "tenantId" TEXT;

-- Backfill existing rows to Wrap Lab
UPDATE "Category" SET "tenantId" = 'cmsxm6ayke42e18a88e43d650' WHERE "tenantId" IS NULL;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "tenantId" SET NOT NULL;

-- DropIndex
DROP INDEX "Category_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Category_tenantId_name_key" ON "Category"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Category_tenantId_idx" ON "Category"("tenantId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============ Product ============

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "tenantId" TEXT;

-- Backfill existing rows to Wrap Lab
UPDATE "Product" SET "tenantId" = 'cmsxm6ayke42e18a88e43d650' WHERE "tenantId" IS NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============ ProductAddon ============

-- AlterTable
ALTER TABLE "ProductAddon" ADD COLUMN "tenantId" TEXT;

-- Backfill existing rows to Wrap Lab
UPDATE "ProductAddon" SET "tenantId" = 'cmsxm6ayke42e18a88e43d650' WHERE "tenantId" IS NULL;

-- AlterTable
ALTER TABLE "ProductAddon" ALTER COLUMN "tenantId" SET NOT NULL;

-- DropIndex
DROP INDEX "ProductAddon_productId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "ProductAddon_tenantId_productId_name_key" ON "ProductAddon"("tenantId", "productId", "name");

-- CreateIndex
CREATE INDEX "ProductAddon_tenantId_idx" ON "ProductAddon"("tenantId");

-- AddForeignKey
ALTER TABLE "ProductAddon" ADD CONSTRAINT "ProductAddon_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============ CartItem ============

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN "tenantId" TEXT;

-- Backfill existing rows to Wrap Lab
UPDATE "CartItem" SET "tenantId" = 'cmsxm6ayke42e18a88e43d650' WHERE "tenantId" IS NULL;

-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "CartItem_tenantId_idx" ON "CartItem"("tenantId");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============ Order ============

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "tenantId" TEXT;

-- Backfill existing rows to Wrap Lab
UPDATE "Order" SET "tenantId" = 'cmsxm6ayke42e18a88e43d650' WHERE "tenantId" IS NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Order_tenantId_idx" ON "Order"("tenantId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============ OrderItem ============

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "tenantId" TEXT;

-- Backfill existing rows to Wrap Lab
UPDATE "OrderItem" SET "tenantId" = 'cmsxm6ayke42e18a88e43d650' WHERE "tenantId" IS NULL;

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "OrderItem_tenantId_idx" ON "OrderItem"("tenantId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============ Offer ============

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN "tenantId" TEXT;

-- Backfill existing rows to Wrap Lab
UPDATE "Offer" SET "tenantId" = 'cmsxm6ayke42e18a88e43d650' WHERE "tenantId" IS NULL;

-- AlterTable
ALTER TABLE "Offer" ALTER COLUMN "tenantId" SET NOT NULL;

-- DropIndex
DROP INDEX "Offer_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "Offer_tenantId_code_key" ON "Offer"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Offer_tenantId_idx" ON "Offer"("tenantId");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;