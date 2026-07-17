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

export default function Calendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/circulars`);
        const data = await response.json();
        
        // Estrai tutti gli eventi da tutte le circolari
        const allEvents: Event[] = [];
        data.forEach((circular: any) => {
          if (circular.events) {
            circular.events.forEach((event: Event) => {
              allEvents.push(event);
            });
          }
        });
        
        setEvents(allEvents);
      } catch (error) {
        console.error("Errore nel recupero degli eventi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dateStr = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    
    return events.filter(event => {
      // Normalizza il formato data (potrebbe essere DD/MM/YYYY o YYYY-MM-DD)
      const eventDate = event.date.replace(/-/g, '/');
      return eventDate === dateStr || eventDate === `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">Calendario</h1>
        <p className="text-slate-400">Caricamento eventi...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-6">Calendario</h1>

      {/* Navigazione mesi */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-all"
        >
          ← Mese precedente
        </button>
        
        <h2 className="text-2xl font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <div className="flex gap-2">
          <button
            onClick={goToToday}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            Oggi
          </button>
          <button
            onClick={nextMonth}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            Mese successivo →
          </button>
        </div>
      </div>

      {/* Griglia calendario */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
        {/* Header giorni */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center text-slate-400 font-semibold py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Giorni del mese */}
        <div className="grid grid-cols-7 gap-2">
          {/* Spazi vuoti per i giorni prima del primo del mese */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-32 bg-slate-950/50 rounded-lg"></div>
          ))}

          {/* Giorni del mese */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayEvents = getEventsForDate(day);
            const isToday = 
              day === new Date().getDate() && 
              currentDate.getMonth() === new Date().getMonth() && 
              currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`h-32 bg-slate-950/50 rounded-lg p-2 overflow-y-auto ${
                  isToday ? "border-2 border-blue-500" : "border border-slate-800"
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday ? "text-blue-400" : "text-slate-400"}`}>
                  {day}
                </div>
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="text-xs bg-blue-600/20 border border-blue-600/30 rounded p-1 mb-1 text-blue-200"
                    title={`${event.title}\n${event.startTime} - ${event.endTime}\n${event.location}`}
                  >
                    <div className="font-semibold truncate">{event.type}</div>
                    <div className="truncate">{event.startTime}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-6 text-slate-400 text-sm">
        <p>Totale eventi caricati: {events.length}</p>
        <p className="mt-2">Clicca su un evento per vedere i dettagli (funzionalità futura)</p>
      </div>
    </div>
  );
}