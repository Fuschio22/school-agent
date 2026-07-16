import { Circular } from '../types/Circular';

export function parseCircularData(text: string, fileName: string): Partial<Circular> {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  return {
    fileName: fileName,
    number: extractNumber(lines),
    date: extractDate(lines),
    subject: extractSubject(lines),
    summary: extractSummary(lines),
    recipients: extractRecipients(lines),
    deadlines: extractDeadlines(lines),
    text: text,
  };
}

function extractNumber(lines: string[]): string {
  const numberLine = lines.find(line => line.toLowerCase().includes('n.') || line.toLowerCase().includes('numero'));
  return numberLine ? numberLine.trim() : 'N/A';
}

function extractDate(lines: string[]): string {
  const dateLine = lines.find(line => line.toLowerCase().includes('data') || /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(line));
  return dateLine ? dateLine.trim() : new Date().toLocaleDateString('it-IT');
}

function extractSubject(lines: string[]): string {
  const subjectLine = lines.find(line => line.toLowerCase().includes('oggetto') || line.toLowerCase().includes('subject'));
  return subjectLine ? subjectLine.replace(/oggetto:|subject:/i, '').trim() : 'Circolare scolastica';
}

function extractSummary(lines: string[]): string {
  const meaningfulLines = lines.filter(line => line.length > 20);
  return meaningfulLines.slice(0, 3).join('. ').substring(0, 200) + '...';
}

function extractRecipients(lines: string[]): string[] {
  const recipientsLine = lines.find(line => line.toLowerCase().includes('destinatari') || line.toLowerCase().includes('a '));
  if (!recipientsLine) return ['Tutti i docenti'];
  return recipientsLine.split(',').map(r => r.trim());
}

function extractDeadlines(lines: string[]): string[] {
  const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
  const dates = lines.join(' ').match(datePattern);
  return dates ? dates : [];
}