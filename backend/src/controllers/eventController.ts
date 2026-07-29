import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { circularId, eventIndex } = req.params;
    const { title, type, sede, data, oraInizio, oraFine, classe, location } = req.body;

    console.log("🔍 BACKEND - Ricevuta richiesta update:", { circularId, eventIndex });

    const circular = await prisma.circular.findUnique({
      where: { id: circularId },
    });

    if (!circular) {
      console.error("❌ BACKEND - Circolare non trovata:", circularId);
      return res.status(404).json({ error: "Circolare non trovata" });
    }

    console.log("✅ BACKEND - Circolare trovata. ID:", circular.id);

    const circularWithEvents = circular as any;
    let events = circularWithEvents.events;

    console.log(" BACKEND - Events grezzo dal DB:", events);
    console.log("📦 BACKEND - Tipo di events:", typeof events);

    if (!events) {
      console.warn("️ BACKEND - Events è null/undefined, imposto array vuoto");
      events = [];
    } else if (typeof events === 'string') {
      try {
        console.log("📝 BACKEND - Events è una stringa, faccio il parse");
        events = JSON.parse(events);
      } catch (e) {
        console.error("❌ BACKEND - Errore parsing JSON:", e);
        events = [];
      }
    }

    const index = parseInt(eventIndex, 10);
    console.log("🔢 BACKEND - Index parsed:", index, "| Events length:", events.length);

    if (isNaN(index) || index < 0 || index >= events.length) {
      console.error("❌ BACKEND - Indice non valido!");
      console.error("Dettagli:", { 
        index, 
        eventsLength: events.length, 
        eventIndex, 
        eventsType: typeof events,
        eventsContent: events 
      });
      
      return res.status(400).json({ 
        error: "Indice evento non valido",
        debug: { 
          index, 
          eventsLength: events.length, 
          eventIndex, 
          eventsType: typeof events,
          eventsContent: events 
        }
      });
    }

    console.log("✏️ BACKEND - Aggiorno evento all'indice", index);
    const updatedEvents = events.map((event: any, i: number) => {
      if (i === index) {
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

    console.log("💾 BACKEND - Salvataggio circolare aggiornata...");
    const updatedCircular = await prisma.circular.update({
      where: { id: circularId },
      data: { events: updatedEvents },
    });

    console.log("✅ BACKEND - Evento aggiornato con successo!");
    res.json(updatedCircular);
  } catch (error) {
    console.error("❌ BACKEND - Errore crash:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "Errore nell'aggiornamento evento", details: errorMessage });
  }
};