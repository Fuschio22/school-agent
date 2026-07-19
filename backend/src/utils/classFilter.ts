const FORBIDDEN_SEDES = ["DORGALI", "ITTL", "I.T.T.L.", "TECNICO", "TRASPORTI E LOGISTICA"];

const ALWAYS_ALLOWED_EVENTS = [
  "COLLEGIO DEI DOCENTI", "DIPARTIMENTI DISCIPLINARI", "COLLEGIO DOCENTI",
  "CONVOCAZIONE DEI DIPARTIMENTI", "DIPARTIMENTI", "CONVOCAZIONE DIPARTIMENTI",
  "COLLEGIO DI PLESSO", "COLLEGI DI PLESSO"
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

  // 2. Eventi generali permessi
  for (const allowedEvent of ALWAYS_ALLOWED_EVENTS) {
    if (title.includes(allowedEvent) || type.includes(allowedEvent)) {
      if (allowedEvent.includes("PLESSO")) {
        const isSiniscola = combinedText.includes("SINISCOLA") || combinedText.includes("SCIENTIFICO");
        const isIpsasr = combinedText.includes("IPSASR") || combinedText.includes("AGRICOLTURA") || combinedText.includes("PROFESSIONALE");
        if (isSiniscola || isIpsasr) return true;
        return false;
      }
      return true;
    }
  }

  // 3. Se nessuna classe configurata, blocca
  if (!userClasses || userClasses.length === 0) {
    return false;
  }

  // 4. Controllo DINAMICO A PROVA DI ERRORE
  for (const userClass of userClasses) {
    const cleanUserClass = userClass.toUpperCase().replace(/[\^\s\.\-]/g, "");
    const cleanCombined = combinedText.replace(/[\^\s\.\-]/g, "");

    // A) Match diretto esatto (es. "4AIPSASR" dentro il testo)
    if (cleanCombined.includes(cleanUserClass)) {
      return true;
    }

    // B) Logica Liceo Scientifico (utente ha "1AS", "2BS", ecc.)
    // ⚠️ IMPORTANTE: Non applicare questa logica se l'evento è chiaramente IPSASR
    if (cleanUserClass.endsWith("AS") || cleanUserClass.endsWith("BS")) {
      // Se l'evento contiene IPSASR, AGRICOLTURA o PROFESSIONALE, NON è un evento del Liceo
      if (cleanCombined.includes("IPSASR") || 
          cleanCombined.includes("AGRICOLTURA") || 
          cleanCombined.includes("PROFESSIONALE")) {
        // Salta questa logica, non è un evento del Liceo
        continue;
      }
      
      const baseClass = cleanUserClass.slice(0, -1); // Estrae "1A" o "5B"
      const hasBaseClass = cleanCombined.includes(baseClass);
      
      // Deve essere Scientifico o Siniscola
      const isLiceoVero = cleanCombined.includes("SINISCOLA") || cleanCombined.includes("SCIENTIFICO") || cleanCombined.includes("LICEO");

      if (hasBaseClass && isLiceoVero) {
        return true;
      }
    }

    // C) Logica IPSASR (utente ha "4A IPSASR", ecc.)
    if (cleanUserClass.includes("IPSASR") || cleanUserClass.includes("AGRICOLTURA")) {
      const baseClassMatch = cleanUserClass.match(/(\d+[A-Z])/); // Estrae "4A"
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