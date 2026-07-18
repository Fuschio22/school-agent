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
              "title": "string (es: 'GLO 1A Liceo Scientifico Siniscola' o 'Consiglio di Classe 4A IPSASR')",
              "type": "string (es: 'GLO', 'Consigli di Classe')",
              "sede": "string (DEVE contenere l'istituto completo: 'Liceo Scientifico Siniscola', 'IPSASR', ecc.)",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string (es: '1A', '4A', '5B')"
            }
          ],
          "ordineDelGiorno": ["array di stringhe"]
        }

        REGOLE FONDAMENTALI PER PDF CON PIÙ SEZIONI:
        
        1. QUANDO IL PDF HA PIÙ TABELLE/SEZIONI:
           - Leggi l'intestazione di OGNI sezione (es: "IPSASR", "LICEO SCIENTIFICO DORGALI", "ITTL", "LICEO SCIENTIFICO SINISCOLA")
           - Per OGNI riga della tabella, ASSOCIA quella sede/istituto alla classe
           - Esempio: Se vedi "LICEO SCIENTIFICO SINISCOLA" e sotto "1^A", crea: 
             title: "GLO 1A Liceo Scientifico Siniscola"
             sede: "Liceo Scientifico Siniscola"
             classe: "1A"
        
        2. NORMALIZZA LE CLASSI:
           - "1^A" → "1A"
           - "4^A" → "4A"
           - "5^B" → "5B"
           - Rimuovi il simbolo "^" e gli spazi
        
        3. CALCOLO ORARIO DI FINE:
           - Se vedi solo l'orario di inizio, calcola la fine dalla riga successiva
           - Esempio: 1^A inizia 15:00, 4^A inizia 15:45 → 1^A finisce 15:45
           - Se non c'è riga dopo, usa 45 minuti
        
        4. USA NOMI COMPLETI:
           - Type: "GLO", "Consigli di Classe", "Collegio dei Docenti" (MAI abbreviazioni)
           - Sede: Scrivi SEMPRE l'istituto completo (es: "Liceo Scientifico Siniscola", NON solo "Siniscola")
        
        5. Crea UN evento per OGNI riga di OGNI tabella
        
        6. Restituisci SOLO JSON, niente markdown o testo aggiuntivo`
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