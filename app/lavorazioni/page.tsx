import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import { updateStatoLavorazione } from "@/app/ordini/actions";
import {
  BRAND_LABELS,
  STATO_LAVORAZIONE_COLORS,
  STATO_LAVORAZIONE_LABELS,
  TIPO_LAVORAZIONE_LABELS,
  formatData,
  formatEuro,
} from "@/lib/labels";
import { inputClass, buttonSecondaryClass } from "@/lib/ui";
import type { StatoLavorazione, TipoLavorazione } from "@/app/generated/prisma/client";

export default async function LavorazioniPage({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string; tipo?: string }>;
}) {
  const filters = await searchParams;

  const lavorazioni = await prisma.lavorazione.findMany({
    where: {
      ...(filters.stato ? { stato: filters.stato as StatoLavorazione } : {}),
      ...(filters.tipo ? { tipo: filters.tipo as TipoLavorazione } : {}),
    },
    include: { ordine: { include: { cliente: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totaleCosto = lavorazioni.reduce((s, l) => s + l.costo, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Lavorazioni: stampe, ricami e altro</h1>
        <p className="text-slate-500 text-sm">
          Totale spese: <span className="font-medium">{formatEuro(totaleCosto)}</span>
        </p>
      </div>

      <form className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Tipo</label>
          <select name="tipo" defaultValue={filters.tipo ?? ""} className={inputClass}>
            <option value="">Tutti</option>
            {Object.entries(TIPO_LAVORAZIONE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Stato</label>
          <select name="stato" defaultValue={filters.stato ?? ""} className={inputClass}>
            <option value="">Tutti</option>
            {Object.entries(STATO_LAVORAZIONE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={buttonSecondaryClass}>
          Filtra
        </button>
        <Link href="/lavorazioni" className="text-sm text-slate-500 hover:underline">
          Reset
        </Link>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Data</th>
              <th className="px-4 py-2.5 font-medium">Cliente / Ordine</th>
              <th className="px-4 py-2.5 font-medium">Brand</th>
              <th className="px-4 py-2.5 font-medium">Tipo</th>
              <th className="px-4 py-2.5 font-medium">Descrizione</th>
              <th className="px-4 py-2.5 font-medium">Fornitore</th>
              <th className="px-4 py-2.5 font-medium text-right">Costo</th>
              <th className="px-4 py-2.5 font-medium">Stato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lavorazioni.map((lavorazione) => (
              <tr key={lavorazione.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">{formatData(lavorazione.createdAt)}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/ordini/${lavorazione.ordineId}`} className="hover:underline">
                    {lavorazione.ordine.cliente.nome}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{BRAND_LABELS[lavorazione.ordine.brand]}</td>
                <td className="px-4 py-2.5">{TIPO_LAVORAZIONE_LABELS[lavorazione.tipo]}</td>
                <td className="px-4 py-2.5 text-slate-500">{lavorazione.descrizione || "-"}</td>
                <td className="px-4 py-2.5 text-slate-500">{lavorazione.fornitore || "-"}</td>
                <td className="px-4 py-2.5 text-right">{formatEuro(lavorazione.costo)}</td>
                <td className="px-4 py-2.5">
                  <AutoSubmitSelect
                    action={updateStatoLavorazione.bind(
                      null,
                      lavorazione.id,
                      lavorazione.ordineId
                    )}
                    name="stato"
                    defaultValue={lavorazione.stato}
                    className={`rounded-full text-xs px-2 py-1 border-0 font-medium ${STATO_LAVORAZIONE_COLORS[lavorazione.stato]}`}
                    options={Object.entries(STATO_LAVORAZIONE_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                </td>
              </tr>
            ))}
            {lavorazioni.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Nessuna lavorazione trovata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
