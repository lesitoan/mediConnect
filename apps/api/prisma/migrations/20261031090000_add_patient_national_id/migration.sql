ALTER TABLE "patients"
  ADD COLUMN "national_id" VARCHAR(12),
  ADD CONSTRAINT "patients_national_id_format_check"
    CHECK ("national_id" IS NULL OR "national_id" ~ '^[0-9]{12}$');

CREATE UNIQUE INDEX "patients_national_id_key" ON "patients"("national_id");
