/*
  Warnings:

  - The `year` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "student_year" AS ENUM ('SEC_1', 'SEC_2', 'SEC_3');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "year",
ADD COLUMN     "year" "student_year" NOT NULL DEFAULT 'SEC_1';
