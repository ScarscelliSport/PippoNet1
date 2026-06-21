import Card from "@/components/Card";
import ClienteForm from "@/components/ClienteForm";
import { createCliente } from "@/app/clienti/actions";

export default function NuovoClientePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Nuovo cliente</h1>
      <Card>
        <ClienteForm action={createCliente} cancelHref="/clienti" />
      </Card>
    </div>
  );
}
