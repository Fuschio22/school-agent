import { useRef } from "react";

type UploadCardProps = {
  onUpload: (file: File) => void;
};

export default function UploadCard({
  onUpload,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file) {
            onUpload(file);
          }
        }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500"
      >
        + Carica circolare
      </button>
    </>
  );
}