-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('STUDENT', 'TEACHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'STUDENT';
