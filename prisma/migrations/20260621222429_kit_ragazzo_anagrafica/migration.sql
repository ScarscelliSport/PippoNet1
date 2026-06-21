/*
  Warnings:

  - You are about to drop the column `ordineId` on the `Kit` table. All the data in the column will be lost.
  - You are about to drop the column `cellulare` on the `KitAtleta` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `KitAtleta` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `KitAtleta` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `KitAtleta` table. All the data in the column will be lost.
  - Added the required column `ragazzoId` to the `KitAtleta` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Ragazzo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "cellulare" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ragazzo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Kit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'SCELTA_PRODOTTI',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kit_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Kit" ("brand", "clienteId", "createdAt", "id", "nome", "note", "stato", "updatedAt") SELECT "brand", "clienteId", "createdAt", "id", "nome", "note", "stato", "updatedAt" FROM "Kit";
DROP TABLE "Kit";
ALTER TABLE "new_Kit" RENAME TO "Kit";
CREATE TABLE "new_KitAtleta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kitId" TEXT NOT NULL,
    "ragazzoId" TEXT NOT NULL,
    "ordineId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KitAtleta_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KitAtleta_ragazzoId_fkey" FOREIGN KEY ("ragazzoId") REFERENCES "Ragazzo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KitAtleta_ordineId_fkey" FOREIGN KEY ("ordineId") REFERENCES "Ordine" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_KitAtleta" ("createdAt", "id", "kitId") SELECT "createdAt", "id", "kitId" FROM "KitAtleta";
DROP TABLE "KitAtleta";
ALTER TABLE "new_KitAtleta" RENAME TO "KitAtleta";
CREATE UNIQUE INDEX "KitAtleta_ordineId_key" ON "KitAtleta"("ordineId");
CREATE TABLE "new_Ordine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT,
    "clienteId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'ORDINE',
    "descrizione" TEXT,
    "importoTotale" REAL NOT NULL,
    "dataOrdine" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataConsegnaPrevista" DATETIME,
    "dataConsegnaEffettiva" DATETIME,
    "statoConsegna" TEXT NOT NULL DEFAULT 'DA_ORDINARE',
    "ragazzoId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ordine_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ordine_ragazzoId_fkey" FOREIGN KEY ("ragazzoId") REFERENCES "Ragazzo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ordine" ("brand", "clienteId", "createdAt", "dataConsegnaEffettiva", "dataConsegnaPrevista", "dataOrdine", "descrizione", "id", "importoTotale", "note", "numero", "statoConsegna", "tipo", "updatedAt") SELECT "brand", "clienteId", "createdAt", "dataConsegnaEffettiva", "dataConsegnaPrevista", "dataOrdine", "descrizione", "id", "importoTotale", "note", "numero", "statoConsegna", "tipo", "updatedAt" FROM "Ordine";
DROP TABLE "Ordine";
ALTER TABLE "new_Ordine" RENAME TO "Ordine";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
