export type EventType =
  | "CDC"
  | "COLLEGIO"
  | "GLO"
  | "GLI"
  | "DIPARTIMENTO"
  | "SCRUTINIO"
  | "FORMAZIONE"
  | "ALTRO";

export interface SchoolEvent {
  id: string;

  title: string;

  type: EventType;

  date: string;

  startTime: string;

  endTime: string;

  location?: string;

  circularNumber?: string;
}