-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creditId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SocialLink_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "PhotoCredit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
