import { Bell, Search, UserCircle2 } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-8 py-5">
      <div className="flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-2">
        <Search size={18} />

        <input
          placeholder="Cerca..."
          className="bg-transparent outline-none"
        />
      </div>

      <div className="flex items-center gap-5">
        <Bell />

        <UserCircle2 size={34} />
      </div>
    </header>
  );
}