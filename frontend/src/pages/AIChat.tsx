import { useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://school-agent-backend.onrender.com";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Ciao! Sono SchoolAgent. Chiedimi pure informazioni sulle circolari, ad esempio: 'Quante ore di Consigli di Classe ho fatto a Novembre?'" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      // ✅ CORRETTO: Il backend invia "response", non "answer"
      if (data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        // Mostriamo l'errore specifico se il backend lo invia
        const errorMsg = data.error || "Mi dispiace, c'è stato un errore nell'elaborazione.";
        setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
      }
    } catch (error) {
      console.error("Errore chat:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Errore di connessione al server. Controlla che il backend sia attivo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto p-4">
      {/* Area dei messaggi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50 rounded-lg border border-slate-800 mb-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-4 rounded-lg shadow-sm ${
              msg.role === "user" 
                ? "bg-blue-600 text-white" 
                : "bg-slate-800 text-slate-200 border border-slate-700"
            }`}>
              <p className="whitespace-pre-wrap text-sm md:text-base">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 p-4 rounded-lg border border-slate-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <span className="ml-2 text-sm">SchoolAgent sta calcolando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Area di input */}
      <div className="flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi la tua domanda qui (es. 'Quante ore di CDC ho fatto?')..."
          className="flex-1 bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center min-w-[100px]"
        >
          {isLoading ? "..." : "Invia"}
        </button>
      </div>
    </div>
  );
}