import { prisma } from "@/lib/prisma";

export async function searchAll(q: string, limit = 5) {
  const query = q.trim();
  if (query.length < 2) {
    return { clienti: [], ordini: [], lavorazioni: [], documenti: [] };
  }

  const [clienti, ordini, lavorazioni, documenti] = await Promise.all([
    prisma.cliente.findMany({
      where: {
        OR: [
          { nome: { contains: query } },
          { referente: { contains: query } },
          { telefono: { contains: query } },
          { email: { contains: query } },
          { piva: { contains: query } },
          { indirizzo: { contains: query } },
          { note: { contains: query } },
        ],
      },
      orderBy: { nome: "asc" },
      take: limit,
    }),
    prisma.ordine.findMany({
      where: {
        OR: [
          { numero: { contains: query } },
          { descrizione: { contains: query } },
          { note: { contains: query } },
          { cliente: { nome: { contains: query } } },
        ],
      },
      include: { cliente: true },
      orderBy: { dataOrdine: "desc" },
      take: limit,
    }),
    prisma.lavorazione.findMany({
      where: {
        OR: [{ descrizione: { contains: query } }, { fornitore: { contains: query } }],
      },
      include: { ordine: { include: { cliente: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.documento.findMany({
      where: { nome: { contains: query } },
      include: { cliente: true, ordine: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  return { clienti, ordini, lavorazioni, documenti };
}

export type SearchResults = Awaited<ReturnType<typeof searchAll>>;
