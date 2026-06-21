import { buttonClass, inputClass } from "@/lib/ui";
import { TIPO_LAVORAZIONE_LABELS, STATO_LAVORAZIONE_LABELS } from "@/lib/labels";

export default function LavorazioneForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
      <div className="sm:col-span-1">
        <label className="block text-xs text-slate-500 mb-1">Tipo</label>
        <select name="tipo" defaultValue="STAMPA" className={inputClass}>
          {Object.entries(TIPO_LAVORAZIONE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-slate-500 mb-1">Descrizione</label>
        <input name="descrizione" placeholder="es. Logo sponsor petto" className={inputClass} />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs text-slate-500 mb-1">Fornitore</label>
        <input name="fornitore" className={inputClass} />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs text-slate-500 mb-1">Costo (€)</label>
        <input
          type="number"
          name="costo"
          step="0.01"
          min="0"
          required
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs text-slate-500 mb-1">Stato</label>
        <select name="stato" defaultValue="DA_FARE" className={inputClass}>
          {Object.entries(STATO_LAVORAZIONE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-6">
        <button type="submit" className={buttonClass}>
          Aggiungi lavorazione
        </button>
      </div>
    </form>
  );
}
