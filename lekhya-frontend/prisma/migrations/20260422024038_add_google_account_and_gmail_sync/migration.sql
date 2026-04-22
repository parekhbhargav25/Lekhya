/*
  Warnings:

  - A unique constraint covering the columns `[userId,externalId]` on the table `Receipt` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'upload',
ALTER COLUMN "s3Key" DROP NOT NULL,
ALTER COLUMN "s3Url" DROP NOT NULL;

-- CreateTable
CREATE TABLE "GoogleAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAccount_userId_key" ON "GoogleAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_userId_externalId_key" ON "Receipt"("userId", "externalId");

-- AddForeignKey
ALTER TABLE "GoogleAccount" ADD CONSTRAINT "GoogleAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
