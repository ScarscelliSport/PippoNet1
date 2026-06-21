"use client";

import { inputClass, labelClass, buttonClass, buttonSecondaryClass } from "@/lib/ui";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ClienteDefaults = {
  nome?: string;
  referente?: string | null;
  telefono?: string | null;
  email?: string | null;
  indirizzo?: string | null;
  piva?: string | null;
  note?: string | null;
};

type ClienteSuggestion = {
  id: string;
  nome: string;
  referente: string | null;
  telefono: string | null;
  email: string | null;
  indirizzo: string | null;
  piva: string | null;
  note: string | null;
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
  const isEditMode = Boolean(defaults);

  const [nome, setNome] = useState(defaults?.nome ?? "");
  const [clienteId, setClienteId] = useState("");
  const [suggestions, setSuggestions] = useState<ClienteSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const referenteRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const indirizzoRef = useRef<HTMLInputElement>(null);
  const pivaRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditMode) return;
    const q = nome.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/clienti/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => setSuggestions(data))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [nome, isEditMode]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selezionaCliente(c: ClienteSuggestion) {
    setNome(c.nome);
    setClienteId(c.id);
    setOpen(false);
    if (referenteRef.current) referenteRef.current.value = c.referente ?? "";
    if (telefonoRef.current) telefonoRef.current.value = c.telefono ?? "";
    if (emailRef.current) emailRef.current.value = c.email ?? "";
    if (indirizzoRef.current) indirizzoRef.current.value = c.indirizzo ?? "";
    if (pivaRef.current) pivaRef.current.value = c.piva ?? "";
    if (noteRef.current) noteRef.current.value = c.note ?? "";
  }

  return (
    <form action={action} className="space-y-4">
      {!isEditMode && <input type="hidden" name="clienteId" value={clienteId} />}
      <div ref={containerRef} className="relative">
        <label className={labelClass} htmlFor="nome">
          Nome società sportiva *
        </label>
        <input
          id="nome"
          name="nome"
          required
          autoComplete="off"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setClienteId("");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={inputClass}
        />
        {!isEditMode && open && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-white text-slate-900 rounded-md shadow-lg border border-slate-200 max-h-60 overflow-y-auto z-10">
            {suggestions.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selezionaCliente(c)}
                className="w-full text-left block px-3 py-2 text-sm hover:bg-slate-50"
              >
                <span className="font-medium">{c.nome}</span>
                {c.referente && <span className="text-slate-400"> · {c.referente}</span>}
              </button>
            ))}
          </div>
        )}
        {!isEditMode && clienteId && (
          <p className="mt-1 text-xs text-amber-600">
            Cliente esistente selezionato: i dati salvati aggiorneranno questo cliente.
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="referente">
            Referente
          </label>
          <input
            id="referente"
            name="referente"
            ref={referenteRef}
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
            ref={telefonoRef}
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
            ref={emailRef}
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
            ref={pivaRef}
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
          ref={indirizzoRef}
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
          ref={noteRef}
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
