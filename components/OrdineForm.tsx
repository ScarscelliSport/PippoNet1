import Link from "next/link";
import { inputClass, labelClass, buttonClass, buttonSecondaryClass } from "@/lib/ui";
import {
  BRAND_LABELS,
  STATO_CONSEGNA_LABELS,
  TIPO_ORDINE_LABELS,
  formatDataInput,
} from "@/lib/labels";
import type { Brand, StatoConsegna, TipoOrdine } from "@/app/generated/prisma/client";

type Cliente = { id: string; nome: string };

type OrdineDefaults = {
  clienteId?: string;
  brand?: Brand;
  tipo?: TipoOrdine;
  numero?: string | null;
  descrizione?: string | null;
  importoTotale?: number;
  dataOrdine?: Date | string | null;
  dataConsegnaPrevista?: Date | string | null;
  dataConsegnaEffettiva?: Date | string | null;
  statoConsegna?: StatoConsegna;
  note?: string | null;
};

export default function OrdineForm({
  action,
  clienti,
  defaults,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  clienti: Cliente[];
  defaults?: OrdineDefaults;
  cancelHref: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="clienteId">
            Cliente *
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
          <label className={labelClass} htmlFor="numero">
            Numero ordine
          </label>
          <input
            id="numero"
            name="numero"
            defaultValue={defaults?.numero ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div>
          <label className={labelClass} htmlFor="tipo">
            Tipo *
          </label>
          <select
            id="tipo"
            name="tipo"
            required
            defaultValue={defaults?.tipo ?? "ORDINE"}
            className={inputClass}
          >
            {Object.entries(TIPO_ORDINE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="descrizione">
          Descrizione (capi, taglie, quantità...)
        </label>
        <textarea
          id="descrizione"
          name="descrizione"
          rows={3}
          defaultValue={defaults?.descrizione ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="importoTotale">
            Importo totale (€) *
          </label>
          <input
            id="importoTotale"
            name="importoTotale"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaults?.importoTotale ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="dataOrdine">
            Data ordine *
          </label>
          <input
            id="dataOrdine"
            name="dataOrdine"
            type="date"
            required
            defaultValue={formatDataInput(defaults?.dataOrdine) || formatDataInput(new Date())}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="dataConsegnaPrevista">
            Consegna prevista
          </label>
          <input
            id="dataConsegnaPrevista"
            name="dataConsegnaPrevista"
            type="date"
            defaultValue={formatDataInput(defaults?.dataConsegnaPrevista)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="statoConsegna">
            Stato consegna
          </label>
          <select
            id="statoConsegna"
            name="statoConsegna"
            defaultValue={defaults?.statoConsegna ?? "DA_ORDINARE"}
            className={inputClass}
          >
            {Object.entries(STATO_CONSEGNA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="dataConsegnaEffettiva">
            Data consegna effettiva
          </label>
          <input
            id="dataConsegnaEffettiva"
            name="dataConsegnaEffettiva"
            type="date"
            defaultValue={formatDataInput(defaults?.dataConsegnaEffettiva)}
            className={inputClass}
          />
        </div>
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
