import Card from "@/components/Card";
import KitForm from "@/components/KitForm";
import { createKit } from "@/app/kit/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NuovoKitPage({
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
      <h1 className="text-2xl font-semibold">Nuovo kit</h1>
      <Card>
        <KitForm
          action={createKit}
          clienti={clienti}
          defaults={clienteId ? { clienteId } : undefined}
          cancelHref="/kit"
        />
      </Card>
    </div>
  );
}
