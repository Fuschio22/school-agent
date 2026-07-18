import { useState, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://school-agent-backend.onrender.com";

type Event = {
  id: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  circularNumber: string;
};

type Circular = {
  id: string;
  number: string;
  date: string;
  subject: string;
  events: Event[];
};

export default function Hours() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<"all" | "month" | "trimester">("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/circulars`);
        const data: Circular[] = await response.json();
        
        const allEvents: Event[] = [];
        data.forEach((circular: Circular) => {
          if (circular.events) {
            circular.events.forEach((event: Event) => {
              allEvents.push(event);
            });
          }
        });
        
        setEvents(allEvents);
      } catch (error) {
        console.error("Errore nel recupero dati:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtra eventi per periodo
  const filteredEvents = events.filter(event => {
    if (filterPeriod === "all") return true;
    
    const eventDate = new Date(event.date.split('/').reverse().join('-'));
    const now = new Date();
    
    if (filterPeriod === "month") {
      return eventDate.getMonth() === now.getMonth() && 
             eventDate.getFullYear() === now.getFullYear();
    }
    
    if (filterPeriod === "trimester") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return eventDate >= threeMonthsAgo;
    }
    
    return true;
  });

  // Calcola ore per tipo
  const cdcEvents = filteredEvents.filter(e => e.type === "Consigli di Classe");
  const cdcHours = cdcEvents.length;
  
  const gloEvents = filteredEvents.filter(e => e.type === "GLO");
  const gloHours = gloEvents.length;
  
  const collegiEvents = filteredEvents.filter(e => e.type === "Collegio dei Docenti");
  const collegiHours = collegiEvents.length;
  
  const dipartimentiEvents = filteredEvents.filter(e => e.type === "Dipartimenti Disciplinari");
  const dipartimentiHours = dipartimentiEvents.length;
  
  const gliEvents = filteredEvents.filter(e => e.type === "GLI");
  const gliHours = gliEvents.length;
  
  const colloquiEvents = filteredEvents.filter(e => e.type === "Colloqui Scuola-Famiglia");
  const colloquiHours = colloquiEvents.length;

  // Raggruppamenti richiesti
  const cdcGloHours = cdcHours + gloHours;
  const collegiDipartimentiHours = collegiHours + dipartimentiHours;
  const altriHours = gliHours + colloquiHours;

  // Calcola ore per classe
  const hoursByClass: { [key: string]: Event[] } = {};
  filteredEvents.forEach(event => {
    const className = event.title.match(/\d+[A-Z]S?(?:\s+IPSASR)?/)?.[0] || "Altro";
    if (!hoursByClass[className]) {
      hoursByClass[className] = [];
    }
    hoursByClass[className].push(event);
  });

  const totalHours = filteredEvents.length;

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">Registro Ore</h1>
        <p className="text-slate-400">Caricamento dati...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Registro Ore</h1>
        <p className="mt-2 text-slate-400">
          Conteggio automatico di Consigli di Classe, Collegi Docenti, GLO, GLI, Dipartimenti e altre attività.
        </p>
      </div>

      {/* Filtro Periodo */}
      <div className="flex gap-3">
        <button
          onClick={() => setFilterPeriod("all")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filterPeriod === "all" 
              ? "bg-blue-600 text-white" 
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Tutto
        </button>
        <button
          onClick={() => setFilterPeriod("month")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filterPeriod === "month" 
              ? "bg-blue-600 text-white" 
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Questo Mese
        </button>
        <button
          onClick={() => setFilterPeriod("trimester")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filterPeriod === "trimester" 
              ? "bg-blue-600 text-white" 
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Ultimi 3 Mesi
        </button>
      </div>

      {/* Totale Ore */}
      <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
        <h2 className="text-2xl font-semibold mb-4">Totale Ore</h2>
        <div className="text-6xl font-bold text-blue-400">{totalHours}</div>
        <p className="text-slate-400 mt-2">ore totali nel periodo selezionato</p>
      </div>

      {/* Ore per Tipo - DETTAGLIATE */}
      <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
        <h2 className="text-2xl font-semibold mb-4">Ore per Tipo di Evento</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Consigli di Classe */}
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-2">Consigli di Classe</h3>
            <p className="text-3xl font-bold text-blue-400">{cdcHours}</p>
            <p className="text-sm text-slate-400">ore</p>
          </div>

          {/* GLO */}
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-2">GLO</h3>
            <p className="text-3xl font-bold text-purple-400">{gloHours}</p>
            <p className="text-sm text-slate-400">ore</p>
          </div>

          {/* Collegio dei Docenti */}
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-2">Collegio dei Docenti</h3>
            <p className="text-3xl font-bold text-green-400">{collegiHours}</p>
            <p className="text-sm text-slate-400">ore</p>
          </div>

          {/* Dipartimenti */}
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-2">Dipartimenti</h3>
            <p className="text-3xl font-bold text-orange-400">{dipartimentiHours}</p>
            <p className="text-sm text-slate-400">ore</p>
          </div>

          {/* GLI */}
          {gliHours > 0 && (
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-white mb-2">GLI</h3>
              <p className="text-3xl font-bold text-yellow-400">{gliHours}</p>
              <p className="text-sm text-slate-400">ore</p>
            </div>
          )}

          {/* Colloqui */}
          {colloquiHours > 0 && (
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-white mb-2">Colloqui</h3>
              <p className="text-3xl font-bold text-pink-400">{colloquiHours}</p>
              <p className="text-sm text-slate-400">ore</p>
            </div>
          )}
        </div>

        {/* Riepilogo raggruppato */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <h3 className="text-xl font-semibold text-white mb-4">Riepilogo per Categorie</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-600/30">
              <h4 className="font-semibold text-blue-300 mb-2">Consigli di Classe + GLO</h4>
              <p className="text-3xl font-bold text-blue-400">{cdcGloHours} ore</p>
              <p className="text-sm text-slate-400 mt-1">(CDC: {cdcHours} + GLO: {gloHours})</p>
            </div>
            <div className="p-4 bg-green-900/20 rounded-lg border border-green-600/30">
              <h4 className="font-semibold text-green-300 mb-2">Collegi + Dipartimenti</h4>
              <p className="text-3xl font-bold text-green-400">{collegiDipartimentiHours} ore</p>
              <p className="text-sm text-slate-400 mt-1">(Collegi: {collegiHours} + Dipartimenti: {dipartimentiHours})</p>
            </div>
          </div>
          {altriHours > 0 && (
            <div className="mt-4 p-4 bg-purple-900/20 rounded-lg border border-purple-600/30">
              <h4 className="font-semibold text-purple-300 mb-2">Altri Eventi (GLI + Colloqui)</h4>
              <p className="text-3xl font-bold text-purple-400">{altriHours} ore</p>
              <p className="text-sm text-slate-400 mt-1">(GLI: {gliHours} + Colloqui: {colloquiHours})</p>
            </div>
          )}
        </div>
      </div>

      {/* Ore per Classe */}
      <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
        <h2 className="text-2xl font-semibold mb-4">Ore per Classe</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-400 font-semibold">Classe</th>
                <th className="text-left p-3 text-slate-400 font-semibold">Tipo Evento</th>
                <th className="text-left p-3 text-slate-400 font-semibold">Data</th>
                <th className="text-left p-3 text-slate-400 font-semibold">Orario</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(hoursByClass)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([className, classEvents]: [string, Event[]]) => (
                  classEvents.map((event: Event, index: number) => (
                    <tr key={`${event.id}-${index}`} className="border-b border-slate-800 hover:bg-slate-800/50">
                      {index === 0 && (
                        <td className="p-3 font-semibold text-white" rowSpan={classEvents.length}>
                          {className}
                        </td>
                      )}
                      <td className="p-3 text-slate-300">{event.type}</td>
                      <td className="p-3 text-slate-300">{event.date}</td>
                      <td className="p-3 text-slate-300">{event.startTime} - {event.endTime}</td>
                    </tr>
                  ))
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}