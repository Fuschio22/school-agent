const ALLOWED_CLASSES = [
  "4A IPSASR", "5A IPSASR",
  "1AS", "2AS", "3AS", "4AS", "5AS",
  "1BS", "2BS", "3BS", "4BS", "5BS"
];

const FORBIDDEN_SEDES = ["DORGALI", "ITTL", "I.T.T.L.", "TECNICO"];

export function shouldIncludeEvent(event: {
  title?: string;
  type?: string;
  sede?: string;
  classe?: string;
}): boolean {
  const title = (event.title || "").toUpperCase();
  const sede = (event.sede || "").toUpperCase();
  const classe = (event.classe || "").toUpperCase();
  const combinedText = `${title} ${classe} ${sede}`.toUpperCase();

  // 1. Blocca immediatamente sedi vietate
  for (const forbidden of FORBIDDEN_SEDES) {
    if (sede.includes(forbidden) || title.includes(forbidden)) {
      console.log(`❌ Bloccato evento (sede vietata ${forbidden}):`, combinedText);
      return false;
    }
  }

  // 2. Controllo per classi del Liceo Scientifico Siniscola
  // Se la sede contiene "SINISCOLA" e NON contiene "DORGALI"
  const isLiceoSiniscola = sede.includes("SINISCOLA") && !sede.includes("DORGALI");
  
  if (isLiceoSiniscola) {
    // Estrai il numero e la lettera (es. "1^A" → "1A", "4^A" → "4A", "5^B" → "5B")
    const classMatch = classe.match(/(\d+)\^?\s*([A-B])/) || title.match(/(\d+)\^?\s*([A-B])/);
    if (classMatch) {
      const num = classMatch[1];
      const letter = classMatch[2];
      const sezione = letter === "A" ? "AS" : "BS";
      const className = `${num}${sezione}`;
      
      // Verifica se è una classe permessa (1AS-5AS o 1BS-5BS)
      if (ALLOWED_CLASSES.includes(className)) {
        console.log(`✅ Permesso evento (Liceo Siniscola ${className}):`, combinedText);
        return true;
      }
    }
  }

  // 3. Controllo per classi IPSASR
  const isIPSASR = sede.includes("IPSASR") || title.includes("IPSASR");
  
  if (isIPSASR) {
    // Estrai il numero e la lettera
    const classMatch = classe.match(/(\d+)\^?\s*([A-B])/) || title.match(/(\d+)\^?\s*([A-B])/);
    if (classMatch) {
      const num = classMatch[1];
      const letter = classMatch[2];
      const classCode = `${num}${letter} IPSASR`;
      
      // Solo 4A e 5A IPSASR sono permesse
      if (classCode === "4A IPSASR" || classCode === "5A IPSASR") {
        console.log(`✅ Permesso evento (IPSASR ${classCode}):`, combinedText);
        return true;
      }
    }
  }

  // 4. Controllo generico per le classi permesse (fallback)
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