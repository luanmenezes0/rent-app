/*
  Warnings:

  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Note";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Post";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BuildingSite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuildingSite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BuildingSite" ("address", "clientId", "createdAt", "id", "name", "updatedAt") SELECT "address", "clientId", "createdAt", "id", "name", "updatedAt" FROM "BuildingSite";
DROP TABLE "BuildingSite";
ALTER TABLE "new_BuildingSite" RENAME TO "BuildingSite";
CREATE TABLE "new_DeliveryUnit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "count" INTEGER NOT NULL,
    "deliveryType" INTEGER NOT NULL,
    "rentableId" INTEGER NOT NULL,
    "deliveryId" INTEGER,
    "buildingSiteId" INTEGER NOT NULL,
    "date" DATETIME DEFAULT '2022-12-31 00:00:00 +03:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryUnit_rentableId_fkey" FOREIGN KEY ("rentableId") REFERENCES "Rentable" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryUnit_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryUnit_buildingSiteId_fkey" FOREIGN KEY ("buildingSiteId") REFERENCES "BuildingSite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DeliveryUnit" ("buildingSiteId", "count", "createdAt", "date", "deliveryId", "deliveryType", "id", "rentableId", "updatedAt") SELECT "buildingSiteId", "count", "createdAt", "date", "deliveryId", "deliveryType", "id", "rentableId", "updatedAt" FROM "DeliveryUnit";
DROP TABLE "DeliveryUnit";
ALTER TABLE "new_DeliveryUnit" RENAME TO "DeliveryUnit";
CREATE TABLE "new_Inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "count" INTEGER NOT NULL,
    "buildingSiteId" INTEGER NOT NULL,
    "rentableId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventory_buildingSiteId_fkey" FOREIGN KEY ("buildingSiteId") REFERENCES "BuildingSite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inventory_rentableId_fkey" FOREIGN KEY ("rentableId") REFERENCES "Rentable" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Inventory" ("buildingSiteId", "count", "createdAt", "id", "rentableId", "updatedAt") SELECT "buildingSiteId", "count", "createdAt", "id", "rentableId", "updatedAt" FROM "Inventory";
DROP TABLE "Inventory";
ALTER TABLE "new_Inventory" RENAME TO "Inventory";
CREATE TABLE "new_Rentable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Rentable" ("count", "createdAt", "id", "name", "updatedAt") SELECT "count", "createdAt", "id", "name", "updatedAt" FROM "Rentable";
DROP TABLE "Rentable";
ALTER TABLE "new_Rentable" RENAME TO "Rentable";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
