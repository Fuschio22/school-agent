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
  scrutiniHours: number;
  events: Event[];
};

// ✅ Helper: dato "2025/2026" restituisce date di inizio e fine anno scolastico
const getSchoolYearRange = (schoolYear: string) => {
  const [startYear] = schoolYear.split("/").map(Number);
  const startDate = new Date(startYear, 8, 1); // 1 Settembre startYear
  const endDate = new Date(startYear + 1, 6, 31); // 31 Luglio startYear+1
  return { startDate, endDate, startYear };
};

// ✅ Helper: verifica se un evento appartiene all'anno scolastico selezionato
const isEventInSchoolYear = (event: Event, schoolYear: string) => {
  const { startDate, endDate } = getSchoolYearRange(schoolYear);
  const [day, month, year] = event.date.split("/").map(Number);
  const eventDate = new Date(year, month - 1, day);
  return eventDate >= startDate && eventDate <= endDate;
};

// ✅ Helper: genera i mesi dell'anno scolastico selezionato
const getSchoolYearMonths = (schoolYear: string) => {
  const { startYear } = getSchoolYearRange(schoolYear);
  return [
    { month: "Settembre", year: String(startYear), monthNumber: 9 },
    { month: "Ottobre", year: String(startYear), monthNumber: 10 },
    { month: "Novembre", year: String(startYear), monthNumber: 11 },
    { month: "Dicembre", year: String(startYear), monthNumber: 12 },
    { month: "Gennaio", year: String(startYear + 1), monthNumber: 1 },
    { month: "Febbraio", year: String(startYear + 1), monthNumber: 2 },
    { month: "Marzo", year: String(startYear + 1), monthNumber: 3 },
    { month: "Aprile", year: String(startYear + 1), monthNumber: 4 },
    { month: "Maggio", year: String(startYear + 1), monthNumber: 5 },
    { month: "Giugno", year: String(startYear + 1), monthNumber: 6 },
    { month: "Luglio", year: String(startYear + 1), monthNumber: 7 }
  ];
};

const calculateDurationHours = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  if (endMinutes <= startMinutes) {
    console.warn(`⚠️ Orario non valido: ${startTime} - ${endTime}. Impostato a 0.`);
    return 0;
  }
  
  const durationMinutes = endMinutes - startMinutes;
  return durationMinutes / 60;
};

export default function Hours() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  
  // ✅ Selettore Anno Scolastico
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(() => {
    return localStorage.getItem("selectedSchoolYear") || "2025/2026";
  });

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

  // ✅ Salva preferenza anno scolastico
  useEffect(() => {
    localStorage.setItem("selectedSchoolYear", selectedSchoolYear);
  }, [selectedSchoolYear]);

  const groupEventsByMonth = (): MonthlyStats[] => {
    const monthsMap: { [key: string]: MonthlyStats } = {};
    
    const schoolYearMonths = getSchoolYearMonths(selectedSchoolYear);

    schoolYearMonths.forEach(({ month, year, monthNumber }) => {
      const monthKey = `${year}-${String(monthNumber).padStart(2, '0')}`;
      monthsMap[monthKey] = {
        month,
        year,
        monthNumber,
        totalHours: 0,
        cdcHours: 0,
        gloHours: 0,
        collegiHours: 0,
        dipartimentiHours: 0,
        gliHours: 0,
        colloquiHours: 0,
        scrutiniHours: 0,
        events: []
      };
    });

    // ✅ Filtra solo eventi dell'anno scolastico selezionato
    const schoolYearEvents = events.filter(event => isEventInSchoolYear(event, selectedSchoolYear));

    schoolYearEvents.forEach(event => {
      const [, month, year] = event.date.split('/');
      const monthKey = `${year}-${month.padStart(2, '0')}`;
      
      if (monthsMap[monthKey]) {
        monthsMap[monthKey].events.push(event);
        const duration = calculateDurationHours(event.startTime, event.endTime);
        monthsMap[monthKey].totalHours += duration;

        if (event.type === "Consigli di Classe") monthsMap[monthKey].cdcHours += duration;
        else if (event.type === "GLO") monthsMap[monthKey].gloHours += duration;
        else if (event.type === "Collegio dei Docenti") monthsMap[monthKey].collegiHours += duration;
        else if (event.type === "Dipartimenti Disciplinari") monthsMap[monthKey].dipartimentiHours += duration;
        else if (event.type === "GLI") monthsMap[monthKey].gliHours += duration;
        else if (event.type === "Colloqui Scuola-Famiglia" || event.type.toLowerCase().includes("colloquio")) monthsMap[monthKey].colloquiHours += duration;
        else if (event.type === "Scrutini" || event.type.includes("Scrutinio")) monthsMap[monthKey].scrutiniHours += duration;
      }
    });

    return Object.values(monthsMap).sort((a, b) => {
      const dateA = new Date(parseInt(a.year), a.monthNumber - 1);
      const dateB = new Date(parseInt(b.year), b.monthNumber - 1);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const monthlyStats = groupEventsByMonth();
  const totalHours = monthlyStats.reduce((sum, month) => sum + month.totalHours, 0);
  const { startYear } = getSchoolYearRange(selectedSchoolYear);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">Registro Ore</h1>
        <p className="text-slate-400">Caricamento dati...</p>
      </div>
    );
  }

  const formatHours = (hours: number): string => {
    if (hours === 0) return "0min";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };

  const sortEventsByDateAndTime = (events: Event[]): Event[] => {
    return events.sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      const timeA = a.startTime.replace(':', '');
      const timeB = b.startTime.replace(':', '');
      return timeA.localeCompare(timeB);
    });
  };

  const availableSchoolYears = ["2025/2026", "2026/2027"];

  return (
    <div className="p-8 space-y-6">
      {/* Header con Selettore */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Registro Ore</h1>
          <p className="mt-2 text-slate-400">
            Anno Scolastico {selectedSchoolYear} - Conteggio automatico delle attività
          </p>
        </div>
        
        {/* ✅ SELETTORE ANNO SCOLASTICO */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400 font-medium">Anno Scolastico:</label>
          <select
            value={selectedSchoolYear}
            onChange={(e) => setSelectedSchoolYear(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {availableSchoolYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Totale Ore */}
      <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
        <h2 className="text-2xl font-semibold mb-4">Totale Ore Anno Scolastico</h2>
        <div className="text-6xl font-bold text-blue-400">{formatHours(totalHours)}</div>
        <p className="text-slate-400 mt-2">dal 1 Settembre {startYear} al 31 Luglio {startYear + 1}</p>
      </div>

      {/* Riepilogo Mensile */}
      <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
        <h2 className="text-2xl font-semibold mb-4">📊 Riepilogo Mensile</h2>
        
        {totalHours === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-xl mb-2">📭</p>
            <p>Nessun evento per l'anno scolastico {selectedSchoolYear}</p>
            <p className="text-sm mt-2">Carica le circolari dell'anno selezionato per vedere i dati</p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthlyStats.map((monthStat) => {
              const monthKey = `${monthStat.month}-${monthStat.year}`;
              const isExpanded = expandedMonth === monthKey;
              const cdcGloHours = monthStat.cdcHours + monthStat.gloHours;
              const collegiDipHours = monthStat.collegiHours + monthStat.dipartimentiHours;
              const hasEvents = monthStat.events.length > 0;

              return (
                <div key={monthKey} className="border border-slate-800 rounded-lg overflow-hidden">
                  <div 
                    className={`p-4 hover:bg-slate-800 transition-colors ${hasEvents ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={() => hasEvents && setExpandedMonth(isExpanded ? null : monthKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className={`text-lg font-bold capitalize ${hasEvents ? 'text-white' : 'text-slate-500'}`}>
                          {monthStat.month} {monthStat.year}
                        </h3>
                        {hasEvents ? (
                          <span className="text-2xl font-bold text-blue-400">
                            {formatHours(monthStat.totalHours)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500 italic">Nessun evento</span>
                        )}
                      </div>
                      {hasEvents && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 hidden lg:block">
                            CDC+GLO: <span className="text-blue-400 font-semibold">{formatHours(cdcGloHours)}</span> | 
                            Collegi+Dip: <span className="text-green-400 font-semibold">{formatHours(collegiDipHours)}</span>
                            {monthStat.colloquiHours > 0 && ` | Colloqui: ${formatHours(monthStat.colloquiHours)}`}
                            {monthStat.scrutiniHours > 0 && ` | Scrutini: ${formatHours(monthStat.scrutiniHours)}`}
                          </span>
                          <span className="text-slate-400">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {hasEvents && (
                      <div className="mt-2 text-xs text-slate-400 lg:hidden">
                        CDC+GLO: <span className="text-blue-400">{formatHours(cdcGloHours)}</span> | 
                        Collegi+Dip: <span className="text-green-400">{formatHours(collegiDipHours)}</span>
                      </div>
                    )}
                  </div>

                  {isExpanded && hasEvents && (
                    <div className="p-4 bg-slate-950/30 border-t border-slate-800">
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-4">
                        {monthStat.cdcHours > 0 && (
                          <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-600/30">
                            <p className="text-sm text-blue-300">Consigli di Classe</p>
                            <p className="text-2xl font-bold text-blue-400">{formatHours(monthStat.cdcHours)}</p>
                          </div>
                        )}
                        {monthStat.gloHours > 0 && (
                          <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-600/30">
                            <p className="text-sm text-purple-300">GLO</p>
                            <p className="text-2xl font-bold text-purple-400">{formatHours(monthStat.gloHours)}</p>
                          </div>
                        )}
                        {monthStat.collegiHours > 0 && (
                          <div className="p-3 bg-green-900/20 rounded-lg border border-green-600/30">
                            <p className="text-sm text-green-300">Collegi dei Docenti</p>
                            <p className="text-2xl font-bold text-green-400">{formatHours(monthStat.collegiHours)}</p>
                          </div>
                        )}
                        {monthStat.dipartimentiHours > 0 && (
                          <div className="p-3 bg-orange-900/20 rounded-lg border border-orange-600/30">
                            <p className="text-sm text-orange-300">Dipartimenti</p>
                            <p className="text-2xl font-bold text-orange-400">{formatHours(monthStat.dipartimentiHours)}</p>
                          </div>
                        )}
                        {monthStat.gliHours > 0 && (
                          <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-600/30">
                            <p className="text-sm text-yellow-300">GLI</p>
                            <p className="text-2xl font-bold text-yellow-400">{formatHours(monthStat.gliHours)}</p>
                          </div>
                        )}
                        {monthStat.colloquiHours > 0 && (
                          <div className="p-3 bg-pink-900/20 rounded-lg border border-pink-600/30">
                            <p className="text-sm text-pink-300">Colloqui</p>
                            <p className="text-2xl font-bold text-pink-400">{formatHours(monthStat.colloquiHours)}</p>
                          </div>
                        )}
                        {monthStat.scrutiniHours > 0 && (
                          <div className="p-3 bg-red-900/20 rounded-lg border border-red-600/30">
                            <p className="text-sm text-red-300">Scrutini</p>
                            <p className="text-2xl font-bold text-red-400">{formatHours(monthStat.scrutiniHours)}</p>
                          </div>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left p-2 text-slate-400">Data</th>
                              <th className="text-left p-2 text-slate-400">Tipo</th>
                              <th className="text-left p-2 text-slate-400">Classe/Dettagli</th>
                              <th className="text-left p-2 text-slate-400">Orario</th>
                              <th className="text-left p-2 text-slate-400">Durata</th>
                              <th className="text-left p-2 text-slate-400">Sede</th>
                              <th className="text-left p-2 text-slate-400">Circolare</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortEventsByDateAndTime(monthStat.events).map((event) => {
                              const duration = calculateDurationHours(event.startTime, event.endTime);
                              const hasInvalidTime = duration === 0 && event.startTime > event.endTime;
                              
                              return (
                                <tr key={event.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                  <td className="p-2 text-slate-300 whitespace-nowrap">{event.date}</td>
                                  <td className="p-2">
                                    <span className="px-2 py-1 bg-slate-800 rounded text-xs font-semibold text-slate-300 whitespace-nowrap">
                                      {event.type}
                                    </span>
                                  </td>
                                  <td className="p-2 text-slate-300 max-w-xs truncate" title={event.title}>{event.title}</td>
                                  <td className="p-2 text-slate-300 whitespace-nowrap">
                                    {hasInvalidTime ? (
                                      <span className="text-red-400 font-semibold">
                                        {event.startTime} - {event.endTime} ⚠️
                                      </span>
                                    ) : (
                                      event.startTime + ' - ' + event.endTime
                                    )}
                                  </td>
                                  <td className="p-2 font-semibold whitespace-nowrap">
                                    {hasInvalidTime ? (
                                      <span className="text-red-400">Errore</span>
                                    ) : (
                                      <span className="text-blue-400">{formatHours(duration)}</span>
                                    )}
                                  </td>
                                  <td className="p-2 text-slate-400 text-xs max-w-[150px] truncate" title={event.location}>{event.location}</td>
                                  <td className="p-2 whitespace-nowrap">
                                    {event.circularNumber ? (
                                      <span className="inline-flex items-center px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs font-semibold border border-blue-700/50">
                                        📄 n. {event.circularNumber}
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 text-xs">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}