-- AlterTable
ALTER TABLE "Event" ADD COLUMN "dateEnd" DATETIME;
ALTER TABLE "Event" ADD COLUMN "dateStart" DATETIME;

-- CreateTable
CREATE TABLE "PhotoCredit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "photoId" TEXT NOT NULL,
    "cosplayerCn" TEXT NOT NULL,
    "characterName" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PhotoCredit_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Backfill: copy the legacy single date into dateStart before it's dropped
-- in a later migration.
UPDATE "Event" SET "dateStart" = "date" WHERE "date" IS NOT NULL;

-- Backfill: turn each photo's legacy single credit into one PhotoCredit row
-- before cosplayerCn/characterName are dropped in a later migration. Photos
-- that were never credited (cosplayerCn = '') get no row, same as before.
INSERT INTO "PhotoCredit" ("id", "photoId", "cosplayerCn", "characterName", "sortOrder")
SELECT lower(hex(randomblob(16))), "id", "cosplayerCn", "characterName", 0
FROM "Photo"
WHERE "cosplayerCn" != '';
