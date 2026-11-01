ALTER TABLE "care_sessions"
ADD COLUMN "skip_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "called_at" TIMESTAMPTZ(6),
ADD COLUMN "skipped_at" TIMESTAMPTZ(6);

CREATE INDEX "care_sessions_queue_date_status_specialty_id_idx"
ON "care_sessions"("queue_date", "status", "specialty_id");

CREATE INDEX "care_sessions_queue_date_status_skipped_at_idx"
ON "care_sessions"("queue_date", "status", "skipped_at");
