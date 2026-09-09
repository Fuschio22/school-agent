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

// ============================================================
// CONVERTE LA DATA DELL'EVENTO NEL FORMATO YYYY-MM-DD
// richiesto da <input type="date">
// ============================================================

const normalizeDateForInput = (date: string): string => {
  if (!date) return "";

  const value = date.trim();

  // Già nel formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // Formato DD/MM/YYYY
  const italianMatch = value.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (italianMatch) {
    const day = italianMatch[1].padStart(2, "0");
    const month = italianMatch[2].padStart(2, "0");
    const year = italianMatch[3];

    return `${year}-${month}-${day}`;
  }

  // Prova con una data JavaScript
  const parsed = new Date(value);

  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return "";
};

// ============================================================
// CONVERTE YYYY-MM-DD IN DD/MM/YYYY
// ============================================================

const formatDateForDisplay = (date: string): string => {
  if (!date) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
  }

  return date;
};

export default function VisualCalendar({
  events,
  circularId,
  onEventUpdated,
}: VisualCalendarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Indice dell'evento nell'array ORIGINALE
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  const [formData, setFormData] = useState({
    title: "",
    type: "",
    sede: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  // ============================================================
  // ORDINAMENTO CRESCENTE PER ORARIO
  // Manteniamo anche l'indice originale
  // ============================================================

  const sortedEvents = events
    .map((event, originalIndex) => ({
      event,
      originalIndex,
    }))
    .sort((a, b) => {
      if (a.event.startTime < b.event.startTime) {
        return -1;
      }

      if (a.event.startTime > b.event.startTime) {
        return 1;
      }

      return 0;
    });

  // ============================================================
  // APRE LA MODALE DI MODIFICA
  // ============================================================

  const handleEditClick = (
    event: Event,
    originalIndex: number
  ) => {
    setEditingIndex(originalIndex);

    setFormData({
      title: event.title || "",
      type: event.type || "",
      sede: event.sede || event.location || "",
      date: normalizeDateForInput(event.date),
      startTime: event.startTime || "",
      endTime: event.endTime || "",
    });

    setIsModalOpen(true);
  };

  // ============================================================
  // ELIMINA SINGOLO EVENTO
  // ============================================================

  const handleDelete = async (
    event: Event,
    originalIndex: number
  ) => {
    if (!circularId) {
      alert("❌ Errore: ID circolare non trovato");
      return;
    }

    const confirmed = window.confirm(
      `⚠️ Vuoi eliminare questo evento?\n\n` +
      `${event.title}\n` +
      `📅 ${formatDateForDisplay(event.date)}\n` +
      `🕒 ${event.startTime} - ${event.endTime}\n\n` +
      `La circolare resterà comunque nell'archivio.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `https://school-agent-backend.onrender.com/api/circulars/${circularId}/events/${originalIndex}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        alert("✅ Evento eliminato con successo!");

        // Aggiorna l'archivio della circolare
        if (onEventUpdated) {
          onEventUpdated();
        }
      } else {
        const err = await response
          .json()
          .catch(() => ({}));

        alert(
          `❌ Errore: ${
            err.error ||
            "Impossibile eliminare l'evento"
          }`
        );
      }
    } catch (error) {
      console.error(
        "Errore durante l'eliminazione:",
        error
      );

      alert(
        "❌ Errore di connessione al server"
      );
    }
  };

  // ============================================================
  // SALVA MODIFICHE
  // ============================================================

  const handleSave = async () => {
    if (
      editingIndex < 0 ||
      !circularId
    ) {
      alert(
        "❌ Errore: parametri non validi"
      );

      return;
    }

    try {
      const response = await fetch(
        `https://school-agent-backend.onrender.com/api/circulars/${circularId}/events/${editingIndex}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: formData.title,

            type: formData.type,

            sede: formData.sede,

            location: formData.sede,

            // Data nel formato YYYY-MM-DD
            date: formData.date,

            // Compatibilità con il backend
            data: formData.date,

            oraInizio:
              formData.startTime,

            oraFine:
              formData.endTime,

            startTime:
              formData.startTime,

            endTime:
              formData.endTime,
          }),
        }
      );

      if (response.ok) {
        alert(
          "✅ Evento aggiornato con successo!"
        );

        setIsModalOpen(false);
        setEditingIndex(-1);

        if (onEventUpdated) {
          onEventUpdated();
        }
      } else {
        const err =
          await response
            .json()
            .catch(() => ({}));

        alert(
          `❌ Errore: ${
            err.error ||
            "Impossibile aggiornare l'evento"
          }`
        );
      }
    } catch (error) {
      console.error(
        "Errore di rete:",
        error
      );

      alert(
        "❌ Errore di connessione al server"
      );
    }
  };

  // ============================================================
  // CHIUDE LA MODALE
  // ============================================================

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingIndex(-1);
  };

  return (
    <div className="space-y-3">

      {/* ====================================================== */}
      {/* ELENCO EVENTI                                         */}
      {/* ====================================================== */}

      {sortedEvents.map(
        ({
          event,
          originalIndex,
        }) => (
          <div
            key={
              event.id ||
              originalIndex
            }
            className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:shadow-md transition-all"
          >
            <div className="flex-1">

              <div className="flex items-center gap-2 mb-1 flex-wrap">

                <span className="font-semibold text-blue-900 text-base">
                  {event.title}
                </span>

                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                  {event.type}
                </span>

                {event.classe && (
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                    {event.classe}
                  </span>
                )}

              </div>

              <div className="text-sm text-blue-700 flex items-center gap-4 flex-wrap">

                <span>
                  📅{" "}
                  {formatDateForDisplay(
                    event.date
                  )}
                </span>

                <span>
                  🕒{" "}
                  {event.startTime}{" "}
                  -{" "}
                  {event.endTime}
                </span>

                <span>
                  📍{" "}
                  {event.location ||
                    event.sede ||
                    "Sede non specificata"}
                </span>

              </div>

            </div>

            {/* ================================================= */}
            {/* PULSANTI MODIFICA / ELIMINA                     */}
            {/* ================================================= */}

            <div className="ml-4 flex items-center gap-2">

              <button
                onClick={() =>
                  handleEditClick(
                    event,
                    originalIndex
                  )
                }
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                title="Modifica questo evento"
              >
                ✏️ Modifica
              </button>

              <button
                onClick={() =>
                  handleDelete(
                    event,
                    originalIndex
                  )
                }
                className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded-lg transition-colors"
                title="Elimina questo evento"
              >
                🗑️ Elimina
              </button>

            </div>

          </div>
        )
      )}

      {/* ====================================================== */}
      {/* MODALE DI MODIFICA                                    */}
      {/* ====================================================== */}

      {isModalOpen &&
        editingIndex >= 0 && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">

            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200">

              <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                ✏️ Modifica Evento
              </h3>

              <div className="space-y-4">

                {/* ================================================== */}
                {/* TITOLO                                             */}
                {/* ================================================== */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Titolo
                  </label>

                  <input
                    type="text"
                    value={
                      formData.title
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        title:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                  />

                </div>

                {/* ================================================== */}
                {/* TIPO EVENTO                                        */}
                {/* ================================================== */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tipo Evento
                  </label>

                  <select
                    value={
                      formData.type
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >

                    <option value="Consigli di Classe">
                      Consigli di Classe
                    </option>

                    <option value="Collegio dei Docenti">
                      Collegio dei Docenti
                    </option>

                    <option value="Collegio di Plesso">
                      Collegio di Plesso
                    </option>

                    <option value="Dipartimenti">
                      Dipartimenti
                    </option>

                    <option value="GLO">
                      GLO
                    </option>

                    <option value="Colloqui">
                      Colloqui
                    </option>

                    <option value="Riunione">
                      Riunione
                    </option>

                  </select>

                </div>

                {/* ================================================== */}
                {/* DATA                                                */}
                {/* ================================================== */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Data
                  </label>

                  <input
                    type="date"
                    value={
                      formData.date
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />

                </div>

                {/* ================================================== */}
                {/* SEDE                                                */}
                {/* ================================================== */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Sede / Luogo
                  </label>

                  <input
                    type="text"
                    value={
                      formData.sede
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sede:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                    placeholder="es. Sede Biscollai, Via Toscana, ecc."
                  />

                </div>

                {/* ================================================== */}
                {/* ORARI                                               */}
                {/* ================================================== */}

                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Ora Inizio
                    </label>

                    <input
                      type="time"
                      value={
                        formData.startTime
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startTime:
                            e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Ora Fine
                    </label>

                    <input
                      type="time"
                      value={
                        formData.endTime
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endTime:
                            e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />

                  </div>

                </div>

              </div>

              {/* ==================================================== */}
              {/* PULSANTI                                             */}
              {/* ==================================================== */}

              <div className="flex gap-3 mt-6">

                <button
                  onClick={
                    handleSave
                  }
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  💾 Salva Modifiche
                </button>

                <button
                  onClick={
                    handleCancel
                  }
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