import { eseguiBrunoTool } from "@/lib/bruno-tools";

const AIUTO = /(aiuto|help|cosa puoi fare|cosa sai fare)/i;
const SALUTI = /^(ciao|salve|buongiorno|buonasera|hey|ehi)\b/i;
const STATISTICHE_KEYWORDS =
  /(incassare|incassato|fatturat|statistich|andamento|margine|ritardo|ritardi|riepilogo)/i;

type StatisticheGenerali = {
  daIncassare: string;
  incassatoQuestoMese: string;
  ordiniAperti: number;
  consegneInRitardo: number;
  speseLavorazioni: string;
  fatturatoPerBrand: { Errea: string; Solo: string };
};

type RisultatiRicerca = {
  clienti: { id: string; nome: string; referente: string | null }[];
  ordini: { id: string; numero: string | null; cliente: string; importoTotale: string }[];
  lavorazioni: { id: string; descrizione: string | null; cliente: string }[];
  documenti: { id: string; nome: string; tipo: string }[];
};

export async function rispostaSenzaAI(testo: string): Promise<string> {
  const msg = testo.trim();

  if (AIUTO.test(msg)) {
    return [
      "Posso aiutarti così, anche senza AI avanzata:",
      "- Scrivimi il nome di un cliente, un numero ordine o una parola chiave: cerco per te tra clienti, ordini, lavorazioni e documenti.",
      '- Chiedimi "statistiche", "fatturato" o "quanto devo incassare" per un riepilogo generale.',
      "- Per risposte più intelligenti e conversazionali, aggiungi una ANTHROPIC_API_KEY nel file .env.",
    ].join("\n");
  }

  if (SALUTI.test(msg) && msg.length < 20) {
    return "Ciao! Sono BRUNO. Scrivimi il nome di un cliente, un numero ordine, oppure chiedimi le statistiche generali.";
  }

  if (STATISTICHE_KEYWORDS.test(msg)) {
    const s = (await eseguiBrunoTool("statistiche_generali", {})) as StatisticheGenerali;
    return [
      `Da incassare: ${s.daIncassare}`,
      `Incassato questo mese: ${s.incassatoQuestoMese}`,
      `Ordini aperti: ${s.ordiniAperti} (di cui ${s.consegneInRitardo} in ritardo)`,
      `Spese lavorazioni: ${s.speseLavorazioni}`,
      `Fatturato Errea: ${s.fatturatoPerBrand.Errea} · Fatturato Solo: ${s.fatturatoPerBrand.Solo}`,
    ].join("\n");
  }

  if (msg.length < 2) {
    return "Scrivi almeno due caratteri per cercare, oppure chiedimi le statistiche generali.";
  }

  const r = (await eseguiBrunoTool("cerca_nel_programma", { query: msg })) as RisultatiRicerca;
  const righe: string[] = [];

  if (r.clienti.length) {
    righe.push("Clienti trovati:");
    r.clienti.forEach((c) =>
      righe.push(`- ${c.nome}${c.referente ? ` (${c.referente})` : ""}`)
    );
  }
  if (r.ordini.length) {
    righe.push("Ordini trovati:");
    r.ordini.forEach((o) =>
      righe.push(`- ${o.numero ? `#${o.numero}` : "Ordine"} · ${o.cliente} · ${o.importoTotale}`)
    );
  }
  if (r.lavorazioni.length) {
    righe.push("Lavorazioni trovate:");
    r.lavorazioni.forEach((l) => righe.push(`- ${l.descrizione || "Lavorazione"} · ${l.cliente}`));
  }
  if (r.documenti.length) {
    righe.push("Documenti trovati:");
    r.documenti.forEach((d) => righe.push(`- ${d.nome} (${d.tipo})`));
  }

  if (righe.length === 0) {
    return `Non ho trovato nulla per "${msg}". Prova con un altro nome, numero ordine o parola chiave, oppure usa la barra di ricerca in alto.`;
  }

  return righe.join("\n");
}
