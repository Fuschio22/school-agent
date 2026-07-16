import { Request, Response } from "express";
import { analyzeCircularText } from "../services/aiService";
import { prisma } from "../lib/prisma";

// Funzione 1: Analizza e salva una nuova circolare
export const analyzeCircularController = async (req: Request, res: Response) => {
  try {
    const { text, fileName } = req.body;
    const filePath = req.file ? req.file.path : null;

    if (!text) {
      return res.status(400).json({ error: "Il testo estratto è obbligatorio" });
    }

    console.log("📄 File salvato fisicamente in:", filePath);

    const analysis = await analyzeCircularText(text);
    console.log("🤖 AI estrazione completata");

    let user = await prisma.user.findUnique({ where: { email: "demo@schoolagent.it" } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: "demo@schoolagent.it", name: "Utente Demo" }
      });
    }

    const circData = analysis.circolare || analysis;
    const eventsData = Array.isArray(analysis.eventi) 
      ? analysis.eventi 
      : (Array.isArray(analysis.consigliDiClasse) ? analysis.consigliDiClasse : []);
    const orderOfDay = Array.isArray(analysis.ordineDelGiorno) ? analysis.ordineDelGiorno : [];

    const circular = await prisma.circular.create({
      data: {
        fileName: fileName || "documento.pdf",
        filePath: filePath,
        number: String(circData.numero || ""),
        date: String(circData.data || ""),
        subject: String(circData.oggetto || ""),
        summary: orderOfDay.length > 0 ? orderOfDay.join("\n") : "Nessun ordine del giorno",
        priority: "media",
        recipients: JSON.stringify(circData.destinatari || []),
        deadlines: JSON.stringify([]),
        text: text,
        userId: user.id,
        events: {
          create: eventsData.map((event: any) => ({
            title: `${event.classe || "Classe non specificata"} - ${event.sede || "Sede non specificata"}`,
            type: "CDC",
            date: String(event.data || ""),
            startTime: String(event.oraInizio || "15:00"),
            endTime: String(event.oraFine || "16:00"),
            location: String(event.sede || "Sede scolastica"),
            circularNumber: String(circData.numero || ""),
          })),
        },
      },
      include: { events: true },
    });

    console.log("✅ Circolare salvata con successo nel DB. ID:", circular.id);
    res.json(circular);
  } catch (error) {
    console.error("❌ Errore analisi circolare:", error);
    res.status(500).json({ error: "Errore durante l'analisi AI della circolare" });
  }
};

// Funzione 2: Recupera tutte le circolari salvate (Archivio)
export const getAllCircularsController = async (req: Request, res: Response) => {
  try {
    const circulars = await prisma.circular.findMany({
      include: { events: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(circulars);
  } catch (error) {
    console.error("❌ Errore nel recupero delle circolari:", error);
    res.status(500).json({ error: "Errore nel recupero delle circolari" });
  }
};