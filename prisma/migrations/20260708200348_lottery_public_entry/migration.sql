/*
  Warnings:

  - Added the required column `token` to the `LotteryDraw` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `LotteryEntry` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LotteryDraw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingEventId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "open" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LotteryDraw_bookingEventId_fkey" FOREIGN KEY ("bookingEventId") REFERENCES "BookingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LotteryDraw" ("bookingEventId", "createdAt", "id", "updatedAt") SELECT "bookingEventId", "createdAt", "id", "updatedAt" FROM "LotteryDraw";
DROP TABLE "LotteryDraw";
ALTER TABLE "new_LotteryDraw" RENAME TO "LotteryDraw";
CREATE UNIQUE INDEX "LotteryDraw_bookingEventId_key" ON "LotteryDraw"("bookingEventId");
CREATE UNIQUE INDEX "LotteryDraw_token_key" ON "LotteryDraw"("token");
CREATE TABLE "new_LotteryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawId" TEXT NOT NULL,
    "bookingId" TEXT,
    "name" TEXT NOT NULL,
    "characterName" TEXT NOT NULL DEFAULT '',
    "contactMethod" TEXT NOT NULL DEFAULT '',
    "contactValue" TEXT NOT NULL DEFAULT '',
    "token" TEXT NOT NULL,
    "wonPrizeId" TEXT,
    "wonAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LotteryEntry_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "LotteryDraw" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LotteryEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LotteryEntry_wonPrizeId_fkey" FOREIGN KEY ("wonPrizeId") REFERENCES "LotteryPrize" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LotteryEntry" ("bookingId", "createdAt", "drawId", "id", "token", "wonAt", "wonPrizeId") SELECT "bookingId", "createdAt", "drawId", "id", "token", "wonAt", "wonPrizeId" FROM "LotteryEntry";
DROP TABLE "LotteryEntry";
ALTER TABLE "new_LotteryEntry" RENAME TO "LotteryEntry";
CREATE UNIQUE INDEX "LotteryEntry_bookingId_key" ON "LotteryEntry"("bookingId");
CREATE UNIQUE INDEX "LotteryEntry_drawId_token_key" ON "LotteryEntry"("drawId", "token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
