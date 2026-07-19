import { Request, Response } from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma";

export const chatController = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Il messaggio è obbligatorio" });
    }

    console.log("💬 Domanda dell'utente:", message);

    // 1. Recupera tutti i dati dal database
    const circulars = await prisma.circular.findMany({
      include: { events: true },
      orderBy: { createdAt: "desc" }
    });

    // 2. Prepara i dati in formato leggibile per l'AI
    const databaseContext = circulars.map(circ => ({
      numero: circ.number,
      data: circ.date,
      oggetto: circ.subject,
      eventi: circ.events.map(e => ({
        tipo: e.type,
        titolo: e.title,
        data: e.date,
        orario: `${e.startTime} - ${e.endTime}`,
        sede: e.location
      })),
      ordineDelGiorno: circ.summary ? circ.summary.split("\n") : []
    }));

    // 3. Configura Groq
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // 4. Crea il prompt per l'AI
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Sei SchoolAgent, un assistente AI per docenti. 
          Hai accesso a tutte le circolari e gli eventi salvati nel database.
          Rispondi in italiano in modo chiaro e professionale.
          Quando ti chiedono di calcolare ore, fai i calcoli precisi basandoti sugli orari di inizio e fine.
          
          DATI DISPONIBILI NEL DATABASE:
          ${JSON.stringify(databaseContext, null, 2)}`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const answer = response.choices[0]?.message?.content || "Mi dispiace, non ho potuto elaborare la tua domanda.";

    console.log("🤖 Risposta AI:", answer);
    res.json({ answer });

  } catch (error) {
    console.error("❌ Errore nella chat:", error);
    res.status(500).json({ error: "Errore durante l'elaborazione della domanda" });
  }
};