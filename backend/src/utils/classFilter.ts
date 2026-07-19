const FORBIDDEN_SEDES = ["DORGALI", "ITTL", "I.T.T.L.", "TECNICO", "TRASPORTI E LOGISTICA"];

const ALWAYS_ALLOWED_EVENTS = [
  "COLLEGIO DEI DOCENTI", "DIPARTIMENTI DISCIPLINARI", "COLLEGIO DOCENTI",
  "CONVOCAZIONE DEI DIPARTIMENTI", "DIPARTIMENTI", "CONVOCAZIONE DIPARTIMENTI",
  "COLLEGIO DI PLESSO", "COLLEGI DI PLESSO",
  "COLLOQUI SCUOLA-FAMIGLIA", "COLLOQUI SCUOLA FAMIGLIA", "COLLOQUI" // <-- AGGIUNTI
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

  // 1. Blocca immediatamente sedi vietate
  for (const forbidden of FORBIDDEN_SEDES) {
    if (combinedText.includes(forbidden)) {
      return false;
    }
  }

  // 2. Eventi generali permessi (inclusi i Colloqui)
  for (const allowedEvent of ALWAYS_ALLOWED_EVENTS) {
    if (title.includes(allowedEvent) || type.includes(allowedEvent)) {
      // Per Colloqui e Collegi di Plesso, verifica che sia Siniscola o IPSASR
      if (allowedEvent.includes("COLLOQUI") || allowedEvent.includes("PLESSO")) {
        const isSiniscola = combinedText.includes("SINISCOLA") || combinedText.includes("SCIENTIFICO") || combinedText.includes("LICEO");
        const isIpsasr = combinedText.includes("IPSASR") || combinedText.includes("AGRICOLTURA") || combinedText.includes("PROFESSIONALE");
        
        if (isSiniscola || isIpsasr) {
          return true;
        }
        return false;
      }
      return true;
    }
  }

  // 3. Se nessuna classe configurata, blocca eventi specifici
  if (!userClasses || userClasses.length === 0) {
    return false;
  }

  // 4. Controllo DINAMICO A PROVA DI ERRORE
  for (const userClass of userClasses) {
    const cleanUserClass = userClass.toUpperCase().replace(/[\^\s\.\-]/g, "");
    const cleanCombined = combinedText.replace(/[\^\s\.\-]/g, "");

    // A) Match diretto esatto
    if (cleanCombined.includes(cleanUserClass)) {
      return true;
    }

    // B) Logica Liceo Scientifico
    if (cleanUserClass.endsWith("AS") || cleanUserClass.endsWith("BS")) {
      if (cleanCombined.includes("IPSASR") || cleanCombined.includes("AGRICOLTURA") || cleanCombined.includes("PROFESSIONALE")) {
        continue; // Salta, non è un evento del Liceo
      }
      
      const baseClass = cleanUserClass.slice(0, -1);
      const hasBaseClass = cleanCombined.includes(baseClass);
      const isLiceoVero = cleanCombined.includes("SINISCOLA") || cleanCombined.includes("SCIENTIFICO") || cleanCombined.includes("LICEO");

      if (hasBaseClass && isLiceoVero) {
        return true;
      }
    }

    // C) Logica IPSASR
    if (cleanUserClass.includes("IPSASR") || cleanUserClass.includes("AGRICOLTURA")) {
      const baseClassMatch = cleanUserClass.match(/(\d+[A-Z])/);
      if (baseClassMatch) {
        const baseClass = baseClassMatch[1];
        const hasBaseClass = cleanCombined.includes(baseClass);
        const isIpsasrVero = cleanCombined.includes("IPSASR") || cleanCombined.includes("AGRICOLTURA") || cleanCombined.includes("PROFESSIONALE");

        if (hasBaseClass && isIpsasrVero) {
          return true;
        }
      }
    }
  }

  return false;
}

export function filterEvents(events: any[], userClasses: string[]): any[] {
  return events.filter(event => shouldIncludeEvent(event, userClasses));
}