import { useState, useEffect } from 'react';

const API_URL = "https://school-agent-backend.onrender.com";

export interface Circular {
  id: string;
  fileName: string;
  number: string;
  date: string;
  subject: string;
  summary: string;
  priority: string;
  recipients: string;
  deadlines: string;
  createdAt: string;
  events: Event[];
}

export interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  circularNumber: string;
}

export function useCirculars() {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCirculars();
  }, []);

  const fetchCirculars = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/circulars`);
      if (!response.ok) {
        throw new Error('Errore nel recupero delle circolari');
      }
      const data = await response.json();
      setCirculars(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  return { circulars, loading, error, refetch: fetchCirculars };
}

export async function analyzeCircular(file: File, text: string): Promise<Circular> {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('text', text);
  formData.append('fileName', file.name);

  const response = await fetch(`${API_URL}/api/circulars/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Errore durante l\'analisi della circolare');
  }

  return await response.json();
}