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
        
        // Estrai tutti gli eventi da tutte le circolari
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

  // Calcola statistiche
  const totalCirculars = circulars.length;
  const totalEvents = events.length;
  
  // Conta ore per tipo di evento
  const cdcEvents = events.filter(e => e.type === "Consigli di Classe");
  const cdcHours = cdcEvents.length; // Ogni evento = 1 ora
  
  const collegiEvents = events.filter(e => e.type === "Collegio dei Docenti");
  const collegiHours = collegiEvents.length;
  
  const dipartimentiEvents = events.filter(e => e.type === "Dipartimenti Disciplinari");
  const dipartimentiHours = dipartimentiEvents.length;

  // Prossimi eventi (futuri)
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
    .slice(0, 5); // Mostra solo i prossimi 5

  // Ultima circolare
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

      {/* Card Statistiche */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
          subtitle="Consigli, Collegi, GLO"
          color="bg-green-500"
          icon="📅"
        />

        <Card
          title="Ore Consigli di Classe"
          value={cdcHours.toString()}
          subtitle="Ore totali CDC"
          color="bg-purple-500"
          icon="👥"
        />

        <Card
          title="Ore Collegi & Dipartimenti"
          value={(collegiHours + dipartimentiHours).toString()}
          subtitle="Collegi + Dipartimenti"
          color="bg-orange-500"
          icon="🏛️"
        />
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
                      {event.type === "Consigli di Classe" ? "👥" : 
                       event.type === "Collegio dei Docenti" ? "️" : 
                       event.type === "GLO" ? "🤝" : ""}
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
                  📊 {lastCircular.events?.length || 0} eventi estratti
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

      {/* Riepilogo per Tipo */}
      <div className="rounded-2xl bg-slate-900 p-6">
        <h2 className="mb-4 text-2xl font-semibold flex items-center gap-2">
          <span>📊</span> Riepilogo per Tipo di Evento
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <EventTypeCard
            type="Consigli di Classe"
            count={cdcEvents.length}
            hours={cdcHours}
            color="bg-purple-500"
            icon="👥"
          />
          <EventTypeCard
            type="Collegio dei Docenti"
            count={collegiEvents.length}
            hours={collegiHours}
            color="bg-orange-500"
            icon="🏛️"
          />
          <EventTypeCard
            type="Dipartimenti Disciplinari"
            count={dipartimentiEvents.length}
            hours={dipartimentiHours}
            color="bg-green-500"
            icon="📚"
          />
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
  hours: number;
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