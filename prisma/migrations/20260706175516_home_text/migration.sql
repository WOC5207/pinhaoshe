-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'site',
    "siteTitleEn" TEXT NOT NULL DEFAULT '',
    "siteTitleZh" TEXT NOT NULL DEFAULT '',
    "homeTitleEn" TEXT NOT NULL DEFAULT '',
    "homeTitleZh" TEXT NOT NULL DEFAULT '',
    "homeSubtitleEn" TEXT NOT NULL DEFAULT '',
    "homeSubtitleZh" TEXT NOT NULL DEFAULT '',
    "backgroundColor" TEXT NOT NULL DEFAULT '',
    "backgroundImage" TEXT NOT NULL DEFAULT '',
    "logo" TEXT NOT NULL DEFAULT '',
    "coverStreamPhotoIds" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("backgroundColor", "backgroundImage", "coverStreamPhotoIds", "id", "logo", "siteTitleEn", "siteTitleZh", "updatedAt") SELECT "backgroundColor", "backgroundImage", "coverStreamPhotoIds", "id", "logo", "siteTitleEn", "siteTitleZh", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
