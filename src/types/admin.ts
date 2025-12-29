export interface AdminStatsGeneral {
  total_usuarios:  number;
  total_archivos_activos: number;
  total_archivos_reportados: number;
  total_profesores:  number;
  total_materias: number;
  total_comisiones: number;
  total_ratings: number;
  espacio_total_mb: number;
  total_descargas: number;
}

export interface AdminStatsUsuarios {
  total_usuarios: number;
  total_admins: number;
  promedio_puntos_archivos:  number;
  promedio_puntos_donaciones: number; // Donación media (total_donaciones / usuarios_que_donaron)
  promedio_archivos_por_usuario: number; // total_archivos / total_usuarios
  usuarios_que_donaron: number; // Cantidad de usuarios que donaron
  porcentaje_usuarios_donaron: number; // (usuarios_que_donaron / total_usuarios) * 100
}

export interface AdminTopUploader {
  id: string;
  nombre: string;
  email: string;
  puntos_archivos: number;
  total_archivos: number;
  total_mb_subidos: number;
  total_descargas: number; // Agregado
}

export interface AdminArchivoReportado {
  id: string;
  nombre: string;
  tipo: string;
  extension: string; // Agregado
  drive_link: string;
  tamanio_mb: string;
  descargas: number; // Agregado
  activo: boolean;
  reportado: boolean;
  motivo_reporte: string | null;
  reportado_at: string | null;
  created_at: string;
  materia_nombre: string | null;
  comision_codigo: string | null;
  uploader_nombre: string | null;
  uploader_email:  string | null;
  reportador_nombre: string | null;
  reportador_email:  string | null;
  total_reportes: number;
}

export interface AdminArchivo {
  id: string;
  nombre: string;
  tipo: string;
  extension: string;
  drive_link: string;
  tamanio_mb: string;
  descargas: number;
  activo:  boolean;
  reportado: boolean;
  created_at: string;
  materia_nombre: string | null;
  comision_codigo: string | null;
  uploader_nombre: string | null;
  uploader_email: string | null;
}

export interface ProfesorMateriaComision {
  id:  string;
  profesor_id:  string;
  materia_id: string;
  comision_id: string;
  created_at: string;
}

export interface Profesor {
  id: string;
  nombre: string;
  apellido?: string | null;
  avg_claridad?: number | null;
  avg_dificultad?: number | null;
  avg_puntualidad?: number | null;
  avg_disponibilidad?: number | null;
  avg_material?: number | null;
  rating_count?: number | null;
  created_at: string;
  updated_at?: string | null;
}