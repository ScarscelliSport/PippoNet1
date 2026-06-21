import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Badge from "@/components/Badge";
import { buttonClass } from "@/lib/ui";
import { BRAND_LABELS, KIT_STATO_COLORS, KIT_STATO_LABELS, formatData } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function KitPage() {
  const kit = await prisma.kit.findMany({
    include: { cliente: true, atleti: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Gestione kit</h1>
        <Link href="/kit/nuovo" className={buttonClass}>
          + Nuovo kit
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Kit</th>
              <th className="px-4 py-2.5 font-medium">Cliente</th>
              <th className="px-4 py-2.5 font-medium">Brand</th>
              <th className="px-4 py-2.5 font-medium">Ragazzi</th>
              <th className="px-4 py-2.5 font-medium">Stato</th>
              <th className="px-4 py-2.5 font-medium">Creato il</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {kit.map((k) => (
              <tr key={k.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/kit/${k.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {k.nome}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/clienti/${k.clienteId}`} className="hover:underline">
                    {k.cliente.nome}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{BRAND_LABELS[k.brand]}</td>
                <td className="px-4 py-2.5">{k.atleti.length}</td>
                <td className="px-4 py-2.5">
                  <Badge label={KIT_STATO_LABELS[k.stato]} className={KIT_STATO_COLORS[k.stato]} />
                </td>
                <td className="px-4 py-2.5">{formatData(k.createdAt)}</td>
              </tr>
            ))}
            {kit.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Nessun kit registrato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
