-- CreateTable
CREATE TABLE "Kit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'SCELTA_PRODOTTI',
    "note" TEXT,
    "ordineId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kit_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Kit_ordineId_fkey" FOREIGN KEY ("ordineId") REFERENCES "Ordine" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KitProdotto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kitId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "prezzoUnitario" REAL NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KitProdotto_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KitAtleta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kitId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "cellulare" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KitAtleta_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KitTaglia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kitAtletaId" TEXT NOT NULL,
    "kitProdottoId" TEXT NOT NULL,
    "taglia" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KitTaglia_kitAtletaId_fkey" FOREIGN KEY ("kitAtletaId") REFERENCES "KitAtleta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KitTaglia_kitProdottoId_fkey" FOREIGN KEY ("kitProdottoId") REFERENCES "KitProdotto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Kit_ordineId_key" ON "Kit"("ordineId");

-- CreateIndex
CREATE UNIQUE INDEX "KitTaglia_kitAtletaId_kitProdottoId_key" ON "KitTaglia"("kitAtletaId", "kitProdottoId");
