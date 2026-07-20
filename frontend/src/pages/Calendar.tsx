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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/circulars`);
        const data = await response.json();
        
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

  // 🎹 Gestione tasto ESC per chiudere il modale
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedDay !== null) {
        setSelectedDay(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDay]);

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
    
    const dayEvents = events.filter(event => {
      const eventDate = event.date.replace(/-/g, '/');
      return eventDate === dateStr || eventDate === `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    });
    
    return dayEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const handleDayClick = (day: number) => {
    const dayEvents = getEventsForDate(day);
    if (dayEvents.length > 0) {
      setSelectedDay(day);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">Calendario</h1>
        <p className="text-slate-400">Caricamento eventi...</p>
      </div>
    );
  }

  const selectedDayEvents = selectedDay 
    ? getEventsForDate(selectedDay)
    : [];

  return (
    <div className="p-8 relative">
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
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-32 bg-slate-950/50 rounded-lg"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayEvents = getEventsForDate(day);
            const isToday = 
              day === new Date().getDate() && 
              currentDate.getMonth() === new Date().getMonth() && 
              currentDate.getFullYear() === new Date().getFullYear();
            const isSelected = selectedDay === day;

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`h-32 bg-slate-950/50 rounded-lg p-2 overflow-y-auto cursor-pointer transition-all ${
                  isToday ? "border-2 border-blue-500" : "border border-slate-800 hover:border-slate-600"
                } ${isSelected ? "ring-2 ring-blue-400 bg-slate-800" : ""}`}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday ? "text-blue-400" : "text-slate-400"}`}>
                  {day}
                </div>
                
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="text-xs bg-blue-600/20 border border-blue-600/30 rounded p-1 mb-1 text-blue-200"
                  >
                    <div className="font-semibold truncate">{event.type}</div>
                    <div className="truncate">{event.startTime}</div>
                  </div>
                ))}
                
                {dayEvents.length > 3 && (
                  <div className="text-xs text-slate-400 text-center mt-1 font-semibold">
                    +{dayEvents.length - 3} altri
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-6 text-slate-400 text-sm">
        <p>Totale eventi caricati: {events.length}</p>
        <p className="mt-2">💡 Clicca su un giorno con degli eventi per vedere i dettagli completi.</p>
      </div>

      {/* MODALE DETTAGLI EVENTO */}
      {selectedDay !== null && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" 
          onClick={() => setSelectedDay(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modale */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
              <h2 className="text-2xl font-bold text-white">
                 Eventi del {selectedDay} {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button 
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-white text-3xl font-bold leading-none transition-colors"
              >
                &times;
              </button>
            </div>
            
            {/* Lista eventi espansa */}
            <div className="p-6 space-y-4">
              {selectedDayEvents.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Nessun evento programmato per questo giorno.</p>
              ) : (
                selectedDayEvents.map(event => (
                  <div key={event.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-blue-500/50 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-blue-400">{event.title}</h3>
                      <span className="text-xs font-semibold bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full border border-blue-600/30">
                        {event.type}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">🕒</span>
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wider">Orario</p>
                          <p className="font-semibold text-white">{event.startTime} - {event.endTime}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <span className="text-xl">📍</span>
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wider">Sede / Luogo</p>
                          <p className="font-semibold text-white">{event.location}</p>
                        </div>
                      </div>
                    </div>

                    {event.circularNumber && (
                      <div className="mt-4 pt-3 border-t border-slate-700 text-xs text-slate-400 flex items-center gap-2">
                        <span>📄</span> Riferimento: Circolare n. {event.circularNumber}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {/* Footer del modale */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0 flex justify-end">
              <button
                onClick={() => setSelectedDay(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg transition-all font-semibold border border-slate-700"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}