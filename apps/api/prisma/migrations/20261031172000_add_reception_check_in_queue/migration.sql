ALTER TABLE "care_sessions"
ADD COLUMN "checked_in_by" UUID;

ALTER TABLE "care_sessions"
ADD CONSTRAINT "care_sessions_checked_in_by_fkey"
FOREIGN KEY ("checked_in_by") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "care_sessions_checked_in_by_idx"
ON "care_sessions"("checked_in_by");

CREATE UNIQUE INDEX "care_sessions_specialty_queue_date_number_key"
ON "care_sessions"("specialty_id", "queue_date", "queue_number")
WHERE "queue_number" IS NOT NULL;
