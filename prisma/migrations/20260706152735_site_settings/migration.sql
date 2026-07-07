-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'site',
    "siteTitleEn" TEXT NOT NULL DEFAULT '',
    "siteTitleZh" TEXT NOT NULL DEFAULT '',
    "backgroundColor" TEXT NOT NULL DEFAULT '',
    "backgroundImage" TEXT NOT NULL DEFAULT '',
    "coverStreamPhotoIds" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL
);
