import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import KitProdottoForm from "@/components/KitProdottoForm";
import KitAtletaForm from "@/components/KitAtletaForm";
import KitTaglieGrid from "@/components/KitTaglieGrid";
import {
  deleteKit,
  updateStatoKit,
  createKitProdotto,
  deleteKitProdotto,
  createKitAtleta,
  deleteKitAtleta,
  saveTaglie,
} from "@/app/kit/actions";
import { BRAND_LABELS, KIT_STATO_COLORS, KIT_STATO_LABELS, formatEuro } from "@/lib/labels";
import { buttonSecondaryClass, buttonDangerClass, inputClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function KitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kit = await prisma.kit.findUnique({
    where: { id },
    include: {
      cliente: true,
      ordine: true,
      prodotti: { orderBy: { createdAt: "asc" } },
      atleti: {
        orderBy: { createdAt: "asc" },
        include: { taglie: true },
      },
    },
  });

  if (!kit) notFound();

  const taglie = kit.atleti.flatMap((a) =>
    a.taglie.map((t) => ({
      kitAtletaId: t.kitAtletaId,
      kitProdottoId: t.kitProdottoId,
      taglia: t.taglia,
    }))
  );

  const prezziProdotti = new Map(kit.prodotti.map((p) => [p.id, p.prezzoUnitario]));
  const importoStimato = taglie.reduce((s, t) => s + (prezziProdotti.get(t.kitProdottoId) ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{kit.nome}</h1>
          <Link href={`/clienti/${kit.clienteId}`} className="text-slate-500 hover:underline">
            {kit.cliente.nome}
          </Link>
          <span className="text-slate-400"> · {BRAND_LABELS[kit.brand]}</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/kit/${kit.id}/edit`} className={buttonSecondaryClass}>
            Modifica
          </Link>
          <form action={deleteKit.bind(null, kit.id)}>
            <ConfirmSubmitButton
              className={buttonDangerClass}
              confirmMessage="Eliminare questo kit? Verranno eliminati anche prodotti, ragazzi e taglie collegate."
            >
              Elimina
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Stato kit">
          <AutoSubmitSelect
            action={updateStatoKit.bind(null, kit.id)}
            name="stato"
            defaultValue={kit.stato}
            className={`${inputClass} ${KIT_STATO_COLORS[kit.stato]} border-0 font-medium`}
            options={Object.entries(KIT_STATO_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Card>
        <Card title="Importo stimato">
          <p className="text-2xl font-semibold">{formatEuro(importoStimato)}</p>
          <p className="text-xs text-slate-400 mt-1">Somma dei prodotti con taglia assegnata</p>
        </Card>
        <Card title="Ordine collegato">
          {kit.ordine ? (
            <Link
              href={`/ordini/${kit.ordine.id}`}
              className="text-slate-900 font-medium hover:underline"
            >
              Vai all&apos;ordine {kit.ordine.numero ? `#${kit.ordine.numero}` : ""}
            </Link>
          ) : (
            <p className="text-sm text-slate-400">
              Verrà creato automaticamente quando il kit passa a &quot;Ordinato&quot;.
            </p>
          )}
        </Card>
      </div>

      {kit.note && (
        <Card title="Note">
          <p className="text-sm whitespace-pre-wrap">{kit.note}</p>
        </Card>
      )}

      <Card title="Prodotti del campionario">
        <div className="space-y-4">
          <KitProdottoForm action={createKitProdotto.bind(null, kit.id)} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left border-b border-slate-100">
                <tr>
                  <th className="py-2 font-medium">Prodotto</th>
                  <th className="py-2 font-medium text-right">Prezzo unitario</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kit.prodotti.map((prodotto) => (
                  <tr key={prodotto.id}>
                    <td className="py-2">{prodotto.nome}</td>
                    <td className="py-2 text-right">{formatEuro(prodotto.prezzoUnitario)}</td>
                    <td className="py-2 text-right">
                      <form action={deleteKitProdotto.bind(null, prodotto.id, kit.id)}>
                        <ConfirmSubmitButton
                          className="text-red-600 text-xs hover:underline"
                          confirmMessage="Eliminare questo prodotto?"
                        >
                          Elimina
                        </ConfirmSubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
                {kit.prodotti.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      Nessun prodotto scelto.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card title="Ragazzi">
        <div className="space-y-4">
          <KitAtletaForm action={createKitAtleta.bind(null, kit.id)} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left border-b border-slate-100">
                <tr>
                  <th className="py-2 font-medium">Nome</th>
                  <th className="py-2 font-medium">Email</th>
                  <th className="py-2 font-medium">Cellulare</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kit.atleti.map((atleta) => (
                  <tr key={atleta.id}>
                    <td className="py-2">{atleta.nome}</td>
                    <td className="py-2 text-slate-500">{atleta.email || "-"}</td>
                    <td className="py-2 text-slate-500">{atleta.cellulare || "-"}</td>
                    <td className="py-2 text-right">
                      <form action={deleteKitAtleta.bind(null, atleta.id, kit.id)}>
                        <ConfirmSubmitButton
                          className="text-red-600 text-xs hover:underline"
                          confirmMessage="Eliminare questo ragazzo?"
                        >
                          Elimina
                        </ConfirmSubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
                {kit.atleti.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Nessun ragazzo aggiunto.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card title="Taglie">
        <KitTaglieGrid
          action={saveTaglie.bind(null, kit.id)}
          atleti={kit.atleti}
          prodotti={kit.prodotti}
          taglie={taglie}
        />
      </Card>
    </div>
  );
}
