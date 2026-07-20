import { Request, Response } from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma";

export const chatController = async (req: Request, res: Response) => {
  console.log("📨 Richiesta chat ricevuta:", req.body?.message);
  
  try {
    const { message } = req.body;
    const messageLower = message.toLowerCase();
    
    // 1. Recuperiamo gli eventi dal database
    const circulars = await prisma.circular.findMany({
      include: { events: true }
    });

    const allEvents = circulars.flatMap(c => c.events);
    console.log(`📊 Eventi totali nel DB: ${allEvents.length}`);

    // 2. FILTRAGGIO DETERMINISTICO NEL BACKEND (non nell'AI!)
    // Analizziamo la domanda dell'utente per capire quali tipi di evento includere
    const filters: string[] = [];
    
    // Rileva i tipi di evento richiesti nella domanda
    if (messageLower.includes("consiglio di classe") || messageLower.includes("cdc")) {
      filters.push("consiglio");
    }
    if (messageLower.includes("glo") || messageLower.includes("gruppo di lavoro")) {
      filters.push("glo");
      filters.push("gruppo");
    }
    if (messageLower.includes("collegio")) {
      filters.push("collegio");
    }
    if (messageLower.includes("dipartiment")) {
      filters.push("dipartiment");
    }
    if (messageLower.includes("scrutini")) {
      filters.push("scrutini");
    }
    if (messageLower.includes("riceviment")) {
      filters.push("riceviment");
    }

    // Se non ha specificato nulla, includi tutto
    if (filters.length === 0) {
      filters.push("consiglio", "glo", "gruppo", "collegio", "dipartiment", "scrutini", "riceviment");
    }

    console.log(`🔍 Filtri applicati: ${filters.join(", ")}`);

    // Applica il filtro agli eventi
    const filteredEvents = allEvents.filter(e => {
      const typeLower = e.type.toLowerCase();
      const titleLower = e.title.toLowerCase();
      return filters.some(f => typeLower.includes(f) || titleLower.includes(f));
    });

    console.log(` Eventi dopo il filtro: ${filteredEvents.length}`);

    // 3. FILTRO TEMPORALE (se l'utente specifica un periodo)
    let finalEvents = filteredEvents;
    
    // Rileva il periodo dalla domanda (es. "da ottobre 2025 a marzo 2026")
    const monthMap: Record<string, number> = {
      "gennaio": 1, "febbraio": 2, "marzo": 3, "aprile": 4,
      "maggio": 5, "giugno": 6, "luglio": 7, "agosto": 8,
      "settembre": 9, "ottobre": 10, "novembre": 11, "dicembre": 12
    };

    // Estrai mesi e anni dalla domanda
    const monthsFound: { month: number; year: number }[] = [];
    for (const [monthName, monthNum] of Object.entries(monthMap)) {
      if (messageLower.includes(monthName)) {
        // Cerca l'anno vicino al nome del mese
        const yearMatch = message.match(/(\d{4})/g);
        if (yearMatch) {
          for (const year of yearMatch) {
            monthsFound.push({ month: monthNum, year: parseInt(year) });
          }
        }
      }
    }

    // Se abbiamo trovato un periodo, filtra gli eventi
    if (monthsFound.length >= 2) {
      // Ordina i mesi trovati per data
      monthsFound.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

      const startDate = monthsFound[0];
      const endDate = monthsFound[monthsFound.length - 1];

      console.log(`📅 Periodo richiesto: ${startDate.month}/${startDate.year} - ${endDate.month}/${endDate.year}`);

      finalEvents = filteredEvents.filter(e => {
        const [day, month, year] = e.date.split('/').map(Number);
        const eventDate = new Date(year, month - 1, day);
        const start = new Date(startDate.year, startDate.month - 1, 1);
        const end = new Date(endDate.year, endDate.month, 0); // Ultimo giorno del mese
        return eventDate >= start && eventDate <= end;
      });

      console.log(`📊 Eventi nel periodo: ${finalEvents.length}`);
    }

    // 4. COMPRESSIONE: Formato compatto per l'AI
    const eventsContext = finalEvents
      .slice(0, 400)
      .map(e => {
        const shortDate = e.date.length >= 8 ? `${e.date.slice(0, 5)}/${e.date.slice(-2)}` : e.date;
        const shortTitle = e.title.length > 30 ? e.title.substring(0, 30) + "..." : e.title;
        return `${shortDate} | ${e.type} | ${shortTitle} | ${e.startTime}-${e.endTime}`;
      })
      .join("\n");

    console.log(" Chiamata a Groq API in corso...");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // 5. Chiamata all'API - ORA L'AI DEVE SOLO FARE LA SOMMA MATEMATICA
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      messages: [
        {
          role: "system",
          content: `Sei un assistente contabile preciso. Devi SOLO calcolare la somma delle durate degli eventi forniti.
          
          DATI DEGLI EVENTI (Formato: Data | Tipo | Titolo | Orario Inizio-Fine):
          ${eventsContext}

          ISTRUZIONI:
          1. Per ogni evento, calcola la durata in minuti (es. 15:00-15:45 = 45 min).
          2. Somma tutte le durate.
          3. Converti il totale in ore e minuti (es. 135 min = 2 ore e 15 minuti).
          4. Rispondi con: "Totale: X ore e Y minuti".
          5. Elenca brevemente gli eventi inclusi nel calcolo.
          
          NON filtrare, NON ignorare eventi, NON aggiungere eventi. Usa SOLO i dati forniti.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.0,
    });

    const aiResponse = response.choices[0]?.message?.content || "Mi dispiace, non sono riuscito a elaborare la risposta.";
    console.log("✅ Risposta AI generata con successo.");
    
    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error("❌ Errore CRITICO nella chat:", error.message);
    res.status(500).json({ error: "Errore interno: " + error.message });
  }
};