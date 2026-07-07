-- AlterTable
ALTER TABLE "Photo" ADD COLUMN "exifAperture" REAL;
ALTER TABLE "Photo" ADD COLUMN "exifExposureTime" REAL;
ALTER TABLE "Photo" ADD COLUMN "exifFocalLengthMm" REAL;
ALTER TABLE "Photo" ADD COLUMN "exifIso" INTEGER;
ALTER TABLE "Photo" ADD COLUMN "exifTakenAt" DATETIME;
