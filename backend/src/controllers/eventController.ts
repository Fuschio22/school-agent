import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const updateEvent = async (req: Request, res: Response) => {
  try {
    // ✅ Ora legge correttamente eventIndex dalla route
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

    const circularWithEvents = circular as any;
    let events = circularWithEvents.events;

    if (!events) {
      events = [];
    } else if (typeof events === 'string') {
      try {
        events = JSON.parse(events);
      } catch (e) {
        events = [];
      }
    }

    const index = parseInt(eventIndex, 10);
    console.log("🔢 Index parsed:", index, "Events length:", events.length);

    if (isNaN(index) || index < 0 || index >= events.length) {
      console.error("❌ Indice non valido:", { index, eventsLength: events.length });
      return res.status(400).json({ 
        error: "Indice evento non valido",
        details: { index, eventsLength: events.length, eventIndex }
      });
    }

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

    const updatedCircular = await prisma.circular.update({
      where: { id: circularId },
      data: { events: updatedEvents },
    });

    console.log("✅ Evento aggiornato con successo!");
    res.json(updatedCircular);
  } catch (error) {
    console.error("❌ Errore nell'aggiornamento evento:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "Errore nell'aggiornamento evento", details: errorMessage });
  }
};