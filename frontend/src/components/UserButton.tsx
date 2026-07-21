import { useState } from "react";

export default function UserButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Simulazione dati utente - TODO: collegare al backend
  const user = {
    name: "Prof. Mario Rossi",
    email: "mario.rossi@scuola.it",
    role: "Docente"
  };

  const handleLogout = () => {
    if (confirm("Sei sicuro di voler effettuare il logout?")) {
      alert("Logout effettuato!");
      setIsOpen(false);
      // TODO: implementare logout reale
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
          {user.name.charAt(0)}
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl z-50">
            <div className="p-4 border-b border-slate-800">
              <p className="font-bold text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded">
                {user.role}
              </span>
            </div>
            <div className="p-2">
              <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                ⚙️ Impostazioni profilo
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                🔒 Cambia password
              </button>
              <hr className="border-slate-800 my-2" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}