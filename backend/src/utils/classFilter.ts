const ALLOWED_CLASSES = [
  "4A IPSASR", "5A IPSASR",
  "1AS", "2AS", "3AS", "4AS", "5AS",
  "1BS", "2BS", "3BS", "4BS", "5BS"
];

const FORBIDDEN_SEDES = ["DORGALI", "ITTL", "I.T.T.L.", "TECNICO"];

// Eventi SEMPRE permessi (non legati a classi specifiche)
const ALWAYS_ALLOWED_EVENTS = [
  "COLLEGIO DEI DOCENTI",
  "DIPARTIMENTI DISCIPLINARI",
  "COLLEGIO DOCENTI",
  "CONVOCAZIONE DEI DIPARTIMENTI",
  "DIPARTIMENTI",
  "CONVOCAZIONE DIPARTIMENTI"
];

export function shouldIncludeEvent(event: {
  title?: string;
  type?: string;
  sede?: string;
  classe?: string;
}): boolean {
  const title = (event.title || "").toUpperCase();
  const sede = (event.sede || "").toUpperCase();
  const classe = (event.classe || "").toUpperCase();
  const type = (event.type || "").toUpperCase();
  const combinedText = `${title} ${type} ${classe} ${sede}`.toUpperCase();

  // 1. EVENTI SEMPRE PERMESSI (Collegio, Dipartimenti, ecc.)
  for (const allowedEvent of ALWAYS_ALLOWED_EVENTS) {
    if (title.includes(allowedEvent) || type.includes(allowedEvent)) {
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

  // 3. Controllo per classi del Liceo Scientifico Siniscola
  const isLiceoSiniscola = sede.includes("SINISCOLA") && !sede.includes("DORGALI");
  
  if (isLiceoSiniscola) {
    const classMatch = classe.match(/(\d+)\^?\s*([A-B])/) || title.match(/(\d+)\^?\s*([A-B])/);
    if (classMatch) {
      const num = classMatch[1];
      const letter = classMatch[2];
      const sezione = letter === "A" ? "AS" : "BS";
      const className = `${num}${sezione}`;
      
      if (ALLOWED_CLASSES.includes(className)) {
        console.log(`✅ Permesso evento (Liceo Siniscola ${className}):`, combinedText);
        return true;
      }
    }
  }

  // 4. Controllo per classi IPSASR
  const isIPSASR = sede.includes("IPSASR") || title.includes("IPSASR");
  
  if (isIPSASR) {
    const classMatch = classe.match(/(\d+)\^?\s*([A-B])/) || title.match(/(\d+)\^?\s*([A-B])/);
    if (classMatch) {
      const num = classMatch[1];
      const letter = classMatch[2];
      const classCode = `${num}${letter} IPSASR`;
      
      if (classCode === "4A IPSASR" || classCode === "5A IPSASR") {
        console.log(`✅ Permesso evento (IPSASR ${classCode}):`, combinedText);
        return true;
      }
    }
  }

  // 5. Controllo generico per le classi permesse (fallback)
  for (const allowed of ALLOWED_CLASSES) {
    const allowedUpper = allowed.toUpperCase();
    const allowedClean = allowedUpper.replace(/[\^\s]/g, "");
    const combinedClean = combinedText.replace(/[\^\s]/g, "");
    
    if (combinedText.includes(allowedUpper) || 
        combinedClean.includes(allowedClean)) {
      console.log(`✅ Permesso evento (classe ${allowed}):`, combinedText);
      return true;
    }
  }

  console.log(`❌ Bloccato evento (non nelle liste):`, combinedText);
  return false;
}

export function filterEvents(events: any[]): any[] {
  return events.filter(shouldIncludeEvent);
}