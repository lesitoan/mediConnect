ALTER TABLE "audit_logs"
ADD COLUMN "session_id" UUID,
ADD COLUMN "method" VARCHAR(10),
ADD COLUMN "path" VARCHAR(500);
