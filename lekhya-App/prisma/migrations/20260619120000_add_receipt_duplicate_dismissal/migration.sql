-- CreateTable
CREATE TABLE "ReceiptDuplicateDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptDuplicateDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReceiptDuplicateDismissal_userId_idx" ON "ReceiptDuplicateDismissal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptDuplicateDismissal_userId_fingerprint_key" ON "ReceiptDuplicateDismissal"("userId", "fingerprint");

-- AddForeignKey
ALTER TABLE "ReceiptDuplicateDismissal" ADD CONSTRAINT "ReceiptDuplicateDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
