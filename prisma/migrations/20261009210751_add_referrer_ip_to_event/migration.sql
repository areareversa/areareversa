-- AlterTable
ALTER TABLE "events" ADD COLUMN     "ip" TEXT,
ADD COLUMN     "referrer" TEXT;

-- CreateIndex
CREATE INDEX "events_ip_idx" ON "events"("ip");
