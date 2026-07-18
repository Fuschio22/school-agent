import { Request, Response } from "express";
import { analyzeCircularText } from "../services/aiService";
import { prisma } from "../lib/prisma";
import { filterEvents } from "../utils/classFilter"; // <-- AGGIUNTA: Import del filtro

// Funzione 1: Analizza e salva (o aggiorna) una circolare
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

    // <-- AGGIUNTA: Applichiamo il filtro di sicurezza QUI, prima di salvare
    const filteredEventsData = filterEvents(eventsData);
    console.log(`🔍 Filtro applicato: da ${eventsData.length} eventi estratti a ${filteredEventsData.length} eventi permessi.`);

    const numeroCircolare = String(circData.numero || "");
    const dataCircolare = String(circData.data || "");

    // 1. CONTROLLA SE ESISTE GIÀ (Anti-duplicato)
    const existingCircular = await prisma.circular.findFirst({
      where: {
        number: numeroCircolare,
        date: dataCircolare,
      },
      include: { events: true }
    });

    if (existingCircular) {
      // Se esiste, cancelliamo i vecchi eventi e aggiorniamo la circolare
      await prisma.event.deleteMany({
        where: { circularId: existingCircular.id }
      });

      const updatedCircular = await prisma.circular.update({
        where: { id: existingCircular.id },
        data: {
          fileName: fileName || existingCircular.fileName,
          filePath: filePath || existingCircular.filePath,
          subject: String(circData.oggetto || existingCircular.subject),
          summary: orderOfDay.length > 0 ? orderOfDay.join("\n") : existingCircular.summary,
          text: text,
          events: {
            create: filteredEventsData.map((event: any) => ({ // <-- MODIFICATO: usa filteredEventsData
              title: event.title || `${event.classe || "Classe"} - ${event.sede || "Sede"}`,
              type: event.type || "Consigli di Classe",
              date: String(event.data || ""),
              startTime: String(event.oraInizio || "15:00"),
              endTime: String(event.oraFine || "16:00"),
              location: String(event.sede || "Sede scolastica"),
              circularNumber: numeroCircolare,
            })),
          },
        },
        include: { events: true },
      });

      console.log("✅ Circolare AGGIORNATA con successo nel DB. ID:", updatedCircular.id);
      return res.json(updatedCircular);
    }

    // 2. SE NON ESISTE, LA CREA (Nuova)
    const circular = await prisma.circular.create({
      data: {
        fileName: fileName || "documento.pdf",
        filePath: filePath,
        number: numeroCircolare,
        date: dataCircolare,
        subject: String(circData.oggetto || ""),
        summary: orderOfDay.length > 0 ? orderOfDay.join("\n") : "Nessun ordine del giorno",
        priority: "media",
        recipients: JSON.stringify(circData.destinatari || []),
        deadlines: JSON.stringify([]),
        text: text,
        userId: user.id,
        events: {
          create: filteredEventsData.map((event: any) => ({ // <-- MODIFICATO: usa filteredEventsData
            title: event.title || `${event.classe || "Classe"} - ${event.sede || "Sede"}`,
            type: event.type || "Consigli di Classe",
            date: String(event.data || ""),
            startTime: String(event.oraInizio || "15:00"),
            endTime: String(event.oraFine || "16:00"),
            location: String(event.sede || "Sede scolastica"),
            circularNumber: numeroCircolare,
          })),
        },
      },
      include: { events: true },
    });

    console.log("✅ Circolare SALVATA con successo nel DB. ID:", circular.id);
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