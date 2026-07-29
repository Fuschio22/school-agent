import OpenAI from "openai";

export async function analyzeCircularText(text: string, userClasses: string[] = []) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1", 
  });

  const isChironi = text.toUpperCase().includes("CHIRONI") || 
                    text.toUpperCase().includes("NUTD110002") ||
                    text.toUpperCase().includes("NUORO");
  
  const isPira = text.toUpperCase().includes("PIRA") || 
                 text.toUpperCase().includes("SINISCOLA") ||
                 text.toUpperCase().includes("LICEO SCIENTIFICO");

  let relevantClasses = userClasses;
  let schoolContext = "";
  
  if (isChironi && !isPira) {
    relevantClasses = userClasses.filter(c => c.toUpperCase().includes("OR"));
    schoolContext = "\n\n SCUOLA: CHIRONI-SATTA (Nuoro)\n" +
                   `CLASSI RILEVANTI: ${relevantClasses.join(', ')}\n` +
                   "ISTRUZIONE: Estrai SOLO eventi per queste classi OR. Ignora tutte le altre.";
  } else if (isPira && !isChironi) {
    relevantClasses = userClasses.filter(c => 
      c.toUpperCase().includes("AS") || 
      c.toUpperCase().includes("BS") || 
      c.toUpperCase().includes("IPSASR")
    );
    schoolContext = "\n\n SCUOLA: IIS PIRA (Liceo Scientifico Siniscola)\n" +
                   `CLASSI RILEVANTI: ${relevantClasses.join(', ')}\n` +
                   "ISTRUZIONE: Estrai SOLO eventi per queste classi. Ignora tutte le altre.";
  } else {
    schoolContext = "\n\n️ SCUOLA NON IDENTIFICATA: estrai eventi per tutte le classi configurate.";
  }

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
    "oggetto": "string (NON vuoto!)",
    "destinatari": ["array"]
  },
  "eventi": [
    {
      "title": "string (es: 'Collegio dei Docenti di Plesso - IPSASR')",
      "type": "string (es: 'Collegio di Plesso', 'Collegio dei Docenti', 'Consigli di Classe')",
      "sede": "string",
      "data": "DD/MM/YYYY",
      "oraInizio": "HH:MM",
      "oraFine": "HH:MM",
      "classe": "string"
    }
  ],
  "ordineDelGiorno": ["array"]
}

REGOLE FONDAMENTALI:

1. OGGETTO: Mai vuoto.

2. DISTINZIONE ODG/EVENTI:
   - OdG = argomenti (NON eventi)
   - Eventi = riunioni con data/ora
   - 7 punti OdG ≠ 7 eventi!

3. LETTURA TABELLE:
   - Intestazione colonna = orario (es. "15.00/15.45")
   - Cella = classe
   - Prima colonna = data

4. TIPOLOGIA EVENTI - MANTIENI LA DISTINZIONE:
   - "Collegio dei Docenti" → plenario (tutti i docenti)
   - "Collegio di Plesso" → separato per sede/indirizzo
   - "Dipartimenti" → per area disciplinare
   - NON confonderli! Mantieni il tipo esatto dalla circolare.

5. FILTRO COLLEGI DI PLESSO (CRITICO):
   - Se l'evento è "Collegio di Plesso", includilo SOLO se riguarda:
     a) "Liceo Scientifico di Siniscola" o "Liceo Scientifico Siniscola"
     b) "IPSASR" o "Istituto Professionale per l'Agricoltura"
   - ESCLUDI i collegi di plesso per altre scuole:
     a) "Liceo Scientifico di Dorgali" → ESCLUDI
     b) "ITTL" → ESCLUDI
     c) Qualsiasi altra sede non Siniscola/IPSASR → ESCLUDI
   - Esempio corretto:
     * Testo: "Collegio di Plesso - IPSASR" → type: "Collegio di Plesso", title: "Collegio dei Docenti di Plesso IPSASR"
     * Testo: "Collegio di Plesso - Liceo Scientifico Siniscola" → type: "Collegio di Plesso", title: "Collegio dei Docenti di Plesso Liceo Scientifico"
     * Testo: "Collegio di Plesso - Dorgali" → ESCLUDI (non nelle classi configurate)

6. NORMALIZZAZIONE CLASSI:
   - "1 OR" → "1AOR"
   - "5A OR" → "5AOR"
   - "1ASA" → "1AS"
   - "2BSA" → "2BS"

7. ASSOCIAZIONE SEDI:
   - Classi OR → "Sede Orosei"
   - Classi AS/BS → "Sede Biscollai"
   - IPSASR/ETU/RIMS → "Via Toscana"

8. ${schoolContext}

9. JSON valido, niente markdown.
`
      },
      {
        role: "user",
        content: `Analizza questa circolare:\n\n${text}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0]?.message?.content || "{}";
  console.log("🤖 RAW AI JSON OUTPUT:", content);
  console.log("🏫 Scuola identificata:", isChironi ? "Chironi-Satta" : isPira ? "Pira" : "Sconosciuta");
  console.log("📚 Classi rilevanti:", relevantClasses);
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("❌ Errore parsing JSON:", error);
    return {
      circolare: { numero: "N/D", data: "N/D", oggetto: "Errore", destinatari: [] },
      eventi: [],
      ordineDelGiorno: []
    };
  }
}