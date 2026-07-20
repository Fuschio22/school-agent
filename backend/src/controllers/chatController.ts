import { Request, Response } from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma";

export const chatController = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const userEmail = "demo@schoolagent.it"; 

    // 1. Recupera tutti gli eventi dell'utente
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        circulars: {
          include: { events: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    // 2. FILTRO INTELLIGENTE: Teniamo solo gli eventi rilevanti per il calcolo delle ore
    const allEvents = user.circulars.flatMap(c => c.events);
    const relevantEvents = allEvents.filter(e => 
      e.type.toLowerCase().includes("consiglio") || 
      e.type.toLowerCase().includes("glo") || 
      e.type.toLowerCase().includes("collegio") || 
      e.type.toLowerCase().includes("scrutini") ||
      e.type.toLowerCase().includes("dipartimenti") ||
      e.type.toLowerCase().includes("ricevimento")
    );

    // 3. COMPRESSIONE DATI: Formato ultra-leggero per restare sotto i 6000 token
    // Prendiamo fino a 200 eventi (più che sufficienti per coprire ottobre-marzo)
    const eventsContext = relevantEvents
      .slice(0, 200)
      .map(e => `${e.date} | ${e.type} | ${e.title} | ${e.startTime}-${e.endTime}`)
      .join("\n");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // 4. Chiamata all'API con modello leggero (8B) e istruzioni di calcolo precise
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      messages: [
        {
          role: "system",
          content: `Sei SchoolAgent, un assistente preciso per un docente. Devi calcolare le ore di servizio per il CCNL.
          
          DATI DEGLI EVENTI (Formato: Data | Tipo | Classe/Titolo | Orario Inizio-Fine):
          ${eventsContext}

          ISTRUZIONI DI CALCOLO ASSOLUTE:
          1. Quando l'utente chiede un totale di ore per un periodo (es. "da ottobre a marzo"), FILTRA mentalmente gli eventi di quel periodo.
          2. Per ogni evento, calcola la durata in minuti (es. 15:00-15:45 = 45 min; 14:30-15:30 = 60 min).
          3. Somma tutte le durate degli eventi che corrispondono alla richiesta (es. solo "Consigli di Classe" e "GLO").
          4. Converti il totale dei minuti in ore e minuti (es. 135 min = 2 ore e 15 minuti).
          5. Mostra il risultato finale in modo chiaro: "Totale: X ore e Y minuti".
          6. Se non ci sono dati per quel periodo, dillo esplicitamente. Non inventare mai numeri.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.1, // Bassissima per massimizzare la precisione matematica
    });

    const aiResponse = response.choices[0]?.message?.content || "Mi dispiace, non sono riuscito a elaborare la risposta.";
    
    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error("❌ Errore nella chat:", error);
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: "Limite di richieste temporaneo raggiunto. Aspetta un minuto e riprova." 
      });
    }
    
    res.status(500).json({ error: "Errore interno del server durante la chat" });
  }
};