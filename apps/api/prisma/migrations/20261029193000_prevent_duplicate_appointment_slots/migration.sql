CREATE UNIQUE INDEX "care_sessions_active_appointment_slot_id_key"
ON "care_sessions"("appointment_slot_id")
WHERE "status" NOT IN ('CANCELLED', 'NO_SHOW');
