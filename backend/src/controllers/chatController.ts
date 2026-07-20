import { Request, Response } from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma";

export const chatController = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    
    // Nota: Sostituisci "demo@schoolagent.it" con la logica di autenticazione reale se la hai
    const userEmail = "demo@schoolagent.it"; 

    // 1. Recupera tutti gli eventi dell'utente per dare contesto all'AI
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

    // 2. Estrai tutti gli eventi in un formato leggibile e compatto per l'AI
    const allEvents = user.circulars.flatMap(c => c.events);
    const eventsContext = allEvents.map(e => 
      `- ${e.title} | Tipo: ${e.type} | Data: ${e.date} | Orario: ${e.startTime}-${e.endTime} | Sede: ${e.location} | Circ: ${e.circularNumber}`
    ).join("\n");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // 3. Chiamata all'API usando il modello LEGGERO (8B) per risparmiare token del 70B
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant", // <-- MODELLO VELOCE ED EFFICIENTE PER LA CHAT
      messages: [
        {
          role: "system",
          content: `Sei SchoolAgent, un assistente virtuale preciso e conciso per un docente. 
          Il tuo compito è rispondere alle domande dell'utente basandoti ESCLUSIVAMENTE sui seguenti dati estratti dalle circolari.
          
          DATI DISPONIBILI (Eventi):
          ${eventsContext}

          REGOLE ASSOLUTE:
          1. Se l'utente chiede il totale delle ore (es. "Quante ore di Consigli di Classe ho fatto?"), calcola la somma delle durate degli eventi corrispondenti.
          2. Se un'informazione non è presente nei dati forniti, rispondi onestamente: "Non ho dati a riguardo nelle circolari caricate".
          3. Sii diretto, professionale e usa l'italiano.
          4. Non inventare mai dati o orari.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.2, // Basso per risposte più precise e fattuali
    });

    const aiResponse = response.choices[0]?.message?.content || "Mi dispiace, non sono riuscito a elaborare la risposta.";
    
    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error("❌ Errore nella chat:", error);
    
    // Gestione elegante dell'errore di rate limit per l'utente
    if (error.status === 429) {
      return res.status(429).json({ 
        error: "Limite di richieste temporaneo raggiunto. Riprova tra pochi minuti." 
      });
    }
    
    res.status(500).json({ error: "Errore interno del server durante la chat" });
  }
};