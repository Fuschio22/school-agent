import { useEffect, useMemo, useState } from "react";

type Lesson = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  className: string;
  subject: string;
  topic: string;
  homework: string | null;
  notes: string | null;
  recurrenceType: string | null;
  recurrenceInterval: number | null;
  recurrenceDays: string | null;
  recurrenceEndDate: string | null;
  recurrenceGroupId: string | null;
  createdAt: string;
  updatedAt: string;
};

type LessonForm = {
  date: string;
  startTime: string;
  endTime: string;
  className: string;
  subject: string;
  topic: string;
  homework: string;
  notes: string;
  recurrenceType: "none" | "daily" | "weekly";
  recurrenceInterval: number;
  recurrenceDays: number[];
  recurrenceEndDate: string;
};

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://school-agent-backend.onrender.com";

const WEEK_DAYS = [
  { value: 1, short: "Lun", full: "Lunedì" },
  { value: 2, short: "Mar", full: "Martedì" },
  { value: 3, short: "Mer", full: "Mercoledì" },
  { value: 4, short: "Gio", full: "Giovedì" },
  { value: 5, short: "Ven", full: "Venerdì" },
  { value: 6, short: "Sab", full: "Sabato" },
  { value: 0, short: "Dom", full: "Domenica" },
];

const START_HOUR = 8;
const END_HOUR = 19;
const SLOT_HEIGHT = 64;

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (date: string) => {
  const parsed = parseDate(date);

  return parsed.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getMonday = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);
  result.setHours(0, 0, 0, 0);

  return result;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatWeekRange = (monday: Date) => {
  const sunday = addDays(monday, 6);

  const first = monday.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const last = sunday.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${first} – ${last}`;
};

const getDayNumber = (date: string) => {
  return parseDate(date).getDay();
};

const getMinutesFromTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const emptyForm = (): LessonForm => {
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
    recurrenceDays: [today.getDay()],
    recurrenceEndDate: "",
  };
};

export default function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [weekStart, setWeekStart] = useState(
    getMonday(new Date())
  );

  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(
    null
  );

  const [form, setForm] = useState<LessonForm>(emptyForm());

  const loadLessons = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${BACKEND_URL}/api/lessons`);

      if (!response.ok) {
        throw new Error("Errore nel recupero delle lezioni");
      }

      const data = await response.json();

      setLessons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Errore recupero lezioni:", error);
      alert("Impossibile recuperare le lezioni.");
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/users/classes`
      );

      if (!response.ok) {
        throw new Error("Errore nel recupero delle classi");
      }

      const data = await response.json();

      if (Array.isArray(data.classes)) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error("❌ Errore recupero classi:", error);
    }
  };

  useEffect(() => {
    loadLessons();
    loadClasses();
  }, []);

  const openNewLesson = (date?: string, startTime?: string) => {
    const newForm = emptyForm();

    if (date) {
      newForm.date = date;
      newForm.recurrenceDays = [getDayNumber(date)];
    }

    if (startTime) {
      const [hour] = startTime.split(":").map(Number);

      newForm.startTime = startTime;

      newForm.endTime = `${String(hour + 1).padStart(2, "0")}:00`;
    }

    if (classes.length > 0) {
      newForm.className = classes[0];
    }

    setEditingLesson(null);
    setForm(newForm);
    setShowForm(true);
  };

  const openEditLesson = (lesson: Lesson) => {
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
      recurrenceType: "none",
      recurrenceInterval: 1,
      recurrenceDays: [getDayNumber(lesson.date)],
      recurrenceEndDate: "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingLesson(null);
    setForm(emptyForm());
  };

  const handleChange = (
    field: keyof LessonForm,
    value: string | number | number[]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleRecurrenceDay = (day: number) => {
    setForm((previous) => {
      const exists = previous.recurrenceDays.includes(day);

      return {
        ...previous,
        recurrenceDays: exists
          ? previous.recurrenceDays.filter((item) => item !== day)
          : [...previous.recurrenceDays, day],
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      !form.className ||
      !form.subject.trim() ||
      !form.topic.trim()
    ) {
      alert(
        "Compila Data, orario, classe, materia e argomento."
      );
      return;
    }

    if (form.endTime <= form.startTime) {
      alert(
        "L'ora di fine deve essere successiva all'ora di inizio."
      );
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
      alert(
        "Per una lezione ricorrente indica la data di fine."
      );
      return;
    }

    if (
      form.recurrenceType !== "none" &&
      form.recurrenceEndDate &&
      form.recurrenceEndDate < form.date
    ) {
      alert(
        "La data di fine della ricorrenza non può essere precedente alla data della lezione."
      );
      return;
    }

    try {
      setSaving(true);

      if (editingLesson) {
        const response = await fetch(
          `${BACKEND_URL}/api/lessons/${editingLesson.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              date: form.date,
              startTime: form.startTime,
              endTime: form.endTime,
              className: form.className,
              subject: form.subject.trim(),
              topic: form.topic.trim(),
              homework: form.homework.trim() || null,
              notes: form.notes.trim() || null,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.error || "Errore durante la modifica"
          );
        }
      } else {
        const response = await fetch(
          `${BACKEND_URL}/api/lessons`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              date: form.date,
              startTime: form.startTime,
              endTime: form.endTime,
              className: form.className,
              subject: form.subject.trim(),
              topic: form.topic.trim(),
              homework: form.homework.trim() || null,
              notes: form.notes.trim() || null,
              recurrenceType: form.recurrenceType,
              recurrenceInterval:
                form.recurrenceType === "none"
                  ? null
                  : form.recurrenceInterval,
              recurrenceDays:
                form.recurrenceType === "weekly"
                  ? form.recurrenceDays
                  : null,
              recurrenceEndDate:
                form.recurrenceType === "none"
                  ? null
                  : form.recurrenceEndDate,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.error || "Errore durante la creazione"
          );
        }
      }

      closeForm();
      await loadLessons();
    } catch (error) {
      console.error("❌ Errore salvataggio lezione:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Errore durante il salvataggio."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    const confirmed = window.confirm(
      `Vuoi eliminare la lezione del ${formatDate(
        lesson.date
      )} alle ${lesson.startTime}?`
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
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.error || "Errore durante l'eliminazione"
        );
      }

      await loadLessons();
    } catch (error) {
      console.error("❌ Errore eliminazione lezione:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Errore durante l'eliminazione."
      );
    }
  };

  const previousWeek = () => {
    setWeekStart((current) => addDays(current, -7));
  };

  const nextWeek = () => {
    setWeekStart((current) => addDays(current, 7));
  };

  const goToday = () => {
    setWeekStart(getMonday(new Date()));
  };

  const weekDays = useMemo(() => {
    return WEEK_DAYS.map((day, index) => {
      const date = addDays(weekStart, index);

      return {
        ...day,
        date,
        dateString: formatDateInput(date),
      };
    });
  }, [weekStart]);

  const lessonsByDay = useMemo(() => {
    const result: Record<string, Lesson[]> = {};

    weekDays.forEach((day) => {
      result[day.dateString] = [];
    });

    lessons.forEach((lesson) => {
      if (result[lesson.date]) {
        result[lesson.date].push(lesson);
      }
    });

    return result;
  }, [lessons, weekDays]);

  const todayString = formatDateInput(new Date());

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Lezioni
          </h1>

          <p className="text-slate-400">
            Il tuo registro personale delle lezioni
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
          >
            Oggi
          </button>

          <button
            type="button"
            onClick={previousWeek}
            className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xl transition"
            title="Settimana precedente"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={nextWeek}
            className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xl transition"
            title="Settimana successiva"
          >
            ›
          </button>

          <button
            type="button"
            onClick={() => openNewLesson()}
            className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
          >
            + Nuova lezione
          </button>
        </div>
      </div>

      {/* WEEK TITLE */}
      <div className="flex items-center justify-center mb-4">
        <h2 className="text-xl font-semibold capitalize">
          {formatWeekRange(weekStart)}
        </h2>
      </div>

      {/* CALENDAR */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        {/* DAYS HEADER */}
        <div className="grid grid-cols-[70px_repeat(7,minmax(110px,1fr))] border-b border-slate-700">
          <div className="border-r border-slate-700" />

          {weekDays.map((day) => {
            const isToday = day.dateString === todayString;

            return (
              <div
                key={day.dateString}
                className={`text-center py-3 border-r border-slate-700 last:border-r-0 ${
                  isToday ? "bg-blue-500/10" : ""
                }`}
              >
                <div className="text-xs text-slate-400 uppercase">
                  {day.short}
                </div>

                <div
                  className={`text-xl font-semibold mt-1 ${
                    isToday
                      ? "text-blue-400"
                      : "text-white"
                  }`}
                >
                  {day.date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* CALENDAR BODY */}
        <div className="overflow-x-auto">
          <div
            className="grid grid-cols-[70px_repeat(7,minmax(110px,1fr))]"
            style={{
              minWidth: "850px",
            }}
          >
            {/* TIME COLUMN */}
            <div className="border-r border-slate-700">
              {Array.from(
                { length: END_HOUR - START_HOUR },
                (_, index) => {
                  const hour = START_HOUR + index;

                  return (
                    <div
                      key={hour}
                      className="relative border-b border-slate-700 text-xs text-slate-500 text-right pr-2"
                      style={{
                        height: SLOT_HEIGHT,
                      }}
                    >
                      <span className="absolute -top-2 right-2">
                        {String(hour).padStart(2, "0")}:00
                      </span>
                    </div>
                  );
                }
              )}
            </div>

            {/* DAYS */}
            {weekDays.map((day) => {
              const dayLessons =
                lessonsByDay[day.dateString] || [];

              return (
                <div
                  key={day.dateString}
                  className={`relative border-r border-slate-700 last:border-r-0 ${
                    day.dateString === todayString
                      ? "bg-blue-500/[0.03]"
                      : ""
                  }`}
                >
                  {/* HOURLY GRID */}
                  {Array.from(
                    {
                      length: END_HOUR - START_HOUR,
                    },
                    (_, index) => {
                      const hour = START_HOUR + index;

                      return (
                        <button
                          key={hour}
                          type="button"
                          onClick={() =>
                            openNewLesson(
                              day.dateString,
                              `${String(hour).padStart(
                                2,
                                "0"
                              )}:00`
                            )
                          }
                          className="absolute left-0 right-0 border-b border-slate-700/80 hover:bg-slate-700/30 transition"
                          style={{
                            top: index * SLOT_HEIGHT,
                            height: SLOT_HEIGHT,
                          }}
                          aria-label={`Nuova lezione ${day.full} alle ${hour}:00`}
                        />
                      );
                    }
                  )}

                  {/* LESSONS */}
                  {dayLessons.map((lesson) => {
                    const startMinutes =
                      getMinutesFromTime(
                        lesson.startTime
                      );

                    const endMinutes =
                      getMinutesFromTime(
                        lesson.endTime
                      );

                    const top =
                      ((startMinutes -
                        START_HOUR * 60) /
                        60) *
                      SLOT_HEIGHT;

                    const height = Math.max(
                      38,
                      ((endMinutes - startMinutes) /
                        60) *
                        SLOT_HEIGHT
                    );

                    return (
                      <div
                        key={lesson.id}
                        className="absolute left-1 right-1 z-10 rounded-lg bg-blue-600/90 border border-blue-400/40 shadow-lg p-2 text-left overflow-hidden cursor-pointer hover:bg-blue-500 transition"
                        style={{
                          top,
                          height,
                        }}
                        onClick={() =>
                          openEditLesson(lesson)
                        }
                        title="Clicca per modificare"
                      >
                        <div className="text-xs text-blue-100 font-medium">
                          {lesson.startTime} –{" "}
                          {lesson.endTime}
                        </div>

                        <div className="font-semibold text-white text-sm mt-1 truncate">
                          {lesson.subject}
                        </div>

                        <div className="text-xs text-blue-100 truncate">
                          {lesson.className}
                        </div>

                        <div className="text-xs text-white/80 truncate mt-1">
                          {lesson.topic}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center text-slate-400 py-6">
          Caricamento lezioni...
        </div>
      )}

      {/* EMPTY */}
      {!loading && lessons.length === 0 && (
        <div className="text-center text-slate-500 py-6">
          Nessuna lezione registrata. Clicca su una fascia
          oraria oppure su{" "}
          <strong>+ Nuova lezione</strong>.
        </div>
      )}

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h2 className="text-2xl font-semibold">
                  {editingLesson
                    ? "Modifica lezione"
                    : "Nuova lezione"}
                </h2>

                {editingLesson && (
                  <p className="text-sm text-slate-400 mt-1">
                    {formatDate(editingLesson.date)} ·{" "}
                    {editingLesson.startTime} –{" "}
                    {editingLesson.endTime}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >
              {/* DATA / ORARIO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
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
                    required
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
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
                    required
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
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
                    required
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* CLASSE / MATERIA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
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
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
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
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* ARGOMENTO */}
              <div className="mb-5">
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
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* RIPETIZIONE */}
              {!editingLesson && (
                <div className="border border-slate-700 rounded-xl p-4 mb-5">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    🔁 Ripeti
                  </label>

                  <select
                    value={form.recurrenceType}
                    onChange={(event) =>
                      handleChange(
                        "recurrenceType",
                        event.target.value
                      )
                    }
                    className="w-full md:w-1/2 px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
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
                    <div className="mt-4">
                      {form.recurrenceType ===
                        "weekly" && (
                        <>
                          <label className="block text-sm text-slate-400 mb-2">
                            Giorni della settimana
                          </label>

                          <div className="flex flex-wrap gap-2">
                            {WEEK_DAYS.map((day) => {
                              const selected =
                                form.recurrenceDays.includes(
                                  day.value
                                );

                              return (
                                <button
                                  key={day.value}
                                  type="button"
                                  onClick={() =>
                                    toggleRecurrenceDay(
                                      day.value
                                    )
                                  }
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                    selected
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                  }`}
                                >
                                  {day.short}
                                </button>
                              );
                            })}
                          </div>

                          <p className="text-xs text-slate-500 mt-2">
                            Puoi selezionare più giorni.
                          </p>
                        </>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">
                            Intervallo
                          </label>

                          <select
                            value={
                              form.recurrenceInterval
                            }
                            onChange={(event) =>
                              handleChange(
                                "recurrenceInterval",
                                Number(
                                  event.target.value
                                )
                              )
                            }
                            className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value={1}>
                              {form.recurrenceType ===
                              "daily"
                                ? "Ogni giorno"
                                : "Ogni settimana"}
                            </option>

                            <option value={2}>
                              {form.recurrenceType ===
                              "daily"
                                ? "Ogni 2 giorni"
                                : "Ogni 2 settimane"}
                            </option>

                            <option value={3}>
                              {form.recurrenceType ===
                              "daily"
                                ? "Ogni 3 giorni"
                                : "Ogni 3 settimane"}
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-slate-400 mb-2">
                            Termina il
                          </label>

                          <input
                            type="date"
                            value={
                              form.recurrenceEndDate
                            }
                            min={form.date}
                            onChange={(event) =>
                              handleChange(
                                "recurrenceEndDate",
                                event.target.value
                              )
                            }
                            required
                            className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* COMPITI */}
              <div className="mb-5">
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
              <div className="mb-6">
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

              {/* BUTTONS */}
              <div className="flex justify-between gap-3">
                <div>
                  {editingLesson && (
                    <button
                      type="button"
                      onClick={() => {
                        closeForm();
                        handleDelete(editingLesson);
                      }}
                      disabled={saving}
                      className="px-5 py-3 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 font-medium transition"
                    >
                      Elimina
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="px-5 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition"
                  >
                    Annulla
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition"
                  >
                    {saving
                      ? "Salvataggio..."
                      : editingLesson
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