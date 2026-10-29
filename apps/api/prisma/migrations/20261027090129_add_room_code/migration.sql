/*
  Warnings:

  - The values [OVERTIME] on the enum `LeaveRequestType` will be removed. If these variants are still used in the database, this will fail.
  - The values [OVERTIME] on the enum `ScheduleType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[license_number]` on the table `doctors` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `license_number` to the `doctors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `room_code` to the `specialties` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LeaveRequestType_new" AS ENUM ('ABSENT');
ALTER TABLE "leave_requests" ALTER COLUMN "request_type" DROP DEFAULT;
ALTER TABLE "leave_requests" ALTER COLUMN "request_type" TYPE "LeaveRequestType_new" USING ("request_type"::text::"LeaveRequestType_new");
ALTER TYPE "LeaveRequestType" RENAME TO "LeaveRequestType_old";
ALTER TYPE "LeaveRequestType_new" RENAME TO "LeaveRequestType";
DROP TYPE "LeaveRequestType_old";
ALTER TABLE "leave_requests" ALTER COLUMN "request_type" SET DEFAULT 'ABSENT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ScheduleType_new" AS ENUM ('REGULAR', 'SHIFT');
ALTER TABLE "doctor_schedules" ALTER COLUMN "schedule_type" TYPE "ScheduleType_new" USING ("schedule_type"::text::"ScheduleType_new");
ALTER TYPE "ScheduleType" RENAME TO "ScheduleType_old";
ALTER TYPE "ScheduleType_new" RENAME TO "ScheduleType";
DROP TYPE "ScheduleType_old";
COMMIT;

-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "license_number" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "leave_requests" ALTER COLUMN "request_type" SET DEFAULT 'ABSENT';

-- AlterTable
ALTER TABLE "specialties" ADD COLUMN     "room_code" VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "doctors_license_number_key" ON "doctors"("license_number");
