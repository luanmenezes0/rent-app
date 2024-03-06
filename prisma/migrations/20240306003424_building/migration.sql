-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Delivery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "buildingSiteId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT '2022-12-31 00:00:00 +03:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Delivery_buildingSiteId_fkey" FOREIGN KEY ("buildingSiteId") REFERENCES "BuildingSite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Delivery" ("buildingSiteId", "createdAt", "date", "id", "updatedAt") SELECT "buildingSiteId", "createdAt", "date", "id", "updatedAt" FROM "Delivery";
DROP TABLE "Delivery";
ALTER TABLE "new_Delivery" RENAME TO "Delivery";
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
    CONSTRAINT "DeliveryUnit_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryUnit_buildingSiteId_fkey" FOREIGN KEY ("buildingSiteId") REFERENCES "BuildingSite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "Inventory_buildingSiteId_fkey" FOREIGN KEY ("buildingSiteId") REFERENCES "BuildingSite" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inventory_rentableId_fkey" FOREIGN KEY ("rentableId") REFERENCES "Rentable" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Inventory" ("buildingSiteId", "count", "createdAt", "id", "rentableId", "updatedAt") SELECT "buildingSiteId", "count", "createdAt", "id", "rentableId", "updatedAt" FROM "Inventory";
DROP TABLE "Inventory";
ALTER TABLE "new_Inventory" RENAME TO "Inventory";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
