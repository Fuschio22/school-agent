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
              "sede": "string (DEVE contenere l'istituto completo)",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string (vuoto se evento generale)"
            }
          ],
          "ordineDelGiorno": ["array di stringhe"]
        }

        REGOLE FONDAMENTALI:
        
        1. EVITA DUPLICATI - REGOLA D'ORO:
           - Se la circolare convoca UN SOLO evento (es: "I Dipartimenti sono convocati il giorno X alle ore Y"), crea UN SOLO evento
           - NON creare eventi multipli per la stessa data/orario anche se ci sono sedi nominate diverse
           - Se vedi "Sede centrale" e il nome completo dell'istituto, sono la STESSA sede → crea UN evento
           
        2. ESTRATTORI DI EVENTI - DUE METODI:
           
           METODO A - TABELLE:
           - Se ci sono tabelle nel testo, crea UN evento per OGNI riga
           - Per COLLOQUI SCUOLA-FAMIGLIA: quando vedi colonne "Indirizzo di studio", "Data", "Orario", "Luogo"
             → Crea evento per: Liceo Scientifico Siniscola, IPSASR
             → IGNORA: ITTL, Liceo Dorgali
           
           METODO B - TESTO DESCRITTIVO:
           - Se NON ci sono tabelle ma il testo contiene convocazioni, estrai dal testo
           - Cerca frasi come: "convocati il giorno X alle ore Y", "dalle ore X alle ore Y"
           - Estrai data, orario e sede
           - Crea UN SOLO evento per ogni convocazione distinta
        
        3. COLLOQUI SCUOLA-FAMIGLIA - INDIRIZZI PERMESSI:
           ✓ "Liceo Scientifico di Siniscola" → crea evento
           ✓ "Istituto Professionale per l'Agricoltura" → crea evento
           ✗ "Istituto Tecnico Trasporti e Logistica" → IGNORA
           ✗ "Liceo Scientifico di Dorgali" → IGNORA
        
        4. NORMALIZZA LE CLASSI:
           - "1^A" → "1A"
           - "4^A" → "4A"
           - Rimuovi il simbolo "^"
        
        5. ORARI:
           - Se vedi "Dalle ore 15:00 alle ore 18:00" → usa entrambi
           - Se vedi solo inizio, calcola fine (+1 ora o dalla riga successiva)
           - NON invertire mai gli orari: oraInizio deve essere SEMPRE < oraFine
        
        6. USA NOMI COMPLETI:
           - Type: "Dipartimenti Disciplinari", "Consigli di Classe", "Collegio dei Docenti", "GLO"
           - Sede: Scrivi SEMPRE la sede completa
        
        7. Restituisci SOLO JSON, niente markdown o testo aggiuntivo`
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