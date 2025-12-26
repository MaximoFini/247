import { useState } from "react";
import { Upload, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import { subjects, commissions } from "@/data/mockData";

const SubirPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [commission, setCommission] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-20">
        <h1 className="mb-2 font-brutal text-5xl text-primary">SUBIR ARCHIVO</h1>
        <p className="mb-12 font-mono text-muted-foreground">Compartí material con la comunidad</p>

        <div className="mx-auto max-w-2xl space-y-6">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center border-4 border-dashed p-8 transition-all ${
              dragActive ? "border-primary bg-primary/10 toxic-glow-intense" : "border-muted-foreground hover:border-primary"
            }`}
          >
            {selectedFile ? (
              <div className="text-center">
                <p className="font-mono text-lg text-primary">{selectedFile.name}</p>
                <p className="font-mono text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <button onClick={() => setSelectedFile(null)} className="mt-4 flex items-center gap-2 text-destructive">
                  <X className="h-4 w-4" /> Eliminar
                </button>
              </div>
            ) : (
              <>
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="font-mono text-muted-foreground">Arrastrá tu archivo acá o hacé click</p>
                <input type="file" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
              </>
            )}
          </div>

          {/* Subject & Commission */}
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border-2 border-primary bg-background px-4 py-3 font-mono text-primary">
            <option value="">SELECCIONAR MATERIA</option>
            {subjects.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
          <select value={commission} onChange={(e) => setCommission(e.target.value)} className="w-full border-2 border-primary bg-background px-4 py-3 font-mono text-primary">
            <option value="">SELECCIONAR COMISIÓN</option>
            {commissions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <button disabled={!selectedFile || !subject || !commission} className="w-full border-2 border-primary bg-primary py-4 font-mono uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary disabled:opacity-50 glitch-hover">
            SUBIR ARCHIVO
          </button>
        </div>
      </main>
    </div>
  );
};

export default SubirPage;
