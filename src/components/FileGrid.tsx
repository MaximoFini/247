import { memo, useMemo } from "react";
import { FileItem } from "@/data/mockData";
import FileCard from "./FileCard";

interface FileGridProps {
  files: FileItem[];
  title?: string;
  showManyFilesIndicator?: boolean; // Muestra "Muchos archivos" en vez del contador
}

// Skeleton para carga de archivos
const FileCardSkeleton = memo(() => (
  <div className="border-2 border-primary/20 bg-background p-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="h-12 w-12 bg-primary/10 rounded" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-primary/10 rounded w-3/4" />
        <div className="h-3 bg-primary/10 rounded w-1/2" />
      </div>
    </div>
    <div className="mt-4 flex gap-2">
      <div className="h-6 bg-primary/10 rounded w-16" />
      <div className="h-6 bg-primary/10 rounded w-20" />
    </div>
  </div>
));
FileCardSkeleton.displayName = "FileCardSkeleton";

// Componente de grid vacío
const EmptyGrid = memo(() => (
  <div className="border-2 border-dashed border-muted-foreground p-12 text-center">
    <p className="font-mono text-lg text-muted-foreground">
      // NO SE ENCONTRARON ARCHIVOS
    </p>
    <p className="mt-2 font-mono text-sm text-muted-foreground">
      Probá ajustando los filtros o buscando otra cosa
    </p>
  </div>
));
EmptyGrid.displayName = "EmptyGrid";

// Componente principal memoizado
const FileGrid = memo(
  ({
    files,
    title = "ARCHIVOS",
    showManyFilesIndicator = false,
  }: FileGridProps) => {
    // Memoizar el texto del contador
    const filesCountText = useMemo(
      () =>
        showManyFilesIndicator
          ? "MUCHOS ARCHIVOS — TOP 20 POR DESCARGAS"
          : `${files.length} ARCHIVOS`,
      [showManyFilesIndicator, files.length]
    );

    if (files.length === 0) {
      return <EmptyGrid />;
    }

    return (
      <section>
        <div className="mb-6 flex items-center gap-4">
          <h2 className="font-brutal text-2xl text-primary">{title}</h2>
          <div className="h-0.5 flex-1 bg-primary/30" />
          <span className="font-mono text-sm text-muted-foreground">
            {filesCountText}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      </section>
    );
  }
);

FileGrid.displayName = "FileGrid";

export default FileGrid;
