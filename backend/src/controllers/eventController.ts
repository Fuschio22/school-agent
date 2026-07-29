import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { circularId, eventIndex } = req.params;
    const { title, type, sede, data, oraInizio, oraFine, classe, location } = req.body;

    console.log("🔍 Backend - Ricevuta richiesta update:", { circularId, eventIndex });

    const circular = await prisma.circular.findUnique({
      where: { id: circularId },
    });

    if (!circular) {
      console.error("❌ Circolare non trovata:", circularId);
      return res.status(404).json({ error: "Circolare non trovata" });
    }

    console.log("✅ Circolare trovata:", circular.id);

    const circularWithEvents = circular as any;
    let events = circularWithEvents.events;

    console.log("📦 Events prima della conversione:", events, "Type:", typeof events);

    // Se events è null o undefined, inizializziamo array vuoto
    if (!events) {
      console.warn("⚠️ Events è null/undefined, inizializzo array vuoto");
      events = [];
    } 
    // Se è una stringa (JSON), parsiamola
    else if (typeof events === 'string') {
      console.log("📝 Events è una stringa JSON, faccio il parse");
      try {
        events = JSON.parse(events);
      } catch (e) {
        console.error("❌ Errore nel parsing JSON:", e);
        events = [];
      }
    }

    console.log("✅ Events dopo la conversione:", events, "Length:", events.length);

    const index = parseInt(eventIndex, 10);

    console.log("🔢 Index parsed:", index, "Valid:", !isNaN(index) && index >= 0 && index < events.length);

    if (isNaN(index) || index < 0 || index >= events.length) {
      console.error("❌ Indice non valido:", { index, eventsLength: events.length });
      return res.status(400).json({ 
        error: "Indice evento non valido",
        details: { index, eventsLength: events.length, eventIndex }
      });
    }

    // Aggiorna l'evento all'indice specificato
    const updatedEvents = events.map((event: any, i: number) => {
      if (i === index) {
        console.log("✏️ Aggiorno evento all'indice", i);
        return {
          ...event,
          title: title || event.title,
          type: type || event.type,
          sede: sede || event.sede,
          data: data || event.data,
          startTime: oraInizio || event.startTime,
          endTime: oraFine || event.endTime,
          classe: classe || event.classe,
          location: location || event.location || sede,
        };
      }
      return event;
    });

    console.log("💾 Salvataggio circolare aggiornata...");

    const updatedCircular = await prisma.circular.update({
      where: { id: circularId },
      data: { events: updatedEvents },
    });

    console.log("✅ Evento aggiornato con successo!");
    res.json(updatedCircular);
  } catch (error) {
    console.error("❌ Errore nell'aggiornamento evento:", error);
    // ✅ CORREZIONE: usiamo (error as Error) per accedere a message
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "Errore nell'aggiornamento evento", details: errorMessage });
  }
};