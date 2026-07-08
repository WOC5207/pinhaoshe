-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LotteryPrize" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LotteryPrize_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "LotteryDraw" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LotteryPrize" ("createdAt", "drawId", "id", "name", "quantity", "sortOrder") SELECT "createdAt", "drawId", "id", "name", "quantity", "sortOrder" FROM "LotteryPrize";
DROP TABLE "LotteryPrize";
ALTER TABLE "new_LotteryPrize" RENAME TO "LotteryPrize";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
