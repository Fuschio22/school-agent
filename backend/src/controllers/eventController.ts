import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { circularId, eventId } = req.params;
    const { title, type, sede, data, oraInizio, oraFine, classe, location } = req.body;

    // Trova la circolare
    const circular = await prisma.circular.findUnique({
      where: { id: circularId },
    });

    if (!circular) {
      return res.status(404).json({ error: "Circolare non trovata" });
    }

    // Type assertion: diciamo a TypeScript che circular ha il campo events (che è un JSON field)
    const circularWithEvents = circular as any;
    const events = circularWithEvents.events || [];

    // Aggiorna l'evento nell'array
    const updatedEvents = events.map((event: any) => {
      if (event.id === eventId) {
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

    // Salva la circolare aggiornata
    const updatedCircular = await prisma.circular.update({
      where: { id: circularId },
      data: { events: updatedEvents },
    });

    res.json(updatedCircular);
  } catch (error) {
    console.error("Errore nell'aggiornamento evento:", error);
    res.status(500).json({ error: "Errore nell'aggiornamento evento" });
  }
};