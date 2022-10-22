/*
  Warnings:

  - Added the required column `buildingSiteId` to the `DeliveryUnit` table without a default value. This is not possible if the table is not empty.
  - Made the column `registrationNumber` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeliveryUnit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "count" INTEGER NOT NULL,
    "deliveryType" INTEGER NOT NULL,
    "rentableId" INTEGER NOT NULL,
    "deliveryId" INTEGER,
    "buildingSiteId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryUnit_rentableId_fkey" FOREIGN KEY ("rentableId") REFERENCES "Rentable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeliveryUnit_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryUnit_buildingSiteId_fkey" FOREIGN KEY ("buildingSiteId") REFERENCES "BuildingSite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DeliveryUnit" ("count", "createdAt", "deliveryId", "deliveryType", "id", "rentableId", "updatedAt") SELECT "count", "createdAt", "deliveryId", "deliveryType", "id", "rentableId", "updatedAt" FROM "DeliveryUnit";
DROP TABLE "DeliveryUnit";
ALTER TABLE "new_DeliveryUnit" RENAME TO "DeliveryUnit";
CREATE TABLE "new_Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "isLegalEntity" BOOLEAN NOT NULL DEFAULT false,
    "registrationNumber" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("address", "createdAt", "id", "isLegalEntity", "name", "phoneNumber", "registrationNumber", "updatedAt") SELECT "address", "createdAt", "id", "isLegalEntity", "name", "phoneNumber", "registrationNumber", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_registrationNumber_key" ON "Client"("registrationNumber");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
