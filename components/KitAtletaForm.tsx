"use client";

import { inputClass, buttonClass } from "@/lib/ui";
import { useEffect, useRef, useState } from "react";

type RagazzoSuggestion = {
  id: string;
  nome: string;
  email: string | null;
  cellulare: string | null;
  note: string | null;
};

export default function KitAtletaForm({
  action,
  clienteId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  clienteId: string;
}) {
  const [nome, setNome] = useState("");
  const [ragazzoId, setRagazzoId] = useState("");
  const [suggestions, setSuggestions] = useState<RagazzoSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const cellulareRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = nome.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/ragazzi/search?clienteId=${clienteId}&q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => setSuggestions(data))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [nome, clienteId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selezionaRagazzo(r: RagazzoSuggestion) {
    setNome(r.nome);
    setRagazzoId(r.id);
    setOpen(false);
    if (emailRef.current) emailRef.current.value = r.email ?? "";
    if (cellulareRef.current) cellulareRef.current.value = r.cellulare ?? "";
  }

  function reset() {
    setNome("");
    setRagazzoId("");
    if (emailRef.current) emailRef.current.value = "";
    if (cellulareRef.current) cellulareRef.current.value = "";
  }

  return (
    <form
      action={action}
      onSubmit={() => setTimeout(reset, 0)}
      className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end"
    >
      <input type="hidden" name="ragazzoId" value={ragazzoId} />
      <div ref={containerRef} className="sm:col-span-2 relative">
        <label className="block text-xs text-slate-500 mb-1">Nome ragazzo/a</label>
        <input
          name="nome"
          required
          autoComplete="off"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setRagazzoId("");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={inputClass}
        />
        {open && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-white text-slate-900 rounded-md shadow-lg border border-slate-200 max-h-60 overflow-y-auto z-10">
            {suggestions.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => selezionaRagazzo(r)}
                className="w-full text-left block px-3 py-2 text-sm hover:bg-slate-50"
              >
                <span className="font-medium">{r.nome}</span>
              </button>
            ))}
          </div>
        )}
        {ragazzoId && (
          <p className="mt-1 text-xs text-amber-600">
            Ragazzo già in anagrafica: lo riassocio a questo kit.
          </p>
        )}
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Email</label>
        <input type="email" name="email" ref={emailRef} className={inputClass} />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Cellulare</label>
        <input name="cellulare" ref={cellulareRef} className={inputClass} />
      </div>
      <div>
        <button type="submit" className={`${buttonClass} w-full`}>
          Aggiungi
        </button>
      </div>
    </form>
  );
}
