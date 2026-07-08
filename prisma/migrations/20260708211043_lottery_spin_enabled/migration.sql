-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LotteryDraw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingEventId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "open" BOOLEAN NOT NULL DEFAULT true,
    "spinEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LotteryDraw_bookingEventId_fkey" FOREIGN KEY ("bookingEventId") REFERENCES "BookingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LotteryDraw" ("bookingEventId", "createdAt", "id", "open", "token", "updatedAt") SELECT "bookingEventId", "createdAt", "id", "open", "token", "updatedAt" FROM "LotteryDraw";
DROP TABLE "LotteryDraw";
ALTER TABLE "new_LotteryDraw" RENAME TO "LotteryDraw";
CREATE UNIQUE INDEX "LotteryDraw_bookingEventId_key" ON "LotteryDraw"("bookingEventId");
CREATE UNIQUE INDEX "LotteryDraw_token_key" ON "LotteryDraw"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
