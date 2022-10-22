-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "isLegalEntity" BOOLEAN NOT NULL DEFAULT false,
    "registrationNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("address", "createdAt", "id", "isLegalEntity", "name", "phoneNumber", "registrationNumber", "updatedAt") SELECT "address", "createdAt", "id", "isLegalEntity", "name", "phoneNumber", "registrationNumber", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_registrationNumber_key" ON "Client"("registrationNumber");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
