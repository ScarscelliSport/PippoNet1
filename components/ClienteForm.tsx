import { inputClass, labelClass, buttonClass, buttonSecondaryClass } from "@/lib/ui";
import Link from "next/link";

type ClienteDefaults = {
  nome?: string;
  referente?: string | null;
  telefono?: string | null;
  email?: string | null;
  indirizzo?: string | null;
  piva?: string | null;
  note?: string | null;
};

export default function ClienteForm({
  action,
  defaults,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: ClienteDefaults;
  cancelHref: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="nome">
          Nome società sportiva *
        </label>
        <input
          id="nome"
          name="nome"
          required
          defaultValue={defaults?.nome}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="referente">
            Referente
          </label>
          <input
            id="referente"
            name="referente"
            defaultValue={defaults?.referente ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="telefono">
            Telefono
          </label>
          <input
            id="telefono"
            name="telefono"
            defaultValue={defaults?.telefono ?? ""}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={defaults?.email ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="piva">
            P.IVA / Cod. Fiscale
          </label>
          <input
            id="piva"
            name="piva"
            defaultValue={defaults?.piva ?? ""}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="indirizzo">
          Indirizzo
        </label>
        <input
          id="indirizzo"
          name="indirizzo"
          defaultValue={defaults?.indirizzo ?? ""}
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
          rows={3}
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
