import {
  LayoutDashboard,
  FileText,
  BookOpen,
  CalendarDays,
  MessageCircle,
  Settings,
  Clock3,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const items = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
  },
  {
    icon: FileText,
    label: "Circolari",
    path: "/circulars",
  },
  {
    icon: BookOpen,
    label: "Lezioni",
    path: "/lessons",
  },
  {
    icon: Clock3,
    label: "Registro Ore",
    path: "/hours",
  },
  {
    icon: CalendarDays,
    label: "Calendario",
    path: "/calendar",
  },
  {
    icon: MessageCircle,
    label: "AI Chat",
    path: "/chat",
  },
  {
    icon: Settings,
    label: "Impostazioni",
    path: "/settings",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-blue-400">
          🏫 SchoolAgent
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Assistente AI per docenti
        </p>
      </div>

      <nav className="flex flex-col gap-2 px-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              <Icon size={20} />

              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}