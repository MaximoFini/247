import { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import TerminalSearch from "@/components/TerminalSearch";
import FilterBar from "@/components/FilterBar";
import FileGrid from "@/components/FileGrid";
import { mockFiles } from "@/data/mockData";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCommission, setSelectedCommission] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("");

  const filteredFiles = useMemo(() => {
    return mockFiles.filter((file) => {
      const matchesSearch = searchQuery === "" || 
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === "" || file.subject === selectedSubject;
      const matchesCommission = selectedCommission === "" || file.commission === selectedCommission;
      const matchesFileType = selectedFileType === "" || file.fileType === selectedFileType;
      return matchesSearch && matchesSubject && matchesCommission && matchesFileType;
    });
  }, [searchQuery, selectedSubject, selectedCommission, selectedFileType]);

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
          <FileGrid files={filteredFiles} />
        </div>
      </main>
    </div>
  );
};

export default Index;
