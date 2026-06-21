import {
  Brand,
  KitStato,
  StatoConsegna,
  StatoLavorazione,
  TipoDocumento,
  TipoLavorazione,
  TipoOrdine,
} from "@/app/generated/prisma/client";

export const BRAND_LABELS: Record<Brand, string> = {
  ERREA: "Errea",
  SOLO: "Solo",
};

export const TIPO_ORDINE_LABELS: Record<TipoOrdine, string> = {
  ORDINE: "Ordine",
  RIASSORTIMENTO: "Riassortimento",
};

export const STATO_CONSEGNA_LABELS: Record<StatoConsegna, string> = {
  DA_ORDINARE: "Da ordinare",
  ORDINATO: "Ordinato",
  IN_LAVORAZIONE: "In lavorazione",
  IN_CONSEGNA: "In consegna",
  CONSEGNATO: "Consegnato",
  ANNULLATO: "Annullato",
};

export const STATO_CONSEGNA_COLORS: Record<StatoConsegna, string> = {
  DA_ORDINARE: "bg-gray-100 text-gray-700",
  ORDINATO: "bg-blue-100 text-blue-700",
  IN_LAVORAZIONE: "bg-amber-100 text-amber-700",
  IN_CONSEGNA: "bg-purple-100 text-purple-700",
  CONSEGNATO: "bg-green-100 text-green-700",
  ANNULLATO: "bg-red-100 text-red-700",
};

export const TIPO_LAVORAZIONE_LABELS: Record<TipoLavorazione, string> = {
  STAMPA: "Stampa",
  RICAMO: "Ricamo",
  ALTRO: "Altro",
};

export const STATO_LAVORAZIONE_LABELS: Record<StatoLavorazione, string> = {
  DA_FARE: "Da fare",
  IN_CORSO: "In corso",
  COMPLETATA: "Completata",
};

export const STATO_LAVORAZIONE_COLORS: Record<StatoLavorazione, string> = {
  DA_FARE: "bg-gray-100 text-gray-700",
  IN_CORSO: "bg-amber-100 text-amber-700",
  COMPLETATA: "bg-green-100 text-green-700",
};

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  DDT: "DDT",
  FATTURA: "Fattura",
  CONTRATTO: "Contratto",
  ALTRO: "Altro",
};

export const KIT_STATO_LABELS: Record<KitStato, string> = {
  SCELTA_PRODOTTI: "Scelta prodotti",
  PROVE: "Prove",
  ORDINATO: "Ordinato",
  IN_LAVORAZIONE: "In lavorazione",
  DA_CONTATTARE: "Da contattare",
  CONTATTATO: "Contattato",
  CHIUSO: "Chiuso",
};

export const KIT_STATO_COLORS: Record<KitStato, string> = {
  SCELTA_PRODOTTI: "bg-gray-100 text-gray-700",
  PROVE: "bg-blue-100 text-blue-700",
  ORDINATO: "bg-purple-100 text-purple-700",
  IN_LAVORAZIONE: "bg-amber-100 text-amber-700",
  DA_CONTATTARE: "bg-orange-100 text-orange-700",
  CONTATTATO: "bg-teal-100 text-teal-700",
  CHIUSO: "bg-green-100 text-green-700",
};

export const KIT_STATO_ORDER: KitStato[] = [
  "SCELTA_PRODOTTI",
  "PROVE",
  "ORDINATO",
  "IN_LAVORAZIONE",
  "DA_CONTATTARE",
  "CONTATTATO",
  "CHIUSO",
];

export type StatoPagamento = "NON_PAGATO" | "PARZIALE" | "PAGATO";

export const STATO_PAGAMENTO_LABELS: Record<StatoPagamento, string> = {
  NON_PAGATO: "Non pagato",
  PARZIALE: "Pagato parzialmente",
  PAGATO: "Pagato",
};

export const STATO_PAGAMENTO_COLORS: Record<StatoPagamento, string> = {
  NON_PAGATO: "bg-red-100 text-red-700",
  PARZIALE: "bg-amber-100 text-amber-700",
  PAGATO: "bg-green-100 text-green-700",
};

export function statoPagamentoOrdine(
  importoTotale: number,
  totalePagato: number
): StatoPagamento {
  if (totalePagato <= 0) return "NON_PAGATO";
  if (totalePagato >= importoTotale) return "PAGATO";
  return "PARZIALE";
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatData(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDataInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
