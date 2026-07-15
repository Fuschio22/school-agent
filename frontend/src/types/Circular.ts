import type { SchoolEvent } from "./SchoolEvent";

export interface Circular {

  id: string;

  fileName: string;

  number: string;

  date: string;

  subject: string;

  recipients: string[];

  deadlines: string[];

  text: string;

  summary: string;

  events: SchoolEvent[];

  createdAt: Date;

}