ALTER TABLE "leave_requests"
  ADD CONSTRAINT "leave_requests_reason_not_blank"
  CHECK (regexp_replace("reason", '\\s', '', 'g') <> '') NOT VALID;

ALTER TABLE "leave_requests"
  ADD CONSTRAINT "leave_requests_rejection_reason_not_blank"
  CHECK (
    "rejection_reason" IS NULL
    OR regexp_replace("rejection_reason", '\\s', '', 'g') <> ''
  ) NOT VALID;

ALTER TABLE "staff_work_schedules"
  ADD CONSTRAINT "staff_work_schedules_default_window_check"
  CHECK (
    ("starts_at" AT TIME ZONE 'Asia/Ho_Chi_Minh')::date =
      ("ends_at" AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
    AND (
      (
        ("starts_at" AT TIME ZONE 'Asia/Ho_Chi_Minh')::time = TIME '08:00'
        AND ("ends_at" AT TIME ZONE 'Asia/Ho_Chi_Minh')::time = TIME '12:00'
      )
      OR
      (
        ("starts_at" AT TIME ZONE 'Asia/Ho_Chi_Minh')::time = TIME '13:00'
        AND ("ends_at" AT TIME ZONE 'Asia/Ho_Chi_Minh')::time = TIME '18:00'
      )
    )
  ) NOT VALID;

ALTER TABLE "staff_work_schedules"
  ADD CONSTRAINT "staff_work_schedules_staff_slot_duration_check"
  CHECK (
    ("staff_type" = 'DOCTOR' AND "slot_duration_minutes" = 30)
    OR
    ("staff_type" = 'RECEPTIONIST' AND "slot_duration_minutes" IS NULL)
  ) NOT VALID;
