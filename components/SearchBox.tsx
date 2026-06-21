"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Results = {
  clienti: { id: string; nome: string; referente: string | null }[];
  ordini: { id: string; numero: string | null; cliente: { nome: string } }[];
  lavorazioni: {
    id: string;
    descrizione: string | null;
    ordineId: string;
    ordine: { cliente: { nome: string } };
  }[];
  documenti: { id: string; nome: string; clienteId: string; ordineId: string | null }[];
  ragazzi: { id: string; nome: string; cliente: { nome: string } }[];
};

const EMPTY: Results = { clienti: [], ordini: [], lavorazioni: [], documenti: [], ragazzi: [] };

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => setResults(data))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const totale =
    results.clienti.length +
    results.ordini.length +
    results.lavorazioni.length +
    results.documenti.length +
    results.ragazzi.length;

  function vediTutti() {
    setOpen(false);
    router.push(`/cerca?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div ref={containerRef} className="relative w-full sm:max-w-xs">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            vediTutti();
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Cerca..."
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-1 bg-white text-slate-900 rounded-md shadow-lg border border-slate-200 max-h-96 overflow-y-auto z-50">
          {totale === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-400">Nessun risultato.</p>
          ) : (
            <>
              {results.clienti.length > 0 && (
                <div className="border-b border-slate-100">
                  <p className="px-3 pt-2 text-xs font-semibold text-slate-400 uppercase">
                    Clienti
                  </p>
                  {results.clienti.map((c) => (
                    <Link
                      key={c.id}
                      href={`/clienti/${c.id}`}
                      className="block px-3 py-2 text-sm hover:bg-slate-50"
                      onClick={() => setOpen(false)}
                    >
                      <span className="font-medium">{c.nome}</span>
                      {c.referente && <span className="text-slate-400"> · {c.referente}</span>}
                    </Link>
                  ))}
                </div>
              )}
              {results.ordini.length > 0 && (
                <div className="border-b border-slate-100">
                  <p className="px-3 pt-2 text-xs font-semibold text-slate-400 uppercase">
                    Ordini
                  </p>
                  {results.ordini.map((o) => (
                    <Link
                      key={o.id}
                      href={`/ordini/${o.id}`}
                      className="block px-3 py-2 text-sm hover:bg-slate-50"
                      onClick={() => setOpen(false)}
                    >
                      <span className="font-medium">{o.numero ? `#${o.numero}` : "Ordine"}</span>
                      <span className="text-slate-400"> · {o.cliente.nome}</span>
                    </Link>
                  ))}
                </div>
              )}
              {results.lavorazioni.length > 0 && (
                <div className="border-b border-slate-100">
                  <p className="px-3 pt-2 text-xs font-semibold text-slate-400 uppercase">
                    Lavorazioni
                  </p>
                  {results.lavorazioni.map((l) => (
                    <Link
                      key={l.id}
                      href={`/ordini/${l.ordineId}`}
                      className="block px-3 py-2 text-sm hover:bg-slate-50"
                      onClick={() => setOpen(false)}
                    >
                      <span className="font-medium">{l.descrizione || "Lavorazione"}</span>
                      <span className="text-slate-400"> · {l.ordine.cliente.nome}</span>
                    </Link>
                  ))}
                </div>
              )}
              {results.documenti.length > 0 && (
                <div className="border-b border-slate-100">
                  <p className="px-3 pt-2 text-xs font-semibold text-slate-400 uppercase">
                    Documenti
                  </p>
                  {results.documenti.map((d) => (
                    <Link
                      key={d.id}
                      href={d.ordineId ? `/ordini/${d.ordineId}` : `/clienti/${d.clienteId}`}
                      className="block px-3 py-2 text-sm hover:bg-slate-50"
                      onClick={() => setOpen(false)}
                    >
                      {d.nome}
                    </Link>
                  ))}
                </div>
              )}
              {results.ragazzi.length > 0 && (
                <div>
                  <p className="px-3 pt-2 text-xs font-semibold text-slate-400 uppercase">
                    Ragazzi
                  </p>
                  {results.ragazzi.map((r) => (
                    <Link
                      key={r.id}
                      href={`/ragazzi/${r.id}`}
                      className="block px-3 py-2 text-sm hover:bg-slate-50"
                      onClick={() => setOpen(false)}
                    >
                      <span className="font-medium">{r.nome}</span>
                      <span className="text-slate-400"> · {r.cliente.nome}</span>
                    </Link>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={vediTutti}
                className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 border-t border-slate-100"
              >
                Vedi tutti i risultati →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
