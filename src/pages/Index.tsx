import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import TerminalSearch from "@/components/TerminalSearch";
import FilterBar from "@/components/FilterBar";
import FileGrid from "@/components/FileGrid";
import { usePublicFiles } from "@/hooks/use-public-files";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCommission, setSelectedCommission] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("");

  // Usar React Query para caché y mejor performance
  const { data: files = [], isLoading: loading } = usePublicFiles();

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch =
        searchQuery === "" ||
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject =
        selectedSubject === "" || file.subject === selectedSubject;
      const matchesCommission =
        selectedCommission === "" || file.commission === selectedCommission;
      const matchesFileType =
        selectedFileType === "" || file.fileType === selectedFileType;
      return (
        matchesSearch && matchesSubject && matchesCommission && matchesFileType
      );
    });
  }, [
    files,
    searchQuery,
    selectedSubject,
    selectedCommission,
    selectedFileType,
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <HeroSection />
        <div className="container mx-auto space-y-8 px-4 pb-20">
          <TerminalSearch onSearch={setSearchQuery} />
          <FilterBar
            selectedSubject={selectedSubject}
            selectedCommission={selectedCommission}
            selectedFileType={selectedFileType}
            onSubjectChange={setSelectedSubject}
            onCommissionChange={setSelectedCommission}
            onFileTypeChange={setSelectedFileType}
          />
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="font-mono text-primary animate-pulse">
                CARGANDO ARCHIVOS...
              </div>
            </div>
          ) : (
            <FileGrid files={filteredFiles} />
          )}
        </div>

        {/* Footer */}
        <footer className="border-t-2 border-primary py-8">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center gap-6 mb-4">
              <Link
                to="/privacy"
                className="font-mono text-xs text-muted-foreground hover:text-primary"
              >
                Política de Privacidad
              </Link>
              <Link
                to="/terms"
                className="font-mono text-xs text-muted-foreground hover:text-primary"
              >
                Términos de Servicio
              </Link>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              © {new Date().getFullYear()} 247 — Plataforma colaborativa para
              estudiantes de Ingeniería en Sistemas UTN FRC.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
