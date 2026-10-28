CREATE TYPE "AcademicTitle" AS ENUM ('PROFESSOR', 'ASSOCIATE_PROFESSOR');

ALTER TABLE "doctors" ADD COLUMN "academic_title" "AcademicTitle";
