"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import {
  BRAND_LABELS,
  KIT_STATO_COLORS,
  KIT_STATO_LABELS,
  KIT_STATO_ORDER,
  formatEuro,
} from "@/lib/labels";
import { ReportRow } from "@/lib/report";

type SortKey = "clienteNome" | "iscritti" | "totaleOrdinato" | "totalePagato" | "residuo";

const DONUT_COLORS: Record<string, string> = {
  SCELTA_PRODOTTI: "#9ca3af",
  PROVE: "#3b82f6",
  ORDINATO: "#a855f7",
  IN_LAVORAZIONE: "#f59e0b",
  DA_CONTATTARE: "#f97316",
  CONTATTATO: "#14b8a6",
  CHIUSO: "#22c55e",
};

export default function ReportForniture({ rows }: { rows: ReportRow[] }) {
  const [filtro, setFiltro] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("totaleOrdinato");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [openRow, setOpenRow] = useState<string | null>(null);

  const filtrate = useMemo(
    () => (filtro ? rows.filter((r) => r.stato === filtro) : rows),
    [rows, filtro]
  );

  const ordinate = useMemo(() => {
    const copy = [...filtrate];
    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtrate, sortKey, sortDir]);

  const kpi = useMemo(() => {
    const totaleIscritti = rows.reduce((s, r) => s + r.iscritti, 0);
    const totaleOrdinato = rows.reduce((s, r) => s + r.totaleOrdinato, 0);
    const totalePagato = rows.reduce((s, r) => s + r.totalePagato, 0);
    const totaleResiduo = rows.reduce((s, r) => s + r.residuo, 0);
    return {
      kit: rows.length,
      iscritti: totaleIscritti,
      totaleOrdinato,
      totalePagato,
      totaleResiduo,
      percentualePagato: totaleOrdinato > 0 ? (totalePagato / totaleOrdinato) * 100 : 0,
    };
  }, [rows]);

  const distribuzioneStato = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.stato, (counts.get(r.stato) ?? 0) + 1);
    return KIT_STATO_ORDER.filter((s) => counts.has(s)).map((s) => ({
      stato: s,
      count: counts.get(s) ?? 0,
    }));
  }, [rows]);

  const maxOrdinato = Math.max(1, ...rows.map((r) => r.totaleOrdinato));

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return null;
    return <span className="ml-1 text-slate-400">{sortDir === "asc" ? "▲" : "▼"}</span>;
  }

  let cumulative = 0;
  const donutSegments = distribuzioneStato.map(({ stato, count }) => {
    const pct = (count / Math.max(rows.length, 1)) * 100;
    const start = cumulative;
    cumulative += pct;
    return `${DONUT_COLORS[stato] ?? "#94a3b8"} ${start}% ${cumulative}%`;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Report forniture</h1>
        <p className="text-slate-500 text-sm">
          Andamento di tutte le forniture (kit) in corso e completate, dati live.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card title="Forniture">
          <p className="text-2xl font-semibold">{kpi.kit}</p>
        </Card>
        <Card title="Iscritti totali">
          <p className="text-2xl font-semibold">{kpi.iscritti}</p>
        </Card>
        <Card title="Totale ordinato">
          <p className="text-2xl font-semibold">{formatEuro(kpi.totaleOrdinato)}</p>
        </Card>
        <Card title="Totale pagato">
          <p className="text-2xl font-semibold text-green-600">{formatEuro(kpi.totalePagato)}</p>
          <p className="text-xs text-slate-400 mt-1">{kpi.percentualePagato.toFixed(0)}% dell&apos;ordinato</p>
        </Card>
        <Card title="Residuo da incassare">
          <p className="text-2xl font-semibold text-red-600">{formatEuro(kpi.totaleResiduo)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Totale ordinato per fornitura">
          <div className="flex items-end gap-2 h-40">
            {rows.map((r) => (
              <div key={r.kitId} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full bg-slate-700 rounded-t-sm hover:bg-slate-900 transition"
                  style={{ height: `${(r.totaleOrdinato / maxOrdinato) * 100}%`, minHeight: 2 }}
                  title={`${r.clienteNome}: ${formatEuro(r.totaleOrdinato)}`}
                />
                <span className="text-[10px] text-slate-400 mt-1 truncate w-full text-center">
                  {r.clienteNome.split(" ")[0]}
                </span>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="text-sm text-slate-400 self-center mx-auto">Nessuna fornitura.</p>
            )}
          </div>
        </Card>

        <Card title="Distribuzione per stato">
          {distribuzioneStato.length > 0 ? (
            <div className="flex items-center gap-6">
              <div
                className="w-32 h-32 rounded-full shrink-0"
                style={{ background: `conic-gradient(${donutSegments.join(", ")})` }}
              />
              <ul className="space-y-1 text-sm">
                {distribuzioneStato.map(({ stato, count }) => (
                  <li key={stato} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ background: DONUT_COLORS[stato] ?? "#94a3b8" }}
                    />
                    <span>{KIT_STATO_LABELS[stato as keyof typeof KIT_STATO_LABELS]}</span>
                    <span className="text-slate-400">({count})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nessuna fornitura.</p>
          )}
        </Card>
      </div>

      <Card title="Forniture">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFiltro(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                filtro === null
                  ? "bg-slate-900 text-white border-slate-900"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Tutti ({rows.length})
            </button>
            {KIT_STATO_ORDER.map((stato) => {
              const count = rows.filter((r) => r.stato === stato).length;
              if (count === 0) return null;
              return (
                <button
                  key={stato}
                  type="button"
                  onClick={() => setFiltro(stato)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    filtro === stato
                      ? "bg-slate-900 text-white border-slate-900"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {KIT_STATO_LABELS[stato]} ({count})
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left border-b border-slate-100">
                <tr>
                  <th
                    className="py-2 font-medium cursor-pointer select-none"
                    onClick={() => toggleSort("clienteNome")}
                  >
                    Società{sortIndicator("clienteNome")}
                  </th>
                  <th className="py-2 font-medium">Brand</th>
                  <th className="py-2 font-medium">Stato</th>
                  <th
                    className="py-2 font-medium text-right cursor-pointer select-none"
                    onClick={() => toggleSort("iscritti")}
                  >
                    Iscritti{sortIndicator("iscritti")}
                  </th>
                  <th
                    className="py-2 font-medium text-right cursor-pointer select-none"
                    onClick={() => toggleSort("totaleOrdinato")}
                  >
                    Ordinato{sortIndicator("totaleOrdinato")}
                  </th>
                  <th
                    className="py-2 font-medium text-right cursor-pointer select-none"
                    onClick={() => toggleSort("totalePagato")}
                  >
                    Pagato{sortIndicator("totalePagato")}
                  </th>
                  <th
                    className="py-2 font-medium text-right cursor-pointer select-none"
                    onClick={() => toggleSort("residuo")}
                  >
                    Residuo{sortIndicator("residuo")}
                  </th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordinate.map((r) => (
                  <Fragment key={r.kitId}>
                    <tr
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setOpenRow(openRow === r.kitId ? null : r.kitId)}
                    >
                      <td className="py-2 font-medium">{r.clienteNome}</td>
                      <td className="py-2 text-slate-500">{BRAND_LABELS[r.brand]}</td>
                      <td className="py-2">
                        <Badge label={KIT_STATO_LABELS[r.stato]} className={KIT_STATO_COLORS[r.stato]} />
                      </td>
                      <td className="py-2 text-right">{r.iscritti}</td>
                      <td className="py-2 text-right">{formatEuro(r.totaleOrdinato)}</td>
                      <td className="py-2 text-right text-green-600">{formatEuro(r.totalePagato)}</td>
                      <td className="py-2 text-right text-red-600">
                        {r.residuo > 0 ? formatEuro(r.residuo) : "-"}
                      </td>
                      <td className="py-2 text-right text-slate-400">
                        {openRow === r.kitId ? "▲" : "▼"}
                      </td>
                    </tr>
                    {openRow === r.kitId && (
                      <tr className="bg-slate-50">
                        <td colSpan={8} className="py-4 px-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="text-slate-400 uppercase font-semibold mb-1">
                                Stato pagamento ordini
                              </p>
                              <p>Pagati: {r.ordiniStatoPagamento.pagato}</p>
                              <p>Parziali: {r.ordiniStatoPagamento.parziale}</p>
                              <p>Non pagati: {r.ordiniStatoPagamento.nonPagato}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 uppercase font-semibold mb-1">Lavorazioni</p>
                              <p>Totale: {r.lavorazioni.totale}</p>
                              <p>
                                Da fare {r.lavorazioni.daFare} · In corso {r.lavorazioni.inCorso} ·
                                Completate {r.lavorazioni.completate}
                              </p>
                              <p>Costo: {formatEuro(r.lavorazioni.costoTotale)}</p>
                            </div>
                            <div className="flex flex-col gap-1 items-start">
                              <Link
                                href={`/kit/${r.kitId}`}
                                className="text-slate-900 hover:underline font-medium"
                              >
                                Apri kit &quot;{r.kitNome}&quot; →
                              </Link>
                              <Link
                                href={`/clienti/${r.clienteId}`}
                                className="text-slate-900 hover:underline font-medium"
                              >
                                Apri società &quot;{r.clienteNome}&quot; →
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {ordinate.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      Nessuna fornitura per questo filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
