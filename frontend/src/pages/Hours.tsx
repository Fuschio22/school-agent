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

type MonthlyStats = {
  month: string;
  year: string;
  monthNumber: number;
  totalHours: number;
  cdcHours: number;
  gloHours: number;
  collegiHours: number;
  dipartimentiHours: number;
  gliHours: number;
  colloquiHours: number;
  events: Event[];
};

export default function Hours() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<"all" | "month" | "trimester">("all");
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

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

  // Raggruppa eventi per mese
  const groupEventsByMonth = (): MonthlyStats[] => {
    const monthsMap: { [key: string]: MonthlyStats } = {};
    const monthNames = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];

    filteredEvents.forEach(event => {
      const [, month, year] = event.date.split('/'); // <-- CORRETTO: rimosso 'day'
      const monthKey = `${year}-${month}`;
      
      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = {
          month: monthNames[parseInt(month) - 1],
          year: year,
          monthNumber: parseInt(month),
          totalHours: 0,
          cdcHours: 0,
          gloHours: 0,
          collegiHours: 0,
          dipartimentiHours: 0,
          gliHours: 0,
          colloquiHours: 0,
          events: []
        };
      }

      monthsMap[monthKey].events.push(event);
      monthsMap[monthKey].totalHours += 1;

      if (event.type === "Consigli di Classe") monthsMap[monthKey].cdcHours += 1;
      else if (event.type === "GLO") monthsMap[monthKey].gloHours += 1;
      else if (event.type === "Collegio dei Docenti") monthsMap[monthKey].collegiHours += 1;
      else if (event.type === "Dipartimenti Disciplinari") monthsMap[monthKey].dipartimentiHours += 1;
      else if (event.type === "GLI") monthsMap[monthKey].gliHours += 1;
      else if (event.type === "Colloqui Scuola-Famiglia") monthsMap[monthKey].colloquiHours += 1;
    });

    // Converti in array e ordina per data
    return Object.values(monthsMap).sort((a, b) => {
      const dateA = new Date(parseInt(a.year), a.monthNumber - 1);
      const dateB = new Date(parseInt(b.year), b.monthNumber - 1);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const monthlyStats = groupEventsByMonth();
  const totalHours = filteredEvents.length;

  // Calcola ore per tipo (totale complessivo)
  const cdcHours = filteredEvents.filter(e => e.type === "Consigli di Classe").length;
  const gloHours = filteredEvents.filter(e => e.type === "GLO").length;
  const collegiHours = filteredEvents.filter(e => e.type === "Collegio dei Docenti").length;
  const dipartimentiHours = filteredEvents.filter(e => e.type === "Dipartimenti Disciplinari").length;

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

      {/* Riepilogo Mensile Dettagliato */}
      <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
        <h2 className="text-2xl font-semibold mb-4">📊 Riepilogo Mensile</h2>
        <div className="space-y-3">
          {monthlyStats.map((monthStat) => {
            const monthKey = `${monthStat.month}-${monthStat.year}`;
            const isExpanded = expandedMonth === monthKey;
            const cdcGloHours = monthStat.cdcHours + monthStat.gloHours;
            const collegiDipHours = monthStat.collegiHours + monthStat.dipartimentiHours;

            return (
              <div key={monthKey} className="border border-slate-800 rounded-lg overflow-hidden">
                {/* Header del mese - sempre visibile */}
                <div 
                  className="p-4 bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between"
                  onClick={() => setExpandedMonth(isExpanded ? null : monthKey)}
                >
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-white capitalize">
                      {monthStat.month} {monthStat.year}
                    </h3>
                    <span className="text-2xl font-bold text-blue-400">
                      {monthStat.totalHours} <span className="text-sm text-slate-400 font-normal">ore</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">
                      CDC+GLO: <span className="text-blue-400 font-semibold">{cdcGloHours}</span> | 
                      Collegi+Dip: <span className="text-green-400 font-semibold">{collegiDipHours}</span>
                    </span>
                    <span className="text-slate-400">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Dettagli espandibili */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950/30 border-t border-slate-800">
                    {/* Card per tipo di evento */}
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mb-4">
                      {monthStat.cdcHours > 0 && (
                        <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-600/30">
                          <p className="text-sm text-blue-300">Consigli di Classe</p>
                          <p className="text-2xl font-bold text-blue-400">{monthStat.cdcHours}</p>
                        </div>
                      )}
                      {monthStat.gloHours > 0 && (
                        <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-600/30">
                          <p className="text-sm text-purple-300">GLO</p>
                          <p className="text-2xl font-bold text-purple-400">{monthStat.gloHours}</p>
                        </div>
                      )}
                      {monthStat.collegiHours > 0 && (
                        <div className="p-3 bg-green-900/20 rounded-lg border border-green-600/30">
                          <p className="text-sm text-green-300">Collegi dei Docenti</p>
                          <p className="text-2xl font-bold text-green-400">{monthStat.collegiHours}</p>
                        </div>
                      )}
                      {monthStat.dipartimentiHours > 0 && (
                        <div className="p-3 bg-orange-900/20 rounded-lg border border-orange-600/30">
                          <p className="text-sm text-orange-300">Dipartimenti</p>
                          <p className="text-2xl font-bold text-orange-400">{monthStat.dipartimentiHours}</p>
                        </div>
                      )}
                      {monthStat.gliHours > 0 && (
                        <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-600/30">
                          <p className="text-sm text-yellow-300">GLI</p>
                          <p className="text-2xl font-bold text-yellow-400">{monthStat.gliHours}</p>
                        </div>
                      )}
                      {monthStat.colloquiHours > 0 && (
                        <div className="p-3 bg-pink-900/20 rounded-lg border border-pink-600/30">
                          <p className="text-sm text-pink-300">Colloqui</p>
                          <p className="text-2xl font-bold text-pink-400">{monthStat.colloquiHours}</p>
                        </div>
                      )}
                    </div>

                    {/* Tabella eventi del mese */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left p-2 text-slate-400">Data</th>
                            <th className="text-left p-2 text-slate-400">Tipo</th>
                            <th className="text-left p-2 text-slate-400">Classe/Dettagli</th>
                            <th className="text-left p-2 text-slate-400">Orario</th>
                            <th className="text-left p-2 text-slate-400">Sede</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthStat.events
                            .sort((a, b) => {
                              const dateA = new Date(a.date.split('/').reverse().join('-'));
                              const dateB = new Date(b.date.split('/').reverse().join('-'));
                              return dateA.getTime() - dateB.getTime();
                            })
                            .map((event) => (
                              <tr key={event.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                <td className="p-2 text-slate-300">{event.date}</td>
                                <td className="p-2">
                                  <span className="px-2 py-1 bg-slate-800 rounded text-xs font-semibold text-slate-300">
                                    {event.type}
                                  </span>
                                </td>
                                <td className="p-2 text-slate-300">{event.title}</td>
                                <td className="p-2 text-slate-300">{event.startTime} - {event.endTime}</td>
                                <td className="p-2 text-slate-400 text-xs">{event.location}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Riepilogo per Tipo (Totale Complessivo) */}
      <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
        <h2 className="text-2xl font-semibold mb-4">Ore per Tipo di Evento (Totale)</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-2">Consigli di Classe</h3>
            <p className="text-3xl font-bold text-blue-400">{cdcHours}</p>
            <p className="text-sm text-slate-400">ore</p>
          </div>

          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-2">GLO</h3>
            <p className="text-3xl font-bold text-purple-400">{gloHours}</p>
            <p className="text-sm text-slate-400">ore</p>
          </div>

          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-2">Collegio dei Docenti</h3>
            <p className="text-3xl font-bold text-green-400">{collegiHours}</p>
            <p className="text-sm text-slate-400">ore</p>
          </div>

          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-2">Dipartimenti</h3>
            <p className="text-3xl font-bold text-orange-400">{dipartimentiHours}</p>
            <p className="text-sm text-slate-400">ore</p>
          </div>
        </div>
      </div>
    </div>
  );
}