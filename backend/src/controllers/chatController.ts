import { Request, Response } from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma";

export const chatController = async (req: Request, res: Response) => {
  console.log("📨 Richiesta chat ricevuta:", req.body?.message);
  
  try {
    const { message } = req.body;
    
    // 1. Recuperiamo gli eventi dal database
    const circulars = await prisma.circular.findMany({
      include: { events: true }
    });

    const allEvents = circulars.flatMap(c => c.events);
    console.log(`📊 Eventi totali nel DB: ${allEvents.length}`);

    // 2. FILTRO: Teniamo solo gli eventi rilevanti per il CCNL
    const relevantEvents = allEvents.filter(e => 
      e.type.toLowerCase().includes("consiglio") || 
      e.type.toLowerCase().includes("glo") || 
      e.type.toLowerCase().includes("gruppo") ||
      e.type.toLowerCase().includes("collegio") || 
      e.type.toLowerCase().includes("scrutini") ||
      e.type.toLowerCase().includes("dipartimenti") ||
      e.type.toLowerCase().includes("ricevimento")
    );

    console.log(`📊 Eventi rilevanti trovati: ${relevantEvents.length}`);

    // 3. COMPRESSIONE ESTREMA: Ordiniamo dal più VECCHIO al più RECENTE (cronologico)
    const eventsContext = relevantEvents
      .sort((a, b) => {
        // Ordina per data crescente (più vecchio prima)
        const [dA, mA, yA] = a.date.split('/').map(Number);
        const [dB, mB, yB] = b.date.split('/').map(Number);
        return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
      })
      .slice(0, 400) 
      .map(e => {
        // Accorcia la data: 14/10/2025 -> 14/10/25
        const shortDate = e.date.length >= 8 ? `${e.date.slice(0, 5)}/${e.date.slice(-2)}` : e.date;
        
        // Accorcia il tipo
        let shortType = "ALTRO";
        const typeLower = e.type.toLowerCase();
        if (typeLower.includes("consiglio")) shortType = "CDC";
        else if (typeLower.includes("glo") || typeLower.includes("gruppo")) shortType = "GLO";
        else if (typeLower.includes("collegio")) shortType = "CD";
        else if (typeLower.includes("dipartimenti")) shortType = "DIP";
        else if (typeLower.includes("scrutini")) shortType = "SCR";

        // Accorcia il titolo se è troppo lungo
        const shortTitle = e.title.length > 35 ? e.title.substring(0, 35) + "..." : e.title;

        return `${shortDate} | ${shortType} | ${shortTitle} | ${e.startTime}-${e.endTime}`;
      })
      .join("\n");

    console.log("🤖 Chiamata a Groq API in corso...");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // 4. Chiamata all'API con istruzioni RIGOROSE
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      messages: [
        {
          role: "system",
          content: `Sei SchoolAgent, un assistente contabile preciso e rigoroso per un docente.
          
          DATI DEGLI EVENTI (Formato: Data | Tipo | Titolo/Classe | Orario):
          ${eventsContext}

          ISTRUZIONI DI CALCOLO ASSOLUTE E RIGOROSE:
          1. IDENTIFICA LA RICHIESTA: Leggi quali TIPI di evento e/o CLASSI l'utente ha chiesto ESPLICITAMENTE.
          2. FILTRO ESCLUSIVO: Considera SOLO gli eventi che corrispondono ESATTAMENTE. Se l'utente chiede "Consigli e GLO", IGNORA totalmente Collegi (CD), Dipartimenti (DIP) e Scrutini (SCR).
          3. FILTRO TEMPORALE: Tieni solo gli eventi nel periodo di date richiesto.
          4. CALCOLO: Per ogni evento valido, calcola la durata in minuti (es. 15:00-15:45 = 45 min).
          5. SOMMA: Somma le durate e converti in ore e minuti.
          6. OUTPUT: Mostra il risultato: "Totale: X ore e Y minuti". Elenca brevemente gli eventi inclusi in ordine cronologico. Se una classe specifica (es. 5A IPSASR) è richiesta ma non presente nei dati, dillo esplicitamente: "Attenzione: non trovo eventi per la 5A IPSASR nei dati forniti". NON inventare mai numeri.`
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