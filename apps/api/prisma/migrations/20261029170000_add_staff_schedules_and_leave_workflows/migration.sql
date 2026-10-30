-- Add the staff schedule and leave workflow needed by UC05.
CREATE TYPE "StaffType" AS ENUM ('DOCTOR', 'RECEPTIONIST');
CREATE TYPE "StaffWorkScheduleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ABSENT', 'CANCELLED');
CREATE TYPE "LeaveRequestPriority" AS ENUM ('NORMAL', 'URGENT');
CREATE TYPE "ScheduleExceptionStatus" AS ENUM ('PENDING_REASSIGNMENT', 'PROPOSED', 'RESOLVED', 'RESCHEDULE_REQUIRED', 'CANCELLED');
CREATE TYPE "ScheduleExceptionResolution" AS ENUM ('REASSIGNED', 'RESCHEDULED', 'CANCELLED');
CREATE TYPE "ScheduleReassignmentStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'REJECTED', 'CANCELLED');

ALTER TYPE "LeaveRequestType" ADD VALUE 'PLANNED_LEAVE';
ALTER TYPE "LeaveRequestType" ADD VALUE 'URGENT_ABSENCE';
ALTER TYPE "CareSessionStatus" ADD VALUE 'CHECKED_IN';

ALTER TABLE "leave_requests"
  ALTER COLUMN "doctor_id" DROP NOT NULL,
  ADD COLUMN "staff_user_id" UUID,
  ADD COLUMN "priority" "LeaveRequestPriority" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "notice_hours" SMALLINT;

CREATE TABLE "staff_work_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "staff_user_id" UUID NOT NULL,
    "staff_type" "StaffType" NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "day_of_week" SMALLINT NOT NULL DEFAULT 1,
    "effective_from" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" DATE,
    "is_recurring" BOOLEAN NOT NULL DEFAULT true,
    "schedule_type" "ScheduleType" NOT NULL DEFAULT 'REGULAR',
    "slot_duration_minutes" SMALLINT,
    "status" "StaffWorkScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_work_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "leave_request_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leave_request_id" UUID NOT NULL,
    "staff_work_schedule_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_request_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "schedule_exceptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leave_request_id" UUID NOT NULL,
    "care_session_id" UUID NOT NULL,
    "original_doctor_id" UUID NOT NULL,
    "status" "ScheduleExceptionStatus" NOT NULL DEFAULT 'PENDING_REASSIGNMENT',
    "resolution" "ScheduleExceptionResolution",
    "reason" TEXT,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_exceptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "schedule_reassignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exception_id" UUID NOT NULL,
    "from_doctor_id" UUID NOT NULL,
    "to_doctor_id" UUID,
    "from_slot_id" UUID NOT NULL,
    "to_slot_id" UUID,
    "status" "ScheduleReassignmentStatus" NOT NULL DEFAULT 'PROPOSED',
    "notes" TEXT,
    "proposed_by" UUID NOT NULL,
    "confirmed_by" UUID,
    "proposed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_reassignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "leave_request_schedules_leave_request_id_staff_work_schedul_key"
  ON "leave_request_schedules"("leave_request_id", "staff_work_schedule_id");
CREATE UNIQUE INDEX "schedule_exceptions_leave_request_id_care_session_id_key"
  ON "schedule_exceptions"("leave_request_id", "care_session_id");

CREATE INDEX "staff_work_schedules_staff_user_id_starts_at_idx"
  ON "staff_work_schedules"("staff_user_id", "starts_at");
CREATE INDEX "staff_work_schedules_staff_user_id_day_of_week_effective_fr_idx"
  ON "staff_work_schedules"("staff_user_id", "day_of_week", "effective_from");
CREATE INDEX "staff_work_schedules_status_starts_at_idx"
  ON "staff_work_schedules"("status", "starts_at");
CREATE INDEX "staff_work_schedules_created_by_idx"
  ON "staff_work_schedules"("created_by");
CREATE INDEX "leave_request_schedules_staff_work_schedule_id_idx"
  ON "leave_request_schedules"("staff_work_schedule_id");
CREATE INDEX "schedule_exceptions_status_created_at_idx"
  ON "schedule_exceptions"("status", "created_at");
CREATE INDEX "schedule_exceptions_original_doctor_id_idx"
  ON "schedule_exceptions"("original_doctor_id");
CREATE INDEX "schedule_exceptions_resolved_by_idx"
  ON "schedule_exceptions"("resolved_by");
CREATE INDEX "schedule_reassignments_exception_id_status_idx"
  ON "schedule_reassignments"("exception_id", "status");
CREATE INDEX "schedule_reassignments_from_doctor_id_idx"
  ON "schedule_reassignments"("from_doctor_id");
CREATE INDEX "schedule_reassignments_to_doctor_id_idx"
  ON "schedule_reassignments"("to_doctor_id");
CREATE INDEX "schedule_reassignments_from_slot_id_idx"
  ON "schedule_reassignments"("from_slot_id");
CREATE INDEX "schedule_reassignments_to_slot_id_idx"
  ON "schedule_reassignments"("to_slot_id");
ALTER TABLE "staff_work_schedules"
  ADD CONSTRAINT "staff_work_schedules_staff_user_id_fkey"
  FOREIGN KEY ("staff_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_work_schedules"
  ADD CONSTRAINT "staff_work_schedules_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leave_requests"
  ADD CONSTRAINT "leave_requests_staff_user_id_fkey"
  FOREIGN KEY ("staff_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leave_request_schedules"
  ADD CONSTRAINT "leave_request_schedules_leave_request_id_fkey"
  FOREIGN KEY ("leave_request_id") REFERENCES "leave_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leave_request_schedules"
  ADD CONSTRAINT "leave_request_schedules_staff_work_schedule_id_fkey"
  FOREIGN KEY ("staff_work_schedule_id") REFERENCES "staff_work_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_exceptions"
  ADD CONSTRAINT "schedule_exceptions_leave_request_id_fkey"
  FOREIGN KEY ("leave_request_id") REFERENCES "leave_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_exceptions"
  ADD CONSTRAINT "schedule_exceptions_care_session_id_fkey"
  FOREIGN KEY ("care_session_id") REFERENCES "care_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_exceptions"
  ADD CONSTRAINT "schedule_exceptions_original_doctor_id_fkey"
  FOREIGN KEY ("original_doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_exceptions"
  ADD CONSTRAINT "schedule_exceptions_resolved_by_fkey"
  FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_reassignments"
  ADD CONSTRAINT "schedule_reassignments_exception_id_fkey"
  FOREIGN KEY ("exception_id") REFERENCES "schedule_exceptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_reassignments"
  ADD CONSTRAINT "schedule_reassignments_from_doctor_id_fkey"
  FOREIGN KEY ("from_doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_reassignments"
  ADD CONSTRAINT "schedule_reassignments_to_doctor_id_fkey"
  FOREIGN KEY ("to_doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_reassignments"
  ADD CONSTRAINT "schedule_reassignments_from_slot_id_fkey"
  FOREIGN KEY ("from_slot_id") REFERENCES "appointment_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_reassignments"
  ADD CONSTRAINT "schedule_reassignments_to_slot_id_fkey"
  FOREIGN KEY ("to_slot_id") REFERENCES "appointment_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_reassignments"
  ADD CONSTRAINT "schedule_reassignments_proposed_by_fkey"
  FOREIGN KEY ("proposed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_reassignments"
  ADD CONSTRAINT "schedule_reassignments_confirmed_by_fkey"
  FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
