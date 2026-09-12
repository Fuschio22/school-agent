import { useEffect, useMemo, useState } from "react";

type Lesson = {
  id: string;
  date: string;
  className: string;
  subject: string;
  topic: string;
  homework: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type LessonForm = {
  date: string;
  className: string;
  subject: string;
  topic: string;
  homework: string;
  notes: string;
};

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://school-agent-backend.onrender.com";

const emptyForm: LessonForm = {
  date: new Date().toISOString().split("T")[0],
  className: "",
  subject: "",
  topic: "",
  homework: "",
  notes: "",
};

const formatDate = (date: string) => {
  if (!date) return "";

  const [year, month, day] = date.split("-");

  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }

  return date;
};

export default function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const [form, setForm] = useState<LessonForm>(emptyForm);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

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
      const response = await fetch(`${BACKEND_URL}/api/users/classes`);

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

  const openNewLesson = () => {
    setEditingLessonId(null);
    setForm({
      ...emptyForm,
      date: new Date().toISOString().split("T")[0],
      className: classes.length > 0 ? classes[0] : "",
    });
    setShowForm(true);
  };

  const openEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);

    setForm({
      date: lesson.date,
      className: lesson.className,
      subject: lesson.subject,
      topic: lesson.topic,
      homework: lesson.homework || "",
      notes: lesson.notes || "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingLessonId(null);
    setForm(emptyForm);
  };

  const handleChange = (
    field: keyof LessonForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !form.date ||
      !form.className ||
      !form.subject.trim() ||
      !form.topic.trim()
    ) {
      alert("Compila Data, Classe, Materia e Argomento.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingLessonId);

      const response = await fetch(
        isEditing
          ? `${BACKEND_URL}/api/lessons/${editingLessonId}`
          : `${BACKEND_URL}/api/lessons`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: form.date,
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
          errorData?.error || "Errore durante il salvataggio"
        );
      }

      closeForm();
      await loadLessons();
    } catch (error) {
      console.error("❌ Errore salvataggio lezione:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Errore durante il salvataggio della lezione."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    const confirmed = window.confirm(
      `Vuoi eliminare la lezione del ${formatDate(
        lesson.date
      )} - ${lesson.className}?`
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
          : "Errore durante l'eliminazione della lezione."
      );
    }
  };

  const filteredLessons = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return lessons.filter((lesson) => {
      const matchesClass =
        !classFilter || lesson.className === classFilter;

      if (!matchesClass) return false;

      if (!searchValue) return true;

      return (
        lesson.className.toLowerCase().includes(searchValue) ||
        lesson.subject.toLowerCase().includes(searchValue) ||
        lesson.topic.toLowerCase().includes(searchValue) ||
        (lesson.homework || "").toLowerCase().includes(searchValue) ||
        (lesson.notes || "").toLowerCase().includes(searchValue)
      );
    });
  }, [lessons, search, classFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Lezioni</h1>

          <p className="text-slate-400">
            Registro personale delle lezioni svolte
          </p>
        </div>

        <button
          type="button"
          onClick={openNewLesson}
          className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
        >
          + Nuova lezione
        </button>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cerca
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Classe, materia, argomento, compiti..."
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Classe
            </label>

            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Tutte le classi</option>

              {classes.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              {editingLessonId
                ? "Modifica lezione"
                : "Nuova lezione"}
            </h2>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="text-slate-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Data *
                </label>

                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    handleChange("date", event.target.value)
                  }
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Classe *
                </label>

                <select
                  value={form.className}
                  onChange={(event) =>
                    handleChange("className", event.target.value)
                  }
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleziona classe</option>

                  {classes.map((className) => (
                    <option key={className} value={className}>
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
                    handleChange("subject", event.target.value)
                  }
                  placeholder="Es. Economia aziendale"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Argomento *
                </label>

                <input
                  type="text"
                  value={form.topic}
                  onChange={(event) =>
                    handleChange("topic", event.target.value)
                  }
                  placeholder="Es. Bilancio d'esercizio"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Compiti assegnati
                </label>

                <textarea
                  value={form.homework}
                  onChange={(event) =>
                    handleChange("homework", event.target.value)
                  }
                  rows={3}
                  placeholder="Es. Esercizi 12-15 pag. 84"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Note
                </label>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    handleChange("notes", event.target.value)
                  }
                  rows={3}
                  placeholder="Eventuali annotazioni sulla lezione..."
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
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
                  : editingLessonId
                    ? "Salva modifiche"
                    : "Salva lezione"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 py-10 text-center">
          Caricamento lezioni...
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">📚</div>

          <h2 className="text-xl font-semibold mb-2">
            {lessons.length === 0
              ? "Nessuna lezione registrata"
              : "Nessuna lezione trovata"}
          </h2>

          <p className="text-slate-400">
            {lessons.length === 0
              ? "Inizia registrando la tua prima lezione."
              : "Prova a modificare i filtri di ricerca."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-slate-800/60 border border-slate-700 rounded-xl p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 text-sm font-medium">
                      {lesson.className}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-sm">
                      {lesson.subject}
                    </span>

                    <span className="text-sm text-slate-400">
                      {formatDate(lesson.date)}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3">
                    {lesson.topic}
                  </h3>

                  {lesson.homework && (
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-slate-300 mb-1">
                        📌 Compiti
                      </div>

                      <div className="text-slate-400 whitespace-pre-wrap">
                        {lesson.homework}
                      </div>
                    </div>
                  )}

                  {lesson.notes && (
                    <div>
                      <div className="text-sm font-semibold text-slate-300 mb-1">
                        📝 Note
                      </div>

                      <div className="text-slate-400 whitespace-pre-wrap">
                        {lesson.notes}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditLesson(lesson)}
                    className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition"
                  >
                    Modifica
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(lesson)}
                    className="px-4 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 text-sm font-medium transition"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && lessons.length > 0 && (
        <div className="text-sm text-slate-500 mt-6">
          {filteredLessons.length}{" "}
          {filteredLessons.length === 1
            ? "lezione visualizzata"
            : "lezioni visualizzate"}
        </div>
      )}
    </div>
  );
}