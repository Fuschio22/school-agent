import { Request, Response } from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma";

export const chatController = async (req: Request, res: Response) => {
  console.log("📨 Richiesta chat ricevuta:", req.body?.message);
  
  try {
    const { message } = req.body;
    
    // 1. Recuperiamo gli eventi dal database (prendiamo gli ultimi 200 per stare nel limite token)
    const circulars = await prisma.circular.findMany({
      include: { events: true }
    });

    const allEvents = circulars.flatMap(c => c.events);
    console.log(`📊 Trovati ${allEvents.length} eventi totali nel DB.`);

    // 2. COMPRESSIONE DATI: Formato ultra-leggero (max 200 eventi più recenti)
    const eventsContext = allEvents
      .slice(0, 200)
      .map(e => `${e.date} | ${e.type} | ${e.title} | ${e.startTime}-${e.endTime}`)
      .join("\n");

    console.log("🤖 Chiamata a Groq API in corso...");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // 3. Chiamata all'API con istruzioni RIGOROSE
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      messages: [
        {
          role: "system",
          content: `Sei SchoolAgent, un assistente contabile preciso e rigoroso per un docente.
          
          DATI DEGLI EVENTI (Formato: Data | Tipo | Titolo/Classe | Orario Inizio-Fine):
          ${eventsContext}

          ISTRUZIONI DI CALCOLO ASSOLUTE E RIGOROSE:
          1. IDENTIFICA LA RICHIESTA: Leggi attentamente quali TIPI di evento l'utente ha chiesto ESPLICITAMENTE (es. "Consigli di Classe e GLO").
          2. FILTRO ESCLUSIVO: Considera SOLO gli eventi il cui "Tipo" o "Titolo" corrisponde ESATTAMENTE a quanto richiesto. 
          3. IGNORA TUTTO IL RESTO: Se l'utente non ha menzionato "Collegi", "Dipartimenti", "Scrutini" o "Ricevimenti", NON includerli nel calcolo. Devono essere completamente ignorati.
          4. FILTRO TEMPORALE: Dei soli eventi validi, tieni solo quelli che rientrano nel periodo di date richiesto.
          5. CALCOLO: Per ogni evento valido, calcola la durata in minuti (es. 15:00-15:45 = 45 min).
          6. SOMMA: Somma le durate e converti il totale in ore e minuti (es. 135 min = 2 ore e 15 minuti).
          7. OUTPUT: Mostra il risultato finale in modo chiaro: "Totale: X ore e Y minuti". Elenca brevemente gli eventi che hai incluso nel calcolo per trasparenza. Se non ce ne sono, dillo esplicitamente. NON inventare mai numeri.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.0, // Zero creatività, solo logica pura
    });

    const aiResponse = response.choices[0]?.message?.content || "Mi dispiace, non sono riuscito a elaborare la risposta.";
    console.log("✅ Risposta AI generata con successo.");
    
    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error("❌ Errore CRITICO nella chat:", error.message);
    res.status(500).json({ error: "Errore interno: " + error.message });
  }
};