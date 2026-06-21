-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "referente" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "indirizzo" TEXT,
    "piva" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Ordine" (
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
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ordine_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lavorazione" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ordineId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descrizione" TEXT,
    "fornitore" TEXT,
    "costo" REAL NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'DA_FARE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lavorazione_ordineId_fkey" FOREIGN KEY ("ordineId") REFERENCES "Ordine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ordineId" TEXT NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importo" REAL NOT NULL,
    "metodo" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pagamento_ordineId_fkey" FOREIGN KEY ("ordineId") REFERENCES "Ordine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
