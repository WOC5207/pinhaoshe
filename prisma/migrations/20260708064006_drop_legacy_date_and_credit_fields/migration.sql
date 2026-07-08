/*
  Warnings:

  - You are about to drop the column `date` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `characterName` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `cosplayerCn` on the `Photo` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "descriptionZh" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "dateStart" DATETIME,
    "dateEnd" DATETIME,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "coverPhotoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "Photo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("coverPhotoId", "createdAt", "dateEnd", "dateStart", "descriptionEn", "descriptionZh", "id", "location", "published", "slug", "titleEn", "titleZh", "updatedAt") SELECT "coverPhotoId", "createdAt", "dateEnd", "dateStart", "descriptionEn", "descriptionZh", "id", "location", "published", "slug", "titleEn", "titleZh", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE UNIQUE INDEX "Event_coverPhotoId_key" ON "Event"("coverPhotoId");
CREATE TABLE "new_Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "exifFocalLengthMm" REAL,
    "exifAperture" REAL,
    "exifExposureTime" REAL,
    "exifIso" INTEGER,
    "exifTakenAt" DATETIME,
    "exifCameraModel" TEXT,
    "exifLensModel" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Photo" ("createdAt", "eventId", "exifAperture", "exifCameraModel", "exifExposureTime", "exifFocalLengthMm", "exifIso", "exifLensModel", "exifTakenAt", "filename", "height", "id", "originalName", "sortOrder", "width") SELECT "createdAt", "eventId", "exifAperture", "exifCameraModel", "exifExposureTime", "exifFocalLengthMm", "exifIso", "exifLensModel", "exifTakenAt", "filename", "height", "id", "originalName", "sortOrder", "width" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
