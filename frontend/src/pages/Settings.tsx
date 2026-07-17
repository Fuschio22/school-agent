import { useState, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://school-agent-backend.onrender.com";

export default function Settings() {
  const [classesInput, setClassesInput] = useState("");
  const [savedClasses, setSavedClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Carica le classi salvate all'avvio
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/users/classes`);
        const data = await response.json();
        if (data.classes) {
          setSavedClasses(data.classes);
          setClassesInput(data.classes.join(", "));
        }
      } catch (error) {
        console.error("Errore nel recupero delle classi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Salva le classi
  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    
    // Trasforma la stringa separata da virgole in un array pulito
    const classesArray = classesInput
      .split(",")
      .map(c => c.trim())
      .filter(c => c.length > 0);

    try {
      const response = await fetch(`${BACKEND_URL}/api/users/classes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classes: classesArray }),
      });

      const data = await response.json();

      if (response.ok) {
        setSavedClasses(data.classes);
        setMessage("✅ Classi salvate con successo!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Errore: " + data.error);
      }
    } catch (error) {
      console.error("Errore salvataggio:", error);
      setMessage("❌ Errore di connessione al server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">Impostazioni</h1>
        <p className="text-slate-400">Caricamento impostazioni...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Impostazioni</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">Le mie Classi</h2>
        <p className="text-slate-400 mb-4 text-sm">
          Inserisci le classi di cui sei titolare o che ti interessano, separate da virgola. 
          Il sistema userà questo elenco per filtrare il Calendario e rispondere alle domande della Chat.
        </p>

        <textarea
          value={classesInput}
          onChange={(e) => setClassesInput(e.target.value)}
          placeholder="Es: 3A, 4B, 5C, 2D"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          rows={3}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
        >
          {saving ? "Salvataggio in corso..." : "💾 Salva Classi"}
        </button>

        {message && (
          <p className={`mt-4 text-sm font-medium ${message.includes("✅") ? "text-green-400" : "text-red-400"}`}>
            {message}
          </p>
        )}

        {savedClasses.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Classi attualmente salvate:</h3>
            <div className="flex flex-wrap gap-2">
              {savedClasses.map((cls, index) => (
                <span key={index} className="bg-blue-600/20 text-blue-300 border border-blue-600/30 px-3 py-1 rounded-full text-sm">
                  {cls}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}