import { useState, useEffect } from "react";

interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
}

interface VisualCalendarProps {
  events: Event[];
}

export default function VisualCalendar({ events }: VisualCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (events && events.length > 0) {
      const firstEvent = events[0];
      const [_day, month, year] = firstEvent.date.split("/").map(Number);
      setCurrentDate(new Date(year, month - 1, 1));
    }
  }, [events]);

  // 🎹 Gestione tasto ESC per chiudere il pannello dettagli
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        setSelectedDate(null);
      }
    };
    
    // Aggiungi l'ascoltatore solo quando il pannello è aperto
    if (selectedDate) {
      document.addEventListener('keydown', handleEsc);
    }
    
    // Rimuovi l'ascoltatore quando il componente si smonta o selectedDate cambia
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [selectedDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  const parseDate = (dateStr: string) => {
    const [day, m, y] = dateStr.split("/").map(Number);
    return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const eventsByDate: Record<string, Event[]> = {};
  events.forEach((event) => {
    const key = parseDate(event.date);
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(event);
  });

  // Ordina gli eventi per orario
  Object.keys(eventsByDate).forEach(key => {
    eventsByDate[key].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-28 border border-gray-100 bg-gray-50/50"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = eventsByDate[dateKey] || [];
    const isSelected = selectedDate === dateKey;

    days.push(
      <div
        key={day}
        onClick={() => setSelectedDate(isSelected ? null : dateKey)}
        className={`h-28 border border-gray-200 p-2 cursor-pointer transition-all ${
          isSelected 
            ? "bg-blue-100 ring-2 ring-blue-500 ring-inset shadow-md" 
            : "bg-white hover:bg-blue-50"
        }`}
      >
        <div className="flex justify-between items-start mb-1">
          <span className={`text-sm font-bold ${dayEvents.length > 0 ? "text-blue-700" : "text-gray-700"}`}>
            {day}
          </span>
          {dayEvents.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {dayEvents.length}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {dayEvents.slice(0, 3).map((event, idx) => (
            <div key={idx} className="truncate text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
              {event.startTime} {event.title.split(" - ")[0]}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <div className="text-[10px] text-blue-600 font-semibold">+{dayEvents.length - 3} altri →</div>
          )}
        </div>
      </div>
    );
  }

  const selectedDayEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];
  const [selYear, selMonth, selDay] = selectedDate ? selectedDate.split("-").map(Number) : [0, 0, 0];

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>📅</span> Calendario Eventi
        </h2>
        <div className="flex items-center gap-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-lg font-bold text-gray-800 min-w-[180px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Istruzione per l'utente */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
        💡 <strong>Click su un giorno</strong> per vedere tutti gli eventi dettagliati
      </div>

      {/* Griglia dei giorni */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {dayNames.map((day) => (
          <div key={day} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-600 uppercase">
            {day}
          </div>
        ))}
        {days}
      </div>

      {/* Dettaglio giorno selezionato - Pannello espanso */}
      {selectedDate && (
        <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-blue-900">
               Eventi del {selDay}/{selMonth}/{selYear}
            </h3>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {selectedDayEvents.length} eventi
            </span>
          </div>
          
          <div className="space-y-3">
            {selectedDayEvents.map((event, idx) => (
              <div key={event.id || idx} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-base">{event.title}</p>
                  <p className="text-sm text-gray-600 mt-1">📍 {event.location}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-blue-700 text-lg">{event.startTime} - {event.endTime}</p>
                  <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                    {event.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}