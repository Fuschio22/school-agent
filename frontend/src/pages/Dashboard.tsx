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

export default function Dashboard() {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/circulars`);
        const data = await response.json();
        
        setCirculars(data);
        
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

  // ✅ FUNZIONE PER CALCOLARE I MINUTI TOTALI (per uso interno)
  const calculateMinutes = (eventList: Event[]) => {
    let totalMinutes = 0;
    eventList.forEach(e => {
      if (e.startTime && e.endTime) {
        const [startH, startM] = e.startTime.split(':').map(Number);
        const [endH, endM] = e.endTime.split(':').map(Number);
        if (!isNaN(startH) && !isNaN(startM) && !isNaN(endH) && !isNaN(endM)) {
          const duration = (endH * 60 + endM) - (startH * 60 + startM);
          if (duration > 0) {
            totalMinutes += duration;
          }
        }
      }
    });
    return totalMinutes;
  };

  // ✅ FUNZIONE PER FORMATTAZIONE ORE (per display)
  const formatHours = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  // ✅ FILTRI FLESSIBILI
  const cdcEvents = events.filter(e => e.type.toLowerCase().includes("consiglio") || e.title.toLowerCase().includes("consiglio"));
  const cdcMinutes = calculateMinutes(cdcEvents);
  
  const collegiEvents = events.filter(e => e.type.toLowerCase().includes("collegio") || e.title.toLowerCase().includes("collegio"));
  const collegiMinutes = calculateMinutes(collegiEvents);
  
  const dipartimentiEvents = events.filter(e => e.type.toLowerCase().includes("dipartiment") || e.title.toLowerCase().includes("dipartiment"));
  const dipartimentiMinutes = calculateMinutes(dipartimentiEvents);
  
  const gloEvents = events.filter(e => 
    e.type.toLowerCase().includes("glo") || 
    e.title.toLowerCase().includes("glo") ||
    e.type.toLowerCase().includes("gruppo di lavoro") ||
    e.title.toLowerCase().includes("gruppo di lavoro")
  );
  const gloMinutes = calculateMinutes(gloEvents);
  
  const colloquiEvents = events.filter(e => 
    e.type.toLowerCase().includes("colloquio") || 
    e.title.toLowerCase().includes("colloquio") ||
    e.type.toLowerCase().includes("riceviment") ||
    e.title.toLowerCase().includes("riceviment") ||
    e.type.toLowerCase().includes("famiglia") ||
    e.title.toLowerCase().includes("famiglia")
  );
  const colloquiMinutes = calculateMinutes(colloquiEvents);

  // ✅ CALCOLO SOGLIA CCNL
  // 40 ore totali / 18 classi totali * 12 tue classi = 26.666 ore = 1600 minuti
  const TARGET_CCNL_MINUTES = Math.round((40 / 18) * 12 * 60); // 1600 minuti
  const currentCCNLMinutes = cdcMinutes + gloMinutes;
  const percentageCCNL = Math.min(100, Math.round((currentCCNLMinutes / TARGET_CCNL_MINUTES) * 100));
  
  // Determina il colore della barra in base alla percentuale
  let progressColor = "bg-blue-500";
  let statusText = "In corso";
  if (percentageCCNL >= 100) {
    progressColor = "bg-green-500";
    statusText = "Obiettivo raggiunto! 🎉";
  } else if (percentageCCNL >= 80) {
    progressColor = "bg-yellow-500";
    statusText = "Quasi completato";
  }

  // Statistiche generali
  const totalCirculars = circulars.length;
  const totalEvents = events.length;
  
  // Prossimi eventi
  const today = new Date();
  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.date.split('/').reverse().join('-'));
      return eventDate >= today;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5);

  const lastCircular = circulars.length > 0 ? circulars[0] : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="mt-2 text-slate-400">Caricamento dati...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="mt-2 text-slate-400">
          Benvenuto in SchoolAgent - {new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ✅ NUOVA CARD: STATO CCNL */}
      <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>⚖️</span> Stato Obblighi CCNL (CDC + GLO)
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Soglia calcolata: 40h ÷ 18 classi × 12 tue classi = <span className="text-white font-semibold">26h 40m</span>
            </p>
          </div>
          <div className="mt-2 md:mt-0 text-right">
            <p className="text-3xl font-bold text-white">{formatHours(currentCCNLMinutes)}</p>
            <p className="text-xs text-slate-400">su {formatHours(TARGET_CCNL_MINUTES)} richieste</p>
          </div>
        </div>
        
        {/* Barra di Progresso */}
        <div className="w-full bg-slate-800 rounded-full h-4 mb-2 overflow-hidden">
          <div 
            className={`h-4 rounded-full ${progressColor} transition-all duration-500 ease-out`}
            style={{ width: `${percentageCCNL}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className={`font-semibold ${percentageCCNL >= 100 ? 'text-green-400' : 'text-blue-400'}`}>
            {percentageCCNL}% completato
          </span>
          <span className="text-slate-400">{statusText}</span>
        </div>
      </div>

      {/* Card Statistiche Principali */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card
          title="Circolari Caricate"
          value={totalCirculars.toString()}
          subtitle="Totale documenti"
          color="bg-blue-500"
          icon="📄"
        />
        <Card
          title="Eventi Totali"
          value={totalEvents.toString()}
          subtitle="Tutti gli eventi"
          color="bg-green-500"
          icon="📅"
        />
        <Card
          title="Ore Consigli di Classe"
          value={formatHours(cdcMinutes)}
          subtitle={`${cdcEvents.length} eventi`}
          color="bg-purple-500"
          icon="👥"
        />
        <Card
          title="Ore GLO"
          value={formatHours(gloMinutes)}
          subtitle={`${gloEvents.length} eventi`}
          color="bg-cyan-500"
          icon="🤝"
        />
        <Card
          title="Ore Collegi Docenti"
          value={formatHours(collegiMinutes)}
          subtitle={`${collegiEvents.length} eventi`}
          color="bg-orange-500"
          icon="🏛️"
        />
        <Card
          title="Ore Dipartimenti"
          value={formatHours(dipartimentiMinutes)}
          subtitle={`${dipartimentiEvents.length} eventi`}
          color="bg-emerald-500"
          icon="📚"
        />
      </div>

      {/* Riepilogo Completo per Tipo */}
      <div className="rounded-2xl bg-slate-900 p-6">
        <h2 className="mb-4 text-2xl font-semibold flex items-center gap-2">
          <span>📊</span> Riepilogo Dettagliato per Tipo di Evento
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <EventTypeCard
            type="Consigli di Classe"
            count={cdcEvents.length}
            hours={formatHours(cdcMinutes)}
            color="bg-purple-500"
            icon="👥"
          />
          <EventTypeCard
            type="GLO"
            count={gloEvents.length}
            hours={formatHours(gloMinutes)}
            color="bg-cyan-500"
            icon=""
          />
          <EventTypeCard
            type="Collegio dei Docenti"
            count={collegiEvents.length}
            hours={formatHours(collegiMinutes)}
            color="bg-orange-500"
            icon="🏛️"
          />
          <EventTypeCard
            type="Dipartimenti"
            count={dipartimentiEvents.length}
            hours={formatHours(dipartimentiMinutes)}
            color="bg-emerald-500"
            icon=""
          />
          <EventTypeCard
            type="Colloqui/Ricevimenti"
            count={colloquiEvents.length}
            hours={formatHours(colloquiMinutes)}
            color="bg-pink-500"
            icon=""
          />
        </div>
      </div>

      {/* Prossimi Eventi e Ultima Circolare */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Prossimi Eventi */}
        <div className="rounded-2xl bg-slate-900 p-6 xl:col-span-2">
          <h2 className="mb-4 text-2xl font-semibold flex items-center gap-2">
            <span>📅</span> Prossimi Eventi
          </h2>

          {upcomingEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
              Nessun evento futuro programmato
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {event.type.toLowerCase().includes("consiglio") ? "👥" : 
                       event.type.toLowerCase().includes("collegio") ? "🏛️" : 
                       event.type.toLowerCase().includes("glo") ? "🤝" : 
                       event.type.toLowerCase().includes("dipartiment") ? "📚" : 
                       event.type.toLowerCase().includes("colloquio") || event.type.toLowerCase().includes("famiglia") ? "" : "📌"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{event.title}</h3>
                      <p className="text-sm text-slate-400">{event.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-400">{event.date}</p>
                    <p className="text-sm text-slate-400">{event.startTime} - {event.endTime}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ultima Circolare */}
        <div className="rounded-2xl bg-slate-900 p-6">
          <h2 className="mb-4 text-2xl font-semibold flex items-center gap-2">
            <span>📄</span> Ultima Circolare
          </h2>

          {lastCircular ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Numero</p>
                <p className="text-xl font-bold text-white">{lastCircular.number}</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Data</p>
                <p className="text-lg font-semibold text-white">{lastCircular.date}</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Oggetto</p>
                <p className="text-sm text-white line-clamp-3">{lastCircular.subject}</p>
              </div>
              <div className="p-4 bg-blue-600/20 rounded-lg border border-blue-600/30">
                <p className="text-sm text-blue-300">
                   {lastCircular.events?.length || 0} eventi estratti
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
              Nessuna circolare caricata
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente Card Statistica
type CardProps = {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  icon: string;
};

function Card({ title, value, subtitle, color, icon }: CardProps) {
  return (
    <div className="rounded-2xl bg-slate-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`h-12 w-12 rounded-lg ${color} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
      <p className="text-slate-400 text-sm">{title}</p>
      <h2 className="mt-2 text-4xl font-bold text-white">{value}</h2>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

// Componente Card Tipo Evento
type EventTypeCardProps = {
  type: string;
  count: number;
  hours: string;
  color: string;
  icon: string;
};

function EventTypeCard({ type, count, hours, color, icon }: EventTypeCardProps) {
  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center text-xl`}>
          {icon}
        </div>
        <h3 className="font-semibold text-white">{type}</h3>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-slate-400">
          Eventi: <span className="text-white font-semibold">{count}</span>
        </p>
        <p className="text-sm text-slate-400">
          Ore totali: <span className="text-white font-semibold">{hours}</span>
        </p>
      </div>
    </div>
  );
}