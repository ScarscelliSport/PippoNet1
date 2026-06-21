# Gestionale Forniture - Errea & Solo

Mini gestionale per tracciare le forniture (Errea e Solo) alle società sportive: clienti, ordini, riassortimenti, lavorazioni (stampe/ricami) e pagamenti, con dashboard in tempo reale su incassi, consegne e margini.

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma 7 con driver adapter SQLite (`@prisma/adapter-better-sqlite3`)
- Server Actions per tutte le operazioni di scrittura (niente API REST separate)
- Zod per la validazione dei form

## Struttura dati

- **Cliente**: società sportiva con dati di contatto
- **Ordine**: ordine o riassortimento (brand Errea/Solo), con importo, stato consegna e date
- **Lavorazione**: spesa di stampa/ricamo/altro legata a un ordine (costo interno, separato dall'importo fatturato al cliente)
- **Pagamento**: incasso registrato su un ordine; lo stato pagamento (non pagato/parziale/pagato) è calcolato dalla somma dei pagamenti

## Comandi utili

- `npm run db:migrate` - crea/applica migrazioni Prisma
- `npm run db:studio` - apre Prisma Studio per ispezionare il database
- `npm run build` - build di produzione
