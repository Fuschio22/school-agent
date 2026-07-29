const FORBIDDEN_SEDES = [
  "BISCOLLAI", 
  "OROSEI", 
  "CHIRONI", 
  "NUORO",
  "DORGALI",
  "ITTL", 
  "I.T.T.L.", 
  "TECNICO", 
  "TRASPORTI E LOGISTICA"
];

const ALLOWED_SEDES = [
  "SINISCOLA",
  "LICEO SCIENTIFICO",
  "LICEO",
  "VIA TOSCANA",
  "IPSASR",
  "AGRICOLTURA",
  "PROFESSIONALE"
];

const ALWAYS_ALLOWED_EVENTS = [
  "COLLEGIO DEI DOCENTI", 
  "DIPARTIMENTI DISCIPLINARI", 
  "COLLEGIO DOCENTI",
  "CONVOCAZIONE DEI DIPARTIMENTI", 
  "DIPARTIMENTI", 
  "CONVOCAZIONE DIPARTIMENTI",
  "COLLEGIO DI PLESSO", 
  "COLLEGI DI PLESSO"
  // I Colloqui sono stati rimossi da qui: devono rispettare il filtro della sede
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

  // ✅ 1. BLOCCO IMMEDIATO SEDI VIETATE (Chironi-Satta e altri)
  for (const forbidden of FORBIDDEN_SEDES) {
    if (combinedText.includes(forbidden)) {
      console.log(`❌ BLOCCATO: Evento contiene sede vietata "${forbidden}"`);
      return false;
    }
  }

  // ✅ 2. EVENTI GENERALI PERMESSI (solo se la sede è permessa)
  for (const allowedEvent of ALWAYS_ALLOWED_EVENTS) {
    if (title.includes(allowedEvent) || type.includes(allowedEvent)) {
      const isAllowedSede = ALLOWED_SEDES.some(s => combinedText.includes(s));
      if (isAllowedSede) {
        return true;
      }
      console.log(`❌ BLOCCATO: ${allowedEvent} ma sede non permessa (${sede})`);
      return false;
    }
  }

  // ✅ 3. Se nessuna classe configurata, blocca eventi specifici
  if (!userClasses || userClasses.length === 0) {
    console.log("❌ BLOCCATO: Nessuna classe configurata dall'utente");
    return false;
  }

  // ✅ 4. Controllo preliminare: la sede DEVE essere permessa per gli eventi di classe
  const isAllowedSede = ALLOWED_SEDES.some(s => combinedText.includes(s));
  if (!isAllowedSede) {
    console.log(`❌ BLOCCATO: Sede non permessa per evento di classe. Testo: ${combinedText}`);
    return false;
  }

  // ✅ 5. Controllo DINAMICO delle classi
  for (const userClass of userClasses) {
    const cleanUserClass = userClass.toUpperCase().replace(/[\^\s\.\-]/g, "");
    const cleanCombined = combinedText.replace(/[\^\s\.\-]/g, "");

    // A) Match diretto esatto
    if (cleanCombined.includes(cleanUserClass)) {
      return true;
    }

    // B) Logica Liceo Scientifico (classi che finiscono con AS o BS)
    if (cleanUserClass.endsWith("AS") || cleanUserClass.endsWith("BS")) {
      // Sicurezza extra: se il testo contiene Biscollai/Orosei, blocca anche se la classe corrisponde
      if (combinedText.includes("BISCOLLAI") || combinedText.includes("OROSEI")) {
        console.log(`❌ BLOCCATO: Classe ${userClass} ma sede Chironi-Satta (Biscollai/Orosei)`);
        continue;
      }
      
      const baseClass = cleanUserClass.slice(0, -1); // es. "1A" da "1AS"
      const hasBaseClass = cleanCombined.includes(baseClass);
      const isLiceoVero = combinedText.includes("SINISCOLA") || 
                          combinedText.includes("SCIENTIFICO") || 
                          combinedText.includes("LICEO");

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
        const isIpsasrVero = combinedText.includes("IPSASR") || 
                            combinedText.includes("AGRICOLTURA") || 
                            combinedText.includes("PROFESSIONALE");

        if (hasBaseClass && isIpsasrVero) {
          return true;
        }
      }
    }
  }

  console.log(`❌ BLOCCATO: Nessun match valido trovato per classe/sede`);
  return false;
}

export function filterEvents(events: any[], userClasses: string[]): any[] {
  const filtered = events.filter(event => shouldIncludeEvent(event, userClasses));
  console.log(`🔍 Filtro applicato: da ${events.length} eventi totali a ${filtered.length} eventi permessi`);
  return filtered;
}