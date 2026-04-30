import { fileTypes } from "@/data/mockData";
import { useFilterOptions } from "@/hooks/use-filter-options";

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
  const { data: filterOptions } = useFilterOptions();
  const subjects = filterOptions?.subjects ?? [];
  const commissions = filterOptions?.commissions ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 border-2 border-primary bg-card p-2 sm:p-3 lg:p-4">
      <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-muted-foreground w-full sm:w-auto">
        FILTROS:
      </span>
      
      {/* Subject Filter */}
      <div className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial min-w-[140px]">
        <label className="font-mono text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-primary whitespace-nowrap">
          MATERIA
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="border-2 border-primary bg-background px-2 sm:px-3 py-1 sm:py-2 font-mono text-[10px] sm:text-xs lg:text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary flex-1"
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
      <div className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial min-w-[140px]">
        <label className="font-mono text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-primary whitespace-nowrap">
          COMISIÓN
        </label>
        <select
          value={selectedCommission}
          onChange={(e) => onCommissionChange(e.target.value)}
          className="border-2 border-primary bg-background px-2 sm:px-3 py-1 sm:py-2 font-mono text-[10px] sm:text-xs lg:text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary flex-1"
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
      <div className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial min-w-[140px]">
        <label className="font-mono text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-primary whitespace-nowrap">
          TIPO
        </label>
        <select
          value={selectedFileType}
          onChange={(e) => onFileTypeChange(e.target.value)}
          className="border-2 border-primary bg-background px-2 sm:px-3 py-1 sm:py-2 font-mono text-[10px] sm:text-xs lg:text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary flex-1"
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
          className="w-full sm:w-auto sm:ml-auto border border-destructive px-2 sm:px-3 py-1 sm:py-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground"
        >
          LIMPIAR
        </button>
      )}
    </div>
  );
};

export default FilterBar;
