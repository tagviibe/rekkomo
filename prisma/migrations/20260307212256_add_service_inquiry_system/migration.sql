-- CreateTable
CREATE TABLE "ServiceInquiry" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "serviceType" TEXT,
    "agreedPrice" TEXT,
    "agreedTime" TEXT,
    "agreedLocation" TEXT,
    "phoneRevealed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceMessage" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceInquiry_providerId_status_idx" ON "ServiceInquiry"("providerId", "status");

-- CreateIndex
CREATE INDEX "ServiceInquiry_customerId_idx" ON "ServiceInquiry"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceInquiry_providerId_customerId_key" ON "ServiceInquiry"("providerId", "customerId");

-- CreateIndex
CREATE INDEX "ServiceMessage_inquiryId_createdAt_idx" ON "ServiceMessage"("inquiryId", "createdAt");

-- AddForeignKey
ALTER TABLE "ServiceInquiry" ADD CONSTRAINT "ServiceInquiry_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceInquiry" ADD CONSTRAINT "ServiceInquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceMessage" ADD CONSTRAINT "ServiceMessage_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "ServiceInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceMessage" ADD CONSTRAINT "ServiceMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
