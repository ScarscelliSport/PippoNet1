import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import DocumentoForm from "@/components/DocumentoForm";
import { deleteCliente } from "@/app/clienti/actions";
import { uploadDocumento, deleteDocumento } from "@/app/documenti/actions";
import {
  BRAND_LABELS,
  STATO_CONSEGNA_COLORS,
  STATO_CONSEGNA_LABELS,
  STATO_PAGAMENTO_COLORS,
  STATO_PAGAMENTO_LABELS,
  TIPO_DOCUMENTO_LABELS,
  TIPO_ORDINE_LABELS,
  formatBytes,
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
      documenti: {
        include: { ordine: true },
        orderBy: { createdAt: "desc" },
      },
      ragazzi: {
        include: { partecipazioni: { include: { kit: true, ordine: true } } },
        orderBy: { nome: "asc" },
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
                <th className="py-2 pr-4 font-medium text-right">Importo</th>
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

      <Card title={`Ragazzi / Kit (${cliente.ragazzi.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-left border-b border-slate-100">
              <tr>
                <th className="py-2 font-medium">Nome</th>
                <th className="py-2 font-medium">Contatti</th>
                <th className="py-2 font-medium">Kit</th>
                <th className="py-2 font-medium text-right">Totale ordinato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cliente.ragazzi.map((ragazzo) => {
                const totaleOrdinato = ragazzo.partecipazioni.reduce(
                  (s, p) => s + (p.ordine?.importoTotale ?? 0),
                  0
                );
                return (
                  <tr key={ragazzo.id}>
                    <td className="py-2 font-medium">{ragazzo.nome}</td>
                    <td className="py-2 text-slate-500">
                      {[ragazzo.email, ragazzo.cellulare].filter(Boolean).join(" · ") || "-"}
                    </td>
                    <td className="py-2">
                      {ragazzo.partecipazioni.map((p) => (
                        <Link
                          key={p.id}
                          href={`/kit/${p.kitId}`}
                          className="text-slate-900 hover:underline block"
                        >
                          {p.kit.nome}
                        </Link>
                      ))}
                    </td>
                    <td className="py-2 text-right">{formatEuro(totaleOrdinato)}</td>
                  </tr>
                );
              })}
              {cliente.ragazzi.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    Nessun ragazzo in anagrafica per questa società.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Documenti">
        <div className="space-y-4">
          <DocumentoForm action={uploadDocumento.bind(null, cliente.id, null)} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left border-b border-slate-100">
                <tr>
                  <th className="py-2 font-medium">Tipo</th>
                  <th className="py-2 font-medium">Nome</th>
                  <th className="py-2 font-medium">Ordine</th>
                  <th className="py-2 font-medium">Dimensione</th>
                  <th className="py-2 font-medium">Caricato il</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cliente.documenti.map((documento) => (
                  <tr key={documento.id}>
                    <td className="py-2">{TIPO_DOCUMENTO_LABELS[documento.tipo]}</td>
                    <td className="py-2">
                      <a
                        href={`/api/documenti/${documento.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-900 hover:underline"
                      >
                        {documento.nome}
                      </a>
                    </td>
                    <td className="py-2 text-slate-500">
                      {documento.ordine
                        ? documento.ordine.numero
                          ? `#${documento.ordine.numero}`
                          : "Ordine collegato"
                        : "-"}
                    </td>
                    <td className="py-2 text-slate-500">{formatBytes(documento.size)}</td>
                    <td className="py-2 text-slate-500">{formatData(documento.createdAt)}</td>
                    <td className="py-2 text-right">
                      <form
                        action={deleteDocumento.bind(
                          null,
                          documento.id,
                          cliente.id,
                          documento.ordineId
                        )}
                      >
                        <ConfirmSubmitButton
                          className="text-red-600 text-xs hover:underline"
                          confirmMessage="Eliminare questo documento?"
                        >
                          Elimina
                        </ConfirmSubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
                {cliente.documenti.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Nessun documento caricato.
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
