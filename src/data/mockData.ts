export interface FileItem {
  id: string;
  name: string;
  subject: string;
  commission: string;
  fileType: 'pdf' | 'doc' | 'ppt' | 'xls' | 'zip' | 'img' | 'other';
  size: string;
  uploadDate: string;
  downloads: number;
}

export const subjects = [
  "Programación I",
  "Programación II", 
  "Matemática Discreta",
  "Álgebra Lineal",
  "Análisis Matemático I",
  "Análisis Matemático II",
  "Física I",
  "Física II",
  "Bases de Datos",
  "Sistemas Operativos",
  "Redes de Computadoras",
  "Ingeniería de Software",
  "Arquitectura de Computadoras",
  "Algoritmos y Estructuras de Datos",
  "Paradigmas de Programación",
] as const;

export const commissions = [
  "1K01",
  "1K02", 
  "1K03",
  "1K04",
  "1K05",
  "2K01",
  "2K02",
  "2K03",
  "3K01",
  "3K02",
] as const;

export const fileTypes = [
  { value: 'pdf', label: 'PDF' },
  { value: 'doc', label: 'DOC' },
  { value: 'ppt', label: 'PPT' },
  { value: 'xls', label: 'XLS' },
  { value: 'zip', label: 'ZIP' },
  { value: 'img', label: 'IMG' },
] as const;

export const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "parcial_2023_resuelto.pdf",
    subject: "Programación II",
    commission: "1K02",
    fileType: "pdf",
    size: "2.4 MB",
    uploadDate: "2024-12-20",
    downloads: 342,
  },
  {
    id: "2",
    name: "tp_final_grafos.zip",
    subject: "Algoritmos y Estructuras de Datos",
    commission: "2K01",
    fileType: "zip",
    size: "15.7 MB",
    uploadDate: "2024-12-18",
    downloads: 127,
  },
  {
    id: "3",
    name: "apuntes_algebra_completo.pdf",
    subject: "Álgebra Lineal",
    commission: "1K03",
    fileType: "pdf",
    size: "8.2 MB",
    uploadDate: "2024-12-15",
    downloads: 891,
  },
  {
    id: "4",
    name: "resumen_fisica_formulas.doc",
    subject: "Física I",
    commission: "1K01",
    fileType: "doc",
    size: "1.1 MB",
    uploadDate: "2024-12-14",
    downloads: 456,
  },
  {
    id: "5",
    name: "ejercicios_analisis_integrales.pdf",
    subject: "Análisis Matemático I",
    commission: "1K04",
    fileType: "pdf",
    size: "3.8 MB",
    uploadDate: "2024-12-12",
    downloads: 673,
  },
  {
    id: "6",
    name: "modelo_er_proyecto.ppt",
    subject: "Bases de Datos",
    commission: "2K02",
    fileType: "ppt",
    size: "5.2 MB",
    uploadDate: "2024-12-10",
    downloads: 234,
  },
  {
    id: "7",
    name: "scripts_bash_ejemplos.zip",
    subject: "Sistemas Operativos",
    commission: "3K01",
    fileType: "zip",
    size: "892 KB",
    uploadDate: "2024-12-08",
    downloads: 189,
  },
  {
    id: "8",
    name: "diagramas_uml_patrones.pdf",
    subject: "Ingeniería de Software",
    commission: "3K02",
    fileType: "pdf",
    size: "4.5 MB",
    uploadDate: "2024-12-05",
    downloads: 312,
  },
  {
    id: "9",
    name: "config_cisco_packet_tracer.zip",
    subject: "Redes de Computadoras",
    commission: "2K03",
    fileType: "zip",
    size: "22.1 MB",
    uploadDate: "2024-12-03",
    downloads: 167,
  },
  {
    id: "10",
    name: "paradigmas_funcional_haskell.pdf",
    subject: "Paradigmas de Programación",
    commission: "2K01",
    fileType: "pdf",
    size: "1.9 MB",
    uploadDate: "2024-12-01",
    downloads: 98,
  },
  {
    id: "11",
    name: "assembly_x86_guia.doc",
    subject: "Arquitectura de Computadoras",
    commission: "2K02",
    fileType: "doc",
    size: "756 KB",
    uploadDate: "2024-11-28",
    downloads: 211,
  },
  {
    id: "12",
    name: "recursividad_ejercicios.pdf",
    subject: "Programación I",
    commission: "1K01",
    fileType: "pdf",
    size: "2.1 MB",
    uploadDate: "2024-11-25",
    downloads: 534,
  },
];
