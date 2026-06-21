import Card from "@/components/Card";
import OrdineForm from "@/components/OrdineForm";
import { createOrdine } from "@/app/ordini/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NuovoOrdinePage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const { clienteId } = await searchParams;
  const clienti = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Nuovo ordine</h1>
      <Card>
        <OrdineForm
          action={createOrdine}
          clienti={clienti}
          defaults={clienteId ? { clienteId } : undefined}
          cancelHref="/ordini"
        />
      </Card>
    </div>
  );
}
