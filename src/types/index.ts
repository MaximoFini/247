/**
 * Tipos TypeScript centralizados para evitar duplicación
 * y mejorar el mantenimiento
 */

export interface FileItem {
  id: string;
  name: string;
  subject: string;
  commission: string;
  fileType: "pdf" | "doc" | "ppt" | "xls" | "zip" | "img" | "other";
  size: string;
  uploadDate: string;
  downloads: number;
}

export interface ProfessorRating {
  claridad: number;
  dificultad: number;
  puntualidad: number;
  disponibilidad: number;
  material: number;
}

export interface Professor {
  id: string;
  nombre: string;
  materia: string;
  comision: string;
  materia_id: string;  // UUID de la materia para guardar ratings
  comision_id: string; // UUID de la comisión para guardar ratings
  cantidadValoraciones: number;
  promedioGeneral: number;
  ratings: ProfessorRating;
}

export interface SelectOption {
  value: string;
  label: string;
}

export type Subject = (typeof import("@/data/mockData").subjects)[number];
export type Commission = (typeof import("@/data/mockData").commissions)[number];
