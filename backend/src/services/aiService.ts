import OpenAI from "openai";

export async function analyzeCircularText(text: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1", 
  });

  const response = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile", // <-- TORNiamo al modello POTENTE
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
            "oggetto": "string (Copia ESATTAMENTE il testo dopo 'OGGETTO:')",
            "destinatari": ["array di stringhe"]
          },
          "eventi": [
            {
              "title": "string (es: 'Consiglio di Classe 1AS Liceo Scientifico Siniscola')",
              "type": "string (es: 'Consigli di Classe', 'Scrutini', 'Collegio dei Docenti')",
              "sede": "string (Nome completo dell'istituto)",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string (es: '1AS', '4A IPSASR')"
            }
          ],
          "ordineDelGiorno": ["array di stringhe"]
        }

        REGOLE FONDAMENTALI:

        1. ORDINE DEL GIORNO (ODG) - PRIORITÀ ASSOLUTA:
           ✅ Cerca nel testo una sezione chiamata "Ordine del Giorno", "ODG" o un elenco numerato (1., 2., 3., ecc.).
           ✅ Estrai OGNI punto dell'elenco e mettilo come stringa separata nell'array "ordineDelGiorno".
           ❌ NON lasciare mai questo array vuoto se nel testo c'è un elenco.

        2. ESTRAZIONE DA TABELLE - REGOLA BRUTALE:
           ✅ Se nel testo c'è una tabella o un elenco strutturato, DEVI leggere e processare OGNI SINGOLA RIGA, dall'inizio alla fine.
           ✅ NON saltare nessuna sezione. Leggi IPSASR, poi ITTL, poi Liceo Scientifico, poi Dorgali.
           ✅ Per ogni riga, estrai: Classe, Data, Ora, Luogo/Sede.
           ✅ FILTRA DOPO: Nel JSON finale, includi SOLO gli eventi per "Liceo Scientifico Siniscola" e "IPSASR". 
           ✅ Escludi dal JSON finale qualsiasi evento per "ITTL", "Istituto Tecnico Trasporti e Logistica", "Liceo Scientifico Dorgali".

        3. NORMALIZZAZIONE CLASSI (FONDAMENTALE):
           - Rimuovi sempre il simbolo "^" (es: "1^A" diventa "1A").
           - Se la classe è del Liceo Scientifico, nel campo "classe" AGGIUNGI "S" alla lettera (es: "1A" → "1AS", "2B" → "2BS", "5A" → "5AS").
           - Se la classe è IPSASR, mantieni il formato "1A IPSASR", "4A IPSASR", ecc.

        4. TIPO EVENTO:
           - Usa "Consigli di Classe" se la circolare parla di Consigli di Classe.
           - Usa "Scrutini" o "Scrutini Finali" solo se la circolare parla esplicitamente di Scrutini.

        5. Restituisci SOLO JSON valido. Niente markdown, niente testo prima o dopo le parentesi graffe.`
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