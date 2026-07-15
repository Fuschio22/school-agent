import type { SchoolEvent } from "../types/SchoolEvent";

export function parseEvents(text: string): SchoolEvent[] {
  const events: SchoolEvent[] = [];

  const lines = text.split("\n");

  let currentDate = "";

  const dateRegex =
    /\b\d{2}\/\d{2}\/\d{4}\b/;

  const eventRegex =
    /(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})\s+(.+)/;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) continue;

    const dateMatch = line.match(dateRegex);

    if (dateMatch) {
      currentDate = dateMatch[0];
      continue;
    }

    const eventMatch = line.match(eventRegex);

    if (!eventMatch) continue;

    const [, start, end, title] = eventMatch;

    events.push({
      id: crypto.randomUUID(),

      title,

      type: "CDC",

      date: currentDate,

      startTime: start,

      endTime: end,

      circularNumber: "",
    });
  }

  return events;
}