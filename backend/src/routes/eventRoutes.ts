import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// ============================================================
// CREA EVENTO MANUALE
// ============================================================

router.post("/", async (req, res) => {
  try {
    const {
      title,
      type,
      date,
      startTime,
      endTime,
      location,
      classe,
    } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({
        error: "Titolo, data, ora di inizio e ora di fine sono obbligatori",
      });
    }

    const event = await prisma.event.create({
      data: {
        title: String(title),
        type: String(type || "Altro"),
        date: String(date),
        startTime: String(startTime),
        endTime: String(endTime),
        location: String(location || ""),
        circularNumber: null,
        circularId: null,
      },
    });

    console.log("✅ Evento manuale creato:", event.id);

    return res.status(201).json(event);
  } catch (error) {
    console.error("❌ Errore nella creazione dell'evento manuale:", error);

    return res.status(500).json({
      error: "Errore nella creazione dell'evento manuale",
    });
  }
});

// ============================================================
// RECUPERA EVENTI MANUALI
// ============================================================

router.get("/", async (_req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        circularId: null,
      },
      orderBy: [
        {
          date: "asc",
        },
        {
          startTime: "asc",
        },
      ],
    });

    return res.json(events);
  } catch (error) {
    console.error("❌ Errore nel recupero degli eventi manuali:", error);

    return res.status(500).json({
      error: "Errore nel recupero degli eventi manuali",
    });
  }
});

// ============================================================
// MODIFICA EVENTO MANUALE
// ============================================================

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      type,
      date,
      startTime,
      endTime,
      location,
    } = req.body;

    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: "Evento non trovato",
      });
    }

    if (existingEvent.circularId) {
      return res.status(400).json({
        error: "Questo evento appartiene a una circolare",
      });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title) }),
        ...(type !== undefined && { type: String(type) }),
        ...(date !== undefined && { date: String(date) }),
        ...(startTime !== undefined && {
          startTime: String(startTime),
        }),
        ...(endTime !== undefined && {
          endTime: String(endTime),
        }),
        ...(location !== undefined && {
          location: String(location),
        }),
      },
    });

    console.log("✏️ Evento manuale aggiornato:", id);

    return res.json(updatedEvent);
  } catch (error) {
    console.error("❌ Errore nella modifica dell'evento manuale:", error);

    return res.status(500).json({
      error: "Errore nella modifica dell'evento manuale",
    });
  }
});

// ============================================================
// ELIMINA EVENTO MANUALE
// ============================================================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: "Evento non trovato",
      });
    }

    if (existingEvent.circularId) {
      return res.status(400).json({
        error: "Questo evento appartiene a una circolare e non può essere eliminato da qui",
      });
    }

    await prisma.event.delete({
      where: { id },
    });

    console.log("🗑️ Evento manuale eliminato:", id);

    return res.json({
      message: "Evento manuale eliminato con successo",
    });
  } catch (error) {
    console.error("❌ Errore nell'eliminazione dell'evento manuale:", error);

    return res.status(500).json({
      error: "Errore nell'eliminazione dell'evento manuale",
    });
  }
});

export default router;