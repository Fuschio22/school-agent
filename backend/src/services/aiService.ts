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
        
        REGOLA 1 - CONTROLLA SEMPRE LA SEDE (PRIMA DI TUTTO):
        - Guarda l'intestazione della tabella o della sezione
        - Se la sede è "Dorgali" → IGNORA TUTTA LA TABELLA, non creare nessun evento
        - Se la sede è "Siniscola" o "IPSASR" → procedi con le regole successive
        - Se la sede è "ITTL" o altro istituto → IGNORA TUTTA LA TABELLA
        
        REGOLA 2 - CLASSI PERMESSE (SOLO SE LA SEDE È CORRETTA):
        ✓ Crea eventi SOLO per queste classi:
          - 4A IPSASR (anche: "4^ A", "4 A IPSASR", "4A") - SOLO sede IPSASR/Siniscola
          - 5A IPSASR (anche: "5^ A", "5 A IPSASR", "5A") - SOLO sede IPSASR/Siniscola
          - 1AS, 2AS, 3AS, 4AS, 5AS - SOLO Liceo Scientifico Siniscola
          - 1BS, 2BS, 3BS, 4BS, 5BS - SOLO Liceo Scientifico Siniscola
        
        REGOLA 3 - CLASSI VIETATE (NON CREARE MAI):
        ✗ 1A IPSASR, 2A IPSASR, 3A IPSASR (qualsiasi sede)
        ✗ 3B IPSASR (qualsiasi sede)
        ✗ QUALSIASI classe di Dorgali (anche se è 4A, 5A, ecc.)
        ✗ QUALSIASI classe ITTL
        ✗ QUALSIASI altra classe non elencata sopra
        
        REGOLA 4 - PRIMA DI CREARE UN EVENTO (CHECKLIST OBBLIGATORIA):
        1. La sede è Siniscola/IPSASR? Se NO → IGNORA
        2. La classe è 4A IPSASR o 5A IPSASR? Se SÌ → crea evento
        3. La classe è 1AS-5AS o 1BS-5BS del Liceo Siniscola? Se SÌ → crea evento
        4. Altrimenti → IGNORA
        
        REGOLA 5 - CALCOLO ORARIO:
        - Se vedi solo orario di inizio, calcola la fine dalla riga successiva
        - Esempio: 4^A inizia 18:45, 4^B inizia 19:30 → 4^A finisce 19:30
        - Se non c'è riga dopo, usa 45 minuti
        
        REGOLA 6 - FORMATO:
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