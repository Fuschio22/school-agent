import { Bell, UserCircle2 } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-8 py-5">
      {/* Spazio vuoto a sinistra (la ricerca è solo in Circolari) */}
      <div className="w-64"></div>

      <div className="flex items-center gap-5">
        <Bell />
        <UserCircle2 size={34} />
      </div>
    </header>
  );
}