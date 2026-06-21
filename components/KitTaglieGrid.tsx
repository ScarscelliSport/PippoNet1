import { buttonClass, inputClass } from "@/lib/ui";

type Prodotto = { id: string; nome: string };
type Atleta = { id: string; nome: string };
type Taglia = { kitAtletaId: string; kitProdottoId: string; taglia: string };

export default function KitTaglieGrid({
  action,
  atleti,
  prodotti,
  taglie,
}: {
  action: (formData: FormData) => void | Promise<void>;
  atleti: Atleta[];
  prodotti: Prodotto[];
  taglie: Taglia[];
}) {
  if (atleti.length === 0 || prodotti.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Aggiungi almeno un prodotto e un ragazzo per assegnare le taglie.
      </p>
    );
  }

  const taglieMap = new Map(taglie.map((t) => [`${t.kitAtletaId}_${t.kitProdottoId}`, t.taglia]));

  return (
    <form action={action} className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-left border-b border-slate-100">
            <tr>
              <th className="py-2 font-medium pr-4">Ragazzo/a</th>
              {prodotti.map((prodotto) => (
                <th key={prodotto.id} className="py-2 font-medium px-2">
                  {prodotto.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {atleti.map((atleta) => (
              <tr key={atleta.id}>
                <td className="py-2 pr-4 font-medium whitespace-nowrap">{atleta.nome}</td>
                {prodotti.map((prodotto) => (
                  <td key={prodotto.id} className="py-2 px-2">
                    <input
                      name={`taglia_${atleta.id}_${prodotto.id}`}
                      defaultValue={taglieMap.get(`${atleta.id}_${prodotto.id}`) ?? ""}
                      placeholder="-"
                      className={`${inputClass} w-20`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="submit" className={buttonClass}>
        Salva taglie
      </button>
    </form>
  );
}
