-- CreateTable
CREATE TABLE "Cosplayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cosplayerCn" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Cosplayer_cosplayerCn_key" ON "Cosplayer"("cosplayerCn");

-- CreateTable
CREATE TABLE "CosplayerSocialLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cosplayerId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CosplayerSocialLink_cosplayerId_fkey" FOREIGN KEY ("cosplayerId") REFERENCES "Cosplayer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Backfill: one Cosplayer row per distinct cosplayerCn already used on a
-- photo credit, so existing cosplayers are immediately available for
-- autofill without waiting for their next photo to be edited.
INSERT INTO "Cosplayer" ("id", "cosplayerCn", "createdAt", "updatedAt")
SELECT lower(hex(randomblob(16))), "cosplayerCn", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "cosplayerCn" FROM "PhotoCredit" WHERE "cosplayerCn" != '');

-- Backfill social links: copy from each cosplayer's most-recently-created
-- PhotoCredit row ("latest entry wins", matching the app's own
-- upsert-on-save behavior going forward). PhotoCredit itself has no
-- createdAt, so recency is taken from the parent Photo's createdAt.
INSERT INTO "CosplayerSocialLink" ("id", "cosplayerId", "platform", "url", "sortOrder")
SELECT lower(hex(randomblob(16))), co."id", sl."platform", sl."url", sl."sortOrder"
FROM "SocialLink" sl
JOIN "PhotoCredit" pc ON pc."id" = sl."creditId"
JOIN "Cosplayer" co ON co."cosplayerCn" = pc."cosplayerCn"
WHERE pc."id" = (
    SELECT pc2."id" FROM "PhotoCredit" pc2
    JOIN "Photo" ph2 ON ph2."id" = pc2."photoId"
    WHERE pc2."cosplayerCn" = pc."cosplayerCn"
    ORDER BY ph2."createdAt" DESC, pc2."id" DESC
    LIMIT 1
);
