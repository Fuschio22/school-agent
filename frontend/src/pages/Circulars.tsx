import UploadCard from "../components/circular/UploadCard";
import { useCircular } from "../hooks/useCircular";

export default function Circulars() {
  const {
    processPDF,
    loading,
    info,
    text,
    events,
  } = useCircular();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Circolari
          </h1>

          <p className="mt-2 text-slate-400">
            Analizza automaticamente le circolari scolastiche.
          </p>
        </div>

        <UploadCard onUpload={processPDF} />
      </div>

      {loading && (
        <div className="rounded-2xl bg-slate-900 p-8">
          Lettura PDF...
        </div>
      )}

      {!loading && text && (
        <>
          <div className="rounded-2xl bg-slate-900 p-8">
            <h2 className="mb-6 text-2xl font-bold">
              🤖 Analisi AI
            </h2>

            <div className="space-y-3">
              <p>
                <strong>Numero:</strong> {info.number}
              </p>

              <p>
                <strong>Data:</strong> {info.date}
              </p>

              <p>
                <strong>Oggetto:</strong> {info.subject}
              </p>

              <p>
                <strong>Destinatari:</strong>{" "}
                {info.recipients.join(", ")}
              </p>

              <p>
                <strong>Scadenze:</strong>{" "}
                {info.deadlines.join(", ")}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-8">
            <h2 className="mb-6 text-2xl font-bold">
              📅 Eventi trovati ({events.length})
            </h2>

            {events.length === 0 ? (
              <p>Nessun evento trovato.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-2 text-left">Data</th>
                    <th className="py-2 text-left">Ora</th>
                    <th className="py-2 text-left">Evento</th>
                  </tr>
                </thead>

                <tbody>
                  {events.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-slate-800"
                    >
                      <td className="py-2">
                        {event.date}
                      </td>

                      <td className="py-2">
                        {event.startTime} - {event.endTime}
                      </td>

                      <td className="py-2">
                        {event.title}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-2xl bg-slate-900 p-8">
            <h2 className="mb-6 text-2xl font-bold">
              📄 Testo della circolare
            </h2>

            <textarea
              readOnly
              value={text}
              className="h-[500px] w-full rounded-xl bg-slate-950 p-4"
            />
          </div>
        </>
      )}
    </div>
  );
}