-- CreateTable
CREATE TABLE "LotteryDraw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingEventId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LotteryDraw_bookingEventId_fkey" FOREIGN KEY ("bookingEventId") REFERENCES "BookingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LotteryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "wonPrizeId" TEXT,
    "wonAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LotteryEntry_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "LotteryDraw" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LotteryEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LotteryEntry_wonPrizeId_fkey" FOREIGN KEY ("wonPrizeId") REFERENCES "LotteryPrize" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LotteryPrize" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LotteryPrize_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "LotteryDraw" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LotteryDraw_bookingEventId_key" ON "LotteryDraw"("bookingEventId");

-- CreateIndex
CREATE UNIQUE INDEX "LotteryEntry_bookingId_key" ON "LotteryEntry"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "LotteryEntry_drawId_token_key" ON "LotteryEntry"("drawId", "token");
