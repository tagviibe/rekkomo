-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'COMMUNITY_ONLY', 'PRIVATE');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "allowFollow" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "communities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "nativePlace" TEXT,
ADD COLUMN     "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "showActivity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showNativePlace" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerUserId" TEXT NOT NULL,
    "followingUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Follow_followingUserId_idx" ON "Follow"("followingUserId");

-- CreateIndex
CREATE INDEX "Follow_followerUserId_idx" ON "Follow"("followerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerUserId_followingUserId_key" ON "Follow"("followerUserId", "followingUserId");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerUserId_fkey" FOREIGN KEY ("followerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingUserId_fkey" FOREIGN KEY ("followingUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
