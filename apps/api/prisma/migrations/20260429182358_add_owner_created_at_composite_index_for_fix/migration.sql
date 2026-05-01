-- CreateIndex
CREATE INDEX "links_created_by_created_at_idx" ON "links"("created_by", "created_at" DESC);
