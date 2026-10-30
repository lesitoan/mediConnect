CREATE TYPE "LeaveRequestSource" AS ENUM ('DOCTOR_REQUEST', 'ADMIN_PAUSE');

ALTER TABLE "leave_requests"
  ALTER COLUMN "ends_at" DROP NOT NULL,
  ADD COLUMN "source" "LeaveRequestSource" NOT NULL DEFAULT 'DOCTOR_REQUEST';

ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_valid_range"
  CHECK (("ends_at" IS NULL OR "ends_at" > "starts_at") AND ("source" = 'ADMIN_PAUSE' OR "ends_at" IS NOT NULL)) NOT VALID;
