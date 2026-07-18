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
              "title": "string (es: 'Dipartimenti Disciplinari' o 'Consiglio di Classe 4A IPSASR')",
              "type": "string (es: 'Dipartimenti Disciplinari', 'Consigli di Classe', 'Collegio dei Docenti')",
              "sede": "string (DEVE contenere l'istituto completo: 'Liceo Scientifico Siniscola', 'IPSASR', ecc.)",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string (es: '1A', '4A', '5B', o vuoto se evento generale)"
            }
          ],
          "ordineDelGiorno": ["array di stringhe"]
        }

        REGOLE FONDAMENTALI:
        
        1. ESTRATTORI DI EVENTI - DUE METODI:
           
           METODO A - TABELLE:
           - Se ci sono tabelle nel testo, crea UN evento per OGNI riga
           - Leggi l'intestazione di ogni sezione (es: "IPSASR", "LICEO SCIENTIFICO SINISCOLA")
           - Associa la sede a tutte le classi nella tabella sottostante
           
           METODO B - TESTO DESCRITTIVO (IMPORTANTE!):
           - Se NON ci sono tabelle ma il testo contiene informazioni su convocazioni, crea eventi dal testo
           - Cerca frasi come:
             * "convocati il giorno X alle ore Y"
             * "si riuniranno il giorno X alle ore Y"
             * "dalle ore X alle ore Y"
             * "presso la sede Z"
           - Estrai data, orario e sede da queste frasi
           - Esempio: "I Dipartimenti sono convocati il giorno giovedì 23 ottobre 2025 alle ore 17:30, presso la sede centrale di Siniscola"
             → Crea evento con:
               title: "Dipartimenti Disciplinari"
               type: "Dipartimenti Disciplinari"
               sede: "Sede Centrale Siniscola"
               data: "23/10/2025"
               oraInizio: "17:30"
               oraFine: "18:30" (se specificata, altrimenti calcola +1 ora)
        
        2. NORMALIZZA LE CLASSI:
           - "1^A" → "1A"
           - "4^A" → "4A"
           - "5^B" → "5B"
           - Rimuovi il simbolo "^" e gli spazi
        
        3. CALCOLO ORARIO DI FINE:
           - Se vedi "dalle ore X alle ore Y", usa entrambi
           - Se vedi solo orario di inizio in tabella, calcola la fine dalla riga successiva
           - Se non c'è riga dopo e non è specificato, usa +1 ora dall'inizio
        
        4. USA NOMI COMPLETI:
           - Type: "Dipartimenti Disciplinari", "Consigli di Classe", "Collegio dei Docenti", "GLO" (MAI abbreviazioni)
           - Sede: Scrivi SEMPRE l'istituto completo
        
        5. Crea eventi per OGNI convocazione trovata (sia in tabelle che nel testo)
        
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