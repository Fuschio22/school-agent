import { Request, Response } from "express";
import { analyzeCircularText } from "../services/aiService";
import { prisma } from "../lib/prisma";
import { filterEvents } from "../utils/classFilter";

// Funzione per estrarre il mese e anno dal titolo/oggetto
function extractMonthYear(text: string): { month: string; year: string } | null {
  const months = [
    "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
    "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"
  ];
  
  const lowerText = text.toLowerCase();
  
  for (const month of months) {
    if (lowerText.includes(month)) {
      // Cerca l'anno (4 cifre)
      const yearMatch = text.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        return { month, year: yearMatch[1] };
      }
    }
  }
  
  return null;
}

// Funzione per verificare se è una rettifica
function isRettifica(text: string): boolean {
  const lowerText = text.toLowerCase();
  return lowerText.includes("rettifica") || 
         lowerText.includes("modifica") || 
         lowerText.includes("variazione") ||
         lowerText.includes("aggiornamento") ||
         lowerText.includes("calendario definitivo") ||
         lowerText.includes("calendario aggiornato") ||
         lowerText.includes("nuovo calendario") ||
         lowerText.includes("calendarizzazione definitiva") ||
         lowerText.includes("integrazione") ||
         lowerText.includes("sostituisce") ||
         lowerText.includes("annulla e sostituisce");
}

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
        data: { email: "demo@schoolagent.it", name: "Utente Demo", classes: [] }
      });
    }

    const circData = analysis.circolare || analysis;
    const eventsData = Array.isArray(analysis.eventi) 
      ? analysis.eventi 
      : (Array.isArray(analysis.consigliDiClasse) ? analysis.consigliDiClasse : []);
    const orderOfDay = Array.isArray(analysis.ordineDelGiorno) ? analysis.ordineDelGiorno : [];

    // 🌟 NUOVO: Recupera le classi configurate dall'utente nelle Impostazioni
    const userClasses = user.classes || [];
    console.log(`👤 Classi configurate dall'utente:`, userClasses);

    // 🌟 NUOVO: Applichiamo il filtro passando le classi dinamiche dell'utente
    const filteredEventsData = filterEvents(eventsData, userClasses);

    // 🛡️ VALIDAZIONE: Correggi orari invertiti
    const validatedEventsData = filteredEventsData.map((event: any) => {
      if (event.oraInizio && event.oraFine) {
        const [hInizio, mInizio] = event.oraInizio.split(':').map(Number);
        const [hFine, mFine] = event.oraFine.split(':').map(Number);
        
        const minutiInizio = hInizio * 60 + mInizio;
        const minutiFine = hFine * 60 + mFine;
        
        // Se l'ora di fine è prima o uguale all'inizio, aggiungi 45 minuti all'inizio
        if (minutiFine <= minutiInizio) {
          const nuoviMinutiFine = minutiInizio + 45;
          const nuoveOre = Math.floor(nuoviMinutiFine / 60);
          const nuoviMinuti = nuoviMinutiFine % 60;
          const nuovaOraFine = `${nuoveOre.toString().padStart(2, '0')}:${nuoviMinuti.toString().padStart(2, '0')}`;
          
          console.log(`⚠️ Corretto orario invertito per ${event.classe}: ${event.oraFine} → ${nuovaOraFine}`);
          
          return {
            ...event,
            oraFine: nuovaOraFine
          };
        }
      }
      return event;
    });

    console.log(`🔍 Filtro applicato: da ${eventsData.length} eventi estratti a ${validatedEventsData.length} eventi permessi.`);

    const numeroCircolare = String(circData.numero || "");
    const dataCircolare = String(circData.data || "");
    const oggetto = String(circData.oggetto || "");

    // Controlla se è una rettifica
    const rettifica = isRettifica(oggetto);
    console.log(`📝 È una rettifica? ${rettifica}`);

    let existingCircular = null;
    let eventsToDelete: string[] = [];
    let relevantCirculars: any[] = [];

    if (rettifica) {
      // Se è una rettifica, cerca circolari simili per sostituire
      const monthYear = extractMonthYear(oggetto);
      
      if (monthYear) {
        console.log(`🔍 Cerco eventi da sostituire per: ${monthYear.month} ${monthYear.year}`);
        
        // Cerca tutte le circolari che hanno eventi nello stesso mese/anno
        const similarCirculars = await prisma.circular.findMany({
          include: { events: true },
          where: {
            OR: [
              { subject: { contains: monthYear.month, mode: 'insensitive' } },
              { subject: { contains: "Consigli di Classe", mode: 'insensitive' } },
              { subject: { contains: "Scrutini", mode: 'insensitive' } }
            ]
          }
        });

        // Filtra solo quelle dello stesso mese/anno
        relevantCirculars = similarCirculars.filter(circ => {
          const circMonthYear = extractMonthYear(circ.subject);
          return circMonthYear && 
                 circMonthYear.month === monthYear.month && 
                 circMonthYear.year === monthYear.year;
        });

        if (relevantCirculars.length > 0) {
          console.log(`📋 Trovate ${relevantCirculars.length} circolari da sostituire`);
          
          // Raccogli tutti gli eventi da cancellare
          for (const circ of relevantCirculars) {
            eventsToDelete = eventsToDelete.concat(circ.events.map((e: any) => e.id));
          }
          
          // Usa l'ultima circolare trovata come riferimento
          existingCircular = relevantCirculars[relevantCirculars.length - 1];
        }
      }
    } else {
      // Se NON è una rettifica, usa la logica anti-duplicato normale
      existingCircular = await prisma.circular.findFirst({
        where: {
          number: numeroCircolare,
          date: dataCircolare,
        },
        include: { events: true }
      });
    }

    // Se esistono eventi da cancellare (rettifica), cancellali
    if (eventsToDelete.length > 0) {
      console.log(`️ Cancello ${eventsToDelete.length} eventi vecchi`);
      await prisma.event.deleteMany({
        where: { id: { in: eventsToDelete } }
      });
      
      // Cancella le circolari vecchie se abbiamo trovato circolari rilevanti
      if (relevantCirculars.length > 0) {
        await prisma.circular.deleteMany({
          where: { id: { in: relevantCirculars.map(c => c.id) } }
        });
      }
    }

    // Se esiste già una circolare con lo stesso numero/data (non rettifica)
    if (existingCircular && !rettifica) {
      await prisma.event.deleteMany({
        where: { circularId: existingCircular.id }
      });

      const updatedCircular = await prisma.circular.update({
        where: { id: existingCircular.id },
        data: {
          fileName: fileName || existingCircular.fileName,
          filePath: filePath || existingCircular.filePath,
          subject: oggetto || existingCircular.subject,
          summary: orderOfDay.length > 0 ? orderOfDay.join("\n") : existingCircular.summary,
          text: text,
          events: {
            create: validatedEventsData.map((event: any) => ({
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

    // CREA NUOVA CIRCOLARE (o rettifica che sostituisce le vecchie)
    const circular = await prisma.circular.create({
      data: {
        fileName: fileName || "documento.pdf",
        filePath: filePath,
        number: numeroCircolare,
        date: dataCircolare,
        subject: oggetto || "",
        summary: orderOfDay.length > 0 ? orderOfDay.join("\n") : "Nessun ordine del giorno",
        priority: "media",
        recipients: JSON.stringify(circData.destinatari || []),
        deadlines: JSON.stringify([]),
        text: text,
        userId: user.id,
        events: {
          create: validatedEventsData.map((event: any) => ({
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

    console.log(`✅ Circolare ${rettifica ? 'RETTIFICA (sostituisce vecchie)' : 'SALVATA'} con successo nel DB. ID:`, circular.id);
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

// Funzione 3: Elimina una circolare
export const deleteCircularController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verifica che la circolare esista
    const circular = await prisma.circular.findUnique({
      where: { id },
      include: { events: true }
    });

    if (!circular) {
      return res.status(404).json({ error: "Circolare non trovata" });
    }

    // Elimina prima tutti gli eventi associati
    await prisma.event.deleteMany({
      where: { circularId: id }
    });

    // Poi elimina la circolare
    await prisma.circular.delete({
      where: { id }
    });

    console.log(`✅ Circolare eliminata con successo. ID: ${id}`);
    res.json({ message: "Circolare eliminata con successo" });
  } catch (error) {
    console.error("❌ Errore nell'eliminazione della circolare:", error);
    res.status(500).json({ error: "Errore durante l'eliminazione della circolare" });
  }
};