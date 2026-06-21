import { buttonClass, inputClass } from "@/lib/ui";

export default function KitProdottoForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
      <div className="sm:col-span-2">
        <label className="block text-xs text-slate-500 mb-1">Prodotto</label>
        <input name="nome" required placeholder="Es. Tuta, pallone..." className={inputClass} />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Prezzo unitario (€)</label>
        <input
          type="number"
          name="prezzoUnitario"
          step="0.01"
          min="0"
          required
          className={inputClass}
        />
      </div>
      <div>
        <button type="submit" className={`${buttonClass} w-full`}>
          Aggiungi prodotto
        </button>
      </div>
    </form>
  );
}
