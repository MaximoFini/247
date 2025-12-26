import { FileItem } from "@/data/mockData";
import FileCard from "./FileCard";

interface FileGridProps {
  files: FileItem[];
  title?: string;
}

const FileGrid = ({ files, title = "ARCHIVOS RECIENTES" }: FileGridProps) => {
  if (files.length === 0) {
    return (
      <div className="border-2 border-dashed border-muted-foreground p-12 text-center">
        <p className="font-mono text-lg text-muted-foreground">
          // NO SE ENCONTRARON ARCHIVOS
        </p>
        <p className="mt-2 font-mono text-sm text-muted-foreground">
          Probá ajustando los filtros o buscando otra cosa
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-6 flex items-center gap-4">
        <h2 className="font-brutal text-2xl text-primary">{title}</h2>
        <div className="h-0.5 flex-1 bg-primary/30" />
        <span className="font-mono text-sm text-muted-foreground">
          {files.length} ARCHIVOS
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {files.map((file) => (
          <FileCard key={file.id} file={file} />
        ))}
      </div>
    </section>
  );
};

export default FileGrid;
