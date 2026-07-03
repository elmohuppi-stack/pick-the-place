-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "proposedById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Location_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Location_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Location" ("createdAt", "description", "eventId", "id", "isActive", "name", "proposedById") SELECT "createdAt", "description", "eventId", "id", "isActive", "name", "proposedById" FROM "Location";
DROP TABLE "Location";
ALTER TABLE "new_Location" RENAME TO "Location";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
