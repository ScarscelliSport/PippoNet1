import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import ClienteForm from "@/components/ClienteForm";
import { updateCliente } from "@/app/clienti/actions";

export const dynamic = "force-dynamic";

export default async function EditClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Modifica cliente</h1>
      <Card>
        <ClienteForm
          action={updateCliente.bind(null, cliente.id)}
          defaults={cliente}
          cancelHref={`/clienti/${cliente.id}`}
        />
      </Card>
    </div>
  );
}
