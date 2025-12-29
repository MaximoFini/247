import { useState } from "react";
import {
  FileText,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAdminFiles } from "@/hooks/use-admin-files";
import { toast } from "sonner";

const AdminArchivos = () => {
  const { files, loading, error, refetch, deleteFile, toggleActive } =
    useAdminFiles();
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterActivo, setFilterActivo] = useState<string>("");

  const handleDelete = async (id: string, nombre: string) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setActioningId(id);
    const success = await deleteFile(id);
    if (success) {
      toast.success("Archivo eliminado correctamente");
    } else {
      toast.error("Error al eliminar el archivo");
    }
    setActioningId(null);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setActioningId(id);
    const success = await toggleActive(id, !currentActive);
    if (success) {
      toast.success(currentActive ? "Archivo desactivado" : "Archivo activado");
    } else {
      toast.error("Error al actualizar el archivo");
    }
    setActioningId(null);
  };

  // Filtrado de archivos
  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.uploader_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.uploader_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.materia_nombre?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = filterTipo === "" || file.tipo === filterTipo;
    const matchesActivo =
      filterActivo === "" ||
      (filterActivo === "activo" && file.activo) ||
      (filterActivo === "inactivo" && !file.activo);

    return matchesSearch && matchesTipo && matchesActivo;
  });

  const tiposUnicos = [...new Set(files.map((f) => f.tipo))];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden py-12 border-b-2 border-primary">
          <div className="container mx-auto px-4">
            <h1 className="font-brutal text-5xl text-primary flex items-center gap-4">
              <FileText className="h-12 w-12" />
              GESTIÓN DE ARCHIVOS
            </h1>
            <p className="font-mono text-sm text-muted-foreground mt-2">
              {files.length} archivo{files.length !== 1 ? "s" : ""} en total •{" "}
              {filteredFiles.length} mostrado
              {filteredFiles.length !== 1 ? "s" : ""}
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {error && (
            <div className="border-2 border-destructive bg-destructive/10 p-4 mb-6">
              <p className="font-mono text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Filtros */}
          <div className="border-2 border-primary bg-card p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, usuario o materia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border-2 border-primary font-mono text-sm focus:outline-none focus:border-primary/80"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="bg-background border-2 border-primary font-mono text-sm px-3 py-2 focus:outline-none"
                >
                  <option value="">Todos los tipos</option>
                  {tiposUnicos.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo.toUpperCase()}
                    </option>
                  ))}
                </select>

                <select
                  value={filterActivo}
                  onChange={(e) => setFilterActivo(e.target.value)}
                  className="bg-background border-2 border-primary font-mono text-sm px-3 py-2 focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de archivos */}
          {filteredFiles.length === 0 ? (
            <div className="border-2 border-primary bg-primary/5 p-12 text-center">
              <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="font-mono text-lg text-primary">
                No se encontraron archivos
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-primary bg-primary/10">
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Nombre
                    </th>
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Tipo
                    </th>
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Materia
                    </th>
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Subido por
                    </th>
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Tamaño
                    </th>
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Descargas
                    </th>
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Estado
                    </th>
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      className={`border-b border-primary/20 hover:bg-primary/5 transition-colors ${
                        file.reportado ? "bg-destructive/10" : ""
                      } ${!file.activo ? "opacity-60" : ""}`}
                    >
                      <td className="p-3">
                        <div className="max-w-[200px]">
                          <p className="font-mono text-sm text-foreground truncate">
                            {file.nombre}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {file.extension?.toUpperCase()}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-xs uppercase text-primary bg-primary/10 px-2 py-1">
                          {file.tipo}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-mono text-xs text-muted-foreground">
                          {file.materia_nombre || "N/A"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {file.comision_codigo || ""}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="font-mono text-xs text-foreground">
                          {file.uploader_nombre || "N/A"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground truncate max-w-[150px]">
                          {file.uploader_email || ""}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="font-mono text-xs text-muted-foreground">
                          {Number(file.tamanio_mb).toFixed(2)} MB
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="font-mono text-sm text-primary">
                          {file.descargas}
                        </p>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`font-mono text-xs uppercase px-2 py-1 inline-block w-fit ${
                              file.activo
                                ? "text-green-500 bg-green-500/10"
                                : "text-red-500 bg-red-500/10"
                            }`}
                          >
                            {file.activo ? "Activo" : "Inactivo"}
                          </span>
                          {file.reportado && (
                            <span className="font-mono text-xs uppercase text-destructive bg-destructive/10 px-2 py-1 inline-block w-fit">
                              Reportado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {/* Ver en Drive */}
                          <a
                            href={file.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border border-primary text-primary hover:bg-primary hover:text-background transition-colors"
                            title="Ver en Drive"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>

                          {/* Toggle activo */}
                          <button
                            onClick={() =>
                              handleToggleActive(file.id, file.activo)
                            }
                            disabled={actioningId === file.id}
                            className={`p-2 border transition-colors ${
                              file.activo
                                ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-background"
                                : "border-green-500 text-green-500 hover:bg-green-500 hover:text-background"
                            }`}
                            title={file.activo ? "Desactivar" : "Activar"}
                          >
                            {actioningId === file.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : file.activo ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => handleDelete(file.id, file.nombre)}
                            disabled={actioningId === file.id}
                            className="p-2 border border-destructive text-destructive hover:bg-destructive hover:text-background transition-colors"
                            title="Eliminar"
                          >
                            {actioningId === file.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminArchivos;
