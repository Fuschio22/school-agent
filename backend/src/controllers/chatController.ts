import { Request, Response } from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma";

export const chatController = async (req: Request, res: Response) => {
  console.log(" Richiesta chat ricevuta:", req.body?.message);
  
  try {
    const { message } = req.body;
    const messageLower = message.toLowerCase();
    
    // 1. Recuperiamo gli eventi dal database
    const circulars = await prisma.circular.findMany({
      include: { events: true }
    });

    const allEvents = circulars.flatMap(c => c.events);
    console.log(`📊 Eventi totali nel DB: ${allEvents.length}`);

    // 2. FILTRAGGIO FLESSIBILE
    const filters: string[] = [];
    
    if (messageLower.includes("consig") || messageLower.includes("cdc")) {
      filters.push("consigli");
      filters.push("consiglio");
    }
    if (messageLower.includes("glo") || messageLower.includes("gruppo")) {
      filters.push("glo");
      filters.push("gruppo");
    }
    if (messageLower.includes("collegio")) {
      filters.push("collegio");
    }
    if (messageLower.includes("dipartiment")) {
      filters.push("dipartiment");
    }
    if (messageLower.includes("scrutin")) {
      filters.push("scrutini");
      filters.push("scrutinio");
    }
    if (messageLower.includes("riceviment")) {
      filters.push("riceviment");
    }

    if (filters.length === 0) {
      filters.push("consigli", "consiglio", "glo", "gruppo", "collegio", "dipartiment", "scrutini", "riceviment");
    }

    console.log(`🔍 Filtri applicati: ${filters.join(", ")}`);

    const filteredEvents = allEvents.filter(e => {
      const typeLower = (e.type || "").toLowerCase();
      const titleLower = (e.title || "").toLowerCase();
      return filters.some(f => typeLower.includes(f) || titleLower.includes(f));
    });

    console.log(`✅ Eventi dopo il filtro: ${filteredEvents.length}`);

    // 3. FILTRO TEMPORALE
    let finalEvents = filteredEvents;
    
    const monthMap: Record<string, number> = {
      "gennaio": 1, "febbraio": 2, "marzo": 3, "aprile": 4,
      "maggio": 5, "giugno": 6, "luglio": 7, "agosto": 8,
      "settembre": 9, "ottobre": 10, "novembre": 11, "dicembre": 12
    };

    const periods: { month: number; year: number }[] = [];
    for (const [monthName, monthNum] of Object.entries(monthMap)) {
      const regex = new RegExp(`${monthName}\\s*(\\d{4})`, 'i');
      const match = message.match(regex);
      if (match) {
        periods.push({ month: monthNum, year: parseInt(match[1]) });
      }
    }

    if (periods.length >= 2) {
      periods.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

      const startDate = periods[0];
      const endDate = periods[periods.length - 1];

      console.log(`📅 Periodo richiesto: ${startDate.month}/${startDate.year} - ${endDate.month}/${endDate.year}`);

      finalEvents = filteredEvents.filter(e => {
        if (!e.date) return false;
        const parts = e.date.split('/');
        if (parts.length !== 3) return false;
        const [day, month, year] = parts.map(Number);
        const eventDate = new Date(year, month - 1, day);
        const start = new Date(startDate.year, startDate.month - 1, 1);
        const end = new Date(endDate.year, endDate.month, 0);
        return eventDate >= start && eventDate <= end;
      });

      console.log(`📊 Eventi nel periodo: ${finalEvents.length}`);
    }

    // 4. ✅ CALCOLO PRECISO DELLE ORE NEL BACKEND (con protezione errori)
    let totalMinutes = 0;
    
    finalEvents.forEach(e => {
      // Se mancano gli orari, salta l'evento per evitare il crash
      if (!e.startTime || !e.endTime) {
        console.log(`⚠️ Evento saltato (orari mancanti): ${e.title}`);
        return;
      }
      
      try {
        const [startH, startM] = String(e.startTime).split(':').map(Number);
        const [endH, endM] = String(e.endTime).split(':').map(Number);
        
        if (!isNaN(startH) && !isNaN(startM) && !isNaN(endH) && !isNaN(endM)) {
          const startTotal = startH * 60 + startM;
          const endTotal = endH * 60 + endM;
          const duration = endTotal - startTotal;
          if (duration > 0) {
            totalMinutes += duration;
          }
        }
      } catch (err) {
        console.log(`⚠️ Errore calcolo su evento: ${e.title}`);
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    console.log(`✅ CALCOLO PRECISO: ${totalMinutes} min = ${hours} ore e ${minutes} min`);

    // 5. Costruiamo l'elenco eventi per la risposta
    const eventsList = finalEvents.map(e => {
      const shortDate = e.date || "";
      const shortTitle = (e.title || "").length > 35 ? (e.title || "").substring(0, 35) + "..." : (e.title || "");
      return `${shortDate} | ${e.type || ""} | ${shortTitle} | ${e.startTime || ""}-${e.endTime || ""}`;
    }).join("\n");

    // 6. Chiamata all'AI SOLO per generare il testo
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `Sei SchoolAgent, un assistente preciso per un docente.
          
          DATI GIA' CALCOLATI DAL SISTEMA (NON RICALCOLARLI):
          - Totale ore: ${hours} ore e ${minutes} minuti (${totalMinutes} minuti totali)
          - Numero eventi analizzati: ${finalEvents.length}
          
          ELENCO EVENTI INCLUSI:
          ${eventsList}

          ISTRUZIONI:
          1. Usa ESATTAMENTE il totale fornito: "${hours} ore e ${minutes} minuti". NON ricalcolare.
          2. Elenca brevemente gli eventi inclusi nel calcolo.
          3. Usa un tono professionale e preciso.
          4. NON inventare numeri, NON ricalcolare. Usa SOLO i dati forniti.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.0,
    });

    const aiResponse = response.choices[0]?.message?.content || 
      `Totale: ${hours} ore e ${minutes} minuti.`;
    
    console.log("✅ Risposta AI generata con successo.");
    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error("❌ Errore CRITICO nella chat:", error.message);
    res.status(500).json({ error: "Errore interno: " + error.message });
  }
};