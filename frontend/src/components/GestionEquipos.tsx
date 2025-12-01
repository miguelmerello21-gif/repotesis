import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Users, Plus, Edit, Trash2, Search, History, Wand2, CheckCircle, Award, UserMinus, Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { DIVISIONES, CATEGORIAS, NIVELES } from '../constants/cheerCategories';
import { equiposService, atletasService, usuariosService } from '../api';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface EquipoDTO {
  id: number;
  nombre: string;
  division: any;
  categoria: any;
  nivel: any;
  entrenador?: number;
  entrenador_nombre?: any;
  descripcion?: string;
  activo: boolean;
}

interface AtletaDTO {
  id: number;
  nombre_completo: string;
  rut?: string;
  genero?: string;
  edad?: number;
  division?: string;
  categoria?: string;
  nivel?: number | string;
  telefono_contacto?: string;
  direccion?: string;
  apoderado_nombre?: string;
  apoderado_email?: string;
  equipo?: number | null;
  equipo_id?: number | null;
}

const normalizeVal = (val: any) => {
  if (!val) return '';
  if (typeof val === 'string' || typeof val === 'number') return val;
  return val.id || val.value || '';
};

const formatError = (err: any) => {
  if (!err) return 'Ocurrió un error';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return 'Ocurrió un error';
  }
};

const resolveEquipoId = (val: any) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return Number(val);
  if (typeof val === 'object') return val.id || val.value || null;
  return null;
};

const nivelVal = (n: any) => {
  if (typeof n === 'number') return n;
  if (typeof n === 'string') return Number(n);
  return Number(n?.id || n?.value || 1);
};

const getLabel = (collection: any[], value: any, fallback: string) => {
  const id = normalizeVal(value);
  const found = collection.find((item) => item.id === id);
  return found?.nombre || found?.label || id || fallback;
};

const getEntrenadorLabel = (entrenador_nombre: any, entrenadorId?: number | string) => {
  if (typeof entrenador_nombre === 'string') return entrenador_nombre;
  if (entrenador_nombre && typeof entrenador_nombre === 'object') {
    return entrenador_nombre.name || entrenador_nombre.email || `Entrenador ${entrenador_nombre.id || ''}`;
  }
  if (entrenadorId) return `Entrenador ${entrenadorId}`;
  return 'No asignado';
};

const DraggableAtleta: React.FC<{
  atleta: AtletaDTO;
  equiposActivos?: EquipoDTO[];
  onAssign?: (atletaId: number, equipoId: number | null) => void;
  onAssignToTeam?: (atleta: AtletaDTO) => void;
}> = ({ atleta, equiposActivos = [], onAssign, onAssignToTeam }) => {
  const [, drag] = useDrag(() => ({
    type: 'ATLETA',
    item: { id: atleta.id },
  }));

  const [showMenu, setShowMenu] = useState(false);
  const sinEquipo = (atleta as any).equipo === null || (atleta as any).equipo === undefined;

  const handleAssign = (eqId: number | null) => {
    if (onAssign) {
      onAssign(atleta.id, eqId);
      setShowMenu(false);
    }
  };

  return (
    <div
      ref={drag}
      className="relative p-4 border border-yellow-100 rounded-2xl bg-yellow-50/30 hover:bg-yellow-50 cursor-grab shadow-sm flex flex-col gap-3 w-full max-w-full"
      key={String(atleta.id)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-sm font-semibold shadow-inner">
          {(atleta.nombre_completo || 'A').charAt(0).toUpperCase()}
        </div>
        <div className="leading-tight space-y-1 flex-1">
          <p className="font-semibold text-sm text-gray-800 truncate max-w-[220px]">{atleta.nombre_completo || 'Atleta sin nombre'}</p>
          <div className="text-[11px] text-gray-600 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 font-medium">ID: {atleta.id}</span>
            {atleta.rut && <span className="inline-flex items-center gap-1">RUT: {atleta.rut}</span>}
            {atleta.division && <span className="inline-flex items-center gap-1">División: {atleta.division}</span>}
            {atleta.categoria && <span className="inline-flex items-center gap-1">Categoría: {atleta.categoria}</span>}
            {atleta.nivel && <span className="inline-flex items-center gap-1">Nivel: {atleta.nivel}</span>}
            {atleta.edad && <span className="inline-flex items-center gap-1">Edad: {atleta.edad}</span>}
            {atleta.genero && <span className="inline-flex items-center gap-1">Género: {atleta.genero}</span>}
          </div>
          {(atleta.apoderado_nombre || atleta.apoderado_email) && (
            <div className="text-[11px] text-gray-600 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 font-medium">Apoderado:</span>
              <span className="truncate max-w-[200px]">{atleta.apoderado_nombre || atleta.apoderado_email}</span>
            </div>
          )}
          <div className="text-[11px] text-gray-500 flex flex-wrap gap-2">
            {atleta.telefono_contacto && <span>Tel: {atleta.telefono_contacto}</span>}
            {atleta.direccion && <span className="truncate max-w-[220px]">Dir: {atleta.direccion}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        {onAssign && !sinEquipo ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs px-2 py-1 h-8 text-red-500 hover:text-red-600"
            onClick={() => handleAssign(null)}
            title="Quitar del equipo"
          >
            <UserMinus className="w-4 h-4" />
          </Button>
        ) : (
          <div />
        )}
        {onAssignToTeam && (
          <Button
            size="sm"
            className="text-xs px-3 h-8 bg-yellow-400 text-black hover:bg-yellow-500 rounded-full"
            onClick={() => onAssignToTeam(atleta)}
          >
            Asignar a equipo
          </Button>
        )}
      </div>
    </div>
  );
};

const DropZone: React.FC<{ onDrop: (atletaId: number) => void; label?: string }> = ({ onDrop, label }) => {
  const [, drop] = useDrop({
    accept: 'ATLETA',
    drop: (item: { id: number }) => onDrop(item.id),
  });
  return (
    <div
      ref={drop}
      className="border border-dashed border-yellow-300 rounded-xl p-3 text-sm text-gray-600 text-center bg-yellow-50/40"
    >
      {label || 'Arrastra atletas aquí'}
    </div>
  );
};

export const GestionEquipos: React.FC = () => {
  const [equipos, setEquipos] = useState<EquipoDTO[]>([]);
  const [atletas, setAtletas] = useState<AtletaDTO[]>([]);
  const [entrenadores, setEntrenadores] = useState<any[]>([]);
  const [asignandoAuto, setAsignandoAuto] = useState(false);
  const [historial, setHistorial] = useState<
    { id: string; atleta: string; de: string; a: string; fecha: string }[]
  >([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState<EquipoDTO | null>(null);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [asignandoAtleta, setAsignandoAtleta] = useState<AtletaDTO | null>(null);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string>('');

  const [formEquipo, setFormEquipo] = useState({
    nombre: '',
    division: '',
    categoria: '',
    nivel: 1,
    entrenador: '',
    descripcion: '',
  });

  useEffect(() => {
    loadEquipos();
    loadAtletas();
    loadEntrenadores();
  }, []);

  const loadEquipos = async () => {
    const resp = await equiposService.listarEquipos();
    if (resp.success) {
      const mapped = (resp.data || []).map((eq: any) => {
        const entrenadoresArr = eq.entrenadores || [];
        const first = entrenadoresArr[0] || {};
        const entId = first.id ?? eq.entrenador_id ?? eq.entrenador ?? null;
        const entNombre = first.name || first.email || eq.entrenador_nombre || null;
        return { ...eq, entrenador: entId, entrenador_id: entId, entrenador_nombre: entNombre, entrenadores: entrenadoresArr };
      });
      setEquipos(mapped);
    } else toast.error(resp.error || 'No se pudieron cargar los equipos');
  };

  const loadAtletas = async () => {
    const resp = await atletasService.listarAtletas();
    if (resp.success) {
      const data = (resp.data || []).map((a: any) => ({
        ...a,
        nombre_completo: a.nombre_completo || `${a.nombres || ''} ${a.apellidos || ''}`.trim(),
        rut: a.rut || '',
        genero: a.genero || '',
        apoderado_nombre: a.apoderado?.name || '',
        apoderado_email: a.apoderado?.email || '',
        equipo: resolveEquipoId(a.equipo ?? a.equipo_id ?? null),
        equipo_id: resolveEquipoId(a.equipo ?? a.equipo_id ?? null),
      }));
      setAtletas(data);
    } else setAtletas([]);
  };

  const loadEntrenadores = async () => {
    const resp = await usuariosService.listarUsuarios?.();
    if (resp && resp.success) setEntrenadores((resp.data || []).filter((u: any) => u.role === 'entrenador'));
  };

  const resetForm = () => {
    setFormEquipo({ nombre: '', division: '', categoria: '', nivel: 1, entrenador: '', descripcion: '' });
    setEquipoEditando(null);
  };

  const handleCrearActualizar = async () => {
    if (!formEquipo.nombre || !formEquipo.division || !formEquipo.categoria) {
      toast.error('Completa nombre, división y categoría');
      return;
    }
    const payload = {
      nombre: formEquipo.nombre,
      division: formEquipo.division,
      categoria: formEquipo.categoria,
      nivel: formEquipo.nivel,
      entrenadores_ids: formEquipo.entrenador ? [Number(formEquipo.entrenador)] : [],
      descripcion: formEquipo.descripcion,
      activo: true,
    };
    const resp = equipoEditando
      ? await equiposService.actualizarEquipo(equipoEditando.id, payload)
      : await equiposService.crearEquipo(payload);

    if (resp.success) {
      toast.success(equipoEditando ? 'Equipo actualizado' : 'Equipo creado');
      setShowModal(false);
      resetForm();
      loadEquipos();
    } else {
      toast.error(resp.error || 'No se pudo guardar');
    }
  };

  const handleEliminar = async (equipoId: number) => {
    if (!confirm('¿Eliminar este equipo?')) return;
    const resp = await equiposService.eliminarEquipo(equipoId);
    if (resp.success) {
      toast.success('Equipo eliminado');
      loadEquipos();
    } else {
      toast.error(resp.error || 'No se pudo eliminar');
    }
  };

  const handleAsignarAtletaDrop = async (atletaId: number, equipoId: number | null) => {
    const atletaActual = atletas.find((a) => a.id === atletaId);
    const equipoAnterior = atletaActual ? resolveEquipoId((atletaActual as any).equipo ?? (atletaActual as any).equipo_id) : null;
    if (equipoAnterior === equipoId) {
      return;
    }
    const resp = await atletasService.asignarEquipo(atletaId, equipoId === null ? null : equipoId);
    if (resp.success) {
      toast.success(equipoId ? 'Atleta asignado' : 'Atleta removido del equipo');
      setAtletas((prev) =>
        prev.map((a) => (a.id === atletaId ? { ...a, equipo: equipoId, equipo_id: equipoId } : a))
      );
      const atletaNombre = atletaActual?.nombre_completo || `Atleta ${atletaId}`;
      const getNombreEquipo = (id: number | null) => {
        if (id === null || id === undefined) return 'Sin equipo';
        const found = equipos.find((e) => Number(e.id) === Number(id));
        return found?.nombre ? `${found.nombre}` : `Equipo ${id}`;
      };
      setHistorial((prev) => [
        {
          id: `${Date.now()}-${atletaId}`,
          atleta: atletaNombre,
          de: getNombreEquipo(equipoAnterior),
          a: getNombreEquipo(equipoId as any),
          fecha: new Date().toISOString(),
        },
        ...prev,
      ]);
      loadEquipos();
    } else {
      toast.error(formatError(resp.error) || 'No se pudo actualizar el atleta');
    }
  };

  const handleAssignToTeam = (atleta: AtletaDTO) => {
    setAsignandoAtleta(atleta);
    setEquipoSeleccionado('');
    setShowAsignarModal(true);
  };

  const handleConfirmAsignar = async () => {
    if (!asignandoAtleta) return;
    if (!equipoSeleccionado) {
      toast.error('Selecciona un equipo');
      return;
    }
    await handleAsignarAtletaDrop(asignandoAtleta.id, Number(equipoSeleccionado));
    setShowAsignarModal(false);
    setAsignandoAtleta(null);
    setEquipoSeleccionado('');
  };

  const equiposFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase();
    return equipos
      .filter((eq) => (filtroActivo === 'activos' ? eq.activo : filtroActivo === 'inactivos' ? !eq.activo : true))
      .filter((eq) => (eq.nombre || '').toString().toLowerCase().includes(term));
  }, [equipos, filtroActivo, busqueda]);

  const atletasSinEquipo = useMemo(() => atletas.filter((a) => !(a as any).equipo && !(a as any).equipo_id), [atletas]);

  const stats = {
    totalEquipos: equipos.length,
    activos: equipos.filter((e) => e.activo).length,
    totalAtletas: atletas.length,
    sinEquipo: atletasSinEquipo.length,
  };
  const equiposActivos = equipos.filter((e) => e.activo);

  const exportEquipoPdf = (eq: EquipoDTO) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const integrantes = atletas.filter((a) => {
      const eqId = Number(eq.id);
      const atletaEq = Number((a as any).equipo ?? (a as any).equipo_id);
      return eqId === atletaEq;
    });
    const filas = integrantes
      .map(
        (a) => `
        <tr>
          <td>${a.nombre_completo || ''}</td>
          <td>${a.rut || ''}</td>
          <td>${a.division || ''}</td>
          <td>${a.categoria || ''}</td>
          <td>${a.nivel || ''}</td>
          <td>${a.apoderado_nombre || ''}</td>
        </tr>
      `
      )
      .join('');
    win.document.write(`
      <html><head><title>Equipo ${eq.nombre}</title></head>
      <body>
        <h2>Equipo: ${eq.nombre}</h2>
        <p>
          Divisi&oacute;n: ${normalizeVal(eq.division)} |
          Categor&iacute;a: ${normalizeVal(eq.categoria)} |
          Nivel: ${eq.nivel} |
          Entrenador: ${entrenadorDisplay(eq)} |
          Estado: ${eq.activo ? 'Activo' : 'Inactivo'}
        </p>
        <table border="1" cellpadding="6" cellspacing="0">
          <thead>
            <tr><th>Atleta</th><th>RUT</th><th>Divisi&oacute;n</th><th>Categor&iacute;a</th><th>Nivel</th><th>Apoderado</th></tr>
          </thead>
          <tbody>
            ${filas || '<tr><td colspan="6">Sin integrantes</td></tr>'}
          </tbody>
        </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const exportEquiposPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = equiposFiltrados.map((eq) => {
      return `<tr>
        <td>${eq.nombre}</td>
        <td>${normalizeVal(eq.division)}</td>
        <td>${normalizeVal(eq.categoria)}</td>
        <td>${eq.nivel}</td>
        <td>${entrenadorDisplay(eq)}</td>
        <td>${eq.activo ? 'Activo' : 'Inactivo'}</td>
      </tr>`;
    }).join('');
    win.document.write(`
      <html><head><title>Equipos</title></head>
      <body>
        <h2>Equipos (${equiposFiltrados.length})</h2>
        <table border="1" cellpadding="6" cellspacing="0">
          <thead><tr><th>Nombre</th><th>División</th><th>Categoría</th><th>Nivel</th><th>Entrenador</th><th>Estado</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6">Sin datos</td></tr>'}</tbody>
        </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const entrenadorDisplay = (eq: EquipoDTO) => {
    const entrenadorId =
      (eq as any).entrenador?.id ??
      (eq as any).entrenador_id ??
      (eq as any).entrenador;
    const found = entrenadores.find((e) => String(e.id) === String(entrenadorId));
    if (found) return found.name || found.email || `Entrenador ${found.id}`;
    return getEntrenadorLabel(eq.entrenador_nombre, entrenadorId);
  };

  const abrirEditar = (eq?: EquipoDTO) => {
    if (eq) {
      setEquipoEditando(eq);
      setFormEquipo({
        nombre: eq.nombre,
        division: normalizeVal(eq.division).toString(),
        categoria: normalizeVal(eq.categoria).toString(),
        nivel: nivelVal(eq.nivel),
        entrenador: eq.entrenador ? String(eq.entrenador) : '',
        descripcion: eq.descripcion || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const autoAsignarAtletas = async () => {
    if (asignandoAuto) return;
    setAsignandoAuto(true);
    try {
      const sinEq = atletas.filter((a) => a.equipo === null || a.equipo === undefined || a.equipo_id === null);
      if (sinEq.length === 0) {
        toast.info('Todos los atletas ya tienen equipo');
        return;
      }
      let asignados = 0;
      let sinMatch = 0;
      for (const atleta of sinEq) {
        const match = equiposActivos.find((eq) => {
          const divEq = normalizeVal((eq as any).division).toString().toLowerCase();
          const catEq = normalizeVal((eq as any).categoria).toString().toLowerCase();
          const nivelEq = Number((eq as any).nivel);
          const divA = (atleta.division || '').toString().toLowerCase();
          const catA = (atleta.categoria || '').toString().toLowerCase();
          const nivelA = Number(atleta.nivel);
          const divOk = divEq ? divEq === divA : true;
          const catOk = catEq ? catEq === catA : true;
          const nivelOk = !Number.isNaN(nivelA) ? nivelEq === nivelA : true;
          return divOk && catOk && nivelOk;
        });
        if (match) {
          const resp = await atletasService.asignarEquipo(atleta.id, Number(match.id));
          if (resp.success) {
            asignados += 1;
            setAtletas((prev) =>
              prev.map((a) => (a.id === atleta.id ? { ...a, equipo: match.id, equipo_id: match.id } : a))
            );
            setHistorial((prev) => [
              {
                id: `${Date.now()}-${atleta.id}`,
                atleta: atleta.nombre_completo || `Atleta ${atleta.id}`,
                de: 'Sin equipo',
                a: match.nombre || `Equipo ${match.id}`,
                fecha: new Date().toISOString(),
              },
              ...prev,
            ]);
          } else {
            toast.error(formatError(resp.error) || 'No se pudo asignar un atleta');
          }
        } else {
          sinMatch += 1;
        }
      }
      if (asignados > 0) {
        toast.success(`Asignados automáticamente: ${asignados}${sinMatch ? ` | Sin coincidencia: ${sinMatch}` : ''}`);
        loadEquipos();
      } else {
        toast.info('No se encontraron equipos compatibles para asignación automática');
      }
    } finally {
      setAsignandoAuto(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Users className="w-6 h-6 text-yellow-400" />
              Gestión de Equipos
            </h2>
            <p className="text-gray-600 text-sm">Organización de atletas por equipos competitivos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={exportEquiposPdf}>
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setShowHistorial(true)}>
              <History className="w-4 h-4" />
              Historial
            </Button>
            <Button variant="outline" className="gap-2" onClick={autoAsignarAtletas} disabled={asignandoAuto}>
              <Wand2 className="w-4 h-4 text-blue-600" />
              {asignandoAuto ? 'Asignando...' : 'Asignar Automático'}
            </Button>
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500 gap-2" onClick={() => abrirEditar()}>
              <Plus className="w-4 h-4" />
              Nuevo Equipo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Total Equipos</span>
                <Users className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="text-3xl font-semibold mt-1">{stats.totalEquipos}</div>
            </CardContent>
          </Card>
          <Card className="border border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Equipos Activos</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-3xl font-semibold mt-1">{stats.activos}</div>
            </CardContent>
          </Card>
          <Card className="border border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Total Atletas</span>
                <Award className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-semibold mt-1">{stats.totalAtletas}</div>
            </CardContent>
          </Card>
          <Card className="border border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Sin Equipo</span>
                <UserMinus className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-3xl font-semibold mt-1">{stats.sinEquipo}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Buscar por nombre de equipo o entrenador..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroActivo} onValueChange={(v) => setFiltroActivo(v as any)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los equipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los equipos</SelectItem>
              <SelectItem value="activos">Solo activos</SelectItem>
              <SelectItem value="inactivos">Solo inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Atletas sin equipo (arrastrar)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <DropZone label="Arrastra aquí para dejar atleta sin equipo" onDrop={(id) => handleAsignarAtletaDrop(id, null)} />
              {atletasSinEquipo.length === 0 ? (
                <p className="text-sm text-gray-500">No hay atletas sin equipo</p>
              ) : (
                <ul className="space-y-2">
                  {atletasSinEquipo.map((at) => (
                    <li key={String(at.id)}>
                      <DraggableAtleta
                        atleta={at}
                        equiposActivos={equiposActivos}
                        onAssign={handleAsignarAtletaDrop}
                        onAssignToTeam={handleAssignToTeam}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {equiposFiltrados.length === 0 ? (
          <Card className="border-dashed border-gray-200">
            <CardContent className="py-16 text-center text-gray-500 space-y-4">
              <Users className="w-10 h-10 mx-auto opacity-50" />
              <div className="text-sm">No hay equipos registrados</div>
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={() => abrirEditar()}>
                Crear Primer Equipo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equiposFiltrados.map((eq) => {
              const integrantes = atletas.filter((a) => {
                const eqId = Number(eq.id);
                return Number((a as any).equipo) === eqId || Number((a as any).equipo_id) === eqId;
              });
              return (
                <Card key={String(eq.id)} className="border border-yellow-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <span className="text-base font-semibold text-gray-800">{eq.nombre}</span>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className="bg-blue-100 text-blue-700 border border-blue-200 capitalize">
                            {getLabel(DIVISIONES, eq.division, 'División')}
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-700 border border-purple-200 capitalize">
                            {getLabel(CATEGORIAS, eq.categoria, 'Categoría')}
                          </Badge>
                          <Badge className="bg-green-100 text-green-700 border border-green-200">
                            Nivel {nivelVal(eq.nivel)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-700" onClick={() => exportEquipoPdf(eq)} title="Exportar equipo en PDF">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-700" onClick={() => abrirEditar(eq)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleEliminar(eq.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{eq.descripcion || 'Sin descripción'}</p>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="font-medium">Entrenador:</span> {entrenadorDisplay(eq)}
                    </div>
                    <div className="space-y-2">
                      <DropZone label="Arrastra atletas a este equipo" onDrop={(atletaId) => handleAsignarAtletaDrop(atletaId, eq.id)} />
                      <div className="border rounded-lg p-3 bg-gradient-to-br from-yellow-50 to-white shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-700">Integrantes ({integrantes.length})</p>
                          <Users className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div className="space-y-2">
                          {integrantes.map((a) => (
                            <div key={String(a.id)} className="flex items-center gap-2">
                              <DraggableAtleta atleta={a} equiposActivos={equiposActivos} onAssign={handleAsignarAtletaDrop} />
                            </div>
                          ))}
                          {integrantes.length === 0 && <p className="text-xs text-gray-500">Sin atletas asignados</p>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog
          open={showAsignarModal}
          onOpenChange={(open) => {
            setShowAsignarModal(open);
            if (!open) {
              setAsignandoAtleta(null);
              setEquipoSeleccionado('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar atleta a equipo</DialogTitle>
              <DialogDescription>
                Selecciona un equipo para {asignandoAtleta?.nombre_completo || 'el atleta'}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={equipoSeleccionado} onValueChange={(v) => setEquipoSeleccionado(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige un equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipos.map((eq) => (
                    <SelectItem key={String(eq.id)} value={String(eq.id)}>
                      {eq.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowAsignarModal(false); setAsignandoAtleta(null); }}>
                  Cancelar
                </Button>
                <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={handleConfirmAsignar}>
                  Asignar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Historial de movimientos</DialogTitle>
              <DialogDescription>Altas y bajas de atletas en equipos (solo sesión actual).</DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-50">
                  <tr className="text-xs uppercase tracking-wide text-gray-600">
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Atleta</th>
                    <th className="px-3 py-2 text-left">Desde</th>
                    <th className="px-3 py-2 text-left">Hacia</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                        Sin movimientos registrados en esta sesión
                      </td>
                    </tr>
                  ) : (
                    historial.map((h) => (
                      <tr key={h.id} className="border-t border-gray-100 odd:bg-white even:bg-gray-50">
                        <td className="px-3 py-2">{new Date(h.fecha).toLocaleString()}</td>
                        <td className="px-3 py-2 font-semibold">{h.atleta}</td>
                        <td className="px-3 py-2">{h.de}</td>
                        <td className="px-3 py-2">{h.a}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{equipoEditando ? 'Editar Equipo' : 'Nuevo Equipo'}</DialogTitle>
              <DialogDescription>Completa la información del equipo</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <Input value={formEquipo.nombre} onChange={(e) => setFormEquipo({ ...formEquipo, nombre: e.target.value })} />
                </div>
                <div>
                  <Label>Entrenador (opcional)</Label>
                  <Select
                    value={formEquipo.entrenador || 'none'}
                    onValueChange={(v) => setFormEquipo({ ...formEquipo, entrenador: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona entrenador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {entrenadores.map((ent) => (
                        <SelectItem key={String(ent.id)} value={String(ent.id)}>
                          {ent.name || ent.email || `Entrenador ${ent.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>División</Label>
                  <Select
                    value={formEquipo.division || 'none'}
                    onValueChange={(v) => setFormEquipo({ ...formEquipo, division: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="División" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>
                        Selecciona división
                      </SelectItem>
                      {DIVISIONES.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select
                    value={formEquipo.categoria || 'none'}
                    onValueChange={(v) => setFormEquipo({ ...formEquipo, categoria: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>
                        Selecciona categoría
                      </SelectItem>
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nivel</Label>
                  <Select value={String(formEquipo.nivel)} onValueChange={(v) => setFormEquipo({ ...formEquipo, nivel: Number(v) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIVELES.map((n) => (
                        <SelectItem key={String(n.id)} value={String(n.id)}>
                          {n.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Descripción</Label>
                  <Textarea
                    rows={3}
                    value={formEquipo.descripcion}
                    onChange={(e) => setFormEquipo({ ...formEquipo, descripcion: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={handleCrearActualizar}>
                {equipoEditando ? 'Guardar cambios' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
};
