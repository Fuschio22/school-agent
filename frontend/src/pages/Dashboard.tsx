export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-400">
          Benvenuto in SchoolAgent
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Circolari"
          value="0"
          color="bg-blue-500"
        />

        <Card
          title="Scadenze"
          value="0"
          color="bg-red-500"
        />

        <Card
          title="Lezioni"
          value="0"
          color="bg-green-500"
        />

        <Card
          title="Verifiche"
          value="0"
          color="bg-yellow-500"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl bg-slate-900 p-6 xl:col-span-2">
          <h2 className="mb-4 text-2xl font-semibold">
            Ultima circolare
          </h2>

          <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
            Nessuna circolare caricata
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 p-6">
          <h2 className="mb-4 text-2xl font-semibold">
            Attività
          </h2>

          <ul className="space-y-4 text-slate-400">
            <li>• Nessuna attività</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

type CardProps = {
  title: string;
  value: string;
  color: string;
};

function Card({
  title,
  value,
  color,
}: CardProps) {
  return (
    <div className="rounded-2xl bg-slate-900 p-6">
      <div className={`mb-4 h-2 rounded ${color}`} />

      <p className="text-slate-400">
        {title}
      </p>

      <h2 className="mt-2 text-4xl font-bold">
        {value}
      </h2>
    </div>
  );
}