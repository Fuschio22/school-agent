import { useState } from "react";
import { extractTextFromPDF } from "../services/pdfService";
import { normalizeCircularData } from "../services/circularParser";
import { normalizeEventData } from "../services/eventParser";
import type { Circular } from "../types/Circular";

export function useCircular() {
  const [loading, setLoading] = useState(false);
  const [circular, setCircular] = useState<Circular | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processPDF = async (file: File) => {
    setLoading(true);
    setError(null);
    setCircular(null);

    try {
      // 1. Estrazione testo lato client
      const text = await extractTextFromPDF(file);

      // 2. Preparazione FormData per inviare il file fisico + il testo
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('text', text);
      formData.append('fileName', file.name);

      // 3. Invio al backend (URL del tuo Codespace)
      const response = await fetch("https://psychic-capybara-wv6qwv4x5vr25pqq-3001.app.github.dev/api/circulars/analyze", {
        method: "POST",
        body: formData, 
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Errore durante l'analisi della circolare");
      }

      const data = await response.json();

      // 4. Normalizzazione e tipizzazione sicura dei dati ricevuti
      const normalizedInfo = normalizeCircularData(data);
      const normalizedEvents = normalizeEventData(data.events);

      setCircular({
        id: data.id,
        fileName: data.fileName,
        filePath: data.filePath,
        text: data.text,
        createdAt: new Date(data.createdAt),
        ...normalizedInfo,
        events: normalizedEvents as any[], 
      } as Circular);

    } catch (err) {
      console.error("Errore processPDF:", err);
      setError(err instanceof Error ? err.message : "Errore sconosciuto durante l'elaborazione");
    } finally {
      setLoading(false);
    }
  };

  return { loading, circular, error, processPDF };
}