import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Activity, Boxes, CalendarDays, CheckCircle2, CircleHelp, ClipboardList,
  Leaf, LogOut, MapPin, Menu, Plus, RefreshCw, Search, Sun, Users, X
} from "lucide-react";
import { z } from "zod";
import { supabase } from "./lib/supabase";
import type { InstallerRow, MaterialRow, ProjectRow, ProjectStatus } from "./types/database";

const projectSchema = z.object({
  nombre: z.string().trim().min(3, "Escribe al menos 3 caracteres."),
  cliente: z.string().trim().min(2, "El cliente es obligatorio."),
  direccion: z.string().trim().min(5, "Indica una dirección válida."),
  potencia_kw: z.coerce.number().positive("La potencia debe ser mayor que cero."),
  estado: z.enum(["Pendiente", "En progreso", "Completado"]),
  instalador_id: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional()
});

const materialSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio."),
  unidad: z.string().trim().min(1, "Indica la unidad."),
  stock: z.coerce.number().int().min(0),
  costo_unitario: z.coerce.number().min(0)
});

type View = "dashboard" | "projects" | "installers" | "materials";
const statusStyles: Record<ProjectStatus, string> = {
  Pendiente: "bg-amber-50 text-amber-700 ring-amber-200",
  "En progreso": "bg-blue-50 text-blue-700 ring-blue-200",
  Completado: "bg-emerald-50 text-emerald-700 ring-emerald-200"
};

function SetupNotice() {
  return <div className="grid min-h-screen place-items-center p-6"><div className="max-w-xl rounded-3xl bg-white p-8 shadow-soft">
    <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-forest-900"><Leaf /></div>
    <h1 className="text-2xl font-bold text-forest-950">Configura EcoFlow</h1>
    <p className="mt-2 text-sm leading-6 text-slate-600">Agrega las credenciales de tu proyecto Supabase en un archivo <code>.env</code>, tomando como referencia <code>.env.example</code>.</p>
    <pre className="mt-5 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-200">VITE_SUPABASE_URL=...{"\n"}VITE_SUPABASE_ANON_KEY=...</pre>
  </div></div>;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  }

  return <div className="grid min-h-screen lg:grid-cols-2">
    <div className="relative hidden overflow-hidden bg-forest-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-leaf-500"><Sun /></div><span className="text-xl font-bold">EcoFlow</span></div>
      <div className="relative z-10 max-w-lg"><p className="text-sm font-semibold uppercase tracking-[.25em] text-leaf-400">Energía que transforma</p><h1 className="mt-5 text-5xl font-semibold leading-tight">Gestiona cada proyecto. Impulsa un futuro más limpio.</h1><p className="mt-5 max-w-md leading-7 text-emerald-100/70">Una vista clara de tus instalaciones solares, equipos y materiales.</p></div>
      <div className="text-xs text-emerald-100/50">EcoFlow · Gestión de proyectos renovables</div>
      <div className="absolute -bottom-32 -right-28 h-96 w-96 rounded-full border-[50px] border-emerald-100/5" />
    </div>
    <div className="grid place-items-center p-6"><form onSubmit={submit} className="w-full max-w-sm">
      <div className="mb-8 flex items-center gap-3 lg:hidden"><div className="grid h-10 w-10 place-items-center rounded-xl bg-forest-900 text-white"><Sun /></div><b className="text-xl text-forest-950">EcoFlow</b></div>
      <p className="text-sm font-semibold text-leaf-500">BIENVENIDO</p><h2 className="mt-2 text-3xl font-bold text-forest-950">Inicia sesión</h2><p className="mt-2 text-sm text-slate-500">Accede a tu espacio de trabajo.</p>
      <label className="mt-7 block text-sm font-medium">Correo electrónico<input className="field mt-2" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nombre@empresa.com" /></label>
      <label className="mt-4 block text-sm font-medium">Contraseña<input className="field mt-2" type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Tu contraseña" /></label>
      {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button disabled={busy} className="mt-6 w-full rounded-xl bg-forest-900 px-4 py-3 font-semibold text-white transition hover:bg-forest-800 disabled:opacity-60">{busy ? "Ingresando…" : "Ingresar"}</button>
      <p className="mt-5 text-center text-xs text-slate-400">El acceso es administrado por Supabase Auth.</p>
    </form></div>
  </div>;
}

function StatCard({label,value,detail,icon:Icon,tone}:{label:string;value:number;detail:string;icon:typeof Sun;tone:string}) {
  return <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={19}/></span></div><div className="mt-4 text-3xl font-bold tracking-tight text-forest-950">{value}</div><p className="mt-1 text-xs text-slate-400">{detail}</p></div>;
}

function StatusBadge({status}:{status:ProjectStatus}) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}>{status}</span>;
}

export default function App() {
  const [session, setSession] = useState<Session|null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [installers, setInstallers] = useState<InstallerRow[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const isAdmin = session?.user.app_metadata?.role === "admin";

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({data}) => { setSession(data.session); setAuthReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);

  const loadWorkspace = useCallback(async () => {
    if (!supabase || !session) return;
    setLoading(true); setError("");
    try {
      let installerId: string | null = null;
      if (!isAdmin) {
        const profile = await supabase.from("instaladores").select("id").eq("user_id", session.user.id).maybeSingle();
        if (profile.error) throw profile.error;
        installerId = profile.data?.id ?? null;
        if (!installerId) {
          setProjects([]); setInstallers([]); setMaterials([]);
          setError("Tu cuenta todavía no tiene un perfil de instalador. Solicita al administrador que lo vincule.");
          return;
        }
      }
      let projectQuery = supabase.from("proyectos").select("*").order("created_at", {ascending:false});
      if (!isAdmin && installerId) projectQuery = projectQuery.eq("instalador_id", installerId);
      const projectResult = await projectQuery;
      if (projectResult.error) throw projectResult.error;
      setProjects(projectResult.data ?? []);

      const materialResult = await supabase.from("materiales").select("*").order("nombre");
      if (materialResult.error) throw materialResult.error;
      setMaterials(materialResult.data ?? []);

      if (isAdmin) {
        const installerResult = await supabase.from("instaladores").select("*").order("nombre");
        if (installerResult.error) throw installerResult.error;
        setInstallers(installerResult.data ?? []);
      } else setInstallers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar la información.");
    } finally { setLoading(false); }
  }, [session, isAdmin]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  const filteredProjects = useMemo(() => projects.filter(p =>
    [p.nombre,p.cliente,p.direccion].join(" ").toLowerCase().includes(search.toLowerCase())
  ), [projects,search]);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !isAdmin) return;
    const form = new FormData(event.currentTarget);
    const parsed = projectSchema.safeParse(Object.fromEntries(form.entries()));
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Revisa el formulario."); return; }
    setBusy(true); setError(""); setNotice("");
    const value = parsed.data;
    const { error } = await supabase.from("proyectos").insert({
      nombre:value.nombre, cliente:value.cliente, direccion:value.direccion,
      potencia_kw:value.potencia_kw, estado:value.estado,
      instalador_id:value.instalador_id || null,
      fecha_inicio:value.fecha_inicio || null, fecha_fin:value.fecha_fin || null
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setShowProjectForm(false); setNotice("Proyecto creado correctamente."); await loadWorkspace();
  }

  async function updateStatus(id:string,status:ProjectStatus) {
    if (!supabase || !isAdmin) return;
    const {error} = await supabase.from("proyectos").update({estado:status}).eq("id",id);
    if (error) setError(error.message); else { setNotice("Estado actualizado."); await loadWorkspace(); }
  }

  async function createMaterial(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !isAdmin) return;
    const parsed = materialSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget).entries()));
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Revisa el formulario."); return; }
    setBusy(true); setError("");
    const {error} = await supabase.from("materiales").insert({...parsed.data, descripcion:null});
    setBusy(false);
    if (error) { setError(error.message); return; }
    setShowMaterialForm(false); setNotice("Material registrado."); await loadWorkspace();
  }

  if (!supabase) return <SetupNotice />;
  if (!authReady) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Cargando sesión…</div>;
  if (!session) return <LoginScreen />;

  const nav = [
    {id:"dashboard" as const,label:"Resumen",icon:Activity},
    {id:"projects" as const,label:"Proyectos",icon:ClipboardList},
    ...(isAdmin ? [{id:"installers" as const,label:"Instaladores",icon:Users},{id:"materials" as const,label:"Materiales",icon:Boxes}] : [])
  ];
  const counts = {
    pending:projects.filter(p=>p.estado==="Pendiente").length,
    progress:projects.filter(p=>p.estado==="En progreso").length,
    done:projects.filter(p=>p.estado==="Completado").length
  };

  return <div className="min-h-screen lg:flex">
    <aside className="flex w-full flex-col bg-forest-950 text-white lg:fixed lg:inset-y-0 lg:w-64">
      <div className="flex items-center justify-between px-6 py-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-leaf-500"><Sun size={21}/></div><div><b className="text-lg">EcoFlow</b><p className="text-[10px] uppercase tracking-[.2em] text-emerald-100/50">Solar workspace</p></div></div><span className="text-emerald-100/40 lg:hidden"><Menu/></span></div>
      <div className="px-4"><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-100/40">Workspace</p>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">{nav.map(item=><button key={item.id} onClick={()=>setView(item.id)} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${view===item.id?"bg-white/12 text-white":"text-emerald-100/65 hover:bg-white/5 hover:text-white"}`}><item.icon size={18}/>{item.label}</button>)}</nav>
      </div>
      <div className="mt-auto hidden border-t border-white/10 p-5 lg:block"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100/10 text-sm font-bold">{session.user.email?.slice(0,1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{session.user.email}</p><p className="text-[10px] text-emerald-100/50">{isAdmin?"Administrador":"Instalador"}</p></div></div><button onClick={()=>supabase.auth.signOut()} className="mt-4 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-emerald-100/60 hover:bg-white/5 hover:text-white"><LogOut size={15}/> Cerrar sesión</button></div>
      <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 lg:hidden"><span className="text-xs text-emerald-100/60">{session.user.email} · {isAdmin?"Administrador":"Instalador"}</span><button onClick={()=>supabase.auth.signOut()} aria-label="Cerrar sesión"><LogOut size={17}/></button></div>
    </aside>

    <main className="min-w-0 flex-1 p-5 sm:p-8 lg:ml-64 lg:p-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-leaf-500">EcoFlow / {nav.find(n=>n.id===view)?.label}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-forest-950">{view==="dashboard"?"Buenos días":nav.find(n=>n.id===view)?.label}</h1><p className="mt-1 text-sm text-slate-500">{view==="dashboard"?"Aquí tienes el estado general de las instalaciones.":"Administra y consulta la información del espacio de trabajo."}</p></div><button onClick={()=>void loadWorkspace()} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-leaf-500"><RefreshCw size={16}/> Actualizar</button></header>

      {error && <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700"><span>{error}</span><button onClick={()=>setError("")}><X size={16}/></button></div>}
      {notice && <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800"><span>{notice}</span><button onClick={()=>setNotice("")}><X size={16}/></button></div>}
      {loading ? <div className="rounded-2xl bg-white p-12 text-center text-sm text-slate-500">Cargando información…</div> : <>
        {view==="dashboard" && <div className="space-y-7">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Proyectos totales" value={projects.length} detail="Proyectos visibles para tu cuenta" icon={ClipboardList} tone="bg-emerald-50 text-forest-900"/>
            <StatCard label="Pendientes" value={counts.pending} detail="A la espera de iniciar" icon={CalendarDays} tone="bg-amber-50 text-amber-700"/>
            <StatCard label="En progreso" value={counts.progress} detail="Instalaciones activas" icon={Activity} tone="bg-blue-50 text-blue-700"/>
            <StatCard label="Completados" value={counts.done} detail="Instalaciones finalizadas" icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700"/>
          </div>
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-forest-950">Proyectos recientes</h2><p className="mt-1 text-xs text-slate-400">Últimas instalaciones registradas</p></div><button onClick={()=>setView("projects")} className="text-xs font-semibold text-leaf-500 hover:text-forest-900">Ver todos →</button></div><ProjectTable projects={projects.slice(0,5)} isAdmin={isAdmin} onStatus={updateStatus}/></section>
        </div>}

        {view==="projects" && <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><div><h2 className="font-bold text-forest-950">Todos los proyectos</h2><p className="mt-1 text-xs text-slate-400">{projects.length} registros disponibles</p></div><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input className="field !w-48 !py-2 !pl-9" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar…"/></div>{isAdmin&&<button onClick={()=>setShowProjectForm(!showProjectForm)} className="flex items-center gap-2 rounded-xl bg-forest-900 px-3 py-2 text-sm font-semibold text-white"><Plus size={16}/> Nuevo proyecto</button>}</div></div>
          {showProjectForm&&<form onSubmit={createProject} className="grid gap-3 border-b border-slate-100 bg-sand p-5 sm:grid-cols-2 xl:grid-cols-3">
            <input name="nombre" className="field" placeholder="Nombre del proyecto" required/><input name="cliente" className="field" placeholder="Cliente" required/><input name="direccion" className="field" placeholder="Dirección" required/><input name="potencia_kw" type="number" min="0.01" step="0.01" className="field" placeholder="Potencia (kW)" required/>
            <select name="estado" className="field" defaultValue="Pendiente"><option>Pendiente</option><option>En progreso</option><option>Completado</option></select>
            <select name="instalador_id" className="field" defaultValue=""><option value="">Sin asignar</option>{installers.filter(i=>i.activo).map(i=><option key={i.id} value={i.id}>{i.nombre}</option>)}</select>
            <label className="text-xs text-slate-500">Fecha de inicio<input name="fecha_inicio" type="date" className="field mt-1"/></label><label className="text-xs text-slate-500">Fecha de finalización<input name="fecha_fin" type="date" className="field mt-1"/></label>
            <div className="flex items-end gap-2"><button disabled={busy} className="rounded-xl bg-forest-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy?"Guardando…":"Guardar proyecto"}</button><button type="button" onClick={()=>setShowProjectForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">Cancelar</button></div>
          </form>}
          <ProjectTable projects={filteredProjects} isAdmin={isAdmin} onStatus={updateStatus}/>
        </section>}

        {view==="installers" && <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="font-bold text-forest-950">Instaladores registrados</h2><p className="mt-1 text-xs text-slate-400">Perfiles vinculados a usuarios de Supabase Auth</p></div><div className="divide-y divide-slate-100">{installers.map(i=><div key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="font-semibold text-forest-950">{i.nombre}</p><p className="text-xs text-slate-500">{i.email}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${i.activo?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{i.activo?"Activo":"Inactivo"}</span></div>)}{installers.length===0&&<EmptyState text="Todavía no hay instaladores registrados."/>}</div><p className="border-t border-slate-100 bg-sand p-4 text-xs leading-5 text-slate-500">Para registrar un instalador, crea primero su usuario en Supabase Auth y después vincúlalo con un registro en la tabla <code>instaladores</code>. Consulta README.md.</p></section>}

        {view==="materials" && <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-bold text-forest-950">Inventario de materiales</h2><p className="mt-1 text-xs text-slate-400">{materials.length} materiales registrados</p></div>{isAdmin&&<button onClick={()=>setShowMaterialForm(!showMaterialForm)} className="flex items-center gap-2 rounded-xl bg-forest-900 px-3 py-2 text-sm font-semibold text-white"><Plus size={16}/> Añadir</button>}</div>
          {showMaterialForm&&<form onSubmit={createMaterial} className="grid gap-3 border-b border-slate-100 bg-sand p-5 sm:grid-cols-2 xl:grid-cols-4"><input name="nombre" className="field" placeholder="Nombre" required/><input name="unidad" className="field" placeholder="Unidad (unidad, m, kg)" required/><input name="stock" type="number" min="0" className="field" placeholder="Existencias" required/><input name="costo_unitario" type="number" min="0" step="0.01" className="field" placeholder="Costo unitario" required/><div className="flex gap-2"><button disabled={busy} className="rounded-xl bg-forest-900 px-4 py-2 text-sm font-semibold text-white">{busy?"Guardando…":"Guardar"}</button><button type="button" onClick={()=>setShowMaterialForm(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Cancelar</button></div></form>}
          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">{materials.map(m=><div key={m.id} className="rounded-xl border border-slate-100 p-4"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-forest-900"><Boxes size={18}/></span><span className="text-xs text-slate-400">Inventario</span></div><h3 className="mt-3 font-semibold text-forest-950">{m.nombre}</h3><div className="mt-2 flex justify-between text-sm"><span className="text-slate-500">Existencias</span><b>{m.stock} {m.unidad}</b></div><div className="mt-1 flex justify-between text-sm"><span className="text-slate-500">Costo unitario</span><b>{Number(m.costo_unitario).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</b></div></div>)}{materials.length===0&&<EmptyState text="No hay materiales registrados."/>}</div>
        </section>}
      </>}
      <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400"><span>EcoFlow · Plataforma de gestión solar</span><span>Conectado mediante Supabase</span></footer>
    </main>
  </div>;
}

function EmptyState({text}:{text:string}) {
  return <div className="p-10 text-center text-sm text-slate-400"><CircleHelp className="mx-auto mb-2" size={24}/>{text}</div>;
}

function ProjectTable({projects,isAdmin,onStatus}:{projects:ProjectRow[];isAdmin:boolean;onStatus:(id:string,status:ProjectStatus)=>void}) {
  if(projects.length===0) return <EmptyState text="No hay proyectos para mostrar."/>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-sand text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Proyecto</th><th className="px-5 py-3 font-semibold">Cliente</th><th className="px-5 py-3 font-semibold">Ubicación</th><th className="px-5 py-3 font-semibold">Potencia</th><th className="px-5 py-3 font-semibold">Estado</th></tr></thead><tbody className="divide-y divide-slate-100">{projects.map(p=><tr key={p.id} className="hover:bg-sand/60"><td className="px-5 py-4"><b className="text-forest-950">{p.nombre}</b><p className="mt-1 text-xs text-slate-400">{p.fecha_inicio||"Fecha sin definir"}</p></td><td className="px-5 py-4 text-slate-600">{p.cliente}</td><td className="px-5 py-4 text-slate-500"><span className="flex items-center gap-1"><MapPin size={14}/>{p.direccion}</span></td><td className="px-5 py-4 font-semibold">{Number(p.potencia_kw)} kW</td><td className="px-5 py-4">{isAdmin?<select aria-label={`Estado de ${p.nombre}`} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs" value={p.estado} onChange={e=>onStatus(p.id,e.target.value as ProjectStatus)}><option>Pendiente</option><option>En progreso</option><option>Completado</option></select>:<StatusBadge status={p.estado}/>}</td></tr>)}</tbody></table></div>;
}
