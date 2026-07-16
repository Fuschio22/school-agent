import { useState, useEffect } from "react";
import { useCirculars, analyzeCircular } from "../hooks/useCircular";
import { extractTextFromPDF } from "../services/pdfService";
import { generateICS } from "../services/icsGenerator";
import VisualCalendar from "../components/VisualCalendar";

interface SavedCircular {
  id: string;
  fileName: string;
  filePath: string;
  number: string;
  date: string;
  subject: string;
  summary: string;
  events: any[];
  createdAt: string;
}

export default function Circulars() {
  // RIMOSSO 'refetch' perché non veniva usato
  const { circulars, loading, error } = useCirculars();
  
  const [savedCirculars, setSavedCirculars] = useState<SavedCircular[]>([]);
  const [selectedCircular, setSelectedCircular] = useState<SavedCircular | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedCirculars();
  }, []);

  useEffect(() => {
    if (circulars && circulars.length > 0) {
      setSavedCirculars(circulars as unknown as SavedCircular[]);
    }
  }, [circulars]);

  const fetchSavedCirculars = async () => {
    try {
      const response = await fetch("https://school-agent-backend.onrender.com/api/circulars");
      if (response.ok) {
        const data = await response.json();
        setSavedCirculars(data);
      }
    } catch (err) {
      console.error("Errore nel caricamento dell'archivio:", err);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessError(null);

    try {
      let text = "";
      try {
        text = await extractTextFromPDF(file);
      } catch (e) {
        console.warn("Impossibile estrarre testo dal PDF, invio solo il file:", e);
      }

      await analyzeCircular(file, text);
      await fetchSavedCirculars();
      event.target.value = "";
    } catch (err: any) {
      setProcessError(err.message || "Errore durante l'elaborazione del file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadICS = (circ: SavedCircular) => {
    const icsContent = generateICS(circ as any);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Circolare_${circ.number || 'Evento'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = (circ: SavedCircular) => {
    if (!circ.filePath) return;
    const fileName = circ.filePath.split('/').pop();
    const backendUrl = "https://school-agent-backend.onrender.com";
    const link = document.createElement('a');
    link.href = `${backendUrl}/uploads/${fileName}`;
    link.setAttribute('download', circ.fileName);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Circolari</h1>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Carica Nuova Circolare</h2>
        <label className="block">
          <span className="sr-only">Scegli un file PDF</span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isProcessing || loading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
          />
        </label>
      </div>

      {(error || processError) && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-bold">Errore</p>
          <p>{error || processError}</p>
        </div>
      )}

      {(loading || isProcessing) && (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="mt-4 text-gray-600 font-medium">Elaborazione in corso...</span>
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🗄️</span> Archivio Circolari ({savedCirculars.length})
        </h2>
        
        {savedCirculars.length === 0 ? (
          <p className="text-gray-500 italic">Nessuna circolare salvata nel database.</p>
        ) : (
          <div className="space-y-3">
            {savedCirculars.map((circ) => (
              <div 
                key={circ.id} 
                onClick={() => setSelectedCircular(selectedCircular?.id === circ.id ? null : circ)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedCircular?.id === circ.id 
                    ? "bg-blue-50 border-blue-300 ring-1 ring-blue-300" 
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">Circolare n. {circ.number || "N/D"} - {circ.date || "Data N/D"}</p>
                    <p className="text-sm text-gray-600 mt-1">{circ.subject || "Nessun oggetto"}</p>
                    <p className="text-xs text-gray-400 mt-2">{circ.events?.length || 0} eventi estratti • Caricata il {new Date(circ.createdAt).toLocaleDateString('it-IT')}</p>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleDownloadPDF(circ)} className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md transition-colors">📄 PDF</button>
                    <button onClick={() => handleDownloadICS(circ)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors">📥 .ics</button>
                  </div>
                </div>

                {selectedCircular?.id === circ.id && (
                  <div className="mt-4 pt-4 border-t border-blue-200 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Ordine del Giorno</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-blue-100 mb-4">
                      {circ.summary || "Nessun riassunto."}
                    </p>
                    {circ.events && circ.events.length > 0 && (
                      <>
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Eventi ({circ.events.length})</h4>
                        <VisualCalendar events={circ.events} />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}