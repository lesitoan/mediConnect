ALTER TABLE "specialties"
  ADD COLUMN "consultation_fee" DECIMAL(14, 2),
  ADD CONSTRAINT "specialties_consultation_fee_positive_whole_check"
    CHECK (
      "consultation_fee" IS NULL
      OR (
        "consultation_fee" > 0
        AND "consultation_fee" = TRUNC("consultation_fee")
      )
    );

ALTER TABLE "invoices"
  ADD COLUMN "consultation_id" UUID,
  ADD COLUMN "payment_bank_code" VARCHAR(30),
  ADD COLUMN "payment_account_number" VARCHAR(60),
  ADD COLUMN "payment_account_name" VARCHAR(160),
  ADD CONSTRAINT "invoices_payment_account_snapshot_complete_check"
    CHECK (
      (
        "payment_bank_code" IS NULL
        AND "payment_account_number" IS NULL
        AND "payment_account_name" IS NULL
      )
      OR (
        NULLIF(BTRIM("payment_bank_code"), '') IS NOT NULL
        AND NULLIF(BTRIM("payment_account_number"), '') IS NOT NULL
        AND NULLIF(BTRIM("payment_account_name"), '') IS NOT NULL
      )
    );

CREATE UNIQUE INDEX "invoices_consultation_id_key"
  ON "invoices"("consultation_id");

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_consultation_id_fkey"
    FOREIGN KEY ("consultation_id")
    REFERENCES "consultations"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
