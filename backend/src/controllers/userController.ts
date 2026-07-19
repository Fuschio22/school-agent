import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Funzione per ottenere le classi dell'utente
export const getUserClassesController = async (req: Request, res: Response) => {
  try {
    const userEmail = "demo@schoolagent.it";
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { classes: true }
    });

    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    // Prisma gestisce nativamente String[], quindi user.classes è già un array!
    res.json({ classes: user.classes || [] });
  } catch (error) {
    console.error("❌ Errore recupero classi:", error);
    res.status(500).json({ error: "Errore durante il recupero delle classi" });
  }
};

// Funzione per salvare/aggiornare le classi dell'utente
export const updateUserClassesController = async (req: Request, res: Response) => {
  try {
    const { classes } = req.body;

    if (!classes || !Array.isArray(classes)) {
      return res.status(400).json({ error: "Le classi devono essere fornite come array" });
    }

    const userEmail = "demo@schoolagent.it";

    const user = await prisma.user.update({
      where: { email: userEmail },
      data: {
        classes: classes, // Prisma accetta direttamente l'array di stringhe, niente JSON.stringify
      },
    });

    res.json({ 
      message: "Classi aggiornate con successo", 
      classes: user.classes 
    });
  } catch (error) {
    console.error("❌ Errore aggiornamento classi:", error);
    res.status(500).json({ error: "Errore durante l'aggiornamento delle classi" });
  }
};