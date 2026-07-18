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

        REGOLE FONDAMENTALI:
        1. Crea UN evento per OGNI riga delle tabelle nel testo.
        2. Normalizza gli orari: se trovi '17.00', convertilo in '17:00'.
        3. Copia l'ordine del giorno ESATTAMENTE come nel testo, dividendolo in un array di stringhe.
        4. Restituisci SOLO il JSON, senza markdown o testo aggiuntivo.
        5. VIETATO usare abbreviazioni. Scrivi SEMPRE i nomi per esteso: usa "Consigli di Classe" (MAI "CDC"), "Collegio dei Docenti" (MAI "Collegio"), "Dipartimenti Disciplinari".
        6. FILTRO CLASSI - INCLUDI SOLO QUESTE CLASSI (in qualsiasi forma siano scritte):
           
           CLASSI PERMESSE (riconosci tutte le varianti):
           ✓ 4A IPSASR (anche scritta come: "4^ A IPSASR", "4 A IPSASR", "4A", "4^ A")
           ✓ 5A IPSASR (anche scritta come: "5^ A IPSASR", "5 A IPSASR", "5A", "5^ A")
           ✓ 1AS Liceo Scientifico Siniscola (anche: "1^ AS", "1 A Liceo", "1AS", "1^ A")
           ✓ 2AS Liceo Scientifico Siniscola (anche: "2^ AS", "2 A Liceo", "2AS", "2^ A")
           ✓ 3AS Liceo Scientifico Siniscola (anche: "3^ AS", "3 A Liceo", "3AS", "3^ A")
           ✓ 4AS Liceo Scientifico Siniscola (anche: "4^ AS", "4 A Liceo", "4AS", "4^ A")
           ✓ 5AS Liceo Scientifico Siniscola (anche: "5^ AS", "5 A Liceo", "5AS", "5^ A")
           ✓ 1BS Liceo Scientifico Siniscola (anche: "1^ BS", "1 B Liceo", "1BS", "1^ B")
           ✓ 2BS Liceo Scientifico Siniscola (anche: "2^ BS", "2 B Liceo", "2BS", "2^ B")
           ✓ 3BS Liceo Scientifico Siniscola (anche: "3^ BS", "3 B Liceo", "3BS", "3^ B")
           ✓ 4BS Liceo Scientifico Siniscola (anche: "4^ BS", "4 B Liceo", "4BS", "4^ B")
           ✓ 5BS Liceo Scientifico Siniscola (anche: "5^ BS", "5 B Liceo", "5BS", "5^ B")
           
           CLASSI DA ESCLUDERE ASSOLUTAMENTE:
            1A IPSASR, 2A IPSASR, 3A IPSASR (qualsiasi classe IPSASR da 1A a 3A)
           ✗ Qualsiasi classe del Liceo Scientifico di Dorgali
           ✗ Qualsiasi altra classe non elencata sopra
           
           Quando trovi una riga, chiediti: "Questa classe è nella lista PERMESSA?" Se SÌ, creala. Se NO, ignorala.`
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