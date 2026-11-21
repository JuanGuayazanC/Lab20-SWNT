export type ProjectStatus = "Pendiente" | "En progreso" | "Completado";

export interface InstallerRow {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  nombre: string;
  cliente: string;
  direccion: string;
  potencia_kw: number;
  estado: ProjectStatus;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  instalador_id: string | null;
  created_at: string;
}

export interface MaterialRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  stock: number;
  costo_unitario: number;
  created_at: string;
}

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      instaladores: Table<
        InstallerRow,
        Omit<InstallerRow, "id" | "activo" | "created_at"> & Partial<Pick<InstallerRow, "id" | "activo" | "created_at">>
      >;
      proyectos: Table<
        ProjectRow,
        Omit<ProjectRow, "id" | "created_at"> & Partial<Pick<ProjectRow, "id" | "created_at">>
      >;
      materiales: Table<
        MaterialRow,
        Omit<MaterialRow, "id" | "created_at"> & Partial<Pick<MaterialRow, "id" | "created_at">>
      >;
      proyecto_materiales: Table<
        { proyecto_id: string; material_id: string; cantidad: number },
        { proyecto_id: string; material_id: string; cantidad: number }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
