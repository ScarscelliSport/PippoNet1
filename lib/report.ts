import { prisma } from "@/lib/prisma";
import { statoPagamentoOrdine } from "@/lib/labels";
import { Brand, KitStato } from "@/app/generated/prisma/client";

export type ReportRow = {
  kitId: string;
  clienteId: string;
  clienteNome: string;
  kitNome: string;
  brand: Brand;
  stato: KitStato;
  iscritti: number;
  numeroOrdini: number;
  totaleOrdinato: number;
  totalePagato: number;
  residuo: number;
  lavorazioni: {
    totale: number;
    daFare: number;
    inCorso: number;
    completate: number;
    costoTotale: number;
  };
  ordiniStatoPagamento: { pagato: number; parziale: number; nonPagato: number };
};

export async function buildFornitureReport(): Promise<ReportRow[]> {
  const kits = await prisma.kit.findMany({
    include: {
      cliente: true,
      atleti: {
        include: {
          ordine: { include: { pagamenti: true, lavorazioni: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return kits.map((kit) => {
    const ordini = kit.atleti
      .map((a) => a.ordine)
      .filter((o): o is NonNullable<typeof o> => Boolean(o));

    const totaleOrdinato = ordini.reduce((s, o) => s + o.importoTotale, 0);
    const totalePagato = ordini.reduce(
      (s, o) => s + o.pagamenti.reduce((s2, p) => s2 + p.importo, 0),
      0
    );

    let pagato = 0;
    let parziale = 0;
    let nonPagato = 0;
    for (const o of ordini) {
      const p = o.pagamenti.reduce((s, x) => s + x.importo, 0);
      const stato = statoPagamentoOrdine(o.importoTotale, p);
      if (stato === "PAGATO") pagato++;
      else if (stato === "PARZIALE") parziale++;
      else nonPagato++;
    }

    const lavorazioniFlat = ordini.flatMap((o) => o.lavorazioni);

    return {
      kitId: kit.id,
      clienteId: kit.clienteId,
      clienteNome: kit.cliente.nome,
      kitNome: kit.nome,
      brand: kit.brand,
      stato: kit.stato,
      iscritti: kit.atleti.length,
      numeroOrdini: ordini.length,
      totaleOrdinato,
      totalePagato,
      residuo: Math.max(totaleOrdinato - totalePagato, 0),
      lavorazioni: {
        totale: lavorazioniFlat.length,
        daFare: lavorazioniFlat.filter((l) => l.stato === "DA_FARE").length,
        inCorso: lavorazioniFlat.filter((l) => l.stato === "IN_CORSO").length,
        completate: lavorazioniFlat.filter((l) => l.stato === "COMPLETATA").length,
        costoTotale: lavorazioniFlat.reduce((s, l) => s + l.costo, 0),
      },
      ordiniStatoPagamento: { pagato, parziale, nonPagato },
    };
  });
}
