const FORBIDDEN_SEDES = [
  "DORGALI",
  "ITTL", 
  "I.T.T.L.", 
  "TECNICO", 
  "TRASPORTI E LOGISTICA"
];

const ALWAYS_ALLOWED_EVENTS = [
  "COLLEGIO DEI DOCENTI", 
  "DIPARTIMENTI DISCIPLINARI", 
  "COLLEGIO DOCENTI",
  "CONVOCAZIONE DEI DIPARTIMENTI", 
  "DIPARTIMENTI", 
  "CONVOCAZIONE DIPARTIMENTI",
  "COLLEGIO DI PLESSO", 
  "COLLEGI DI PLESSO",
  "COLLOQUI SCUOLA-FAMIGLIA", 
  "COLLOQUI SCUOLA FAMIGLIA", 
  "COLLOQUI"
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

  // ✅ 1. BLOCCO IMMEDIATO SOLO PER SEDI VERAMENTE VIETATE
  for (const forbidden of FORBIDDEN_SEDES) {
    if (combinedText.includes(forbidden)) {
      console.log(`❌ BLOCCATO: Sede vietata "${forbidden}"`);
      return false;
    }
  }

  // ✅ 2. EVENTI GENERALI PERMESSI (Collegi, Dipartimenti, Colloqui)
  for (const allowedEvent of ALWAYS_ALLOWED_EVENTS) {
    if (title.includes(allowedEvent) || type.includes(allowedEvent)) {
      return true;
    }
  }

  // ✅ 3. Se nessuna classe configurata, blocca
  if (!userClasses || userClasses.length === 0) {
    console.log("❌ BLOCCATO: Nessuna classe configurata");
    return false;
  }

  // ✅ 4. Controllo DINAMICO delle classi configurate
  for (const userClass of userClasses) {
    const cleanUserClass = userClass.toUpperCase().replace(/[\s\.\-]/g, "");
    const cleanCombined = combinedText.replace(/[\s\.\-]/g, "");

    // A) Match diretto: cerca la classe esatta nelle impostazioni
    // Esempio: userClass="1AOR" → cerca "1AOR" o "1 OR" nel testo
    const classVariations = [
      cleanUserClass,                          // "1AOR"
      cleanUserClass.replace("AOR", " OR"),    // "1 OR"
      cleanUserClass.replace("BOR", " OR"),    // "5 OR" (per 5BOR)
    ];

    for (const variation of classVariations) {
      if (cleanCombined.includes(variation)) {
        console.log(`✅ PERMESSO: Classe ${userClass} trovata come "${variation}"`);
        return true;
      }
    }

    // B) Logica per classi AS/BS del Liceo
    if (cleanUserClass.endsWith("AS") || cleanUserClass.endsWith("BS")) {
      const baseClass = cleanUserClass.slice(0, -1); // "1A" da "1AS"
      const hasBaseClass = cleanCombined.includes(baseClass);
      const isLiceo = combinedText.includes("LICEO") || 
                      combinedText.includes("SCIENTIFICO") || 
                      combinedText.includes("SINISCOLA");
      
      if (hasBaseClass && isLiceo) {
        return true;
      }
    }

    // C) Logica per IPSASR
    if (cleanUserClass.includes("IPSASR")) {
      const baseClassMatch = cleanUserClass.match(/(\d+[A-Z])/);
      if (baseClassMatch) {
        const baseClass = baseClassMatch[1];
        const hasBaseClass = cleanCombined.includes(baseClass);
        const isIpsasr = combinedText.includes("IPSASR") || 
                        combinedText.includes("AGRICOLTURA") || 
                        combinedText.includes("PROFESSIONALE");
        
        if (hasBaseClass && isIpsasr) {
          return true;
        }
      }
    }
  }

  console.log(`❌ BLOCCATO: Classe non trovata nelle impostazioni. Testo: ${classe}`);
  return false;
}

export function filterEvents(events: any[], userClasses: string[]): any[] {
  const filtered = events.filter(event => shouldIncludeEvent(event, userClasses));
  console.log(`🔍 Filtro: da ${events.length} eventi a ${filtered.length} permessi`);
  return filtered;
}