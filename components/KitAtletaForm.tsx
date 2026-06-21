import { buttonClass, inputClass } from "@/lib/ui";

export default function KitAtletaForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
      <div className="sm:col-span-2">
        <label className="block text-xs text-slate-500 mb-1">Nome ragazzo/a</label>
        <input name="nome" required className={inputClass} />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Email</label>
        <input type="email" name="email" className={inputClass} />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Cellulare</label>
        <input name="cellulare" className={inputClass} />
      </div>
      <div>
        <button type="submit" className={`${buttonClass} w-full`}>
          Aggiungi
        </button>
      </div>
    </form>
  );
}
