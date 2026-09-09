import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { circularId, eventIndex } = req.params;
    const { title, type, sede, data, oraInizio, oraFine, classe, location } = req.body;

    console.log("🔍 BACKEND - Ricevuta richiesta update:", {
      circularId,
      eventIndex,
    });

    const index = parseInt(eventIndex, 10);

    // Trova tutti gli eventi per questa circolare, ordinati per createdAt
    const events = await prisma.event.findMany({
      where: { circularId },
      orderBy: { createdAt: "asc" },
    });

    console.log("📦 BACKEND - Eventi trovati:", events.length);

    if (events.length === 0) {
      console.error(
        "❌ BACKEND - Nessun evento trovato per questa circolare"
      );

      return res.status(404).json({
        error: "Nessun evento trovato per questa circolare",
      });
    }

    if (isNaN(index) || index < 0 || index >= events.length) {
      console.error("❌ BACKEND - Indice non valido:", {
        index,
        eventsLength: events.length,
      });

      return res.status(400).json({
        error: "Indice evento non valido",
        details: {
          index,
          eventsLength: events.length,
        },
      });
    }

    // Prendi l'evento all'indice specificato
    const eventToUpdate = events[index];

    console.log(
      "✏️ BACKEND - Aggiorno evento:",
      eventToUpdate.id
    );

    // Aggiorna l'evento nella tabella Event
    const updatedEvent = await prisma.event.update({
      where: { id: eventToUpdate.id },
      data: {
        title: title || eventToUpdate.title,
        type: type || eventToUpdate.type,
        location:
          location || sede || eventToUpdate.location,
        startTime:
          oraInizio || eventToUpdate.startTime,
        endTime:
          oraFine || eventToUpdate.endTime,
        date:
          data || eventToUpdate.date,
      },
    });

    console.log(
      "✅ BACKEND - Evento aggiornato con successo!"
    );

    res.json(updatedEvent);
  } catch (error) {
    console.error("❌ BACKEND - Errore crash:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    res.status(500).json({
      error: "Errore nell'aggiornamento evento",
      details: errorMessage,
    });
  }
};


// ============================================================
// ELIMINA UN SINGOLO EVENTO
// ============================================================

export const deleteEvent = async (
  req: Request,
  res: Response
) => {
  try {
    const { circularId, eventIndex } = req.params;

    console.log("🗑️ BACKEND - Ricevuta richiesta eliminazione:", {
      circularId,
      eventIndex,
    });

    const index = parseInt(eventIndex, 10);

    // Trova tutti gli eventi della circolare nello stesso ordine
    // utilizzato da updateEvent
    const events = await prisma.event.findMany({
      where: { circularId },
      orderBy: { createdAt: "asc" },
    });

    console.log(
      "📦 BACKEND - Eventi trovati:",
      events.length
    );

    if (events.length === 0) {
      console.error(
        "❌ BACKEND - Nessun evento trovato per questa circolare"
      );

      return res.status(404).json({
        error: "Nessun evento trovato per questa circolare",
      });
    }

    if (
      isNaN(index) ||
      index < 0 ||
      index >= events.length
    ) {
      console.error("❌ BACKEND - Indice non valido:", {
        index,
        eventsLength: events.length,
      });

      return res.status(400).json({
        error: "Indice evento non valido",
        details: {
          index,
          eventsLength: events.length,
        },
      });
    }

    const eventToDelete = events[index];

    console.log(
      "🗑️ BACKEND - Elimino evento:",
      eventToDelete.id
    );

    await prisma.event.delete({
      where: {
        id: eventToDelete.id,
      },
    });

    console.log(
      "✅ BACKEND - Evento eliminato con successo!"
    );

    res.json({
      success: true,
      message: "Evento eliminato con successo",
      deletedEventId: eventToDelete.id,
    });
  } catch (error) {
    console.error(
      "❌ BACKEND - Errore eliminazione evento:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    res.status(500).json({
      error: "Errore nell'eliminazione evento",
      details: errorMessage,
    });
  }
};