const FORBIDDEN_SEDES = ["DORGALI", "ITTL", "I.T.T.L.", "TECNICO", "TRASPORTI E LOGISTICA"];

// Eventi VERAMENTE generali permessi (non legati a una singola classe)
// ⚠️ NOTA: "COLLOQUI" e "SCRUTINI" sono stati RIMOSSI da qui perché sono legati a classi specifiche 
// e devono passare attraverso il controllo dinamico delle classi dell'utente (Punto 4).
const ALWAYS_ALLOWED_EVENTS = [
  "COLLEGIO DEI DOCENTI",
  "DIPARTIMENTI DISCIPLINARI",
  "COLLEGIO DOCENTI",
  "CONVOCAZIONE DEI DIPARTIMENTI",
  "DIPARTIMENTI",
  "CONVOCAZIONE DIPARTIMENTI",
  "COLLEGIO DI PLESSO",
  "COLLEGI DI PLESSO"
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

  // 1. Blocca immediatamente sedi vietate (Dorgali, ITTL)
  for (const forbidden of FORBIDDEN_SEDES) {
    if (combinedText.includes(forbidden)) {
      console.log(`❌ Bloccato (sede vietata ${forbidden}):`, combinedText);
      return false;
    }
  }

  // 2. Eventi VERAMENTE generali permessi (Collegio, Dipartimenti, Collegi di Plesso)
  for (const allowedEvent of ALWAYS_ALLOWED_EVENTS) {
    if (title.includes(allowedEvent) || type.includes(allowedEvent)) {
      // Per i Collegi di Plesso, verifichiamo che sia Siniscola o IPSASR
      if (allowedEvent.includes("PLESSO")) {
        const isSiniscola = combinedText.includes("SINISCOLA") || combinedText.includes("LICEO SCIENTIFICO");
        const isIpsasr = combinedText.includes("IPSASR") || combinedText.includes("AGRICOLTURA") || combinedText.includes("PROFESSIONALE");
        
        if (isSiniscola || isIpsasr) {
          console.log(`✅ Permesso evento generale (${allowedEvent}):`, combinedText);
          return true;
        }
        console.log(`❌ Bloccato evento generale (sede non valida per ${allowedEvent}):`, combinedText);
        return false;
      }
      
      console.log(`✅ Permesso evento generale (${allowedEvent}):`, combinedText);
      return true;
    }
  }

  // 3. Se l'utente non ha configurato classi, blocca tutto il resto
  if (!userClasses || userClasses.length === 0) {
    console.log(`❌ Bloccato evento (nessuna classe configurata dall'utente):`, combinedText);
    return false;
  }

  // 4. Controllo DINAMICO: verifica se l'evento matcha con UNA delle classi configurate dall'utente
  // Questo gestisce ora: Consigli di Classe, Scrutini, Colloqui, ecc.
  for (const userClass of userClasses) {
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