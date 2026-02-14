-- CreateEnum
CREATE TYPE "Profession" AS ENUM ('STUDENT', 'IT_PROFESSIONAL', 'JOB_SEEKER', 'FREELANCER', 'BUSINESS_OWNER', 'OTHER');

-- CreateEnum
CREATE TYPE "MoveTimeframe" AS ENUM ('MONTHS_0_3', 'MONTHS_3_12', 'YEAR_1_PLUS');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "canOffer" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "currentLocality" TEXT,
ADD COLUMN     "languagesSpoken" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "movedToCityWhen" "MoveTimeframe",
ADD COLUMN     "nativePlaceCity" TEXT,
ADD COLUMN     "nativePlaceState" TEXT,
ADD COLUMN     "needs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profession" "Profession";
