import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import OrdineForm from "@/components/OrdineForm";
import { updateOrdine } from "@/app/ordini/actions";

export default async function EditOrdinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ordine, clienti] = await Promise.all([
    prisma.ordine.findUnique({ where: { id } }),
    prisma.cliente.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  if (!ordine) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Modifica ordine</h1>
      <Card>
        <OrdineForm
          action={updateOrdine.bind(null, ordine.id)}
          clienti={clienti}
          defaults={ordine}
          cancelHref={`/ordini/${ordine.id}`}
        />
      </Card>
    </div>
  );
}
