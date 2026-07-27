import { useState, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://school-agent-backend.onrender.com";

export default function Settings() {
  const [liceoClassesInput, setLiceoClassesInput] = useState("");
  const [orClassesInput, setOrClassesInput] = useState("");
  const [savedClasses, setSavedClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Carica le classi salvate all'avvio e le divide nelle due sezioni
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/users/classes`);
        const data = await response.json();
        if (data.classes) {
          setSavedClasses(data.classes);
          
          // ✅ Divide automaticamente le classi in due gruppi
          const liceoClasses = data.classes.filter((c: string) => !c.toUpperCase().endsWith("OR"));
          const orClasses = data.classes.filter((c: string) => c.toUpperCase().endsWith("OR"));
          
          setLiceoClassesInput(liceoClasses.join(", "));
          setOrClassesInput(orClasses.join(", "));
        }
      } catch (error) {
        console.error("Errore nel recupero delle classi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Salva le classi (unisce le due sezioni in un unico array)
  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    
    // ✅ Trasforma i due input in un unico array pulito
    const liceoArray = liceoClassesInput
      .split(",")
      .map(c => c.trim())
      .filter(c => c.length > 0);
      
    const orArray = orClassesInput
      .split(",")
      .map(c => c.trim())
      .filter(c => c.length > 0);
      
    // Unisce le due liste (Liceo prima, OR dopo)
    const classesArray = [...liceoArray, ...orArray];

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
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Impostazioni</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
        
        {/* ✅ SEZIONE 1: CLASSI LICEO */}
        <div>
          <h2 className="text-xl font-semibold mb-2 text-blue-400 flex items-center gap-2">
            <span></span> Classi Liceo
          </h2>
          <p className="text-slate-400 mb-3 text-sm">
            Classi del Liceo Scientifico, IPSASR e altri indirizzi (escluse le classi OR).
          </p>

          <textarea
            value={liceoClassesInput}
            onChange={(e) => setLiceoClassesInput(e.target.value)}
            placeholder="Es: 1AS, 2AS, 3AS, 4AS, 5AS, 1BS, 2BS, 3BS, 4BS, 5BS, 4A IPSASR, 5A IPSASR"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* ✅ SEZIONE 2: CLASSI OR */}
        <div>
          <h2 className="text-xl font-semibold mb-2 text-emerald-400 flex items-center gap-2">
            <span>🚌</span> Classi OR
          </h2>
          <p className="text-slate-400 mb-3 text-sm">
            Classi dell'indirizzo OR (es: 1AOR, 2AOR, 3AOR, 4AOR, 5AOR, 5BOR).
          </p>

          <textarea
            value={orClassesInput}
            onChange={(e) => setOrClassesInput(e.target.value)}
            placeholder="Es: 1AOR, 2AOR, 3AOR, 4AOR, 5AOR, 5BOR"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows={2}
          />
        </div>

        {/* ✅ BOTTONE SALVA */}
        <div>
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
        </div>

        {/* ✅ ANTEPRIMA CLASSI SALVATE (divise in due sezioni) */}
        {savedClasses.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Classi attualmente salvate:</h3>
            
            {/* Classi Liceo */}
            {savedClasses.filter(c => !c.toUpperCase().endsWith("OR")).length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-blue-400 font-medium mb-2">🏫 Liceo:</p>
                <div className="flex flex-wrap gap-2">
                  {savedClasses
                    .filter(c => !c.toUpperCase().endsWith("OR"))
                    .map((cls, index) => (
                      <span key={index} className="bg-blue-600/20 text-blue-300 border border-blue-600/30 px-3 py-1 rounded-full text-sm">
                        {cls}
                      </span>
                    ))}
                </div>
              </div>
            )}
            
            {/* Classi OR */}
            {savedClasses.filter(c => c.toUpperCase().endsWith("OR")).length > 0 && (
              <div>
                <p className="text-xs text-emerald-400 font-medium mb-2">🚌 OR:</p>
                <div className="flex flex-wrap gap-2">
                  {savedClasses
                    .filter(c => c.toUpperCase().endsWith("OR"))
                    .map((cls, index) => (
                      <span key={index} className="bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 px-3 py-1 rounded-full text-sm">
                        {cls}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}