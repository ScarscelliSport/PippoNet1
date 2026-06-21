import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/clienti", label: "Clienti" },
  { href: "/ordini", label: "Ordini" },
  { href: "/lavorazioni", label: "Lavorazioni" },
];

export default function Nav() {
  return (
    <header className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Gestionale Forniture <span className="text-slate-400">Errea / Solo</span>
        </Link>
        <nav className="flex gap-1 text-sm items-center">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-md hover:bg-slate-700 transition"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="/api/export"
            className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 transition font-medium"
          >
            Esporta Excel
          </a>
        </nav>
      </div>
    </header>
  );
}
