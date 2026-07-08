-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BookingEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "descriptionZh" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL,
    "open" BOOLEAN NOT NULL DEFAULT true,
    "lotteryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_BookingEvent" ("createdAt", "date", "descriptionEn", "descriptionZh", "id", "location", "open", "titleEn", "titleZh", "token", "updatedAt") SELECT "createdAt", "date", "descriptionEn", "descriptionZh", "id", "location", "open", "titleEn", "titleZh", "token", "updatedAt" FROM "BookingEvent";
DROP TABLE "BookingEvent";
ALTER TABLE "new_BookingEvent" RENAME TO "BookingEvent";
CREATE UNIQUE INDEX "BookingEvent_token_key" ON "BookingEvent"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
