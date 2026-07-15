import { useState } from "react";

import { extractTextFromPDF } from "../services/pdfService";
import {
  parseCircular,
  type CircularInfo,
} from "../services/circularParser";
import { parseEvents } from "../services/eventParser";

import type { SchoolEvent } from "../types/SchoolEvent";

export function useCircular() {
  const [loading, setLoading] = useState(false);

  const [text, setText] = useState("");

  const [events, setEvents] = useState<SchoolEvent[]>([]);

  const [info, setInfo] = useState<CircularInfo>({
    number: "",
    date: "",
    subject: "",
    recipients: [],
    deadlines: [],
  });

  const processPDF = async (file: File) => {
    setLoading(true);

    try {
      const extractedText = await extractTextFromPDF(file);

      setText(extractedText);

      const parsedInfo = parseCircular(extractedText);
      setInfo(parsedInfo);

      const parsedEvents = parseEvents(extractedText);
      setEvents(parsedEvents);
    } catch (error) {
      console.error("Errore completo:", error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(JSON.stringify(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    text,
    info,
    events,
    processPDF,
  };
}