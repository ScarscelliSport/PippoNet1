import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import PagamentoForm from "@/components/PagamentoForm";
import LavorazioneForm from "@/components/LavorazioneForm";
import DocumentoForm from "@/components/DocumentoForm";
import {
  deleteOrdine,
  updateStatoConsegnaOrdine,
  createPagamento,
  deletePagamento,
  createLavorazione,
  updateStatoLavorazione,
  deleteLavorazione,
} from "@/app/ordini/actions";
import { uploadDocumento, deleteDocumento } from "@/app/documenti/actions";
import {
  BRAND_LABELS,
  STATO_CONSEGNA_COLORS,
  STATO_CONSEGNA_LABELS,
  STATO_LAVORAZIONE_COLORS,
  STATO_LAVORAZIONE_LABELS,
  STATO_PAGAMENTO_COLORS,
  STATO_PAGAMENTO_LABELS,
  TIPO_DOCUMENTO_LABELS,
  TIPO_LAVORAZIONE_LABELS,
  TIPO_ORDINE_LABELS,
  formatBytes,
  formatData,
  formatEuro,
  statoPagamentoOrdine,
} from "@/lib/labels";
import { buttonClass, buttonSecondaryClass, buttonDangerClass, inputClass } from "@/lib/ui";

export default async function OrdineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ordine = await prisma.ordine.findUnique({
    where: { id },
    include: {
      cliente: true,
      pagamenti: { orderBy: { data: "desc" } },
      lavorazioni: { orderBy: { createdAt: "desc" } },
      documenti: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!ordine) notFound();

  const totalePagato = ordine.pagamenti.reduce((s, p) => s + p.importo, 0);
  const residuo = Math.max(ordine.importoTotale - totalePagato, 0);
  const statoPag = statoPagamentoOrdine(ordine.importoTotale, totalePagato);
  const totaleLavorazioni = ordine.lavorazioni.reduce((s, l) => s + l.costo, 0);
  const margine = ordine.importoTotale - totaleLavorazioni;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Ordine {ordine.numero ? `#${ordine.numero}` : ""}{" "}
            <span className="text-slate-400 font-normal">
              {BRAND_LABELS[ordine.brand]} · {TIPO_ORDINE_LABELS[ordine.tipo]}
            </span>
          </h1>
          <Link href={`/clienti/${ordine.clienteId}`} className="text-slate-500 hover:underline">
            {ordine.cliente.nome}
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href={`/ordini/${ordine.id}/edit`} className={buttonSecondaryClass}>
            Modifica
          </Link>
          <form action={deleteOrdine.bind(null, ordine.id)}>
            <ConfirmSubmitButton
              className={buttonDangerClass}
              confirmMessage="Eliminare questo ordine? Verranno eliminati anche pagamenti e lavorazioni collegate."
            >
              Elimina
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Importo ordine">
          <p className="text-2xl font-semibold">{formatEuro(ordine.importoTotale)}</p>
        </Card>
        <Card title="Situazione pagamento">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              label={STATO_PAGAMENTO_LABELS[statoPag]}
              className={STATO_PAGAMENTO_COLORS[statoPag]}
            />
          </div>
          <p className="text-sm text-slate-500">
            Pagato {formatEuro(totalePagato)} · Residuo{" "}
            <span className={residuo > 0 ? "text-red-600 font-medium" : ""}>
              {formatEuro(residuo)}
            </span>
          </p>
        </Card>
        <Card title="Stato consegna">
          <AutoSubmitSelect
            action={updateStatoConsegnaOrdine.bind(null, ordine.id)}
            name="statoConsegna"
            defaultValue={ordine.statoConsegna}
            className={`${inputClass} ${STATO_CONSEGNA_COLORS[ordine.statoConsegna]} border-0 font-medium`}
            options={Object.entries(STATO_CONSEGNA_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <p className="text-xs text-slate-400 mt-2">
            Prevista: {formatData(ordine.dataConsegnaPrevista)}
            {ordine.dataConsegnaEffettiva && (
              <> · Consegnata: {formatData(ordine.dataConsegnaEffettiva)}</>
            )}
          </p>
        </Card>
      </div>

      {(ordine.descrizione || ordine.note) && (
        <Card title="Dettagli">
          {ordine.descrizione && (
            <p className="text-sm whitespace-pre-wrap mb-2">{ordine.descrizione}</p>
          )}
          {ordine.note && (
            <p className="text-sm text-slate-500 whitespace-pre-wrap">Note: {ordine.note}</p>
          )}
        </Card>
      )}

      <Card title="Pagamenti">
        <div className="space-y-4">
          <PagamentoForm action={createPagamento.bind(null, ordine.id)} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left border-b border-slate-100">
                <tr>
                  <th className="py-2 font-medium">Data</th>
                  <th className="py-2 font-medium">Importo</th>
                  <th className="py-2 font-medium">Metodo</th>
                  <th className="py-2 font-medium">Note</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordine.pagamenti.map((pagamento) => (
                  <tr key={pagamento.id}>
                    <td className="py-2">{formatData(pagamento.data)}</td>
                    <td className="py-2 font-medium">{formatEuro(pagamento.importo)}</td>
                    <td className="py-2 text-slate-500">{pagamento.metodo || "-"}</td>
                    <td className="py-2 text-slate-500">{pagamento.note || "-"}</td>
                    <td className="py-2 text-right">
                      <form action={deletePagamento.bind(null, pagamento.id, ordine.id)}>
                        <ConfirmSubmitButton
                          className="text-red-600 text-xs hover:underline"
                          confirmMessage="Eliminare questo pagamento?"
                        >
                          Elimina
                        </ConfirmSubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
                {ordine.pagamenti.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Nessun pagamento registrato.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card title="Lavorazioni: stampe, ricami e altre spese">
        <div className="space-y-4">
          <LavorazioneForm action={createLavorazione.bind(null, ordine.id)} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left border-b border-slate-100">
                <tr>
                  <th className="py-2 font-medium">Tipo</th>
                  <th className="py-2 font-medium">Descrizione</th>
                  <th className="py-2 font-medium">Fornitore</th>
                  <th className="py-2 pr-4 font-medium text-right">Costo</th>
                  <th className="py-2 font-medium">Stato</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordine.lavorazioni.map((lavorazione) => (
                  <tr key={lavorazione.id}>
                    <td className="py-2">{TIPO_LAVORAZIONE_LABELS[lavorazione.tipo]}</td>
                    <td className="py-2 text-slate-500">{lavorazione.descrizione || "-"}</td>
                    <td className="py-2 text-slate-500">{lavorazione.fornitore || "-"}</td>
                    <td className="py-2 pr-4 text-right">{formatEuro(lavorazione.costo)}</td>
                    <td className="py-2">
                      <AutoSubmitSelect
                        action={updateStatoLavorazione.bind(null, lavorazione.id, ordine.id)}
                        name="stato"
                        defaultValue={lavorazione.stato}
                        className={`rounded-full text-xs px-2 py-1 border-0 font-medium ${STATO_LAVORAZIONE_COLORS[lavorazione.stato]}`}
                        options={Object.entries(STATO_LAVORAZIONE_LABELS).map(
                          ([value, label]) => ({ value, label })
                        )}
                      />
                    </td>
                    <td className="py-2 text-right">
                      <form action={deleteLavorazione.bind(null, lavorazione.id, ordine.id)}>
                        <ConfirmSubmitButton
                          className="text-red-600 text-xs hover:underline"
                          confirmMessage="Eliminare questa lavorazione?"
                        >
                          Elimina
                        </ConfirmSubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
                {ordine.lavorazioni.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Nessuna lavorazione registrata.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {ordine.lavorazioni.length > 0 && (
            <p className="text-sm text-slate-500 pt-2 border-t border-slate-100">
              Totale spese lavorazioni: <span className="font-medium">{formatEuro(totaleLavorazioni)}</span>
              {" · "}Margine stimato:{" "}
              <span className={margine < 0 ? "text-red-600 font-medium" : "font-medium"}>
                {formatEuro(margine)}
              </span>
            </p>
          )}
        </div>
      </Card>

      <Card title="Documenti: DDT, fatture e altri allegati">
        <div className="space-y-4">
          <DocumentoForm action={uploadDocumento.bind(null, ordine.clienteId, ordine.id)} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left border-b border-slate-100">
                <tr>
                  <th className="py-2 font-medium">Tipo</th>
                  <th className="py-2 font-medium">Nome</th>
                  <th className="py-2 font-medium">Dimensione</th>
                  <th className="py-2 font-medium">Caricato il</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordine.documenti.map((documento) => (
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
                    <td className="py-2 text-slate-500">{formatBytes(documento.size)}</td>
                    <td className="py-2 text-slate-500">{formatData(documento.createdAt)}</td>
                    <td className="py-2 text-right">
                      <form
                        action={deleteDocumento.bind(
                          null,
                          documento.id,
                          ordine.clienteId,
                          ordine.id
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
                {ordine.documenti.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Nessun documento caricato per questo ordine.
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
