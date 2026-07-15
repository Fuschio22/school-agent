export type CircularInfo = {
  number: string;
  date: string;
  subject: string;
  recipients: string[];
  deadlines: string[];
};

export function parseCircular(text: string): CircularInfo {
  const number =
    text.match(/Circolare\s*n\.?\s*([0-9]+)/i)?.[1] ?? "";

  const date =
    text.match(/([0-9]{1,2}\s+[A-Za-zàèéìòù]+\s+[0-9]{4})/)?.[1] ?? "";

  const subject =
    text.match(/OGGETTO:\s*(.+?)(?=I consigli|$)/is)?.[1]
      ?.replace(/\s+/g, " ")
      .trim() ?? "";

  const recipients: string[] = [];

  [
    "Docenti",
    "Studenti",
    "Genitori",
    "DSGA",
    "Personale ATA",
  ].forEach((r) => {
    if (text.toLowerCase().includes(r.toLowerCase())) {
      recipients.push(r);
    }
  });

  const deadlines = [
    ...text.matchAll(
      /\b([0-9]{1,2}\s+[A-Za-zàèéìòù]+\s+[0-9]{4})\b/gi
    ),
  ].map((m) => m[1]);

  return {
    number,
    date,
    subject,
    recipients,
    deadlines: [...new Set(deadlines)],
  };
}