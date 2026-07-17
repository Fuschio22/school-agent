import type { SchoolEvent } from "../types/SchoolEvent";

const VALID_TYPES = ["Consigli di Classe", "Collegio dei Docenti", "GLO", "GLI", "Dipartimenti Disciplinari", "SCRUTINIO", "FORMAZIONE", "ALTRO"];

export function normalizeEventData(events: any[]): Partial<SchoolEvent>[] {
  if (!Array.isArray(events)) return [];
  
  return events.map((event, index) => ({
    id: event.id || `event-${index}`,
    title: String(event.title || "").trim(),
    type: VALID_TYPES.includes(event.type) ? event.type : "ALTRO",
    date: String(event.date || "").trim(),
    startTime: String(event.startTime || "").trim(),
    endTime: String(event.endTime || "").trim(),
    location: event.location ? String(event.location).trim() : undefined,
    circularNumber: event.circularNumber ? String(event.circularNumber).trim() : undefined,
  }));
}