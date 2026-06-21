import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import {
  BRAND_LABELS,
  STATO_CONSEGNA_COLORS,
  STATO_CONSEGNA_LABELS,
  STATO_PAGAMENTO_COLORS,
  STATO_PAGAMENTO_LABELS,
  formatData,
  formatEuro,
  statoPagamentoOrdine,
} from "@/lib/labels";
import type { Brand } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ordini = await prisma.ordine.findMany({
    include: { cliente: true, pagamenti: true, lavorazioni: true },
    orderBy: { dataOrdine: "desc" },
  });

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);

  let daIncassareTotale = 0;
  let incassatoMese = 0;
  let speseLavorazioniTotale = 0;
  let ordiniAperti = 0;

  const consegneInRitardo: typeof ordini = [];
  const prossimeConsegne: typeof ordini = [];
  const ordiniConResiduo: { ordine: (typeof ordini)[number]; residuo: number }[] = [];

  for (const ordine of ordini) {
    const pagato = ordine.pagamenti.reduce((s, p) => s + p.importo, 0);
    const residuo = Math.max(ordine.importoTotale - pagato, 0);
    daIncassareTotale += residuo;
    speseLavorazioniTotale += ordine.lavorazioni.reduce((s, l) => s + l.costo, 0);

    for (const pagamento of ordine.pagamenti) {
      if (new Date(pagamento.data) >= inizioMese) {
        incassatoMese += pagamento.importo;
      }
    }

    const consegnaAperta = !["CONSEGNATO", "ANNULLATO"].includes(ordine.statoConsegna);
    if (consegnaAperta) {
      ordiniAperti += 1;
      if (ordine.dataConsegnaPrevista && new Date(ordine.dataConsegnaPrevista) < oggi) {
        consegneInRitardo.push(ordine);
      } else if (ordine.dataConsegnaPrevista) {
        prossimeConsegne.push(ordine);
      }
    }

    if (residuo > 0) {
      ordiniConResiduo.push({ ordine, residuo });
    }
  }

  prossimeConsegne.sort(
    (a, b) =>
      new Date(a.dataConsegnaPrevista!).getTime() - new Date(b.dataConsegnaPrevista!).getTime()
  );
  consegneInRitardo.sort(
    (a, b) =>
      new Date(a.dataConsegnaPrevista!).getTime() - new Date(b.dataConsegnaPrevista!).getTime()
  );
  ordiniConResiduo.sort((a, b) => b.residuo - a.residuo);

  const margineTotale =
    ordini.reduce((s, o) => s + o.importoTotale, 0) - speseLavorazioniTotale;

  const fatturatoPerBrand: Record<Brand, { totale: number; ordini: number }> = {
    ERREA: { totale: 0, ordini: 0 },
    SOLO: { totale: 0, ordini: 0 },
  };
  for (const ordine of ordini) {
    fatturatoPerBrand[ordine.brand].totale += ordine.importoTotale;
    fatturatoPerBrand[ordine.brand].ordini += 1;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Da incassare">
          <p className="text-2xl font-semibold text-red-600">
            {formatEuro(daIncassareTotale)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            su {ordiniConResiduo.length} ordini non saldati
          </p>
        </Card>
        <Card title="Incassato questo mese">
          <p className="text-2xl font-semibold text-green-600">{formatEuro(incassatoMese)}</p>
        </Card>
        <Card title="Ordini aperti">
          <p className="text-2xl font-semibold">{ordiniAperti}</p>
          <p className="text-xs text-slate-400 mt-1">
            di cui {consegneInRitardo.length} in ritardo
          </p>
        </Card>
        <Card title="Spese lavorazioni">
          <p className="text-2xl font-semibold">{formatEuro(speseLavorazioniTotale)}</p>
          <p className="text-xs text-slate-400 mt-1">
            Margine stimato: {formatEuro(margineTotale)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Fatturato per brand">
          <div className="space-y-3">
            {Object.entries(fatturatoPerBrand).map(([brand, dati]) => (
              <div key={brand} className="flex items-center justify-between text-sm">
                <span className="font-medium">{BRAND_LABELS[brand as Brand]}</span>
                <span className="text-slate-500">{dati.ordini} ordini</span>
                <span className="font-semibold">{formatEuro(dati.totale)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Consegne in ritardo">
          {consegneInRitardo.length === 0 ? (
            <p className="text-sm text-slate-400">Nessuna consegna in ritardo.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {consegneInRitardo.slice(0, 6).map((ordine) => (
                <li key={ordine.id} className="flex items-center justify-between">
                  <Link href={`/ordini/${ordine.id}`} className="hover:underline">
                    {ordine.cliente.nome}
                  </Link>
                  <span className="text-red-600">
                    prevista {formatData(ordine.dataConsegnaPrevista)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Prossime consegne">
        {prossimeConsegne.length === 0 ? (
          <p className="text-sm text-slate-400">Nessuna consegna in programma.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left border-b border-slate-100">
                <tr>
                  <th className="py-2 font-medium">Cliente</th>
                  <th className="py-2 font-medium">Brand</th>
                  <th className="py-2 font-medium">Consegna prevista</th>
                  <th className="py-2 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prossimeConsegne.slice(0, 8).map((ordine) => (
                  <tr key={ordine.id}>
                    <td className="py-2">
                      <Link href={`/ordini/${ordine.id}`} className="hover:underline">
                        {ordine.cliente.nome}
                      </Link>
                    </td>
                    <td className="py-2">{BRAND_LABELS[ordine.brand]}</td>
                    <td className="py-2">{formatData(ordine.dataConsegnaPrevista)}</td>
                    <td className="py-2">
                      <Badge
                        label={STATO_CONSEGNA_LABELS[ordine.statoConsegna]}
                        className={STATO_CONSEGNA_COLORS[ordine.statoConsegna]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Pagamenti in sospeso">
        {ordiniConResiduo.length === 0 ? (
          <p className="text-sm text-slate-400">Tutti gli ordini sono saldati.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left border-b border-slate-100">
                <tr>
                  <th className="py-2 font-medium">Cliente</th>
                  <th className="py-2 font-medium">Data ordine</th>
                  <th className="py-2 font-medium text-right">Importo</th>
                  <th className="py-2 pr-4 font-medium text-right">Residuo</th>
                  <th className="py-2 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordiniConResiduo.slice(0, 10).map(({ ordine, residuo }) => {
                  const pagato = ordine.pagamenti.reduce((s, p) => s + p.importo, 0);
                  const stato = statoPagamentoOrdine(ordine.importoTotale, pagato);
                  return (
                    <tr key={ordine.id}>
                      <td className="py-2">
                        <Link href={`/ordini/${ordine.id}`} className="hover:underline">
                          {ordine.cliente.nome}
                        </Link>
                      </td>
                      <td className="py-2">{formatData(ordine.dataOrdine)}</td>
                      <td className="py-2 text-right">{formatEuro(ordine.importoTotale)}</td>
                      <td className="py-2 pr-4 text-right text-red-600 font-medium">
                        {formatEuro(residuo)}
                      </td>
                      <td className="py-2">
                        <Badge
                          label={STATO_PAGAMENTO_LABELS[stato]}
                          className={STATO_PAGAMENTO_COLORS[stato]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
