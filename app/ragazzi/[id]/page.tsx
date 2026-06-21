import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import {
  BRAND_LABELS,
  KIT_STATO_COLORS,
  KIT_STATO_LABELS,
  STATO_CONSEGNA_COLORS,
  STATO_CONSEGNA_LABELS,
  STATO_PAGAMENTO_COLORS,
  STATO_PAGAMENTO_LABELS,
  formatData,
  formatEuro,
  statoPagamentoOrdine,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function RagazzoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ragazzo = await prisma.ragazzo.findUnique({
    where: { id },
    include: {
      cliente: true,
      partecipazioni: {
        include: { kit: true, ordine: { include: { pagamenti: true } } },
        orderBy: { createdAt: "desc" },
      },
      ordini: {
        include: { pagamenti: true, lavorazioni: true },
        orderBy: { dataOrdine: "desc" },
      },
    },
  });

  if (!ragazzo) notFound();

  const totaleOrdinato = ragazzo.ordini.reduce((s, o) => s + o.importoTotale, 0);
  const totalePagato = ragazzo.ordini.reduce(
    (s, o) => s + o.pagamenti.reduce((s2, p) => s2 + p.importo, 0),
    0
  );
  const residuo = Math.max(totaleOrdinato - totalePagato, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{ragazzo.nome}</h1>
        <Link href={`/clienti/${ragazzo.clienteId}`} className="text-slate-500 hover:underline">
          {ragazzo.cliente.nome}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Contatti">
          <p className="text-sm">{ragazzo.email || "-"}</p>
          <p className="text-sm text-slate-500">{ragazzo.cellulare || "-"}</p>
        </Card>
        <Card title="Totale ordinato">
          <p className="text-2xl font-semibold">{formatEuro(totaleOrdinato)}</p>
        </Card>
        <Card title="Residuo da pagare">
          <p className={`text-2xl font-semibold ${residuo > 0 ? "text-red-600" : ""}`}>
            {formatEuro(residuo)}
          </p>
        </Card>
      </div>

      {ragazzo.note && (
        <Card title="Note">
          <p className="text-sm whitespace-pre-wrap">{ragazzo.note}</p>
        </Card>
      )}

      <Card title={`Kit (${ragazzo.partecipazioni.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-left border-b border-slate-100">
              <tr>
                <th className="py-2 font-medium">Kit</th>
                <th className="py-2 font-medium">Brand</th>
                <th className="py-2 font-medium">Stato kit</th>
                <th className="py-2 font-medium">Ordine personale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ragazzo.partecipazioni.map((p) => (
                <tr key={p.id}>
                  <td className="py-2">
                    <Link href={`/kit/${p.kitId}`} className="font-medium hover:underline">
                      {p.kit.nome}
                    </Link>
                  </td>
                  <td className="py-2 text-slate-500">{BRAND_LABELS[p.kit.brand]}</td>
                  <td className="py-2">
                    <Badge label={KIT_STATO_LABELS[p.kit.stato]} className={KIT_STATO_COLORS[p.kit.stato]} />
                  </td>
                  <td className="py-2">
                    {p.ordine ? (
                      <Link href={`/ordini/${p.ordine.id}`} className="hover:underline">
                        <Badge
                          label={`${formatEuro(p.ordine.importoTotale)} · ${STATO_CONSEGNA_LABELS[p.ordine.statoConsegna]}`}
                          className={STATO_CONSEGNA_COLORS[p.ordine.statoConsegna]}
                        />
                      </Link>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {ragazzo.partecipazioni.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    Nessun kit collegato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={`Ordini (${ragazzo.ordini.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-left border-b border-slate-100">
              <tr>
                <th className="py-2 font-medium">Data</th>
                <th className="py-2 font-medium">Descrizione</th>
                <th className="py-2 pr-4 font-medium text-right">Importo</th>
                <th className="py-2 font-medium">Pagamento</th>
                <th className="py-2 font-medium">Consegna</th>
                <th className="py-2 font-medium">Lavorazioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ragazzo.ordini.map((ordine) => {
                const pagato = ordine.pagamenti.reduce((s, p) => s + p.importo, 0);
                const statoPag = statoPagamentoOrdine(ordine.importoTotale, pagato);
                return (
                  <tr key={ordine.id} className="hover:bg-slate-50">
                    <td className="py-2">
                      <Link
                        href={`/ordini/${ordine.id}`}
                        className="text-slate-900 font-medium hover:underline"
                      >
                        {formatData(ordine.dataOrdine)}
                      </Link>
                    </td>
                    <td className="py-2 text-slate-500">{ordine.descrizione || "-"}</td>
                    <td className="py-2 pr-4 text-right">{formatEuro(ordine.importoTotale)}</td>
                    <td className="py-2">
                      <Badge
                        label={STATO_PAGAMENTO_LABELS[statoPag]}
                        className={STATO_PAGAMENTO_COLORS[statoPag]}
                      />
                    </td>
                    <td className="py-2">
                      <Badge
                        label={STATO_CONSEGNA_LABELS[ordine.statoConsegna]}
                        className={STATO_CONSEGNA_COLORS[ordine.statoConsegna]}
                      />
                    </td>
                    <td className="py-2 text-slate-500">
                      {ordine.lavorazioni.length > 0 ? ordine.lavorazioni.length : "-"}
                    </td>
                  </tr>
                );
              })}
              {ragazzo.ordini.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Nessun ordine personale registrato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
