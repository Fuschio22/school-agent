import { useState, useEffect } from "react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://school-agent-backend.onrender.com";

type Event = {
  id: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  circularNumber: string;
  circularId?: string;
  sede?: string;
  classe?: string;
};

export default function Calendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [editFormData, setEditFormData] = useState({
    title: "",
    type: "",
    date: "",
    sede: "",
    startTime: "",
    endTime: "",
  });

  const [showNewEventModal, setShowNewEventModal] = useState(false);

  const [newEventFormData, setNewEventFormData] = useState({
    title: "",
    type: "Altro",
    date: "",
    sede: "",
    startTime: "",
    endTime: "",
  });

  // ============================================================
  // CARICA EVENTI
  // ============================================================

  const loadEvents = async () => {
    try {
      setLoading(true);

      // --------------------------------------------------------
      // EVENTI DA CIRCOLARI
      // --------------------------------------------------------

      const circularResponse = await fetch(
        `${BACKEND_URL}/api/circulars?t=${Date.now()}`
      );

      if (!circularResponse.ok) {
        throw new Error("Errore nel recupero delle circolari");
      }

      const circularData = await circularResponse.json();

      const allEvents: Event[] = [];

      circularData.forEach((circular: any) => {
        if (circular.events) {
          circular.events.forEach((event: Event) => {
            allEvents.push({
              ...event,
              circularNumber: circular.number,
              circularId: circular.id,
            });
          });
        }
      });

      // --------------------------------------------------------
      // EVENTI MANUALI
      // --------------------------------------------------------

      const manualResponse = await fetch(
        `${BACKEND_URL}/api/events?t=${Date.now()}`
      );

      if (manualResponse.ok) {
        const manualEvents = await manualResponse.json();

        if (Array.isArray(manualEvents)) {
          manualEvents.forEach((event: Event) => {
            allEvents.push({
              ...event,
              circularNumber: "",
              circularId: undefined,
            });
          });
        }
      } else {
        console.warn(
          "⚠️ Impossibile recuperare gli eventi manuali"
        );
      }

      console.log(
        "📅 Eventi caricati nel calendario:",
        allEvents
      );

      setEvents(allEvents);
    } catch (error) {
      console.error(
        "Errore nel recupero degli eventi:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // ============================================================
  // ESC PER CHIUDERE MODALI
  // ============================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedDay(null);
        setEditingEvent(null);
        setShowNewEventModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ============================================================
  // GIORNI DEL MESE
  // ============================================================

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(
      year,
      month,
      1
    );

    const lastDay = new Date(
      year,
      month + 1,
      0
    );

    const daysInMonth = lastDay.getDate();

    let startingDayOfWeek = firstDay.getDay();

    // Domenica = 6
    // Lunedì = 0
    startingDayOfWeek =
      startingDayOfWeek === 0
        ? 6
        : startingDayOfWeek - 1;

    return {
      daysInMonth,
      startingDayOfWeek,
    };
  };

  // ============================================================
  // NORMALIZZA LE DATE
  //
  // Accetta:
  // 15/09/2026
  // 15-09-2026
  // 2026/09/15
  // 2026-09-15
  // ============================================================

  const normalizeEventDate = (
    value: string
  ): string | null => {
    if (!value) return null;

    const clean = value
      .trim()
      .split("T")[0];

    // DD/MM/YYYY oppure DD-MM-YYYY
    let match = clean.match(
      /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
    );

    if (match) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3];

      return `${year}-${month}-${day}`;
    }

    // YYYY/MM/DD oppure YYYY-MM-DD
    match = clean.match(
      /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/
    );

    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, "0");
      const day = match[3].padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    // Ultimo tentativo per eventuali date ISO complete
    const parsed = new Date(value);

    if (!isNaN(parsed.getTime())) {
      return [
        parsed.getFullYear(),
        String(parsed.getMonth() + 1).padStart(2, "0"),
        String(parsed.getDate()).padStart(2, "0"),
      ].join("-");
    }

    console.warn(
      "⚠️ Data evento non riconosciuta:",
      value
    );

    return null;
  };

  // ============================================================
  // FORMATTA DATA PER INPUT DATE
  // ============================================================

  const normalizeDateForInput = (
    value: string
  ): string => {
    return normalizeEventDate(value) || "";
  };

  // ============================================================
  // RECUPERA EVENTI DI UN GIORNO
  // ============================================================

  const getEventsForDate = (
    day: number
  ) => {
    const year =
      currentDate.getFullYear();

    const month =
      currentDate.getMonth() + 1;

    const targetDate =
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const dayEvents =
      events.filter((event) => {
        const normalized =
          normalizeEventDate(event.date);

        return normalized === targetDate;
      });

    return dayEvents.sort((a, b) =>
      a.startTime.localeCompare(
        b.startTime
      )
    );
  };

  const {
    daysInMonth,
    startingDayOfWeek,
  } = getDaysInMonth(currentDate);

  const monthNames = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ];

  const dayNames = [
    "Lun",
    "Mar",
    "Mer",
    "Gio",
    "Ven",
    "Sab",
    "Dom",
  ];

  // ============================================================
  // NAVIGAZIONE MESE
  // ============================================================

  const prevMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    );

    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    );

    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  // ============================================================
  // CLICK GIORNO
  // ============================================================

  const handleDayClick = (
    day: number
  ) => {
    const dayEvents =
      getEventsForDate(day);

    if (dayEvents.length > 0) {
      setSelectedDay(day);
    }
  };

  // ============================================================
  // NUOVO EVENTO
  // ============================================================

  const openNewEventModal = () => {
    const today = new Date();

    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    setNewEventFormData({
      title: "",
      type: "Altro",
      date: todayString,
      sede: "",
      startTime: "09:00",
      endTime: "10:00",
    });

    setShowNewEventModal(true);
  };

  const handleCreateManualEvent = async () => {
    if (
      !newEventFormData.title.trim() ||
      !newEventFormData.date ||
      !newEventFormData.startTime ||
      !newEventFormData.endTime
    ) {
      alert(
        "❌ Inserisci titolo, data, ora di inizio e ora di fine."
      );

      return;
    }

    if (
      newEventFormData.endTime <=
      newEventFormData.startTime
    ) {
      alert(
        "❌ L'ora di fine deve essere successiva all'ora di inizio."
      );

      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title:
              newEventFormData.title.trim(),

            type:
              newEventFormData.type,

            date:
              newEventFormData.date,

            startTime:
              newEventFormData.startTime,

            endTime:
              newEventFormData.endTime,

            location:
              newEventFormData.sede.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          `❌ Errore: ${
            data.error ||
            "Impossibile creare l'evento"
          }`
        );

        return;
      }

      alert("✅ Evento creato!");

      setShowNewEventModal(false);

      await loadEvents();

      const createdDate =
        normalizeEventDate(data.date);

      if (createdDate) {
        const [year, month, day] =
          createdDate
            .split("-")
            .map(Number);

        setCurrentDate(
          new Date(
            year,
            month - 1,
            1
          )
        );

        setSelectedDay(day);
      }
    } catch (error) {
      console.error(
        "Errore nella creazione dell'evento:",
        error
      );

      alert(
        "❌ Errore di connessione con il server."
      );
    }
  };

  // ============================================================
  // MODIFICA EVENTO
  // ============================================================

  const handleEditEvent = (
    event: Event
  ) => {
    setEditingEvent(event);

    setEditFormData({
      title: event.title,
      type: event.type,
      date: normalizeDateForInput(
        event.date
      ),
      sede:
        event.sede ||
        event.location ||
        "",
      startTime:
        event.startTime,
      endTime:
        event.endTime,
    });
  };

  // ============================================================
  // SALVA MODIFICA EVENTO
  // ============================================================

  const handleSaveEdit = async () => {
    if (!editingEvent) {
      return;
    }

    if (
      !editFormData.title.trim() ||
      !editFormData.date ||
      !editFormData.startTime ||
      !editFormData.endTime
    ) {
      alert(
        "❌ Titolo, data, ora di inizio e ora di fine sono obbligatori."
      );

      return;
    }

    if (
      editFormData.endTime <=
      editFormData.startTime
    ) {
      alert(
        "❌ L'ora di fine deve essere successiva all'ora di inizio."
      );

      return;
    }

    try {
      // --------------------------------------------------------
      // EVENTO MANUALE
      // --------------------------------------------------------

      if (!editingEvent.circularId) {
        const response = await fetch(
          `${BACKEND_URL}/api/events/${editingEvent.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              title:
                editFormData.title.trim(),

              type:
                editFormData.type,

              date:
                editFormData.date,

              location:
                editFormData.sede.trim(),

              startTime:
                editFormData.startTime,

              endTime:
                editFormData.endTime,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          alert(
            `❌ Errore: ${
              data.error ||
              "Impossibile aggiornare l'evento"
            }`
          );

          return;
        }

        alert("✅ Evento aggiornato!");

        setEditingEvent(null);

        await loadEvents();

        return;
      }

      // --------------------------------------------------------
      // EVENTO DA CIRCOLARE
      // --------------------------------------------------------

      const circularEvents =
        events.filter(
          (event) =>
            event.circularId ===
            editingEvent.circularId
        );

      const eventIndex =
        circularEvents.findIndex(
          (event) =>
            event.id ===
            editingEvent.id
        );

      if (
        eventIndex < 0
      ) {
        alert(
          "❌ Impossibile individuare l'evento nella circolare."
        );

        return;
      }

      const response =
        await fetch(
          `${BACKEND_URL}/api/circulars/${editingEvent.circularId}/events/${eventIndex}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              title:
                editFormData.title,

              type:
                editFormData.type,

              data:
                editFormData.date,

              sede:
                editFormData.sede,

              location:
                editFormData.sede,

              oraInizio:
                editFormData.startTime,

              oraFine:
                editFormData.endTime,
            }),
          }
        );

      if (response.ok) {
        alert(
          "✅ Evento aggiornato!"
        );

        setEditingEvent(null);

        await loadEvents();
      } else {
        const err =
          await response.json();

        alert(
          `❌ Errore: ${
            err.error ||
            "Impossibile aggiornare"
          }`
        );
      }
    } catch (error) {
      console.error(
        "Errore:",
        error
      );

      alert(
        "❌ Errore di connessione"
      );
    }
  };

  // ============================================================
  // ELIMINA EVENTO MANUALE
  // ============================================================

  const handleDeleteManualEvent = async () => {
    if (
      !editingEvent ||
      editingEvent.circularId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Vuoi eliminare l'evento "${editingEvent.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `${BACKEND_URL}/api/events/${editingEvent.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          `❌ Errore: ${
            data.error ||
            "Impossibile eliminare l'evento"
          }`
        );

        return;
      }

      alert(
        "🗑️ Evento eliminato!"
      );

      setEditingEvent(null);

      await loadEvents();
    } catch (error) {
      console.error(
        "Errore nell'eliminazione:",
        error
      );

      alert(
        "❌ Errore di connessione"
      );
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">
          Calendario
        </h1>

        <p className="text-slate-400">
          Caricamento eventi...
        </p>
      </div>
    );
  }

  const selectedDayEvents =
    selectedDay
      ? getEventsForDate(
          selectedDay
        )
      : [];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="p-8 relative">

      {/* ======================================================
          TITOLO
          ====================================================== */}

      <div className="flex items-center justify-between mb-6">

        <h1 className="text-4xl font-bold">
          Calendario
        </h1>

        <button
          onClick={
            openNewEventModal
          }
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg transition-all font-semibold shadow-lg"
        >
          ＋ Nuovo evento
        </button>

      </div>

      {/* ======================================================
          NAVIGAZIONE
          ====================================================== */}

      <div className="flex items-center justify-between mb-6">

        <button
          onClick={prevMonth}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-all"
        >
          ← Mese precedente
        </button>

        <h2 className="text-2xl font-semibold">
          {
            monthNames[
              currentDate.getMonth()
            ]
          }{" "}
          {currentDate.getFullYear()}
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

      {/* ======================================================
          CALENDARIO
          ====================================================== */}

      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">

        <div className="grid grid-cols-7 gap-2 mb-4">

          {dayNames.map(
            (day) => (
              <div
                key={day}
                className="text-center text-slate-400 font-semibold py-2"
              >
                {day}
              </div>
            )
          )}

        </div>

        <div className="grid grid-cols-7 gap-2">

          {/* GIORNI VUOTI */}

          {Array.from({
            length:
              startingDayOfWeek,
          }).map(
            (_, index) => (
              <div
                key={`empty-${index}`}
                className="h-32 bg-slate-950/50 rounded-lg"
              />
            )
          )}

          {/* GIORNI DEL MESE */}

          {Array.from({
            length:
              daysInMonth,
          }).map(
            (_, index) => {
              const day =
                index + 1;

              const dayEvents =
                getEventsForDate(
                  day
                );

              const today =
                new Date();

              const isToday =
                day ===
                  today.getDate() &&
                currentDate.getMonth() ===
                  today.getMonth() &&
                currentDate.getFullYear() ===
                  today.getFullYear();

              const isSelected =
                selectedDay ===
                day;

              return (
                <div
                  key={day}
                  onClick={() =>
                    handleDayClick(
                      day
                    )
                  }
                  className={`h-32 bg-slate-950/50 rounded-lg p-2 overflow-y-auto cursor-pointer transition-all ${
                    isToday
                      ? "border-2 border-blue-500"
                      : "border border-slate-800 hover:border-slate-600"
                  } ${
                    isSelected
                      ? "ring-2 ring-blue-400 bg-slate-800"
                      : ""
                  }`}
                >

                  <div
                    className={`text-sm font-semibold mb-1 ${
                      isToday
                        ? "text-blue-400"
                        : "text-slate-400"
                    }`}
                  >
                    {day}
                  </div>

                  {dayEvents
                    .slice(0, 3)
                    .map(
                      (event) => (
                        <div
                          key={
                            event.id
                          }
                          className={`text-xs rounded p-1 mb-1 ${
                            event.circularId
                              ? "bg-blue-600/20 border border-blue-600/30 text-blue-200"
                              : "bg-green-600/20 border border-green-600/30 text-green-200"
                          }`}
                        >

                          <div className="font-semibold truncate">
                            {event.type}
                          </div>

                          <div className="truncate">
                            {
                              event.startTime
                            }
                          </div>

                        </div>
                      )
                    )}

                  {dayEvents.length >
                    3 && (
                    <div className="text-xs text-slate-400 text-center mt-1 font-semibold">
                      +
                      {dayEvents.length -
                        3}{" "}
                      altri
                    </div>
                  )}

                </div>
              );
            }
          )}

        </div>

      </div>

      {/* ======================================================
          INFO
          ====================================================== */}

      <div className="mt-6 text-slate-400 text-sm">

        <p>
          Totale eventi caricati:{" "}
          {events.length}
        </p>

        <p className="mt-2">
          💡 Gli eventi <span className="text-blue-400">blu</span>{" "}
          provengono dalle circolari.
          Gli eventi <span className="text-green-400">verdi</span>{" "}
          sono inseriti manualmente.
        </p>

        <p className="mt-2">
          💡 Clicca su un giorno con degli eventi
          per vedere i dettagli completi.
        </p>

      </div>

      {/* ========================================================
          MODALE NUOVO EVENTO
          ======================================================== */}

      {showNewEventModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() =>
            setShowNewEventModal(false)
          }
        >

          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h3 className="text-xl font-bold mb-5 text-gray-800 flex items-center gap-2">
              ＋ Nuovo evento
            </h3>

            <div className="space-y-4">

              {/* TITOLO */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Titolo *
                </label>

                <input
                  type="text"
                  value={
                    newEventFormData.title
                  }
                  onChange={(e) =>
                    setNewEventFormData({
                      ...newEventFormData,
                      title:
                        e.target.value,
                    })
                  }
                  placeholder="es. Riunione dipartimento"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                />
              </div>

              {/* TIPO */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tipo evento
                </label>

                <select
                  value={
                    newEventFormData.type
                  }
                  onChange={(e) =>
                    setNewEventFormData({
                      ...newEventFormData,
                      type:
                        e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                >
                  <option value="Altro">
                    Altro
                  </option>

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
                </select>
              </div>

              {/* DATA */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Data *
                </label>

                <input
                  type="date"
                  value={
                    newEventFormData.date
                  }
                  onChange={(e) =>
                    setNewEventFormData({
                      ...newEventFormData,
                      date:
                        e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                />
              </div>

              {/* SEDE */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Sede / Luogo
                </label>

                <input
                  type="text"
                  value={
                    newEventFormData.sede
                  }
                  onChange={(e) =>
                    setNewEventFormData({
                      ...newEventFormData,
                      sede:
                        e.target.value,
                    })
                  }
                  placeholder="es. Sede Biscollai"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                />
              </div>

              {/* ORARI */}

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ora Inizio *
                  </label>

                  <input
                    type="time"
                    value={
                      newEventFormData.startTime
                    }
                    onChange={(e) =>
                      setNewEventFormData({
                        ...newEventFormData,
                        startTime:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ora Fine *
                  </label>

                  <input
                    type="time"
                    value={
                      newEventFormData.endTime
                    }
                    onChange={(e) =>
                      setNewEventFormData({
                        ...newEventFormData,
                        endTime:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                  />
                </div>

              </div>

            </div>

            <div className="flex gap-3 mt-6">

              <button
                onClick={
                  handleCreateManualEvent
                }
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-semibold transition-colors"
              >
                💾 Crea evento
              </button>

              <button
                onClick={() =>
                  setShowNewEventModal(false)
                }
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                Annulla
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================
          MODALE DETTAGLI EVENTI
          ======================================================== */}

      {selectedDay !== null && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedDay(null)
          }
        >

          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">

              <h2 className="text-2xl font-bold text-white">
                Eventi del{" "}
                {selectedDay}{" "}
                {
                  monthNames[
                    currentDate.getMonth()
                  ]
                }{" "}
                {
                  currentDate.getFullYear()
                }
              </h2>

              <button
                onClick={() =>
                  setSelectedDay(null)
                }
                className="text-slate-400 hover:text-white text-3xl font-bold leading-none transition-colors"
              >
                &times;
              </button>

            </div>

            <div className="p-6 space-y-4">

              {selectedDayEvents.length ===
              0 ? (
                <p className="text-slate-400 text-center py-8">
                  Nessun evento
                  programmato per
                  questo giorno.
                </p>
              ) : (
                selectedDayEvents.map(
                  (event) => (
                    <div
                      key={event.id}
                      className={`rounded-xl p-5 border transition-all ${
                        event.circularId
                          ? "bg-slate-800 border-slate-700 hover:border-blue-500/50"
                          : "bg-slate-800 border-green-700/50 hover:border-green-500/70"
                      }`}
                    >

                      <div className="flex justify-between items-start mb-3">

                        <h3 className="text-lg font-bold text-blue-400">
                          {
                            event.title
                          }
                        </h3>

                        <div className="flex gap-2 items-center">

                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                              event.circularId
                                ? "bg-blue-600/20 text-blue-300 border-blue-600/30"
                                : "bg-green-600/20 text-green-300 border-green-600/30"
                            }`}
                          >
                            {
                              event.type
                            }
                          </span>

                          <button
                            onClick={() =>
                              handleEditEvent(
                                event
                              )
                            }
                            className="text-xs bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 px-3 py-1 rounded-full border border-yellow-600/30 transition-colors"
                          >
                            ✏️ Modifica
                          </button>

                        </div>

                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300 mt-4">

                        <div className="flex items-start gap-3">

                          <span className="text-xl">
                            🕒
                          </span>

                          <div>

                            <p className="text-slate-400 text-xs uppercase tracking-wider">
                              Orario
                            </p>

                            <p className="font-semibold text-white">
                              {
                                event.startTime
                              }{" "}
                              -{" "}
                              {
                                event.endTime
                              }
                            </p>

                          </div>

                        </div>

                        <div className="flex items-start gap-3">

                          <span className="text-xl">
                            📍
                          </span>

                          <div>

                            <p className="text-slate-400 text-xs uppercase tracking-wider">
                              Sede / Luogo
                            </p>

                            <p className="font-semibold text-white">
                              {
                                event.location ||
                                "Non specificato"
                              }
                            </p>

                          </div>

                        </div>

                      </div>

                      {event.circularId ? (
                        <div className="mt-4 pt-3 border-t border-slate-700 text-xs text-slate-400 flex items-center gap-2">
                          <span>
                            📋
                          </span>

                          Riferimento:
                          Circolare n.{" "}
                          {
                            event.circularNumber
                          }
                        </div>
                      ) : (
                        <div className="mt-4 pt-3 border-t border-slate-700 text-xs text-green-400 flex items-center gap-2">
                          <span>
                            ✏️
                          </span>

                          Evento inserito
                          manualmente
                        </div>
                      )}

                    </div>
                  )
                )
              )}

            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0 flex justify-end">

              <button
                onClick={() =>
                  setSelectedDay(null)
                }
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg transition-all font-semibold border border-slate-700"
              >
                Chiudi
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================
          MODALE MODIFICA EVENTO
          ======================================================== */}

      {editingEvent && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() =>
            setEditingEvent(null)
          }
        >

          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              ✏️ Modifica Evento
            </h3>

            {!editingEvent.circularId && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
                ✏️ Questo è un evento inserito manualmente.
              </div>
            )}

            <div className="space-y-4">

              {/* TITOLO */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Titolo
                </label>

                <input
                  type="text"
                  value={
                    editFormData.title
                  }
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      title:
                        e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* TIPO */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tipo Evento
                </label>

                <select
                  value={
                    editFormData.type
                  }
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      type:
                        e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  <option value="Altro">
                    Altro
                  </option>

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
                </select>
              </div>

              {/* DATA */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Data
                </label>

                <input
                  type="date"
                  value={
                    editFormData.date
                  }
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      date:
                        e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* SEDE */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Sede / Luogo
                </label>

                <input
                  type="text"
                  value={
                    editFormData.sede
                  }
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      sede:
                        e.target.value,
                    })
                  }
                  placeholder="es. Sede Biscollai"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* ORARI */}

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ora Inizio
                  </label>

                  <input
                    type="time"
                    value={
                      editFormData.startTime
                    }
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
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
                      editFormData.endTime
                    }
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        endTime:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>

              </div>

            </div>

            <div className="flex gap-3 mt-6">

              {!editingEvent.circularId && (
                <button
                  onClick={
                    handleDeleteManualEvent
                  }
                  className="px-4 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 font-semibold transition-colors"
                >
                  🗑️
                </button>
              )}

              <button
                onClick={
                  handleSaveEdit
                }
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                💾 Salva Modifiche
              </button>

              <button
                onClick={() =>
                  setEditingEvent(null)
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