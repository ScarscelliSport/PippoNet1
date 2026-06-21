"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function Bruno() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading]);

  async function invia() {
    const testo = input.trim();
    if (!testo || loading) return;
    const nuovi: Message[] = [...messages, { role: "user", content: testo }];
    setMessages(nuovi);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/bruno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nuovi }),
      });
      if (res.status === 503) {
        setNotConfigured(true);
        return;
      }
      const data = await res.json();
      setMessages([...nuovi, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...nuovi,
        { role: "assistant", content: "Si è verificato un errore. Riprova." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 w-80 sm:w-96 h-[28rem] bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <span className="font-semibold">BRUNO · Assistente AI</span>
            <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-white">
              ✕
            </button>
          </div>

          {notConfigured ? (
            <div className="flex-1 flex items-center justify-center p-4 text-center text-sm text-slate-500">
              BRUNO non è ancora configurato.
              <br />
              Aggiungi <code className="bg-slate-100 px-1 rounded">ANTHROPIC_API_KEY</code> al
              file <code className="bg-slate-100 px-1 rounded">.env</code> per attivarlo.
            </div>
          ) : (
            <>
              <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && (
                  <p className="text-sm text-slate-400 text-center mt-8">
                    Ciao, sono BRUNO 👋
                    <br />
                    Chiedimi qualsiasi cosa su clienti, ordini, lavorazioni o pagamenti.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`text-sm rounded-md px-3 py-2 max-w-[85%] whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-slate-900 text-white ml-auto"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                {loading && (
                  <div className="bg-slate-100 text-slate-400 text-sm rounded-md px-3 py-2 max-w-[85%]">
                    BRUNO sta pensando...
                  </div>
                )}
              </div>
              <div className="border-t border-slate-200 p-2 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      invia();
                    }
                  }}
                  placeholder="Scrivi a BRUNO..."
                  className="flex-1 border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <button
                  onClick={invia}
                  disabled={loading}
                  className="rounded-md bg-slate-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-slate-700 transition disabled:opacity-50"
                >
                  Invia
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full bg-slate-900 hover:bg-slate-700 transition text-white w-14 h-14 shadow-lg flex items-center justify-center font-semibold"
        aria-label="Apri BRUNO"
      >
        {open ? "✕" : "B"}
      </button>
    </div>
  );
}
