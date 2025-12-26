import { subjects, commissions, fileTypes } from "@/data/mockData";

interface FilterBarProps {
  selectedSubject: string;
  selectedCommission: string;
  selectedFileType: string;
  onSubjectChange: (subject: string) => void;
  onCommissionChange: (commission: string) => void;
  onFileTypeChange: (fileType: string) => void;
}

const FilterBar = ({
  selectedSubject,
  selectedCommission,
  selectedFileType,
  onSubjectChange,
  onCommissionChange,
  onFileTypeChange,
}: FilterBarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 border-2 border-primary bg-card p-4">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        FILTROS:
      </span>
      
      {/* Subject Filter */}
      <div className="flex items-center gap-2">
        <label className="font-mono text-xs uppercase tracking-widest text-primary">
          MATERIA
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="border-2 border-primary bg-background px-3 py-2 font-mono text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">TODAS</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      
      {/* Commission Filter */}
      <div className="flex items-center gap-2">
        <label className="font-mono text-xs uppercase tracking-widest text-primary">
          COMISIÓN
        </label>
        <select
          value={selectedCommission}
          onChange={(e) => onCommissionChange(e.target.value)}
          className="border-2 border-primary bg-background px-3 py-2 font-mono text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">TODAS</option>
          {commissions.map((commission) => (
            <option key={commission} value={commission}>
              {commission}
            </option>
          ))}
        </select>
      </div>
      
      {/* File Type Filter */}
      <div className="flex items-center gap-2">
        <label className="font-mono text-xs uppercase tracking-widest text-primary">
          TIPO
        </label>
        <select
          value={selectedFileType}
          onChange={(e) => onFileTypeChange(e.target.value)}
          className="border-2 border-primary bg-background px-3 py-2 font-mono text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">TODOS</option>
          {fileTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Clear Filters */}
      {(selectedSubject || selectedCommission || selectedFileType) && (
        <button
          onClick={() => {
            onSubjectChange("");
            onCommissionChange("");
            onFileTypeChange("");
          }}
          className="ml-auto border border-destructive px-3 py-2 font-mono text-xs uppercase tracking-widest text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground"
        >
          LIMPIAR
        </button>
      )}
    </div>
  );
};

export default FilterBar;
