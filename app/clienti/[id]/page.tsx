import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { deleteCliente } from "@/app/clienti/actions";
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
} from "@/lib/labels";
import { buttonClass, buttonSecondaryClass, buttonDangerClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      ordini: {
        include: { pagamenti: true },
        orderBy: { dataOrdine: "desc" },
      },
    },
  });

  if (!cliente) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
          {cliente.referente && (
            <p className="text-slate-500 text-sm">Referente: {cliente.referente}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/ordini/nuovo?clienteId=${cliente.id}`} className={buttonClass}>
            + Nuovo ordine
          </Link>
          <Link href={`/clienti/${cliente.id}/edit`} className={buttonSecondaryClass}>
            Modifica
          </Link>
          <form action={deleteCliente.bind(null, cliente.id)}>
            <ConfirmSubmitButton
              className={buttonDangerClass}
              confirmMessage="Eliminare questo cliente e tutti i suoi ordini?"
            >
              Elimina
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <Card title="Dati cliente">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400">Telefono</dt>
            <dd>{cliente.telefono || "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Email</dt>
            <dd>{cliente.email || "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">P.IVA / Cod. Fiscale</dt>
            <dd>{cliente.piva || "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Indirizzo</dt>
            <dd>{cliente.indirizzo || "-"}</dd>
          </div>
          {cliente.note && (
            <div className="sm:col-span-2">
              <dt className="text-slate-400">Note</dt>
              <dd className="whitespace-pre-wrap">{cliente.note}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card title={`Ordini (${cliente.ordini.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-left border-b border-slate-100">
              <tr>
                <th className="py-2 font-medium">Data</th>
                <th className="py-2 font-medium">Brand</th>
                <th className="py-2 font-medium">Tipo</th>
                <th className="py-2 font-medium text-right">Importo</th>
                <th className="py-2 font-medium">Pagamento</th>
                <th className="py-2 font-medium">Consegna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cliente.ordini.map((ordine) => {
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
                    <td className="py-2">{BRAND_LABELS[ordine.brand]}</td>
                    <td className="py-2">{TIPO_ORDINE_LABELS[ordine.tipo]}</td>
                    <td className="py-2 text-right">{formatEuro(ordine.importoTotale)}</td>
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
                  </tr>
                );
              })}
              {cliente.ordini.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nessun ordine registrato per questo cliente.
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
