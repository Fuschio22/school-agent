import type { Circular } from "../types/Circular";

export function generateICS(circular: Circular): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SchoolAgent//Circolari Scolastiche//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  // Genera un evento per ogni classe trovata
  circular.events.forEach((event: any, index: number) => {
    const dtStart = formatICSDate(event.date, event.startTime);
    const dtEnd = formatICSDate(event.date, event.endTime);
    
    // Escape dei caratteri speciali per il formato ICS
    const safeTitle = String(event.title).replace(/[,;\\]/g, '\\$&');
    const safeLocation = String(event.location || 'Sede scolastica').replace(/[,;\\]/g, '\\$&');
    const safeDesc = `Circolare n. ${circular.number}\\n${circular.subject}`.replace(/[,;\\]/g, '\\$&');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${circular.id}-${index}@schoolagent.it`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${safeTitle}`);
    lines.push(`LOCATION:${safeLocation}`);
    lines.push(`DESCRIPTION:${safeDesc}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  
  // Unisci con ritorno a capo standard CRLF per compatibilità massima
  return lines.join('\r\n');
}

// Funzione helper per convertire "DD/MM/YYYY" e "HH:MM" in "YYYYMMDDTHHMMSS"
function formatICSDate(dateStr: string, timeStr: string): string {
  const [day, month, year] = String(dateStr).split('/');
  const [hours, minutes] = String(timeStr).split(':');
  return `${year}${month}${day}T${hours}${minutes}00`;
}