import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const getUserId = async () => {
  const userEmail = "demo@schoolagent.it";

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });

  return user?.id || null;
};

const getDatesForRecurrence = (
  date: string,
  recurrenceType: string | null | undefined,
  recurrenceInterval: number | null | undefined,
  recurrenceDays: string | null | undefined,
  recurrenceEndDate: string | null | undefined
): string[] => {
  if (!recurrenceType || recurrenceType === "none") {
    return [date];
  }

  const start = new Date(`${date}T00:00:00`);

  if (Number.isNaN(start.getTime())) {
    return [date];
  }

  const end = recurrenceEndDate
    ? new Date(`${recurrenceEndDate}T00:00:00`)
    : new Date(start);

  if (Number.isNaN(end.getTime()) || end < start) {
    return [date];
  }

  const interval = Math.max(1, recurrenceInterval || 1);
  const dates: string[] = [];

  const formatDate = (current: Date) => {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  if (recurrenceType === "daily") {
    const current = new Date(start);

    while (current <= end) {
      dates.push(formatDate(current));
      current.setDate(current.getDate() + interval);
    }

    return dates;
  }

  if (recurrenceType === "weekly") {
    const selectedDays = recurrenceDays
      ? recurrenceDays
          .split(",")
          .map((day) => Number(day))
          .filter((day) => day >= 0 && day <= 6)
      : [start.getDay()];

    const days = [...new Set(selectedDays)].sort((a, b) => a - b);

    const currentWeekStart = new Date(start);
    currentWeekStart.setDate(
      currentWeekStart.getDate() - currentWeekStart.getDay()
    );

    let weekIndex = 0;

    while (true) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(
        weekStart.getDate() + weekIndex * interval * 7
      );

      if (weekStart > end) {
        break;
      }

      for (const day of days) {
        const current = new Date(weekStart);
        current.setDate(current.getDate() + day);

        if (current < start || current > end) {
          continue;
        }

        dates.push(formatDate(current));
      }

      weekIndex++;
    }

    return dates.sort();
  }

  return [date];
};

// Recupera tutte le lezioni dell'utente
export const getLessonsController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = await getUserId();

    if (!userId) {
      return res.status(404).json({
        error: "Utente non trovato",
      });
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          date: "desc",
        },
        {
          startTime: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    res.json(lessons);
  } catch (error) {
    console.error("❌ Errore recupero lezioni:", error);

    res.status(500).json({
      error: "Errore durante il recupero delle lezioni",
    });
  }
};

// Crea una nuova lezione, singola o ricorrente
export const createLessonController = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      date,
      startTime,
      endTime,
      className,
      subject,
      topic,
      homework,
      notes,
      recurrenceType,
      recurrenceInterval,
      recurrenceDays,
      recurrenceEndDate,
    } = req.body;

    if (
      !date ||
      !startTime ||
      !endTime ||
      !className ||
      !subject?.trim() ||
      !topic?.trim()
    ) {
      return res.status(400).json({
        error:
          "Data, orario, classe, materia e argomento sono obbligatori",
      });
    }

    const userId = await getUserId();

    if (!userId) {
      return res.status(404).json({
        error: "Utente non trovato",
      });
    }

    const type = recurrenceType || "none";

    const interval =
      type === "none"
        ? null
        : Math.max(1, Number(recurrenceInterval) || 1);

    const days =
      type === "weekly" && Array.isArray(recurrenceDays)
        ? recurrenceDays.join(",")
        : type === "weekly"
          ? recurrenceDays || null
          : null;

    const endDate =
      type !== "none" ? recurrenceEndDate || null : null;

    const dates = getDatesForRecurrence(
      date,
      type,
      interval,
      days,
      endDate
    );

    const recurrenceGroupId =
      type !== "none" ? crypto.randomUUID() : null;

    const lessons = await prisma.$transaction(
      dates.map((lessonDate) =>
        prisma.lesson.create({
          data: {
            date: lessonDate,
            startTime,
            endTime,
            className,
            subject: subject.trim(),
            topic: topic.trim(),
            homework: homework?.trim() || null,
            notes: notes?.trim() || null,
            recurrenceType: type,
            recurrenceInterval: interval,
            recurrenceDays: days,
            recurrenceEndDate: endDate,
            recurrenceGroupId,
            userId,
          },
        })
      )
    );

    res.status(201).json({
      message:
        lessons.length === 1
          ? "Lezione creata con successo"
          : `Serie creata con ${lessons.length} lezioni`,
      lessons,
    });
  } catch (error) {
    console.error("❌ Errore creazione lezione:", error);

    res.status(500).json({
      error: "Errore durante la creazione della lezione",
    });
  }
};

// Modifica una singola lezione
export const updateLessonController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const {
      date,
      startTime,
      endTime,
      className,
      subject,
      topic,
      homework,
      notes,
    } = req.body;

    if (
      !date ||
      !startTime ||
      !endTime ||
      !className ||
      !subject?.trim() ||
      !topic?.trim()
    ) {
      return res.status(400).json({
        error:
          "Data, orario, classe, materia e argomento sono obbligatori",
      });
    }

    const userId = await getUserId();

    if (!userId) {
      return res.status(404).json({
        error: "Utente non trovato",
      });
    }

    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingLesson) {
      return res.status(404).json({
        error: "Lezione non trovata",
      });
    }

    const lesson = await prisma.lesson.update({
      where: {
        id,
      },
      data: {
        date,
        startTime,
        endTime,
        className,
        subject: subject.trim(),
        topic: topic.trim(),
        homework: homework?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    res.json(lesson);
  } catch (error) {
    console.error("❌ Errore modifica lezione:", error);

    res.status(500).json({
      error: "Errore durante la modifica della lezione",
    });
  }
};

// Elimina una singola lezione
export const deleteLessonController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const userId = await getUserId();

    if (!userId) {
      return res.status(404).json({
        error: "Utente non trovato",
      });
    }

    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingLesson) {
      return res.status(404).json({
        error: "Lezione non trovata",
      });
    }

    await prisma.lesson.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Lezione eliminata con successo",
    });
  } catch (error) {
    console.error("❌ Errore eliminazione lezione:", error);

    res.status(500).json({
      error: "Errore durante l'eliminazione della lezione",
    });
  }
};