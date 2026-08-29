/*
  Warnings:

  - A unique constraint covering the columns `[token_hash,device_id]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Session_token_hash_device_id_key" ON "Session"("token_hash", "device_id");
