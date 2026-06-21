import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import {
  BRAND_LABELS,
  STATO_CONSEGNA_LABELS,
  STATO_LAVORAZIONE_LABELS,
  STATO_PAGAMENTO_LABELS,
  TIPO_DOCUMENTO_LABELS,
  TIPO_LAVORAZIONE_LABELS,
  TIPO_ORDINE_LABELS,
  formatDataInput,
  statoPagamentoOrdine,
} from "@/lib/labels";

export async function buildExportWorkbook() {
  const [clienti, ordini, pagamenti, lavorazioni, documenti] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { nome: "asc" } }),
    prisma.ordine.findMany({
      include: { cliente: true, pagamenti: true },
      orderBy: { dataOrdine: "desc" },
    }),
    prisma.pagamento.findMany({
      include: { ordine: { include: { cliente: true } } },
      orderBy: { data: "desc" },
    }),
    prisma.lavorazione.findMany({
      include: { ordine: { include: { cliente: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.documento.findMany({
      include: { cliente: true, ordine: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      clienti.map((c) => ({
        Nome: c.nome,
        Referente: c.referente ?? "",
        Telefono: c.telefono ?? "",
        Email: c.email ?? "",
        "P.IVA / Cod.Fiscale": c.piva ?? "",
        Indirizzo: c.indirizzo ?? "",
        Note: c.note ?? "",
      }))
    ),
    "Clienti"
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      ordini.map((o) => {
        const pagato = o.pagamenti.reduce((s, p) => s + p.importo, 0);
        const stato = statoPagamentoOrdine(o.importoTotale, pagato);
        return {
          Numero: o.numero ?? "",
          Cliente: o.cliente.nome,
          Brand: BRAND_LABELS[o.brand],
          Tipo: TIPO_ORDINE_LABELS[o.tipo],
          Descrizione: o.descrizione ?? "",
          "Importo totale": o.importoTotale,
          Pagato: pagato,
          Residuo: Math.max(o.importoTotale - pagato, 0),
          "Stato pagamento": STATO_PAGAMENTO_LABELS[stato],
          "Data ordine": formatDataInput(o.dataOrdine),
          "Consegna prevista": formatDataInput(o.dataConsegnaPrevista),
          "Consegna effettiva": formatDataInput(o.dataConsegnaEffettiva),
          "Stato consegna": STATO_CONSEGNA_LABELS[o.statoConsegna],
          Note: o.note ?? "",
        };
      })
    ),
    "Ordini"
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      pagamenti.map((p) => ({
        Cliente: p.ordine.cliente.nome,
        Ordine: p.ordine.numero ?? p.ordine.id,
        Data: formatDataInput(p.data),
        Importo: p.importo,
        Metodo: p.metodo ?? "",
        Note: p.note ?? "",
      }))
    ),
    "Pagamenti"
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      lavorazioni.map((l) => ({
        Cliente: l.ordine.cliente.nome,
        Ordine: l.ordine.numero ?? l.ordine.id,
        Tipo: TIPO_LAVORAZIONE_LABELS[l.tipo],
        Descrizione: l.descrizione ?? "",
        Fornitore: l.fornitore ?? "",
        Costo: l.costo,
        Stato: STATO_LAVORAZIONE_LABELS[l.stato],
      }))
    ),
    "Lavorazioni"
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      documenti.map((d) => ({
        Cliente: d.cliente.nome,
        Ordine: d.ordine?.numero ?? d.ordine?.id ?? "",
        Tipo: TIPO_DOCUMENTO_LABELS[d.tipo],
        Nome: d.nome,
        "Caricato il": formatDataInput(d.createdAt),
      }))
    ),
    "Documenti"
  );

  return wb;
}
