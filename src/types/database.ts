export type TipoArchivo =
  | "apunte"
  | "resumen"
  | "parcial"
  | "final"
  | "tp"
  | "guia";

export type ExtensionArchivo =
  | "pdf"
  | "doc"
  | "docx"
  | "ppt"
  | "pptx"
  | "zip"
  | "rar"
  | "xls"
  | "xlsx"
  | "txt";

export type DonacionStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  google_id: string | null;
  email: string;
  nombre: string;
  puntos_archivos: number;
  puntos_donaciones: number;
  is_admin: boolean;
  created_at: string;
}

export interface Materia {
  id: string;
  nombre: string;
  created_at: string;
}

export interface Comision {
  id: string;
  codigo: string;
  created_at: string;
}

export interface Profesor {
  id: string;
  nombre: string;
  apellido?: string;
  avg_claridad?: number;
  avg_dificultad?: number;
  avg_puntualidad?: number;
  avg_disponibilidad?: number;
  avg_material?: number;
  rating_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface Archivo {
  id: string;
  user_id: string;
  materia_id: string;
  comision_id: string;
  tipo: TipoArchivo;
  nombre: string;
  drive_file_id: string;
  drive_link: string;
  tamanio_mb: number;
  extension: ExtensionArchivo;
  descargas: number;
  reportado: boolean;
  activo: boolean;
  motivo_reporte?: string | null;
  reportado_por?: string | null;
  reportado_at?: string | null;
  created_at: string;
}

export type ReporteEstado = "pendiente" | "aprobado" | "rechazado";

export interface Reporte {
  id: string;
  archivo_id: string;
  user_id: string;
  motivo: string;
  estado: ReporteEstado;
  resuelto_por?: string | null;
  resuelto_at?: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  user_id: string;
  profesor_id: string;
  materia_id: string;
  claridad: number;
  dificultad: number;
  puntualidad: number;
  disponibilidad: number;
  material: number;
  created_at: string;
}

export const PUNTOS_POR_TIPO: Record<TipoArchivo, number> = {
  apunte: 90,
  resumen: 90,
  parcial: 60,
  final: 80,
  tp: 60,
  guia: 40,
};
