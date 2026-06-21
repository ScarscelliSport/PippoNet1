import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import KitForm from "@/components/KitForm";
import { updateKit } from "@/app/kit/actions";

export default async function EditKitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [kit, clienti] = await Promise.all([
    prisma.kit.findUnique({ where: { id } }),
    prisma.cliente.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  if (!kit) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Modifica kit</h1>
      <Card>
        <KitForm
          action={updateKit.bind(null, kit.id)}
          clienti={clienti}
          defaults={kit}
          cancelHref={`/kit/${kit.id}`}
        />
      </Card>
    </div>
  );
}
