export interface Deadline {
  description: string;
  date: string;
  recipients: string[];
}

export interface CircularData {
  title: string;
  protocol?: string;
  publicationDate?: string;
  deadlines: Deadline[];
  summary: string;
}