import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { circularId, eventIndex } = req.params;
    const { title, type, sede, data, oraInizio, oraFine, classe, location } = req.body;

    const circular = await prisma.circular.findUnique({
      where: { id: circularId },
    });

    if (!circular) {
      return res.status(404).json({ error: "Circolare non trovata" });
    }

    const circularWithEvents = circular as any;
    const events = circularWithEvents.events || [];

    const index = parseInt(eventIndex, 10);

    if (isNaN(index) || index < 0 || index >= events.length) {
      return res.status(400).json({ error: "Indice evento non valido" });
    }

    // Aggiorna l'evento all'indice specificato
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