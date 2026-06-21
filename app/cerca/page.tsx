import Link from "next/link";
import Card from "@/components/Card";
import { searchAll } from "@/lib/search";
import { TIPO_DOCUMENTO_LABELS, formatData, formatEuro } from "@/lib/labels";
import { inputClass, buttonClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function CercaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results =
    query.length >= 2
      ? await searchAll(query, 50)
      : { clienti: [], ordini: [], lavorazioni: [], documenti: [] };
  const totale =
    results.clienti.length +
    results.ordini.length +
    results.lavorazioni.length +
    results.documenti.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cerca</h1>

      <form action="/cerca" className="flex gap-2 max-w-xl">
        <input
          name="q"
          defaultValue={query}
          placeholder="Cerca cliente, ordine, lavorazione, documento..."
          className={inputClass}
        />
        <button type="submit" className={buttonClass}>
          Cerca
        </button>
      </form>

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-slate-400">Inserisci almeno 2 caratteri.</p>
      )}
      {query.length >= 2 && totale === 0 && (
        <p className="text-sm text-slate-400">Nessun risultato per &laquo;{query}&raquo;.</p>
      )}

      {results.clienti.length > 0 && (
        <Card title={`Clienti (${results.clienti.length})`}>
          <ul className="divide-y divide-slate-100 text-sm">
            {results.clienti.map((c) => (
              <li key={c.id} className="py-2">
                <Link href={`/clienti/${c.id}`} className="font-medium hover:underline">
                  {c.nome}
                </Link>
                <span className="text-slate-400">
                  {c.referente && ` · ${c.referente}`}
                  {c.telefono && ` · ${c.telefono}`}
                  {c.email && ` · ${c.email}`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {results.ordini.length > 0 && (
        <Card title={`Ordini (${results.ordini.length})`}>
          <ul className="divide-y divide-slate-100 text-sm">
            {results.ordini.map((o) => (
              <li key={o.id} className="py-2">
                <Link href={`/ordini/${o.id}`} className="font-medium hover:underline">
                  {o.numero ? `#${o.numero}` : "Ordine"} · {o.cliente.nome}
                </Link>
                <span className="text-slate-400">
                  {" "}
                  · {formatEuro(o.importoTotale)} · {formatData(o.dataOrdine)}
                </span>
                {o.descrizione && (
                  <p className="text-slate-500 truncate">{o.descrizione}</p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {results.lavorazioni.length > 0 && (
        <Card title={`Lavorazioni (${results.lavorazioni.length})`}>
          <ul className="divide-y divide-slate-100 text-sm">
            {results.lavorazioni.map((l) => (
              <li key={l.id} className="py-2">
                <Link href={`/ordini/${l.ordineId}`} className="font-medium hover:underline">
                  {l.descrizione || "Lavorazione"} · {l.ordine.cliente.nome}
                </Link>
                <span className="text-slate-400">
                  {l.fornitore && ` · ${l.fornitore}`} · {formatEuro(l.costo)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {results.documenti.length > 0 && (
        <Card title={`Documenti (${results.documenti.length})`}>
          <ul className="divide-y divide-slate-100 text-sm">
            {results.documenti.map((d) => (
              <li key={d.id} className="py-2">
                <Link
                  href={d.ordineId ? `/ordini/${d.ordineId}` : `/clienti/${d.clienteId}`}
                  className="font-medium hover:underline"
                >
                  {d.nome}
                </Link>
                <span className="text-slate-400">
                  {" "}
                  · {TIPO_DOCUMENTO_LABELS[d.tipo]} · {d.cliente.nome}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
