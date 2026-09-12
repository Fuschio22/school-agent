import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Recupera tutte le lezioni dell'utente
export const getLessonsController = async (req: Request, res: Response) => {
  try {
    const userEmail = "demo@schoolagent.it";

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        error: "Utente non trovato",
      });
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        {
          date: "desc",
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

// Crea una nuova lezione
export const createLessonController = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      date,
      className,
      subject,
      topic,
      homework,
      notes,
    } = req.body;

    if (!date || !className || !subject || !topic) {
      return res.status(400).json({
        error: "Data, classe, materia e argomento sono obbligatori",
      });
    }

    const userEmail = "demo@schoolagent.it";

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        error: "Utente non trovato",
      });
    }

    const lesson = await prisma.lesson.create({
      data: {
        date,
        className,
        subject,
        topic,
        homework: homework || null,
        notes: notes || null,
        userId: user.id,
      },
    });

    res.status(201).json(lesson);
  } catch (error) {
    console.error("❌ Errore creazione lezione:", error);

    res.status(500).json({
      error: "Errore durante la creazione della lezione",
    });
  }
};

// Modifica una lezione
export const updateLessonController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const {
      date,
      className,
      subject,
      topic,
      homework,
      notes,
    } = req.body;

    if (!date || !className || !subject || !topic) {
      return res.status(400).json({
        error: "Data, classe, materia e argomento sono obbligatori",
      });
    }

    const userEmail = "demo@schoolagent.it";

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        error: "Utente non trovato",
      });
    }

    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id,
        userId: user.id,
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
        className,
        subject,
        topic,
        homework: homework || null,
        notes: notes || null,
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

// Elimina una lezione
export const deleteLessonController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const userEmail = "demo@schoolagent.it";

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        error: "Utente non trovato",
      });
    }

    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id,
        userId: user.id,
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