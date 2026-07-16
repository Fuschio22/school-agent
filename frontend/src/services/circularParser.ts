import type { Circular } from "../types/Circular";

export function normalizeCircularData(data: any): Partial<Circular> {
  return {
    number: String(data.number || "").trim(),
    date: String(data.date || "").trim(),
    subject: String(data.subject || "").trim(),
    summary: String(data.summary || "").trim(),
    priority: ["bassa", "media", "alta"].includes(data.priority) ? data.priority : "media",
    recipients: Array.isArray(data.recipients) ? data.recipients.map(String) : [],
    deadlines: Array.isArray(data.deadlines) ? data.deadlines.map(String) : [],
  };
}