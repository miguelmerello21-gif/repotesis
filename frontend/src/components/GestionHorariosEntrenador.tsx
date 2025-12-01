import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Clock, Plus, Edit, Trash2, MapPin, ArrowLeft, ArrowRight, User } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../contexts/AuthContext';
import { horariosService, equiposService, usuariosService } from '../api';

interface Horario {
  id: number;
  equipo: number;
  equipo_nombre: string;
  entrenador?: any;
  lugar: string;
  dia_semana: number; // 0 = Domingo
  hora_inicio: string;
  hora_termino: string;
  color: string;
  activo: boolean;
  fecha?: string | null;
}

interface GestionHorariosEntrenadorProps {
  equiposAsignados: any[];
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const COLORES_HORARIO = ['#FCD34D', '#60A5FA', '#34D399', '#F472B6', '#A78BFA', '#FB923C', '#38BDF8'];
const START_HOUR = 8;
const END_HOUR = 23;
const HOUR_HEIGHT = 60;

export const GestionHorariosEntrenador: React.FC<GestionHorariosEntrenadorProps> = ({ equiposAsignados }) => {
  const { user } = useAuth();

  const safeMsg = (err: any, fallback: string) => {
    if (typeof err === 'string') return err;
    const pick = err?.message || err?.error || err?.detail;
    if (typeof pick === 'string') return pick;
    if (pick) return JSON.stringify(pick);
    return fallback;
  };

  const idsAsignados = (equiposAsignados || []).map((e: any) => String((e as any)?.id ?? e));

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [entrenadores, setEntrenadores] = useState<any[]>([]);
  const [showNuevoHorario, setShowNuevoHorario] = useState(false);
  const [showEditarHorario, setShowEditarHorario] = useState(false);
  const [horarioEditando, setHorarioEditando] = useState<Horario | null>(null);
  const [nuevoHorario, setNuevoHorario] = useState({
    equipo: '',
    dia_semana: 1,
    hora_inicio: '08:00',
    hora_termino: '10:00',
    lugar: '',
    fecha: '',
    color: COLORES_HORARIO[0],
  });

  const formatLocalDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parseLocalDate = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const getMondayOfWeek = (date: Date) => {
    const day = date.getDay(); // 0 domingo
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));

  useEffect(() => {
    const hoy = formatLocalDate(new Date());
    setNuevoHorario((prev) => ({ ...prev, fecha: hoy }));
    loadEquipos();
    loadHorarios();
    loadEntrenadores();
  }, [equiposAsignados]);

  const loadEquipos = async () => {
    try {
      const resp = await equiposService.listarEquipos();
      if (resp.success) {
        const todos = resp.data || [];
        const idsPorEntrenador = user
          ? todos
              .filter((e: any) => {
                if (String(e.entrenador) === String(user.id)) return true;
                if (Array.isArray(e.entrenadores)) {
                  return e.entrenadores.some((ent: any) => String(ent?.id ?? ent) === String(user.id));
                }
                return false;
              })
              .map((e: any) => String(e.id))
          : [];
        const ids = new Set([...idsAsignados, ...idsPorEntrenador]);
        const filtrados = todos.filter((e: any) => ids.has(String(e.id)));
        if (filtrados.length > 0) {
          setEquipos(filtrados);
        } else if (ids.size > 0) {
          setEquipos(Array.from(ids).map((id) => ({ id, nombre: `Equipo ${id}` })));
        } else {
          setEquipos([]);
        }
      } else {
        setEquipos(idsAsignados.map((id) => ({ id, nombre: `Equipo ${id}` })));
      }
    } catch {
      setEquipos(idsAsignados.map((id) => ({ id, nombre: `Equipo ${id}` })));
    }
  };

  const loadHorarios = async () => {
    const respMis = await horariosService.obtenerMisHorarios?.();
    if (respMis?.success) {
      setHorarios(respMis.data || []);
      return;
    }
    const resp = await horariosService.listarHorarios();
    if (resp?.success) {
      setHorarios(resp.data || []);
    } else {
      toast.error(safeMsg(resp, 'No se pudieron cargar los horarios'));
    }
  };

  const loadEntrenadores = async () => {
    try {
      const resp = await usuariosService.listarUsuarios?.();
      if (resp?.success) {
        setEntrenadores(resp.data || []);
      } else {
        setEntrenadores([]);
      }
    } catch {
      // Si el endpoint devuelve 403 u otro error, simplemente dejamos vacío y usamos el nombre del usuario como fallback
      setEntrenadores([]);
    }
  };

  const resetForm = () => {
    const hoy = formatLocalDate(new Date());
    setNuevoHorario({
      equipo: '',
      dia_semana: 1,
      hora_inicio: '08:00',
      hora_termino: '10:00',
      lugar: '',
      fecha: hoy,
      color: COLORES_HORARIO[0],
    });
  };

  const handleCrear = async () => {
    if (!nuevoHorario.equipo || !nuevoHorario.lugar) {
      toast.error('Completa equipo y lugar');
      return;
    }

    if (
      existeChoqueHorario(
        {
          dia_semana: Number(nuevoHorario.dia_semana),
          hora_inicio: nuevoHorario.hora_inicio,
          hora_termino: nuevoHorario.hora_termino,
          fecha: nuevoHorario.fecha || null,
        },
        null,
      )
    ) {
      toast.error('Existe un choque de horario en el mismo día y rango horario.');
      return;
    }

    const payload = {
      equipo: Number(nuevoHorario.equipo),
      entrenador: user ? Number(user.id) : null,
      lugar: nuevoHorario.lugar,
      dia_semana: Number(nuevoHorario.dia_semana),
      fecha: nuevoHorario.fecha,
      hora_inicio: nuevoHorario.hora_inicio,
      hora_termino: nuevoHorario.hora_termino,
      color: nuevoHorario.color,
    };
    const resp = await horariosService.crearHorario(payload);
    if (resp.success) {
      toast.success('Horario creado');
      setShowNuevoHorario(false);
      resetForm();
      loadHorarios();
    } else {
      toast.error(safeMsg(resp, 'No se pudo crear'));
    }
  };

  const handleEditar = (h: Horario) => {
    // Solo permitir editar si el horario fue creado por este entrenador
    if (user && h.entrenador && String(h.entrenador) !== String(user.id)) {
      toast.error('Solo puedes editar horarios que hayas creado');
      return;
    }
    setHorarioEditando(h);
    // Si el horario tiene fecha, úsala; si no, calcula la fecha estimada de esa semana
    let fechaStr = h.fecha || '';
    if (!fechaStr) {
      const hoy = new Date();
      const diaActualSemana = hoy.getDay();
      const diff = (h.dia_semana - diaActualSemana + 7) % 7;
      const fechaEstimativa = new Date(hoy);
      fechaEstimativa.setDate(hoy.getDate() + diff);
      fechaStr = formatLocalDate(fechaEstimativa);
    }
    setNuevoHorario({
      equipo: String(h.equipo),
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio,
      hora_termino: h.hora_termino,
      lugar: h.lugar,
      fecha: fechaStr,
      color: h.color,
    });
    setShowEditarHorario(true);
  };

  const handleActualizar = async () => {
    if (!horarioEditando) return;

    if (
      existeChoqueHorario(
        {
          dia_semana: Number(nuevoHorario.dia_semana),
          hora_inicio: nuevoHorario.hora_inicio,
          hora_termino: nuevoHorario.hora_termino,
          fecha: nuevoHorario.fecha || null,
        },
        horarioEditando.id,
      )
    ) {
      toast.error('Existe un choque de horario en el mismo día y rango horario.');
      return;
    }

    const payload = {
      equipo: Number(nuevoHorario.equipo),
      entrenador: user ? Number(user.id) : null,
      lugar: nuevoHorario.lugar,
      dia_semana: Number(nuevoHorario.dia_semana),
      fecha: nuevoHorario.fecha,
      hora_inicio: nuevoHorario.hora_inicio,
      hora_termino: nuevoHorario.hora_termino,
      color: nuevoHorario.color,
    };
    const resp = await horariosService.actualizarHorario(horarioEditando.id, payload);
    if (resp.success) {
      toast.success('Horario actualizado');
      setShowEditarHorario(false);
      setHorarioEditando(null);
      loadHorarios();
    } else {
      toast.error(safeMsg(resp, 'No se pudo actualizar'));
    }
  };

  const handleEliminar = async (id: number) => {
    const horario = horarios.find((h) => h.id === id);
    if (user && horario?.entrenador && String(horario.entrenador) !== String(user.id)) {
      toast.error('Solo puedes eliminar horarios que hayas creado');
      return;
    }
    if (!confirm('¿Eliminar este horario?')) return;
    const resp = await horariosService.eliminarHorario(id);
    if (resp.success) {
      toast.success('Horario eliminado');
      loadHorarios();
      setShowEditarHorario(false);
    } else {
      toast.error(safeMsg(resp, 'No se pudo eliminar'));
    }
  };

  const parseTimeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const existeChoqueHorario = (
    payload: { dia_semana: number; hora_inicio: string; hora_termino: string; fecha?: string | null },
    ignoreId?: number | null,
  ) => {
    const inicioNuevo = parseTimeToMinutes(payload.hora_inicio);
    const finNuevo = parseTimeToMinutes(payload.hora_termino);

    return horarios.some((h) => {
      if (ignoreId && h.id === ignoreId) return false;

      // Coincidencia por fecha exacta (si ambas existen) o por día de semana cuando alguno es recurrente
      const coincideFecha =
        h.fecha && payload.fecha ? h.fecha === payload.fecha : h.dia_semana === payload.dia_semana;
      if (!coincideFecha) return false;

      const inicioExistente = parseTimeToMinutes(h.hora_inicio);
      const finExistente = parseTimeToMinutes(h.hora_termino);

      return inicioNuevo < finExistente && finNuevo > inicioExistente;
    });
  };

  const parseApiDate = (value: string) => {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatHora = (hora: string) => {
    if (!hora) return '00:00';
    const [h, m = '00'] = hora.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  };

  const weekDays = useMemo(() => {
    const days: { date: Date; label: string; dayIndex: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push({
        date: d,
        label: d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' }),
        dayIndex: i,
      });
    }
    return days;
  }, [weekStart]);

  const formatWeekRange = () => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${weekStart.toLocaleDateString('es-CL', options)} - ${end.toLocaleDateString('es-CL', options)}`;
  };

  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(date.getDate() + days);
    return d;
  };

  const eventosPorDia = useMemo(() => {
    const map: Record<number, Horario[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    horarios.forEach((h) => {
      let idx = -1;
      if (h.fecha) {
        const fh = parseApiDate(String(h.fecha));
        if (fh) {
          fh.setHours(0, 0, 0, 0);
          const diff = Math.floor((fh.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && diff < 7) {
            idx = diff;
          }
        }
      } else {
        idx = (h.dia_semana + 6) % 7; // domingo->6, lunes->0
      }
      if (idx >= 0 && idx < 7) {
        map[idx].push(h);
      }
    });
    return map;
  }, [horarios, weekStart]);

  const hoursLabels = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const totalCalendarHeight = hoursLabels.length * HOUR_HEIGHT;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-yellow-400" />
            Horarios de mis equipos
          </h2>
          <p className="text-gray-600">Gestiona horarios de tus equipos asignados</p>
        </div>
        <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={() => setShowNuevoHorario(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Horario
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setWeekStart((prev) => addDays(prev, -7))}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="text-sm text-gray-600">
              Semana: <span className="font-semibold text-gray-900">{formatWeekRange()}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setWeekStart((prev) => addDays(prev, 7))}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-500">Horario 08:00 - 23:00</div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <div className="min-w-[960px]">
            <div
              className="grid gap-3 pb-6 items-center"
              style={{ gridTemplateColumns: '80px repeat(7, minmax(120px, 1fr))' }}
            >
              <div />
              {weekDays.map((d, idx) => {
                const dayText = d.date.toLocaleDateString('es-CL', { weekday: 'long' });
                const dayPretty = dayText.charAt(0).toUpperCase() + dayText.slice(1);
                const dayNumber = d.date.getDate();
                const monthPretty = d.date.toLocaleDateString('es-CL', { month: 'short' });
                return (
                  <div
                    key={idx}
                    className="px-6 py-2 rounded-xl border border-yellow-300 bg-yellow-50 text-center shadow-sm flex flex-col items-center justify-center"
                  >
                    <span className="text-sm font-semibold text-gray-900">{dayPretty}</span>
                    <span className="text-xs text-gray-600">
                      {dayNumber} {monthPretty}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              className="grid gap-3 items-start"
              style={{ gridTemplateColumns: '80px repeat(7, minmax(120px, 1fr))' }}
            >
              <div className="flex flex-col items-end pr-2" style={{ height: totalCalendarHeight }}>
                {hoursLabels.map((h) => (
                  <div key={h} className="text-xs text-gray-500 pr-1 leading-5" style={{ height: HOUR_HEIGHT }}>
                    {`${h}:00`}
                  </div>
                ))}
              </div>

              {weekDays.map((_, dayIdx) => (
                <div
                  key={dayIdx}
                  className="relative border border-gray-100 rounded-lg bg-white"
                  style={{ height: totalCalendarHeight }}
                >
                  <div className="absolute inset-0">
                    {hoursLabels.map((h) => (
                      <div key={h} className="border-t border-gray-100" style={{ height: HOUR_HEIGHT }} />
                    ))}
                  </div>

                  <div className="relative h-full">
                    {eventosPorDia[dayIdx].map((ev) => {
                      const startMinutes = parseTimeToMinutes(ev.hora_inicio);
                      const endMinutes = parseTimeToMinutes(ev.hora_termino);
                      const topMinutes = Math.max(startMinutes, START_HOUR * 60);
                      const bottomMinutes = Math.min(endMinutes, END_HOUR * 60);
                      const durationMinutes = Math.max(bottomMinutes - topMinutes, 30);
                      const topPx = ((topMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                      const heightPx = (durationMinutes / 60) * HOUR_HEIGHT;

                      const entrenObj = ev.entrenador;
                      const entrenStore = entrenadores.find((e: any) => String(e.id) === String(entrenObj));
                      const entrenadorIdStr = entrenObj?.id ?? entrenObj;
                      const esActual = entrenadorIdStr && user && String(entrenadorIdStr) === String(user.id);
                      const entrenadorNombre =
                        ev.entrenador_nombre ||
                        entrenObj?.name ||
                        entrenObj?.nombre ||
                        [entrenObj?.first_name, entrenObj?.last_name].filter(Boolean).join(' ') ||
                        entrenStore?.name ||
                        entrenStore?.nombre ||
                        [entrenStore?.first_name, entrenStore?.last_name].filter(Boolean).join(' ') ||
                        (esActual ? user?.name || user?.email : '') ||
                        (entrenadorIdStr ? '' : '');

                      return (
                        <div
                          key={ev.id}
                          className="absolute left-2 right-2 rounded-md shadow-sm border border-gray-100 text-xs text-gray-900 overflow-hidden cursor-pointer"
                          style={{
                            top: topPx,
                            height: heightPx,
                            backgroundColor: ev.color || '#FCD34D',
                          }}
                          onClick={() => handleEditar(ev)}
                        >
                          <div className="px-2 py-1 font-semibold text-sm truncate">{ev.equipo_nombre}</div>
                          <div className="px-2 pb-2 text-[11px] text-gray-700 flex flex-col gap-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatHora(ev.hora_inicio)} - {formatHora(ev.hora_termino)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ev.lugar || 'Sin lugar'}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {entrenadorNombre || 'Sin entrenador'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={showNuevoHorario}
        onOpenChange={(open) => {
          setShowNuevoHorario(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Horario</DialogTitle>
            <DialogDescription>Define día, horas y equipo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Equipo</Label>
                <Select value={nuevoHorario.equipo} onValueChange={(v) => setNuevoHorario({ ...nuevoHorario, equipo: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipos.map((eq) => (
                      <SelectItem key={eq.id} value={String(eq.id)}>
                        {eq.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={nuevoHorario.fecha}
                  onChange={(e) => {
                    const value = e.target.value;
                    const fecha = parseLocalDate(value);
                    setNuevoHorario({
                      ...nuevoHorario,
                      fecha: value,
                      dia_semana: fecha.getDay(),
                    });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se usará el día de la semana seleccionado ({DIAS_SEMANA[nuevoHorario.dia_semana]}) para el horario.
                </p>
              </div>
              <div>
                <Label>Lugar</Label>
                <Input
                  placeholder="Ej: Gimnasio principal"
                  value={nuevoHorario.lugar}
                  onChange={(e) => setNuevoHorario({ ...nuevoHorario, lugar: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora inicio</Label>
                <Input
                  type="time"
                  value={nuevoHorario.hora_inicio}
                  onChange={(e) => setNuevoHorario({ ...nuevoHorario, hora_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora término</Label>
                <Input
                  type="time"
                  value={nuevoHorario.hora_termino}
                  onChange={(e) => setNuevoHorario({ ...nuevoHorario, hora_termino: e.target.value })}
                />
              </div>
              <div>
                <Label>Color</Label>
                <Select
                  value={nuevoHorario.color}
                  onValueChange={(v) => setNuevoHorario({ ...nuevoHorario, color: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORES_HORARIO.map((c) => (
                      <SelectItem key={c} value={c}>
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded" style={{ backgroundColor: c }} />
                          {c}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNuevoHorario(false)}>
              Cancelar
            </Button>
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={handleCrear}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditarHorario} onOpenChange={setShowEditarHorario}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Horario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Equipo</Label>
                <Select value={nuevoHorario.equipo} onValueChange={(v) => setNuevoHorario({ ...nuevoHorario, equipo: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipos.map((eq) => (
                      <SelectItem key={eq.id} value={String(eq.id)}>
                        {eq.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={nuevoHorario.fecha}
                  onChange={(e) => {
                    const value = e.target.value;
                    const fecha = parseLocalDate(value);
                    setNuevoHorario({
                      ...nuevoHorario,
                      fecha: value,
                      dia_semana: fecha.getDay(),
                    });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se usará el día de la semana seleccionado ({DIAS_SEMANA[nuevoHorario.dia_semana]}) para el horario.
                </p>
              </div>
              <div>
                <Label>Lugar</Label>
                <Input
                  placeholder="Ej: Gimnasio principal"
                  value={nuevoHorario.lugar}
                  onChange={(e) => setNuevoHorario({ ...nuevoHorario, lugar: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora inicio</Label>
                <Input
                  type="time"
                  value={nuevoHorario.hora_inicio}
                  onChange={(e) => setNuevoHorario({ ...nuevoHorario, hora_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora término</Label>
                <Input
                  type="time"
                  value={nuevoHorario.hora_termino}
                  onChange={(e) => setNuevoHorario({ ...nuevoHorario, hora_termino: e.target.value })}
                />
              </div>
              <div>
                <Label>Color</Label>
                <Select
                  value={nuevoHorario.color}
                  onValueChange={(v) => setNuevoHorario({ ...nuevoHorario, color: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORES_HORARIO.map((c) => (
                      <SelectItem key={c} value={c}>
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded" style={{ backgroundColor: c }} />
                          {c}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditarHorario(false)}>
              Cancelar
            </Button>
            {horarioEditando && (
              <Button
                variant="destructive"
                onClick={() => handleEliminar(horarioEditando.id)}
                className="mr-auto"
              >
                Eliminar
              </Button>
            )}
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={handleActualizar}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
