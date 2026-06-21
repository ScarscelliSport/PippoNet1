import { buttonClass, inputClass } from "@/lib/ui";
import { formatDataInput } from "@/lib/labels";

export default function PagamentoForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
      <div className="sm:col-span-1">
        <label className="block text-xs text-slate-500 mb-1">Data</label>
        <input
          type="date"
          name="data"
          required
          defaultValue={formatDataInput(new Date())}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs text-slate-500 mb-1">Importo (€)</label>
        <input
          type="number"
          name="importo"
          step="0.01"
          min="0.01"
          required
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs text-slate-500 mb-1">Metodo</label>
        <input name="metodo" placeholder="Bonifico, contanti..." className={inputClass} />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs text-slate-500 mb-1">Note</label>
        <input name="note" className={inputClass} />
      </div>
      <div className="sm:col-span-1">
        <button type="submit" className={`${buttonClass} w-full`}>
          Registra pagamento
        </button>
      </div>
    </form>
  );
}
