/*
  Warnings:

  - Added the required column `device_id` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "device_id" TEXT NOT NULL;
