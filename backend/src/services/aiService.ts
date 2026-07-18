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
              "title": "string (es: 'Colloqui Scuola-Famiglia Liceo Scientifico Siniscola')",
              "type": "string (es: 'Colloqui Scuola-Famiglia', 'Dipartimenti Disciplinari', 'Consigli di Classe')",
              "sede": "string (DEVE contenere la sede: 'Sede Centrale di Siniscola', 'La Caletta', ecc.)",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string (vuoto per eventi generali)"
            }
          ],
          "ordineDelGiorno": ["array di stringhe"]
        }

        REGOLE FONDAMENTALI:
        
        1. ESTRATTORI DI EVENTI - DUE METODI:
           
           METODO A - TABELLE:
           - Se ci sono tabelle nel testo, crea UN evento per OGNI riga
           - Per COLLOQUI SCUOLA-FAMIGLIA: quando vedi colonne "Indirizzo di studio", "Data", "Orario", "Luogo"
             → Crea evento per: Liceo Scientifico Siniscola, IPSASR
             → IGNORA: ITTL, Liceo Dorgali
           
           METODO B - TESTO DESCRITTIVO:
           - Se NON ci sono tabelle ma il testo contiene convocazioni, estrai dal testo
           - Cerca frasi come: "convocati il giorno X alle ore Y", "dalle ore X alle ore Y"
           - Estrai data, orario e sede
        
        2. COLLOQUI SCUOLA-FAMIGLIA - INDIRIZZI PERMESSI:
           ✓ "Liceo Scientifico di Siniscola" → crea evento
           ✓ "Istituto Professionale per l'Agricoltura" → crea evento
           ✗ "Istituto Tecnico Trasporti e Logistica" → IGNORA
           ✗ "Liceo Scientifico di Dorgali" → IGNORA
        
        3. NORMALIZZA LE CLASSI:
           - "1^A" → "1A"
           - "4^A" → "4A"
           - Rimuovi il simbolo "^"
        
        4. ORARI:
           - Se vedi "Dalle ore 15:00 alle ore 18:00" → usa entrambi
           - Se vedi solo inizio, calcola fine (+1 ora o dalla riga successiva)
        
        5. USA NOMI COMPLETI:
           - Type: "Colloqui Scuola-Famiglia", "Dipartimenti Disciplinari", "Consigli di Classe", "Collegio dei Docenti"
           - Sede: Scrivi SEMPRE la sede completa
        
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