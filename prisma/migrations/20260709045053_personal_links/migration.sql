-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "QuickLink";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PersonalLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "labelEn" TEXT NOT NULL,
    "labelZh" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

