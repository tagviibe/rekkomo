-- AlterTable
ALTER TABLE "CommunityPost" ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "jobPostId" TEXT;

-- AlterTable
ALTER TABLE "Meetup" ADD COLUMN     "eventId" TEXT;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
