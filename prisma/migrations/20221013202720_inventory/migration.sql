/*
  Warnings:

  - Added the required column `count` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Made the column `deliveryType` on table `Delivery` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "Inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "buildingSiteId" INTEGER NOT NULL,
    "rentableId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventory_buildingSiteId_fkey" FOREIGN KEY ("buildingSiteId") REFERENCES "BuildingSite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inventory_rentableId_fkey" FOREIGN KEY ("rentableId") REFERENCES "Rentable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rentable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Rentable" ("count", "createdAt", "id", "name", "updatedAt") SELECT coalesce("count", 0) AS "count", "createdAt", "id", "name", "updatedAt" FROM "Rentable";
DROP TABLE "Rentable";
ALTER TABLE "new_Rentable" RENAME TO "Rentable";
CREATE TABLE "new_Delivery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "buildingSiteId" INTEGER NOT NULL,
    "rentableId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    "deliveryType" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Delivery_buildingSiteId_fkey" FOREIGN KEY ("buildingSiteId") REFERENCES "BuildingSite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Delivery_rentableId_fkey" FOREIGN KEY ("rentableId") REFERENCES "Rentable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Delivery" ("buildingSiteId", "createdAt", "deliveryType", "id", "rentableId", "updatedAt") SELECT "buildingSiteId", "createdAt", "deliveryType", "id", "rentableId", "updatedAt" FROM "Delivery";
DROP TABLE "Delivery";
ALTER TABLE "new_Delivery" RENAME TO "Delivery";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
