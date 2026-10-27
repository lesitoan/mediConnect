-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'ANONYMOUS', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditLogResult" AS ENUM ('SUCCESS', 'FAILED', 'COMPLETED');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_type" "AuditActorType" NOT NULL,
    "actor_user_id" UUID,
    "actor_display_name" VARCHAR(255),
    "actor_role" "UserRole",
    "action_code" VARCHAR(100) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" VARCHAR(100),
    "result" "AuditLogResult" NOT NULL,
    "reason" TEXT,
    "before_snapshot" JSONB,
    "after_snapshot" JSONB,
    "source" VARCHAR(50),
    "ip_address" INET,
    "user_agent" VARCHAR(1000),
    "request_id" VARCHAR(100),
    "idempotency_key" VARCHAR(100) NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_idempotency_key_key" ON "audit_logs"("idempotency_key");

-- CreateIndex
CREATE INDEX "audit_logs_occurred_at_id_idx" ON "audit_logs"("occurred_at", "id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_occurred_at_idx" ON "audit_logs"("actor_user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_occurred_at_idx" ON "audit_logs"("target_type", "target_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_code_occurred_at_idx" ON "audit_logs"("action_code", "occurred_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_identity_check" CHECK (
    ("actor_type" = 'USER' AND "actor_user_id" IS NOT NULL)
    OR ("actor_type" IN ('ANONYMOUS', 'SYSTEM') AND "actor_user_id" IS NULL)
);

-- Audit history remains append-only even when a caller has UPDATE/DELETE privileges.
CREATE FUNCTION "reject_audit_log_mutation"() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable' USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "audit_logs_reject_update_delete"
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION "reject_audit_log_mutation"();

CREATE TRIGGER "audit_logs_reject_truncate"
BEFORE TRUNCATE ON "audit_logs"
FOR EACH STATEMENT EXECUTE FUNCTION "reject_audit_log_mutation"();
