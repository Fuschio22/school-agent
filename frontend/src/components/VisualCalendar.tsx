import { useState } from "react";

type Event = {
  id?: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  sede?: string;
  classe?: string;
};

type VisualCalendarProps = {
  events: Event[];
  circularId?: string;
  onEventUpdated?: () => void;
};

export default function VisualCalendar({ events, circularId, onEventUpdated }: VisualCalendarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    sede: "",
    startTime: "",
    endTime: "",
  });

  const handleEditClick = (event: Event, index: number) => {
    setEditingIndex(index);
    setFormData({
      title: event.title,
      type: event.type,
      sede: event.sede || event.location || "",
      startTime: event.startTime,
      endTime: event.endTime,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (editingIndex === null || !circularId) return;

    try {
      const response = await fetch(
        `https://school-agent-backend.onrender.com/api/circulars/${circularId}/events/${editingIndex}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            type: formData.type,
            sede: formData.sede,
            location: formData.sede,
            oraInizio: formData.startTime,
            oraFine: formData.endTime,
          }),
        }
      );

      if (response.ok) {
        alert("✅ Evento aggiornato con successo!");
        setIsModalOpen(false);
        setEditingIndex(null);
        if (onEventUpdated) {
          onEventUpdated();
        }
      } else {
        const err = await response.json();
        alert(`❌ Errore: ${err.error || "Impossibile aggiornare l'evento"}`);
      }
    } catch (error) {
      console.error("Errore di rete:", error);
      alert("❌ Errore di connessione al server");
    }
  };

  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:shadow-md transition-all"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-blue-900 text-base">{event.title}</span>
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                {event.type}
              </span>
              {event.classe && (
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                  {event.classe}
                </span>
              )}
            </div>
            <div className="text-sm text-blue-700 flex items-center gap-4">
              <span>🕒 {event.startTime} - {event.endTime}</span>
              <span> {event.location || event.sede || "Sede non specificata"}</span>
            </div>
          </div>
          
          <button
            onClick={() => handleEditClick(event, index)}
            className="ml-4 text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded-lg transition-colors"
            title="Modifica questo evento"
          >
            ✏️ Modifica
          </button>
        </div>
      ))}

      {/* MODALE DI MODIFICA */}
      {isModalOpen && editingIndex !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              ✏️ Modifica Evento
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Titolo</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo Evento</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  <option value="Consigli di Classe">Consigli di Classe</option>
                  <option value="Collegio dei Docenti">Collegio dei Docenti</option>
                  <option value="Collegio di Plesso">Collegio di Plesso</option>
                  <option value="Dipartimenti">Dipartimenti</option>
                  <option value="GLO">GLO</option>
                  <option value="Colloqui">Colloqui</option>
                  <option value="Riunione">Riunione</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sede / Luogo</label>
                <input
                  type="text"
                  value={formData.sede}
                  onChange={(e) => setFormData({ ...formData, sede: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                  placeholder="es. Sede Biscollai, Via Toscana, ecc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ora Inizio</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ora Fine</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                 Salva Modifiche
              </button>
              <button
                onClick={() => { setIsModalOpen(false); setEditingIndex(null); }}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}