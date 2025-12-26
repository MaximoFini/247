import { Download, FileText, FileArchive, FileImage, FileSpreadsheet, Presentation, File } from "lucide-react";
import { FileItem } from "@/data/mockData";

interface FileCardProps {
  file: FileItem;
}

const getFileIcon = (fileType: FileItem["fileType"]) => {
  switch (fileType) {
    case "pdf":
    case "doc":
      return FileText;
    case "zip":
      return FileArchive;
    case "img":
      return FileImage;
    case "xls":
      return FileSpreadsheet;
    case "ppt":
      return Presentation;
    default:
      return File;
  }
};

const getFileTypeColor = (fileType: FileItem["fileType"]) => {
  switch (fileType) {
    case "pdf":
      return "text-red-500 border-red-500";
    case "doc":
      return "text-blue-500 border-blue-500";
    case "zip":
      return "text-yellow-500 border-yellow-500";
    case "img":
      return "text-purple-500 border-purple-500";
    case "xls":
      return "text-green-500 border-green-500";
    case "ppt":
      return "text-orange-500 border-orange-500";
    default:
      return "text-muted-foreground border-muted-foreground";
  }
};

const FileCard = ({ file }: FileCardProps) => {
  const FileIcon = getFileIcon(file.fileType);
  const typeColor = getFileTypeColor(file.fileType);

  return (
    <div className="group relative border-2 border-primary bg-card transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_hsl(var(--primary))]">
      {/* File Type Badge */}
      <div className={`absolute -top-3 -right-3 border-2 bg-background px-2 py-1 font-mono text-xs uppercase ${typeColor}`}>
        {file.fileType.toUpperCase()}
      </div>
      
      <div className="p-5">
        {/* File Icon & Name */}
        <div className="mb-4 flex items-start gap-3">
          <FileIcon className="h-8 w-8 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-mono text-sm font-bold text-card-foreground group-hover:text-primary">
              {file.name}
            </h3>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {file.size}
            </p>
          </div>
        </div>
        
        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="file-tag">
            {file.subject}
          </span>
          <span className="file-tag">
            {file.commission}
          </span>
        </div>
        
        {/* Metadata */}
        <div className="mb-4 flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>{file.uploadDate}</span>
          <span>{file.downloads} descargas</span>
        </div>
        
        {/* Download Button */}
        <button className="flex w-full items-center justify-center gap-2 border-2 border-primary bg-primary py-3 font-mono text-sm uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary glitch-hover">
          <Download className="h-4 w-4" />
          DESCARGAR
        </button>
      </div>
    </div>
  );
};

export default FileCard;
