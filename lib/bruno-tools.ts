import { prisma } from "@/lib/prisma";
import { searchAll, searchKit } from "@/lib/search";
import {
  BRAND_LABELS,
  KIT_STATO_LABELS,
  STATO_CONSEGNA_LABELS,
  STATO_LAVORAZIONE_LABELS,
  TIPO_DOCUMENTO_LABELS,
  formatEuro,
  formatData,
  statoPagamentoOrdine,
  STATO_PAGAMENTO_LABELS,
} from "@/lib/labels";
import type { Brand } from "@/app/generated/prisma/client";

export const brunoToolDefinitions = [
  {
    name: "cerca_nel_programma",
    description:
      "Cerca clienti, ordini, lavorazioni, documenti e ragazzi (atleti) nel gestionale in base a una parola chiave (nome cliente, numero ordine, descrizione, fornitore, nome ragazzo, ecc.). Usa questo strumento quando l'utente chiede di trovare qualcosa ma non conosci già l'id esatto. Se l'utente cerca un ragazzo, usa l'id restituito qui con dettagli_ragazzo per recuperare tutti i suoi ordini e il relativo stato.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Parola chiave da cercare" },
      },
      required: ["query"],
    },
  },
  {
    name: "cerca_kit",
    description:
      "Cerca tra i Kit: i campionari di prodotti scelti dalle società sportive per fascia età, con i ragazzi, le taglie assegnate e lo stato di avanzamento (scelta prodotti, prove, ordinato, in lavorazione, da contattare, contattato, chiuso). È una ricerca separata da cerca_nel_programma: usa questo strumento solo quando l'utente chiede esplicitamente di un Kit, di un campionario, di taglie o di un ragazzo legato a un Kit. Se l'utente parla di Kit in modo generico senza indicare un nome, chiedi prima quale kit, ragazzo o società sportiva cercare invece di chiamare lo strumento.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Nome del kit, della società sportiva o del ragazzo da cercare",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "dettagli_cliente",
    description:
      "Recupera i dati completi di un cliente (referente, contatti, indirizzo) e l'elenco dei suoi ordini, dato il suo id.",
    input_schema: {
      type: "object" as const,
      properties: {
        clienteId: { type: "string", description: "Id del cliente" },
      },
      required: ["clienteId"],
    },
  },
  {
    name: "dettagli_ordine",
    description:
      "Recupera i dati completi di un ordine (importo, stato consegna, lavorazioni collegate, pagamenti ricevuti), dato il suo id.",
    input_schema: {
      type: "object" as const,
      properties: {
        ordineId: { type: "string", description: "Id dell'ordine" },
      },
      required: ["ordineId"],
    },
  },
  {
    name: "dettagli_ragazzo",
    description:
      "Recupera l'anagrafica completa di un ragazzo/atleta (società sportiva, contatti) e tutti i suoi kit e ordini personali con relativo stato di pagamento e consegna, dato il suo id. Usa questo strumento quando l'utente chiede informazioni su un ragazzo, cosa ha ordinato o a che punto è il suo ordine.",
    input_schema: {
      type: "object" as const,
      properties: {
        ragazzoId: { type: "string", description: "Id del ragazzo" },
      },
      required: ["ragazzoId"],
    },
  },
  {
    name: "statistiche_generali",
    description:
      "Restituisce le statistiche generali del gestionale: totale da incassare, incassato questo mese, numero di ordini aperti, consegne in ritardo, fatturato per brand (Errea/Solo). Usa questo strumento per domande generali su andamento, incassi, fatturato o ritardi.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

export async function eseguiBrunoTool(name: string, input: Record<string, unknown>) {
  switch (name) {
    case "cerca_nel_programma": {
      const query = String(input.query ?? "");
      const results = await searchAll(query, 8);
      return {
        clienti: results.clienti.map((c) => ({ id: c.id, nome: c.nome, referente: c.referente })),
        ordini: results.ordini.map((o) => ({
          id: o.id,
          numero: o.numero,
          cliente: o.cliente.nome,
          importoTotale: formatEuro(o.importoTotale),
        })),
        lavorazioni: results.lavorazioni.map((l) => ({
          id: l.id,
          descrizione: l.descrizione,
          ordineId: l.ordineId,
          cliente: l.ordine.cliente.nome,
        })),
        documenti: results.documenti.map((d) => ({
          id: d.id,
          nome: d.nome,
          tipo: TIPO_DOCUMENTO_LABELS[d.tipo],
        })),
        ragazzi: results.ragazzi.map((r) => ({
          id: r.id,
          nome: r.nome,
          cliente: r.cliente.nome,
        })),
      };
    }

    case "cerca_kit": {
      const query = String(input.query ?? "");
      const kit = await searchKit(query, 8);
      return {
        kit: kit.map((k) => ({
          id: k.id,
          nome: k.nome,
          cliente: k.cliente.nome,
          brand: BRAND_LABELS[k.brand],
          stato: KIT_STATO_LABELS[k.stato],
          numeroRagazzi: k.atleti.length,
        })),
      };
    }

    case "dettagli_cliente": {
      const clienteId = String(input.clienteId ?? "");
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        include: { ordini: { include: { pagamenti: true } } },
      });
      if (!cliente) return { errore: "Cliente non trovato" };
      return {
        nome: cliente.nome,
        referente: cliente.referente,
        telefono: cliente.telefono,
        email: cliente.email,
        indirizzo: cliente.indirizzo,
        piva: cliente.piva,
        note: cliente.note,
        ordini: cliente.ordini.map((o) => {
          const pagato = o.pagamenti.reduce((s, p) => s + p.importo, 0);
          return {
            id: o.id,
            numero: o.numero,
            brand: BRAND_LABELS[o.brand],
            importoTotale: formatEuro(o.importoTotale),
            stato: STATO_PAGAMENTO_LABELS[statoPagamentoOrdine(o.importoTotale, pagato)],
            statoConsegna: STATO_CONSEGNA_LABELS[o.statoConsegna],
            dataOrdine: formatData(o.dataOrdine),
          };
        }),
      };
    }

    case "dettagli_ordine": {
      const ordineId = String(input.ordineId ?? "");
      const ordine = await prisma.ordine.findUnique({
        where: { id: ordineId },
        include: { cliente: true, lavorazioni: true, pagamenti: true },
      });
      if (!ordine) return { errore: "Ordine non trovato" };
      const pagato = ordine.pagamenti.reduce((s, p) => s + p.importo, 0);
      return {
        numero: ordine.numero,
        cliente: ordine.cliente.nome,
        brand: BRAND_LABELS[ordine.brand],
        descrizione: ordine.descrizione,
        importoTotale: formatEuro(ordine.importoTotale),
        residuo: formatEuro(Math.max(ordine.importoTotale - pagato, 0)),
        statoConsegna: STATO_CONSEGNA_LABELS[ordine.statoConsegna],
        dataOrdine: formatData(ordine.dataOrdine),
        dataConsegnaPrevista: formatData(ordine.dataConsegnaPrevista),
        lavorazioni: ordine.lavorazioni.map((l) => ({
          tipo: l.tipo,
          descrizione: l.descrizione,
          fornitore: l.fornitore,
          costo: formatEuro(l.costo),
          stato: STATO_LAVORAZIONE_LABELS[l.stato],
        })),
        pagamenti: ordine.pagamenti.map((p) => ({
          importo: formatEuro(p.importo),
          data: formatData(p.data),
          metodo: p.metodo,
        })),
      };
    }

    case "dettagli_ragazzo": {
      const ragazzoId = String(input.ragazzoId ?? "");
      const ragazzo = await prisma.ragazzo.findUnique({
        where: { id: ragazzoId },
        include: {
          cliente: true,
          partecipazioni: { include: { kit: true } },
          ordini: { include: { pagamenti: true, lavorazioni: true } },
        },
      });
      if (!ragazzo) return { errore: "Ragazzo non trovato" };
      return {
        nome: ragazzo.nome,
        societa: ragazzo.cliente.nome,
        email: ragazzo.email,
        cellulare: ragazzo.cellulare,
        kit: ragazzo.partecipazioni.map((p) => ({
          nome: p.kit.nome,
          brand: BRAND_LABELS[p.kit.brand],
          stato: KIT_STATO_LABELS[p.kit.stato],
        })),
        ordini: ragazzo.ordini.map((o) => {
          const pagato = o.pagamenti.reduce((s, p) => s + p.importo, 0);
          return {
            id: o.id,
            descrizione: o.descrizione,
            importoTotale: formatEuro(o.importoTotale),
            residuo: formatEuro(Math.max(o.importoTotale - pagato, 0)),
            statoPagamento: STATO_PAGAMENTO_LABELS[statoPagamentoOrdine(o.importoTotale, pagato)],
            statoConsegna: STATO_CONSEGNA_LABELS[o.statoConsegna],
            dataOrdine: formatData(o.dataOrdine),
            lavorazioni: o.lavorazioni.map((l) => ({
              descrizione: l.descrizione,
              stato: STATO_LAVORAZIONE_LABELS[l.stato],
              costo: formatEuro(l.costo),
            })),
          };
        }),
      };
    }

    case "statistiche_generali": {
      const ordini = await prisma.ordine.findMany({
        include: { pagamenti: true, lavorazioni: true },
      });
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);

      let daIncassareTotale = 0;
      let incassatoMese = 0;
      let speseLavorazioniTotale = 0;
      let ordiniAperti = 0;
      let consegneInRitardo = 0;

      const fatturatoPerBrand: Record<Brand, { totale: number; ordini: number }> = {
        ERREA: { totale: 0, ordini: 0 },
        SOLO: { totale: 0, ordini: 0 },
      };

      for (const ordine of ordini) {
        const pagato = ordine.pagamenti.reduce((s, p) => s + p.importo, 0);
        daIncassareTotale += Math.max(ordine.importoTotale - pagato, 0);
        speseLavorazioniTotale += ordine.lavorazioni.reduce((s, l) => s + l.costo, 0);
        fatturatoPerBrand[ordine.brand].totale += ordine.importoTotale;
        fatturatoPerBrand[ordine.brand].ordini += 1;

        for (const pagamento of ordine.pagamenti) {
          if (new Date(pagamento.data) >= inizioMese) incassatoMese += pagamento.importo;
        }

        const consegnaAperta = !["CONSEGNATO", "ANNULLATO"].includes(ordine.statoConsegna);
        if (consegnaAperta) {
          ordiniAperti += 1;
          if (ordine.dataConsegnaPrevista && new Date(ordine.dataConsegnaPrevista) < oggi) {
            consegneInRitardo += 1;
          }
        }
      }

      return {
        daIncassare: formatEuro(daIncassareTotale),
        incassatoQuestoMese: formatEuro(incassatoMese),
        ordiniAperti,
        consegneInRitardo,
        speseLavorazioni: formatEuro(speseLavorazioniTotale),
        fatturatoPerBrand: {
          Errea: formatEuro(fatturatoPerBrand.ERREA.totale),
          Solo: formatEuro(fatturatoPerBrand.SOLO.totale),
        },
      };
    }

    default:
      return { errore: `Strumento sconosciuto: ${name}` };
  }
}
