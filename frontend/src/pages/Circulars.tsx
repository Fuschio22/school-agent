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

const renderNumberedSummary = (summary: string) => {
  if (!summary || summary === "Nessun riassunto.") {
    return <span className="text-gray-500 italic">Nessun riassunto disponibile.</span>;
  }
  
  const lines = summary.split('\n').filter(line => line.trim() !== '');
  
  return lines.map((line, index) => (
    <div key={index} className="flex items-start mb-2 last:mb-0">
      <span className="font-bold text-blue-700 mr-3 min-w-[1.5rem] text-right">
        {index + 1}.
      </span>
      <span className="text-gray-700 leading-relaxed">{line.trim()}</span>
    </div>
  ));
};

export default function Circulars() {
  const { circulars, loading, error } = useCirculars();
  
  const [savedCirculars, setSavedCirculars] = useState<SavedCircular[]>([]);
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
          <div className="space-y-4">
            {savedCirculars.map((circ) => (
              <div 
                key={circ.id} 
                className="p-4 rounded-lg border bg-gray-50 border-gray-200 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      Circolare n. {circ.number || "N/D"} 
                      <span className="text-gray-500 font-normal"> - {circ.date || "Data N/D"}</span>
                    </p>
                    <p className="text-sm text-gray-700 mt-1 font-medium">{circ.subject || "Nessun oggetto"}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {circ.events?.length || 0} eventi estratti • Caricata il {new Date(circ.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownloadPDF(circ)} className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md transition-colors font-medium">
                      📄 PDF
                    </button>
                    <button onClick={() => handleDownloadICS(circ)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors font-medium">
                      📥 .ics
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 bg-white p-4 rounded-lg border border-gray-100">
                  <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span>📋</span> Ordine del Giorno
                  </h4>
                  <div className="mb-6">
                    {renderNumberedSummary(circ.summary)}
                  </div>
                  
                  {circ.events && circ.events.length > 0 && (
                    <>
                      <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <span></span> Calendario Eventi ({circ.events.length})
                      </h4>
                      <VisualCalendar events={circ.events} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


