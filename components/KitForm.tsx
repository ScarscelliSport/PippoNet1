import Link from "next/link";
import { inputClass, labelClass, buttonClass, buttonSecondaryClass } from "@/lib/ui";
import { BRAND_LABELS } from "@/lib/labels";
import type { Brand } from "@/app/generated/prisma/client";

type Cliente = { id: string; nome: string };

type KitDefaults = {
  clienteId?: string;
  nome?: string;
  brand?: Brand;
  note?: string | null;
};

export default function KitForm({
  action,
  clienti,
  defaults,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  clienti: Cliente[];
  defaults?: KitDefaults;
  cancelHref: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="clienteId">
            Società sportiva *
          </label>
          <select
            id="clienteId"
            name="clienteId"
            required
            defaultValue={defaults?.clienteId ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Seleziona un cliente
            </option>
            {clienti.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="brand">
            Brand *
          </label>
          <select
            id="brand"
            name="brand"
            required
            defaultValue={defaults?.brand ?? "ERREA"}
            className={inputClass}
          >
            {Object.entries(BRAND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="nome">
          Nome kit / fascia età *
        </label>
        <input
          id="nome"
          name="nome"
          required
          placeholder="Es. Kit Esordienti 2016"
          defaultValue={defaults?.nome ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="note">
          Note
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          defaultValue={defaults?.note ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" className={buttonClass}>
          Salva
        </button>
        <Link href={cancelHref} className={buttonSecondaryClass}>
          Annulla
        </Link>
      </div>
    </form>
  );
}
