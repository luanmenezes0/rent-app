-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'USER';

-- RedefineTables
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "DeliveryUnit_buildingSiteId_fkey" FOREIGN KEY ("buildingSiteId") REFERENCES "BuildingSite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DeliveryUnit" ("buildingSiteId", "count", "createdAt", "date", "deliveryId", "deliveryType", "id", "rentableId", "updatedAt") SELECT "buildingSiteId", "count", "createdAt", "date", "deliveryId", "deliveryType", "id", "rentableId", "updatedAt" FROM "DeliveryUnit";
DROP TABLE "DeliveryUnit";
ALTER TABLE "new_DeliveryUnit" RENAME TO "DeliveryUnit";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
