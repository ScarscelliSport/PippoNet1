import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Badge from "@/components/Badge";
import { buttonClass, inputClass, buttonSecondaryClass } from "@/lib/ui";
import {
  BRAND_LABELS,
  STATO_CONSEGNA_COLORS,
  STATO_CONSEGNA_LABELS,
  STATO_PAGAMENTO_COLORS,
  STATO_PAGAMENTO_LABELS,
  TIPO_ORDINE_LABELS,
  formatData,
  formatEuro,
  statoPagamentoOrdine,
  type StatoPagamento,
} from "@/lib/labels";
import type { Brand, StatoConsegna } from "@/app/generated/prisma/client";

export default async function OrdiniPage({
  searchParams,
}: {
  searchParams: Promise<{
    brand?: string;
    statoConsegna?: string;
    statoPagamento?: string;
  }>;
}) {
  const filters = await searchParams;

  const ordini = await prisma.ordine.findMany({
    where: {
      ...(filters.brand ? { brand: filters.brand as Brand } : {}),
      ...(filters.statoConsegna
        ? { statoConsegna: filters.statoConsegna as StatoConsegna }
        : {}),
    },
    include: { cliente: true, pagamenti: true },
    orderBy: { dataOrdine: "desc" },
  });

  const ordiniFiltrati = ordini.filter((ordine) => {
    if (!filters.statoPagamento) return true;
    const pagato = ordine.pagamenti.reduce((s, p) => s + p.importo, 0);
    return statoPagamentoOrdine(ordine.importoTotale, pagato) === filters.statoPagamento;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Ordini</h1>
        <Link href="/ordini/nuovo" className={buttonClass}>
          + Nuovo ordine
        </Link>
      </div>

      <form className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Brand</label>
          <select name="brand" defaultValue={filters.brand ?? ""} className={inputClass}>
            <option value="">Tutti</option>
            {Object.entries(BRAND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Stato consegna</label>
          <select
            name="statoConsegna"
            defaultValue={filters.statoConsegna ?? ""}
            className={inputClass}
          >
            <option value="">Tutti</option>
            {Object.entries(STATO_CONSEGNA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Stato pagamento</label>
          <select
            name="statoPagamento"
            defaultValue={filters.statoPagamento ?? ""}
            className={inputClass}
          >
            <option value="">Tutti</option>
            {Object.entries(STATO_PAGAMENTO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={buttonSecondaryClass}>
          Filtra
        </button>
        <Link href="/ordini" className="text-sm text-slate-500 hover:underline">
          Reset
        </Link>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Data</th>
              <th className="px-4 py-2.5 font-medium">Cliente</th>
              <th className="px-4 py-2.5 font-medium">Brand</th>
              <th className="px-4 py-2.5 font-medium">Tipo</th>
              <th className="px-4 py-2.5 font-medium text-right">Importo</th>
              <th className="px-4 py-2.5 font-medium">Pagamento</th>
              <th className="px-4 py-2.5 font-medium">Consegna</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ordiniFiltrati.map((ordine) => {
              const pagato = ordine.pagamenti.reduce((s, p) => s + p.importo, 0);
              const statoPag: StatoPagamento = statoPagamentoOrdine(
                ordine.importoTotale,
                pagato
              );
              return (
                <tr key={ordine.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/ordini/${ordine.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {formatData(ordine.dataOrdine)}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/clienti/${ordine.clienteId}`} className="hover:underline">
                      {ordine.cliente.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{BRAND_LABELS[ordine.brand]}</td>
                  <td className="px-4 py-2.5">{TIPO_ORDINE_LABELS[ordine.tipo]}</td>
                  <td className="px-4 py-2.5 text-right">{formatEuro(ordine.importoTotale)}</td>
                  <td className="px-4 py-2.5">
                    <Badge
                      label={STATO_PAGAMENTO_LABELS[statoPag]}
                      className={STATO_PAGAMENTO_COLORS[statoPag]}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      label={STATO_CONSEGNA_LABELS[ordine.statoConsegna]}
                      className={STATO_CONSEGNA_COLORS[ordine.statoConsegna]}
                    />
                  </td>
                </tr>
              );
            })}
            {ordiniFiltrati.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Nessun ordine trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
