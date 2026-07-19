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
  const [filteredCirculars, setFilteredCirculars] = useState<SavedCircular[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSavedCirculars();
  }, []);

  useEffect(() => {
    if (circulars && circulars.length > 0) {
      setSavedCirculars(circulars as unknown as SavedCircular[]);
    }
  }, [circulars]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCirculars(savedCirculars);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = savedCirculars.filter(circ => {
        const numberMatch = circ.number.toLowerCase().includes(term);
        const subjectMatch = circ.subject.toLowerCase().includes(term);
        const dateMatch = circ.date.toLowerCase().includes(term);
        const fileNameMatch = circ.fileName.toLowerCase().includes(term);
        
        return numberMatch || subjectMatch || dateMatch || fileNameMatch;
      });
      setFilteredCirculars(filtered);
    }
  }, [searchTerm, savedCirculars]);

  const fetchSavedCirculars = async () => {
    try {
      const response = await fetch("https://school-agent-backend.onrender.com/api/circulars");
      if (response.ok) {
        const data = await response.json();
        setSavedCirculars(data);
        setFilteredCirculars(data);
      }
    } catch (err) {
      console.error("Errore nel caricamento dell'archivio:", err);
    }
  };

  const handleDeleteCircular = async (id: string, numero: string) => {
    const confirmed = window.confirm(
      `️ Sei sicuro di voler eliminare la Circolare n. ${numero}?\n\nQuesta azione eliminerà anche tutti gli eventi associati e non potrà essere annullata.`
    );

    if (!confirmed) return;

    setIsDeleting(id);
    try {
      const response = await fetch(`https://school-agent-backend.onrender.com/api/circulars/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('✅ Circolare eliminata con successo!');
        await fetchSavedCirculars();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante l\'eliminazione');
      }
    } catch (err: any) {
      alert(`❌ Errore: ${err.message}`);
      console.error("Errore nell'eliminazione della circolare:", err);
    } finally {
      setIsDeleting(null);
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* BARRA STICKY: Titolo + Ricerca + Upload - rimane fissa quando scorri */}
      <div className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 shadow-lg">
        {/* Riga 1: Titolo e Ricerca */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white">Gestione Circolari</h1>
          
          <div className="relative w-96">
            <input
              type="text"
              placeholder="🔍 Cerca per numero, oggetto, data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-slate-600 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Riga 2: Carica Nuova Circolare */}
        <div className="px-6 py-4 bg-slate-900">
          <h2 className="text-lg font-semibold mb-3 text-white">Carica Nuova Circolare</h2>
          <label className="block">
            <span className="sr-only">Scegli un file PDF</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isProcessing || loading}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-50"
            />
          </label>
        </div>
      </div>

      {/* Contenuto scrollabile */}
      <div className="p-6 space-y-8">
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

        {/* Mostra risultati della ricerca */}
        {searchTerm && (
          <div className="text-sm text-gray-300">
            Trovate <span className="font-semibold">{filteredCirculars.length}</span> circolari per "{searchTerm}"
          </div>
        )}

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🗄️</span> Archivio Circolari ({filteredCirculars.length})
          </h2>
          
          {filteredCirculars.length === 0 ? (
            <p className="text-gray-500 italic">
              {searchTerm 
                ? `Nessuna circolare trovata per "${searchTerm}".` 
                : "Nessuna circolare salvata nel database."}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredCirculars.map((circ) => (
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
                      <button 
                        onClick={() => handleDeleteCircular(circ.id, circ.number)} 
                        disabled={isDeleting === circ.id}
                        className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1.5 rounded-md transition-colors font-medium flex items-center gap-1"
                      >
                        {isDeleting === circ.id ? (
                          <>
                            <span className="animate-spin"></span> Elimino...
                          </>
                        ) : (
                          <>
                            <span>🗑️</span> Elimina
                          </>
                        )}
                      </button>
                      
                      <button onClick={() => handleDownloadPDF(circ)} className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md transition-colors font-medium">
                        📄 PDF
                      </button>
                      <button onClick={() => handleDownloadICS(circ)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors font-medium">
                         .ics
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
    </div>
  );
}