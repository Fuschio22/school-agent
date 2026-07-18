import OpenAI from "openai";

export async function analyzeCircularText(text: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1", 
  });

  const response = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `Sei SchoolAgent, un esperto nell'analisi di circolari scolastiche italiane.
        Il tuo compito è estrarre i dati da una circolare testuale e restituire UN SOLO oggetto JSON valido.

        STRUTTURA JSON OBBLIGATORIA:
        {
          "circolare": {
            "numero": "string",
            "data": "string",
            "oggetto": "string",
            "destinatari": ["array di stringhe"]
          },
          "eventi": [
            {
              "title": "string (es: 'Consiglio di Classe 4A IPSASR' o 'Consiglio di Classe 1AS')",
              "type": "string (es: 'Consigli di Classe')",
              "sede": "string",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string"
            }
          ],
          "ordineDelGiorno": ["array di stringhe"]
        }

        REGOLE FONDAMENTALI - SEGUI QUESTO ORDINE:
        
        REGOLA 1 - CLASSI VIETATE (LEGGI PRIMA DI TUTTO):
        ✗ NON creare MAI eventi per: 1A IPSASR, 2A IPSASR, 3A IPSASR, 3B IPSASR
        ✗ NON creare MAI eventi per classi del Liceo Scientifico di Dorgali
        ✗ Se vedi una di queste classi nella tabella, IGNORALA COMPLETAMENTE. Non creare l'evento.
        
        REGOLA 2 - CLASSI PERMESSE (SOLO QUESTE):
        ✓ Crea eventi SOLO per queste classi (se presenti nella tabella):
          - 4A IPSASR (anche scritta come: "4^ A", "4 A IPSASR", "4A")
          - 5A IPSASR (anche scritta come: "5^ A", "5 A IPSASR", "5A")
          - 1AS, 2AS, 3AS, 4AS, 5AS (Liceo Scientifico Siniscola)
          - 1BS, 2BS, 3BS, 4BS, 5BS (Liceo Scientifico Siniscola)
        
        REGOLA 3 - PRIMA DI CREARE UN EVENTO:
        Per ogni riga della tabella, chiediti: "Questa classe è 4A IPSASR, 5A IPSASR, o una classe del Liceo Siniscola (1AS-5AS, 1BS-5BS)?"
        - Se SÌ → crea l'evento
        - Se NO → IGNORA la riga, non creare nulla
        
        REGOLA 4 - CALCOLO ORARIO:
        - Se la tabella mostra solo l'orario di inizio, calcola l'orario di fine basandoti sulla riga successiva
        - Esempio: se 4^A inizia alle 18:45 e 4^B inizia alle 19:30, allora 4^A finisce alle 19:30
        - Se non c'è riga successiva, usa durata standard di 45 minuti
        
        REGOLA 5 - FORMATO:
        - Normalizza orari: '17.00' → '17:00'
        - Usa nomi completi: "Consigli di Classe" (MAI "CDC")
        - Crea UN evento per riga
        - Restituisci SOLO JSON, niente altro testo`
      },
      {
        role: "user",
        content: `Analizza questa circolare:\n\n${text}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}