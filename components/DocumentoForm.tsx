import { buttonClass, inputClass } from "@/lib/ui";
import { TIPO_DOCUMENTO_LABELS } from "@/lib/labels";

export default function DocumentoForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Tipo</label>
        <select name="tipo" defaultValue="DDT" className={inputClass}>
          {Object.entries(TIPO_DOCUMENTO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-slate-500 mb-1">File</label>
        <input type="file" name="file" required className={inputClass} />
      </div>
      <div>
        <button type="submit" className={`${buttonClass} w-full`}>
          Carica documento
        </button>
      </div>
    </form>
  );
}
