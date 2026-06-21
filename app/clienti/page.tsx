import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonClass } from "@/lib/ui";
import { formatEuro } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function ClientiPage() {
  const clienti = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
    include: {
      ordini: {
        include: { pagamenti: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clienti</h1>
        <Link href="/clienti/nuovo" className={buttonClass}>
          + Nuovo cliente
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nome</th>
              <th className="px-4 py-2.5 font-medium">Referente</th>
              <th className="px-4 py-2.5 font-medium">Contatti</th>
              <th className="px-4 py-2.5 font-medium text-right">Ordini</th>
              <th className="px-4 py-2.5 font-medium text-right">Da incassare</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clienti.map((cliente) => {
              const daIncassare = cliente.ordini.reduce((acc, ordine) => {
                const pagato = ordine.pagamenti.reduce((s, p) => s + p.importo, 0);
                return acc + Math.max(ordine.importoTotale - pagato, 0);
              }, 0);
              return (
                <tr key={cliente.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/clienti/${cliente.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {cliente.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {cliente.referente || "-"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {[cliente.telefono, cliente.email].filter(Boolean).join(" · ") || "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right">{cliente.ordini.length}</td>
                  <td className="px-4 py-2.5 text-right">
                    {daIncassare > 0 ? (
                      <span className="text-red-600 font-medium">
                        {formatEuro(daIncassare)}
                      </span>
                    ) : (
                      <span className="text-green-600">{formatEuro(0)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {clienti.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Nessun cliente registrato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
