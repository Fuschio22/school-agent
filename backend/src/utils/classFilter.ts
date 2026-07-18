const ALLOWED_CLASSES = [
  "4A IPSASR",
  "5A IPSASR",
  "1AS", "2AS", "3AS", "4AS", "5AS",
  "1BS", "2BS", "3BS", "4BS", "5BS"
];

const FORBIDDEN_SEDES = ["Dorgali", "ITTL", "I.T.T.L."];

export function shouldIncludeEvent(event: {
  title?: string;
  type?: string;
  sede?: string;
  classe?: string;
}): boolean {
  const title = (event.title || "").toUpperCase();
  const sede = (event.sede || "").toUpperCase();
  const classe = (event.classe || "").toUpperCase();
  const combinedText = `${title} ${classe}`.toUpperCase();

  // Blocca immediatamente sedi vietate
  for (const forbidden of FORBIDDEN_SEDES) {
    if (sede.includes(forbidden.toUpperCase()) || 
        title.includes(forbidden.toUpperCase())) {
      return false;
    }
  }

  // Controlla se la classe è in quella permessa
  for (const allowed of ALLOWED_CLASSES) {
    const allowedUpper = allowed.toUpperCase();
    const allowedClean = allowedUpper.replace(/[\^\s]/g, "");
    const combinedClean = combinedText.replace(/[\^\s]/g, "");
    
    if (combinedText.includes(allowedUpper) || 
        combinedClean.includes(allowedClean)) {
      return true;
    }
  }

  // Se non è una delle 12 classi permesse, la scarta
  return false;
}

export function filterEvents(events: any[]): any[] {
  return events.filter(shouldIncludeEvent);
}