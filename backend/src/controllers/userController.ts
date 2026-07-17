import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Funzione per ottenere le classi dell'utente
export const getUserClassesController = async (req: Request, res: Response) => {
  try {
    // Usiamo l'utente demo (in futuro qui ci sarà l'autenticazione reale)
    const userEmail = "demo@schoolagent.it";
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { classes: true }
    });

    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    // Il campo è salvato come stringa JSON, lo convertiamo in array
    const classesArray = user.classes ? JSON.parse(user.classes) : [];
    res.json({ classes: classesArray });
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
        classes: JSON.stringify(classes), // Salviamo l'array come stringa JSON
      },
    });

    res.json({ 
      message: "Classi aggiornate con successo", 
      classes: JSON.parse(user.classes) 
    });
  } catch (error) {
    console.error("❌ Errore aggiornamento classi:", error);
    res.status(500).json({ error: "Errore durante l'aggiornamento delle classi" });
  }
};