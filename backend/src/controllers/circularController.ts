import { Request, Response } from "express";
import { analyzeCircularText } from "../services/aiService";
import { prisma } from "../lib/prisma";

export const analyzeCircularController = async (req: Request, res: Response) => {
  try {
    // 1. Estrai i dati dalla richiesta (Multer gestisce il file, il resto è nel body)
    const { text, fileName } = req.body;
    const filePath = req.file ? req.file.path : null;

    if (!text) {
      return res.status(400).json({ error: "Il testo estratto è obbligatorio" });
    }

    console.log("📄 File salvato fisicamente in:", filePath);

    // 2. Chiama l'AI per analizzare il testo
    const analysis = await analyzeCircularText(text);
    console.log("🤖 AI estrazione completata");

    // 3. Gestione Utente Demo (per evitare errori di chiave esterna P2003)
    let user = await prisma.user.findUnique({ where: { email: "demo@schoolagent.it" } });
    if (!user) {
      user = await prisma.user.create({
        data: { 
          email: "demo@schoolagent.it", 
          name: "Utente Demo" 
        }
      });
    }

    // 4. Normalizzazione intelligente dei dati (gestisce strutture nidificate o piatte)
    const circData = analysis.circolare || analysis;
    const eventsData = Array.isArray(analysis.eventi) 
      ? analysis.eventi 
      : (Array.isArray(analysis.consigliDiClasse) ? analysis.consigliDiClasse : []);
    const orderOfDay = Array.isArray(analysis.ordineDelGiorno) ? analysis.ordineDelGiorno : [];

    // 5. Salvataggio della circolare e degli eventi nel Database
    const circular = await prisma.circular.create({
      data: {
        fileName: fileName || "documento.pdf",
        filePath: filePath, // <-- Percorso del file salvato per il download
        number: String(circData.numero || ""),
        date: String(circData.data || ""),
        subject: String(circData.oggetto || ""),
        // Unisce i punti dell'OdG con un "a capo" per la visualizzazione corretta nel frontend
        summary: orderOfDay.length > 0 ? orderOfDay.join("\n") : "Nessun ordine del giorno",
        priority: "media",
        recipients: JSON.stringify(circData.destinatari || []),
        deadlines: JSON.stringify([]),
        text: text,
        userId: user.id,
        events: {
          create: eventsData.map((event: any) => ({
            // Titolo chiaro: Classe + Sede
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
      include: {
        events: true,
      },
    });

    console.log("✅ Circolare salvata con successo nel DB. ID:", circular.id);
    
    // 6. Rispondi al frontend con i dati completi
    res.json(circular);
    
  } catch (error) {
    console.error("❌ Errore analisi circolare:", error);
    res.status(500).json({ error: "Errore durante l'analisi AI della circolare" });
  }
};