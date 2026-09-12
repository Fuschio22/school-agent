import { useEffect, useMemo, useState } from "react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://school-agent-backend.onrender.com";

type Lesson = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  className: string;
  subject: string;
  topic: string;
  homework?: string | null;
  notes?: string | null;
  recurrenceType?: string | null;
  recurrenceInterval?: number | null;
  recurrenceDays?: string | null;
  recurrenceEndDate?: string | null;
  recurrenceGroupId?: string | null;
};

type FormData = {
  date: string;
  startTime: string;
  endTime: string;
  className: string;
  subject: string;
  topic: string;
  homework: string;
  notes: string;
  recurrenceType: string;
  recurrenceInterval: number;
  recurrenceDays: number[];
  recurrenceEndDate: string;
};

const DAY_NAMES = [
  "Lun",
  "Mar",
  "Mer",
  "Gio",
  "Ven",
  "Sab",
  "Dom",
];

const CALENDAR_START_HOUR = 8;
const CALENDAR_END_HOUR = 19;
const SLOT_HEIGHT = 64;

const pad = (value: number) => String(value).padStart(2, "0");

const formatDateInput = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

const parseDate = (date: string) => {
  if (!date) return new Date();

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
    const [day, month, year] = date.split("/").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(date);
};

const formatDateDisplay = (date: string) => {
  const value = parseDate(date);

  if (Number.isNaN(value.getTime())) return date;

  return value.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getMonday = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);
  return result;
};

const getWeekDays = (date: Date) => {
  const monday = getMonday(date);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
};

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${pad(hours)}:${pad(mins)}`;
};

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const createDefaultForm = (): FormData => {
  const today = new Date();

  return {
    date: formatDateInput(today),
    startTime: "08:00",
    endTime: "09:00",
    className: "",
    subject: "",
    topic: "",
    homework: "",
    notes: "",
    recurrenceType: "none",
    recurrenceInterval: 1,
    recurrenceDays: [],
    recurrenceEndDate: "",
  };
};

export default function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentWeek, setCurrentWeek] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [form, setForm] = useState<FormData>(createDefaultForm());

  // ============================================================
  // CARICA CLASSI E LEZIONI
  // ============================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [classesResponse, lessonsResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/users/classes?t=${Date.now()}`),
        fetch(`${BACKEND_URL}/api/lessons?t=${Date.now()}`),
      ]);

      if (classesResponse.ok) {
        const classesData = await classesResponse.json();

        if (Array.isArray(classesData)) {
          setClasses(classesData);
        } else if (Array.isArray(classesData.classes)) {
          setClasses(classesData.classes);
        }
      }

      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();

        if (Array.isArray(lessonsData)) {
          setLessons(lessonsData);
        }
      }
    } catch (error) {
      console.error("Errore nel caricamento delle lezioni:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================================
  // SETTIMANA CORRENTE
  // ============================================================

  const weekDays = useMemo(
    () => getWeekDays(currentWeek),
    [currentWeek]
  );

  const goToPreviousWeek = () => {
    setCurrentWeek((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeek((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  // ============================================================
  // APERTURA MODALE
  // ============================================================

  const openNewLesson = (
    date?: string,
    startTime?: string,
    endTime?: string
  ) => {
    const defaultForm = createDefaultForm();

    setEditingLesson(null);

    setForm({
      ...defaultForm,
      date: date || defaultForm.date,
      startTime: startTime || defaultForm.startTime,
      endTime: endTime || endTime || defaultForm.endTime,
    });

    setIsModalOpen(true);
  };

  const openEditLesson = (lesson: Lesson) => {
    let recurrenceDays: number[] = [];

    if (lesson.recurrenceDays) {
      try {
        const parsed = JSON.parse(lesson.recurrenceDays);

        if (Array.isArray(parsed)) {
          recurrenceDays = parsed.map(Number);
        }
      } catch {
        recurrenceDays = lesson.recurrenceDays
          .split(",")
          .map(Number)
          .filter((value) => !Number.isNaN(value));
      }
    }

    setEditingLesson(lesson);

    setForm({
      date: lesson.date,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      className: lesson.className,
      subject: lesson.subject,
      topic: lesson.topic,
      homework: lesson.homework || "",
      notes: lesson.notes || "",
      recurrenceType: lesson.recurrenceType || "none",
      recurrenceInterval: lesson.recurrenceInterval || 1,
      recurrenceDays,
      recurrenceEndDate: lesson.recurrenceEndDate || "",
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLesson(null);
  };

  // ============================================================
  // CAMBIO FORM
  // ============================================================

  const handleChange = (
    field: keyof FormData,
    value: string | number | number[]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleRecurrenceDay = (day: number) => {
    setForm((current) => {
      const exists = current.recurrenceDays.includes(day);

      return {
        ...current,
        recurrenceDays: exists
          ? current.recurrenceDays.filter((item) => item !== day)
          : [...current.recurrenceDays, day].sort((a, b) => a - b),
      };
    });
  };

  // ============================================================
  // CLICK SU UNO SLOT DEL CALENDARIO
  // ============================================================

  const handleCalendarSlotClick = (
    day: Date,
    hour: number
  ) => {
    const date = formatDateInput(day);
    const startTime = `${pad(hour)}:00`;
    const endTime = `${pad(hour + 1)}:00`;

    openNewLesson(date, startTime, endTime);
  };

  // ============================================================
  // SALVATAGGIO
  // ============================================================

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!form.date) {
      alert("Inserisci la data.");
      return;
    }

    if (!form.startTime || !form.endTime) {
      alert("Inserisci l'orario di inizio e di fine.");
      return;
    }

    if (timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
      alert("L'orario di fine deve essere successivo all'orario di inizio.");
      return;
    }

    if (!form.className) {
      alert("Seleziona una classe.");
      return;
    }

    if (!form.subject.trim()) {
      alert("Inserisci la materia.");
      return;
    }

    if (!form.topic.trim()) {
      alert("Inserisci l'argomento.");
      return;
    }

    if (
      form.recurrenceType === "weekly" &&
      form.recurrenceDays.length === 0
    ) {
      alert("Seleziona almeno un giorno della settimana.");
      return;
    }

    if (
      form.recurrenceType !== "none" &&
      !form.recurrenceEndDate
    ) {
      alert("Inserisci la data fino alla quale ripetere la lezione.");
      return;
    }

    try {
      const payload = {
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        className: form.className,
        subject: form.subject.trim(),
        topic: form.topic.trim(),
        homework: form.homework.trim() || null,
        notes: form.notes.trim() || null,
        recurrenceType: form.recurrenceType,
        recurrenceInterval: form.recurrenceInterval,
        recurrenceDays:
          form.recurrenceType === "weekly"
            ? form.recurrenceDays
            : [],
        recurrenceEndDate:
          form.recurrenceType !== "none"
            ? form.recurrenceEndDate
            : null,
      };

      let response: Response;

      if (editingLesson) {
        response = await fetch(
          `${BACKEND_URL}/api/lessons/${editingLesson.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch(
          `${BACKEND_URL}/api/lessons`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.error ||
            "Errore durante il salvataggio della lezione."
        );
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error("Errore salvataggio lezione:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Errore durante il salvataggio della lezione."
      );
    }
  };

  // ============================================================
  // ELIMINA
  // ============================================================

  const handleDelete = async (lesson: Lesson) => {
    const confirmed = window.confirm(
      `Vuoi eliminare la lezione di ${lesson.subject} del ${formatDateDisplay(
        lesson.date
      )}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/lessons/${lesson.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione.");
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error("Errore eliminazione lezione:", error);
      alert("Non è stato possibile eliminare la lezione.");
    }
  };

  // ============================================================
  // LEZIONI DEL GIORNO
  // ============================================================

  const getLessonsForDay = (day: Date) => {
    const dateString = formatDateInput(day);

    return lessons
      .filter((lesson) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(lesson.date)) {
          return lesson.date === dateString;
        }

        const parsed = parseDate(lesson.date);

        return (
          formatDateInput(parsed) === dateString
        );
      })
      .sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
  };

  // ============================================================
  // POSIZIONE LEZIONE NEL CALENDARIO
  // ============================================================

  const getLessonStyle = (lesson: Lesson) => {
    const startMinutes = timeToMinutes(lesson.startTime);
    const endMinutes = timeToMinutes(lesson.endTime);

    const calendarStartMinutes =
      CALENDAR_START_HOUR * 60;

    const top =
      ((startMinutes - calendarStartMinutes) / 60) *
      SLOT_HEIGHT;

    const height = Math.max(
      34,
      ((endMinutes - startMinutes) / 60) *
        SLOT_HEIGHT
    );

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const todayString = formatDateInput(new Date());

  // ============================================================
  // TITOLO SETTIMANA
  // ============================================================

  const weekTitle = `${weekDays[0].toLocaleDateString(
    "it-IT",
    {
      day: "numeric",
      month: "long",
    }
  )} – ${weekDays[6].toLocaleDateString(
    "it-IT",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  )}`;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* HEADER */}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Lezioni
          </h1>

          <p className="text-slate-400 mt-1">
            Registro personale delle lezioni
          </p>
        </div>

        <button
          type="button"
          onClick={() => openNewLesson()}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition font-semibold"
        >
          + Nuova lezione
        </button>
      </div>

      {/* NAVIGAZIONE SETTIMANA */}

      <div className="flex items-center justify-between mb-4 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <button
          type="button"
          onClick={goToPreviousWeek}
          className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300"
        >
          ←
        </button>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm"
          >
            Oggi
          </button>

          <h2 className="font-semibold capitalize">
            {weekTitle}
          </h2>
        </div>

        <button
          type="button"
          onClick={goToNextWeek}
          className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300"
        >
          →
        </button>
      </div>

      {/* CALENDARIO */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* INTESTAZIONE GIORNI */}

        <div className="grid grid-cols-[70px_repeat(7,minmax(0,1fr))] border-b border-slate-800">
          <div className="border-r border-slate-800" />

          {weekDays.map((day, index) => {
            const dateString = formatDateInput(day);
            const isToday = dateString === todayString;

            return (
              <div
                key={dateString}
                className={`text-center py-3 border-r border-slate-800 last:border-r-0 ${
                  isToday ? "bg-blue-950/40" : ""
                }`}
              >
                <div className="text-xs text-slate-500 uppercase">
                  {DAY_NAMES[index]}
                </div>

                <div
                  className={`text-lg font-semibold mt-1 ${
                    isToday
                      ? "text-blue-400"
                      : "text-slate-200"
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* AREA CALENDARIO */}

        <div className="grid grid-cols-[70px_repeat(7,minmax(0,1fr))]">
          {/* COLONNA ORARI */}

          <div className="border-r border-slate-800">
            {Array.from(
              {
                length:
                  CALENDAR_END_HOUR -
                  CALENDAR_START_HOUR,
              },
              (_, index) => {
                const hour =
                  CALENDAR_START_HOUR + index;

                return (
                  <div
                    key={hour}
                    className="h-16 border-b border-slate-800 text-xs text-slate-500 text-right pr-2 pt-1"
                  >
                    {pad(hour)}:00
                  </div>
                );
              }
            )}
          </div>

          {/* COLONNE GIORNI */}

          {weekDays.map((day) => {
            const dayString = formatDateInput(day);
            const dayLessons =
              getLessonsForDay(day);

            return (
              <div
                key={dayString}
                className="relative border-r border-slate-800 last:border-r-0"
                style={{
                  height: `${
                    (CALENDAR_END_HOUR -
                      CALENDAR_START_HOUR) *
                    SLOT_HEIGHT
                  }px`,
                }}
              >
                {/* SLOT ORARI */}

                {Array.from(
                  {
                    length:
                      CALENDAR_END_HOUR -
                      CALENDAR_START_HOUR,
                  },
                  (_, index) => {
                    const hour =
                      CALENDAR_START_HOUR + index;

                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() =>
                          handleCalendarSlotClick(
                            day,
                            hour
                          )
                        }
                        className="absolute left-0 right-0 h-16 border-b border-slate-800/80 hover:bg-slate-800/40 transition"
                        style={{
                          top: `${
                            index * SLOT_HEIGHT
                          }px`,
                        }}
                        aria-label={`Nuova lezione ${day.toLocaleDateString(
                          "it-IT"
                        )} alle ${pad(hour)}:00`}
                      />
                    );
                  }
                )}

                {/* LEZIONI */}

                {dayLessons.map((lesson) => {
                  const style =
                    getLessonStyle(lesson);

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditLesson(lesson);
                      }}
                      className="absolute left-1 right-1 z-10 rounded-lg bg-blue-600/90 hover:bg-blue-500 border border-blue-400/30 text-left p-2 overflow-hidden shadow-lg transition"
                      style={style}
                    >
                      <div className="font-semibold text-xs truncate">
                        {lesson.subject}
                      </div>

                      <div className="text-[11px] text-blue-100 truncate mt-0.5">
                        {lesson.className}
                      </div>

                      <div className="text-[10px] text-blue-200 mt-1">
                        {lesson.startTime} –{" "}
                        {lesson.endTime}
                      </div>

                      {lesson.topic && (
                        <div className="text-[10px] text-blue-100 truncate mt-1">
                          {lesson.topic}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="text-center text-slate-500 py-6">
          Caricamento lezioni...
        </div>
      )}

      {/* ========================================================
          MODALE
         ======================================================== */}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER MODALE */}

            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {editingLesson
                  ? "Modifica lezione"
                  : "Nuova lezione"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-5"
            >
              {/* DATA + ORARI */}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data *
                  </label>

                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      handleChange(
                        "date",
                        event.target.value
                      )
                    }
                    onMouseDown={(event) =>
                      event.stopPropagation()
                    }
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                    required
                    className="w-full h-12 px-4 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Inizio *
                  </label>

                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      handleChange(
                        "startTime",
                        event.target.value
                      )
                    }
                    onMouseDown={(event) =>
                      event.stopPropagation()
                    }
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                    required
                    className="w-full h-12 px-4 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fine *
                  </label>

                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) =>
                      handleChange(
                        "endTime",
                        event.target.value
                      )
                    }
                    onMouseDown={(event) =>
                      event.stopPropagation()
                    }
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                    required
                    className="w-full h-12 px-4 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* CLASSE + MATERIA */}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Classe *
                  </label>

                  <select
                    value={form.className}
                    onChange={(event) =>
                      handleChange(
                        "className",
                        event.target.value
                      )
                    }
                    required
                    className="w-full h-12 px-4 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">
                      Seleziona classe
                    </option>

                    {classes.map((className) => (
                      <option
                        key={className}
                        value={className}
                      >
                        {className}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Materia *
                  </label>

                  <input
                    type="text"
                    value={form.subject}
                    onChange={(event) =>
                      handleChange(
                        "subject",
                        event.target.value
                      )
                    }
                    placeholder="Es. Economia aziendale"
                    required
                    className="w-full h-12 px-4 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* ARGOMENTO */}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Argomento *
                </label>

                <input
                  type="text"
                  value={form.topic}
                  onChange={(event) =>
                    handleChange(
                      "topic",
                      event.target.value
                    )
                  }
                  placeholder="Es. Il bilancio d'esercizio"
                  required
                  className="w-full h-12 px-4 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* RIPETIZIONE */}

              <div className="border border-slate-700 rounded-xl p-4">
                <div className="text-sm font-semibold text-slate-300 mb-3">
                  🔁 Ripeti
                </div>

                <select
                  value={form.recurrenceType}
                  onChange={(event) =>
                    handleChange(
                      "recurrenceType",
                      event.target.value
                    )
                  }
                  className="w-full max-w-md h-12 px-4 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="none">
                    Non si ripete
                  </option>

                  <option value="daily">
                    Ogni giorno
                  </option>

                  <option value="weekly">
                    Ogni settimana
                  </option>
                </select>

                {form.recurrenceType !== "none" && (
                  <div className="mt-4 space-y-4">
                    {/* INTERVALLO */}

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">
                        Ripeti ogni
                      </span>

                      <select
                        value={form.recurrenceInterval}
                        onChange={(event) =>
                          handleChange(
                            "recurrenceInterval",
                            Number(event.target.value)
                          )
                        }
                        className="h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                      </select>

                      <span className="text-sm text-slate-400">
                        {form.recurrenceType ===
                        "daily"
                          ? "giorno/i"
                          : "settimana/e"}
                      </span>
                    </div>

                    {/* GIORNI SETTIMANA */}

                    {form.recurrenceType ===
                      "weekly" && (
                      <div>
                        <div className="text-sm text-slate-400 mb-2">
                          Giorni
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {DAY_NAMES.map(
                            (name, index) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() =>
                                  toggleRecurrenceDay(
                                    index + 1
                                  )
                                }
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                                  form.recurrenceDays.includes(
                                    index + 1
                                  )
                                    ? "bg-blue-600 border-blue-500 text-white"
                                    : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                                }`}
                              >
                                {name}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* DATA FINE RIPETIZIONE */}

                    <div className="max-w-xs">
                      <label className="block text-sm text-slate-400 mb-2">
                        Ripeti fino al
                      </label>

                      <input
                        type="date"
                        value={
                          form.recurrenceEndDate
                        }
                        onChange={(event) =>
                          handleChange(
                            "recurrenceEndDate",
                            event.target.value
                          )
                        }
                        onMouseDown={(event) =>
                          event.stopPropagation()
                        }
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                        className="w-full h-11 px-4 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* COMPITI */}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  📌 Compiti assegnati
                </label>

                <textarea
                  value={form.homework}
                  onChange={(event) =>
                    handleChange(
                      "homework",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Es. Esercizi 12-15 pag. 84"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>

              {/* NOTE */}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  📝 Note
                </label>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    handleChange(
                      "notes",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Eventuali annotazioni..."
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>

              {/* PULSANTI */}

              <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                <div>
                  {editingLesson && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(editingLesson)
                      }
                      className="px-4 py-2.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30"
                    >
                      Elimina
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    Annulla
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                  >
                    {editingLesson
                      ? "Salva modifiche"
                      : "Salva lezione"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}