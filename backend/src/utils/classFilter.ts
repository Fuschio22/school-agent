const FORBIDDEN_SEDES = ["DORGALI", "ITTL", "I.T.T.L.", "TECNICO", "TRASPORTI E LOGISTICA"];

// Eventi SEMPRE permessi (non legati a classi specifiche)
// ⚠️ RIMOSSI: "CONSIGLI DI CLASSE", "CONSIGLIO DI CLASSE", "CONSIGLI DI CLASSE STRAORDINARI", "CONSIGLIO DI CLASSE STRAORDINARIO"
// Perché i Consigli di Classe sono legati a classi specifiche e devono essere filtrati!
const ALWAYS_ALLOWED_EVENTS = [
  "COLLEGIO DEI DOCENTI",
  "DIPARTIMENTI DISCIPLINARI",
  "COLLEGIO DOCENTI",
  "CONVOCAZIONE DEI DIPARTIMENTI",
  "DIPARTIMENTI",
  "CONVOCAZIONE DIPARTIMENTI",
  "COLLOQUI SCUOLA-FAMIGLIA",
  "COLLOQUI SCUOLA FAMIGLIA",
  "COLLOQUI",
  "COLLEGIO DI PLESSO",
  "COLLEGI DI PLESSO",
  "SCRUTINI",
  "SCRUTINI FINALI"
];

export function shouldIncludeEvent(event: {
  title?: string;
  type?: string;
  sede?: string;
  classe?: string;
}, userClasses: string[]): boolean {
  const title = (event.title || "").toUpperCase();
  const sede = (event.sede || "").toUpperCase();
  const classe = (event.classe || "").toUpperCase();
  const type = (event.type || "").toUpperCase();
  const combinedText = `${title} ${type} ${classe} ${sede}`.toUpperCase();

  // 1. EVENTI SEMPRE PERMESSI (con controlli extra per sedi)
  for (const allowedEvent of ALWAYS_ALLOWED_EVENTS) {
    if (title.includes(allowedEvent) || type.includes(allowedEvent)) {
      
      // Controllo aggiuntivo: se è un colloquio, collegio di plesso o scrutinio, verifica che non sia ITTL o Dorgali
      if (allowedEvent.includes("COLLOQUI") || allowedEvent.includes("PLESSO") || allowedEvent.includes("SCRUTINI")) {
        if (title.includes("ITTL") || title.includes("DORGALI") || title.includes("TRASPORTI") ||
            sede.includes("DORGALI") || sede.includes("ITTL")) {
          console.log(`❌ Bloccato evento generale (sede non permessa: Dorgali/ITTL):`, combinedText);
          return false;
        }
        // Permetti solo Siniscola e IPSASR
        if (title.includes("LICEO SCIENTIFICO") && sede.includes("SINISCOLA")) {
          console.log(`✅ Permesso evento generale (${allowedEvent} - Liceo Siniscola):`, combinedText);
          return true;
        }
        if (title.includes("ISTITUTO PROFESSIONALE") || title.includes("IPSASR") || title.includes("AGRICOLTURA")) {
          console.log(`✅ Permesso evento generale (${allowedEvent} - IPSASR):`, combinedText);
          return true;
        }
      }
      
      console.log(`✅ Permesso evento generale (${allowedEvent}):`, combinedText);
      return true;
    }
  }

  // 2. Blocca sedi vietate (solo per eventi legati a classi)
  for (const forbidden of FORBIDDEN_SEDES) {
    if (sede.includes(forbidden) || title.includes(forbidden)) {
      console.log(`❌ Bloccato evento (sede vietata ${forbidden}):`, combinedText);
      return false;
    }
  }

  // 3. Se l'utente non ha configurato classi, blocca gli eventi specifici per classe
  if (!userClasses || userClasses.length === 0) {
    console.log(`❌ Bloccato evento (nessuna classe configurata dall'utente):`, combinedText);
    return false;
  }

  // 4. Controllo DINAMICO: verifica se l'evento matcha con UNA delle classi configurate dall'utente
  for (const userClass of userClasses) {
    // Puliamo le stringhe da spazi, punti e ^ per rendere il confronto universale
    const cleanUserClass = userClass.toUpperCase().replace(/[\^\s\.\-]/g, "");
    const cleanCombined = combinedText.replace(/[\^\s\.\-]/g, "");

    // A) Match diretto (es. utente ha "1AS", evento dice "1AS LICEO SINISCOLA")
    if (cleanCombined.includes(cleanUserClass)) {
      console.log(`✅ Permesso evento (match diretto con classe utente "${userClass}"):`, combinedText);
      return true;
    }

    // B) Logica Liceo Scientifico (es. utente ha "1AS" -> il sistema cerca "1A" + "SINISCOLA" o "LICEO")
    if (cleanUserClass.endsWith("AS") || cleanUserClass.endsWith("BS")) {
      const baseClass = cleanUserClass.slice(0, -1); // Estrae "1A" o "5B"
      const hasBaseClass = cleanCombined.includes(baseClass);
      const isLiceo = cleanCombined.includes("SINISCOLA") || cleanCombined.includes("LICEO");
      
      if (hasBaseClass && isLiceo) {
        console.log(`✅ Permesso evento (match Liceo con classe utente "${userClass}"):`, combinedText);
        return true;
      }
    }

    // C) Logica IPSASR (es. utente ha "4A IPSASR" -> il sistema cerca "4A" + "IPSASR" o "AGRICOLTURA")
    if (cleanUserClass.includes("IPSASR") || cleanUserClass.includes("AGRICOLTURA") || cleanUserClass.includes("PROFESSIONALE")) {
      const baseClassMatch = cleanUserClass.match(/(\d+[A-Z])/); // Estrae "4A"
      if (baseClassMatch) {
        const baseClass = baseClassMatch[1];
        const hasBaseClass = cleanCombined.includes(baseClass);
        const isIpsasr = cleanCombined.includes("IPSASR") || cleanCombined.includes("AGRICOLTURA") || cleanCombined.includes("PROFESSIONALE");
        
        if (hasBaseClass && isIpsasr) {
          console.log(`✅ Permesso evento (match IPSASR con classe utente "${userClass}"):`, combinedText);
          return true;
        }
      }
    }
  }

  console.log(`❌ Bloccato evento (nessun match con le classi configurate):`, combinedText);
  return false;
}

export function filterEvents(events: any[], userClasses: string[]): any[] {
  return events.filter(event => shouldIncludeEvent(event, userClasses));
} 