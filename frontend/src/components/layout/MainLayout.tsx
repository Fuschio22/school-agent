type Props = {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
};

export default function MainLayout({
  sidebar,
  header,
  children,
}: Props) {
  return (
    <div className="flex h-screen bg-slate-950 text-white">
      {sidebar}

      <div className="flex flex-1 flex-col overflow-hidden">
        {header}

        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}