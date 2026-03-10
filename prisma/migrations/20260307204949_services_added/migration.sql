-- AlterTable
ALTER TABLE "ServiceProvider" ADD COLUMN     "acceptsUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "categoryName" TEXT,
ADD COLUMN     "communityDiscount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "services" JSONB;
