import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Filter,
  ArrowLeft,
  ArrowRight,
  User,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { horariosService, equiposService, usuariosService } from '../api';

interface Horario {
  id: number;
  equipo: number;
  equipo_nombre: string;
  entrenador?: number | string;
  fecha?: string;
  lugar: string;
  dia_semana: number;
  hora_inicio: string;
  hora_termino: string;
  color: string;
  activo: boolean;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const COLORES_HORARIO = ['#FCD34D', '#60A5FA', '#34D399', '#F472B6', '#A78BFA', '#FB923C', '#38BDF8'];
const DIAS_ORDEN = [1, 2, 3, 4, 5, 6, 0]; // Lunes -> Domingo

export const GestionHorarios: React.FC = () => {
  const formatLocalDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parseLocalDate = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  // Parse fecha (YYYY-MM-DD) sin offset de zona
  const parseApiDateLocal = (dateStr: string) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [entrenadores, setEntrenadores] = useState<any[]>([]);
  const [showNuevoHorario, setShowNuevoHorario] = useState(false);
  const [showEditarHorario, setShowEditarHorario] = useState(false);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<Horario | null>(null);
  const [filtroEquipo, setFiltroEquipo] = useState<string>('todos');
  const today = formatLocalDate(new Date());
  const [nuevoHorario, setNuevoHorario] = useState({
    equipo: '',
    entrenador: 'none',
    lugar: '',
    dia_semana: 1,
    fecha: today,
    hora_inicio: '17:00',
    hora_termino: '19:00',
    color: COLORES_HORARIO[0],
  });

  const START_HOUR = 8; // mostrar desde 08:00
  const END_HOUR = 23; // hasta 23:00
  const HOUR_HEIGHT = 60; // px por hora (altura uniforme)

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
    loadHorarios();
    loadEquipos();
    loadEntrenadores();
  }, []);

  const safeMsg = (err: any, fallback: string) =>
    typeof err === 'string' ? err : err?.message || err?.detail || err?.error || fallback;

  const loadHorarios = async () => {
    const resp = await horariosService.listarHorarios();
    if (resp.success) {
      setHorarios(resp.data || []);
    } else {
      toast.error(safeMsg(resp.error, 'No se pudieron cargar los horarios'));
    }
  };

  const loadEquipos = async () => {
    const resp = await equiposService.listarEquipos();
    if (resp.success) {
      setEquipos(resp.data || []);
    }
  };

  const loadEntrenadores = async () => {
    try {
      const resp = await usuariosService.listarUsuarios?.();
      if (resp && resp.success) {
        const entrenas = (resp.data || []).filter((u: any) => u.role === 'entrenador');
        setEntrenadores(entrenas);
      }
    } catch {
      setEntrenadores([]);
    }
  };

  const resetFormulario = () => {
    const hoy = formatLocalDate(new Date());
    setNuevoHorario({
      equipo: '',
      entrenador: 'none',
      lugar: '',
      dia_semana: 1,
      fecha: hoy,
      hora_inicio: '17:00',
      hora_termino: '19:00',
      color: COLORES_HORARIO[0],
    });
  };

  const abrirNuevoHorario = () => {
    resetFormulario();
    setShowNuevoHorario(true);
  };

  const handleCrearHorario = async () => {
    if (!nuevoHorario.equipo || !nuevoHorario.lugar || !nuevoHorario.hora_inicio || !nuevoHorario.hora_termino) {
      toast.error('Completa todos los campos obligatorios');
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
      entrenador:
        nuevoHorario.entrenador && nuevoHorario.entrenador !== 'none'
          ? Number(nuevoHorario.entrenador)
          : null,
      lugar: nuevoHorario.lugar,
      dia_semana: Number(nuevoHorario.dia_semana),
      fecha: nuevoHorario.fecha,
      hora_inicio: nuevoHorario.hora_inicio,
      hora_termino: nuevoHorario.hora_termino,
      color: nuevoHorario.color,
      activo: true,
    };
    const resp = await horariosService.crearHorario(payload);
    if (resp.success) {
      toast.success('Horario creado exitosamente');
      setShowNuevoHorario(false);
      resetFormulario();
      loadHorarios();
    } else {
      toast.error(safeMsg(resp.error, 'No se pudo crear el horario'));
    }
  };

  const handleEditarHorario = (horario: Horario) => {
    setHorarioSeleccionado(horario);
    const hoy = new Date();
    const diaActualSemana = hoy.getDay();
    const diff = (horario.dia_semana - diaActualSemana + 7) % 7;
    const fechaEstimativa = new Date(hoy);
    fechaEstimativa.setDate(hoy.getDate() + diff);
    setNuevoHorario({
      equipo: String(horario.equipo),
      entrenador: horario.entrenador ? String(horario.entrenador) : 'none',
      lugar: horario.lugar,
      dia_semana: horario.dia_semana,
      fecha: formatLocalDate(fechaEstimativa),
      hora_inicio: horario.hora_inicio,
      hora_termino: horario.hora_termino,
      color: horario.color,
    });
    setShowEditarHorario(true);
  };

  const handleActualizarHorario = async () => {
    if (!horarioSeleccionado) return;

    if (
      existeChoqueHorario(
        {
          dia_semana: Number(nuevoHorario.dia_semana),
          hora_inicio: nuevoHorario.hora_inicio,
          hora_termino: nuevoHorario.hora_termino,
          fecha: nuevoHorario.fecha || null,
        },
        horarioSeleccionado.id,
      )
    ) {
      toast.error('Existe un choque de horario en el mismo día y rango horario.');
      return;
    }

    const payload = {
      equipo: Number(nuevoHorario.equipo),
      entrenador:
        nuevoHorario.entrenador && nuevoHorario.entrenador !== 'none'
          ? Number(nuevoHorario.entrenador)
          : null,
      lugar: nuevoHorario.lugar,
      dia_semana: Number(nuevoHorario.dia_semana),
      fecha: nuevoHorario.fecha,
      hora_inicio: nuevoHorario.hora_inicio,
      hora_termino: nuevoHorario.hora_termino,
      color: nuevoHorario.color,
    };
    const resp = await horariosService.actualizarHorario(horarioSeleccionado.id, payload);
    if (resp.success) {
      toast.success('Horario actualizado');
      setShowEditarHorario(false);
      setHorarioSeleccionado(null);
      loadHorarios();
    } else {
      toast.error(safeMsg(resp.error, 'No se pudo actualizar'));
    }
  };

  const handleEliminarHorario = async (horarioId: number) => {
    if (!confirm('¿Eliminar este horario?')) return;
    const resp = await horariosService.eliminarHorario(horarioId);
    if (resp.success) {
      toast.success('Horario eliminado');
      loadHorarios();
    } else {
      toast.error(safeMsg(resp.error, 'No se pudo eliminar'));
    }
  };

  const actualizarDiaDesdeFecha = (fechaIso: string) => {
    if (!fechaIso) return;
    const fecha = parseLocalDate(fechaIso);
    const dia = fecha.getDay();
    setNuevoHorario((prev) => ({ ...prev, fecha: fechaIso, dia_semana: dia }));
  };

  const horariosFiltrados = useMemo(() => {
    const list =
      filtroEquipo === 'todos' ? horarios : horarios.filter((h) => String(h.equipo) === filtroEquipo);
    return [...list].sort((a, b) => {
      if (a.fecha && b.fecha) return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      if (a.fecha) return -1;
      if (b.fecha) return 1;
      return a.dia_semana - b.dia_semana;
    });
  }, [horarios, filtroEquipo]);

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
    return `${weekStart.toLocaleDateString('es-CL', options)} - ${end.toLocaleDateString(
      'es-CL',
      options,
    )}`;
  };

  const parseTimeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const formatHora = (hora: string) => {
    if (!hora) return '00:00';
    const [h, m = '00'] = hora.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  };

  const existeChoqueHorario = (
    payload: { dia_semana: number; hora_inicio: string; hora_termino: string; fecha?: string | null },
    ignoreId?: number | null,
  ) => {
    const inicioNuevo = parseTimeToMinutes(payload.hora_inicio);
    const finNuevo = parseTimeToMinutes(payload.hora_termino);

    return horarios.some((h) => {
      if (ignoreId && h.id === ignoreId) return false;

      const coincideFecha =
        h.fecha && payload.fecha ? h.fecha === payload.fecha : h.dia_semana === payload.dia_semana;
      if (!coincideFecha) return false;

      const inicioExistente = parseTimeToMinutes(h.hora_inicio);
      const finExistente = parseTimeToMinutes(h.hora_termino);

      return inicioNuevo < finExistente && finNuevo > inicioExistente;
    });
  };

  const eventosPorDia = useMemo(() => {
    const map: Record<number, Horario[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    horariosFiltrados.forEach((h) => {
      let idx = -1;
      if (h.fecha) {
        const fecha = parseApiDateLocal(h.fecha);
        if (!fecha) return;
        fecha.setHours(0, 0, 0, 0);
        const diff = Math.floor((fecha.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff < 7) {
          idx = diff;
        }
      } else {
        idx = (h.dia_semana + 6) % 7; // domingo -> 6, lunes -> 0
      }
      if (idx >= 0 && idx < 7) {
        map[idx].push(h);
      }
    });
    return map;
  }, [horariosFiltrados, weekStart]);

  const hoursLabels = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const totalCalendarHeight = hoursLabels.length * HOUR_HEIGHT;

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const horariosSemana = useMemo(() => {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);
    return horariosFiltrados.filter((h) => {
      if (h.fecha) {
        const fecha = parseApiDateLocal(h.fecha);
        if (!fecha) return false;
        fecha.setHours(12, 0, 0, 0);
        return fecha >= start && fecha <= end;
      }
      // sin fecha: se repiten semanalmente
      return true;
    });
  }, [horariosFiltrados, weekStart, weekEnd]);

  const horariosAgrupados = useMemo(() => {
    const days: { label: string; items: Horario[] }[] = [];
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);

    // Construimos slots de lunes a domingo para la semana actual
    DIAS_ORDEN.forEach((diaSemana) => {
      const dayDate = new Date(weekStart);
      const diff = (diaSemana + 6) % 7; // lunes=1 -> 0 offset; domingo=0 -> 6 offset
      dayDate.setDate(weekStart.getDate() + diff);
      dayDate.setHours(12, 0, 0, 0);
      const label = dayDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' });
      const items = horariosSemana.filter((h) => {
        if (h.fecha) {
          const fecha = parseApiDateLocal(h.fecha);
          if (!fecha) return false;
          return fecha.getDay() === diaSemana;
        }
        return Number(h.dia_semana) === diaSemana;
      });
      if (items.length > 0) {
        days.push({ label, items });
      }
    });
    return days;
  }, [horariosSemana, weekStart, weekEnd]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-yellow-400" />
            Gestion de Horarios
          </h2>
          <p className="text-gray-600">Administra horarios por equipo y dia</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filtroEquipo} onValueChange={setFiltroEquipo}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Equipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Todos los equipos
                </div>
              </SelectItem>
              {equipos.map((eq) => (
                <SelectItem key={eq.id} value={String(eq.id)}>
                  {eq.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={abrirNuevoHorario}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Horario
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendario">
        <TabsList>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>

        {/* VISTA CALENDARIO */}
        <TabsContent value="calendario" className="mt-4">
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
              <div className="text-xs text-gray-500">
                Horario 07:00 - 22:00. Los eventos sin fecha se repiten semanalmente segun el dia.
              </div>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <div className="min-w-[960px]">
                {/* Cabecera de dias: una fila con 7 tarjetas alineadas */}
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
                        <span className="text-xs text-gray-600">{dayNumber} {monthPretty}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Cuerpo del calendario: columna de horas + 7 columnas de dias */}
                <div
                  className="grid gap-3 items-start"
                  style={{ gridTemplateColumns: '80px repeat(7, minmax(120px, 1fr))' }}
                >
                  {/* Columna de horas (vertical) */}
                  <div className="flex flex-col items-end pr-2" style={{ height: totalCalendarHeight }}>
                    {hoursLabels.map((h) => (
                      <div
                        key={h}
                        className="text-xs text-gray-500 pr-1 leading-5"
                        style={{ height: HOUR_HEIGHT }}
                      >
                        {`${h}:00`}
                      </div>
                    ))}
                  </div>

                  {/* Grid de dias */}
                  {weekDays.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className="relative border border-gray-100 rounded-lg bg-white"
                      style={{ height: totalCalendarHeight }}
                    >
                      {/* Lineas de hora */}
                      <div className="absolute inset-0">
                        {hoursLabels.map((h) => (
                          <div
                            key={h}
                            className="border-t border-gray-100"
                            style={{ height: HOUR_HEIGHT }}
                          />
                        ))}
                      </div>

                      {/* Eventos */}
                      <div className="relative h-full">
                        {eventosPorDia[dayIdx].map((ev) => {
                          const startMinutes = parseTimeToMinutes(ev.hora_inicio);
                          const endMinutes = parseTimeToMinutes(ev.hora_termino);
                          const topMinutes = Math.max(startMinutes, START_HOUR * 60);
                          const bottomMinutes = Math.min(endMinutes, END_HOUR * 60);
                          const durationMinutes = Math.max(bottomMinutes - topMinutes, 30);
                          const topPx =
                            ((topMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                          const heightPx = (durationMinutes / 60) * HOUR_HEIGHT;
                          const entrenadorNombre =
                            typeof ev.entrenador === 'string'
                              ? ev.entrenador
                              : entrenadores.find((e) => String(e.id) === String(ev.entrenador))?.name ||
                                'Sin entrenador';

                          return (
                            <div
                              key={ev.id}
                              className="absolute left-2 right-2 rounded-md shadow-sm border border-gray-100 text-xs text-gray-900 overflow-hidden"
                              style={{
                                top: topPx,
                                height: heightPx,
                                backgroundColor: ev.color || '#FCD34D',
                              }}
                            >
                              <div className="px-2 py-1 font-semibold text-sm truncate">
                                Equipo: {ev.equipo_nombre}
                              </div>
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
                                  {entrenadorNombre}
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
        </TabsContent>

        {/* VISTA LISTA */}
        <TabsContent value="lista" className="mt-4">
          <Card className="mb-3">
            <CardContent className="flex items-center justify-between py-3">
              <Button variant="outline" size="sm" onClick={() => setWeekStart((prev) => addDays(prev, -7))}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="text-sm text-gray-700">
                Semana: <span className="font-semibold text-gray-900">{formatWeekRange()}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setWeekStart((prev) => addDays(prev, 7))}>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {horariosAgrupados.map((group, idx) => (
              <Card key={`${group.label}-${idx}`} className="border border-yellow-100">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{group.label}</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      {group.items.length} horario{group.items.length !== 1 && 's'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.items.map((horario) => (
                    <div
                      key={horario.id}
                      className="p-3 rounded-lg border border-gray-100 bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{horario.equipo_nombre}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatHora(horario.hora_inicio)} - {formatHora(horario.hora_termino)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {horario.lugar}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditarHorario(horario)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleEliminarHorario(horario.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOG NUEVO HORARIO */}
      <Dialog
        open={showNuevoHorario}
        onOpenChange={(open) => {
          setShowNuevoHorario(open);
          if (!open) resetFormulario();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Horario</DialogTitle>
            <DialogDescription>Define dia, horas y equipo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Equipo</Label>
                <Select
                  value={nuevoHorario.equipo}
                  onValueChange={(v) => setNuevoHorario({ ...nuevoHorario, equipo: v })}
                >
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
                <Label>Entrenador (opcional)</Label>
                <Select
                  value={nuevoHorario.entrenador}
                  onValueChange={(v) => setNuevoHorario({ ...nuevoHorario, entrenador: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona entrenador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin entrenador</SelectItem>
                    {entrenadores.map((ent) => (
                      <SelectItem key={ent.id} value={String(ent.id)}>
                        {ent.name || ent.email || `Entrenador ${ent.id}`}
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
                  onChange={(e) => actualizarDiaDesdeFecha(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se usara el dia de la semana seleccionado ({DIAS_SEMANA[nuevoHorario.dia_semana]}) para
                  el horario.
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
                <Label>Hora termino</Label>
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
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={handleCrearHorario}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG EDITAR */}
      <Dialog open={showEditarHorario} onOpenChange={setShowEditarHorario}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Horario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Equipo</Label>
                <Select
                  value={nuevoHorario.equipo}
                  onValueChange={(v) => setNuevoHorario({ ...nuevoHorario, equipo: v })}
                >
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
                <Label>Entrenador (opcional)</Label>
                <Select
                  value={nuevoHorario.entrenador}
                  onValueChange={(v) => setNuevoHorario({ ...nuevoHorario, entrenador: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona entrenador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin entrenador</SelectItem>
                    {entrenadores.map((ent) => (
                      <SelectItem key={ent.id} value={String(ent.id)}>
                        {ent.name || ent.email || `Entrenador ${ent.id}`}
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
                  onChange={(e) => actualizarDiaDesdeFecha(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se usara el dia de la semana seleccionado ({DIAS_SEMANA[nuevoHorario.dia_semana]}) para
                  el horario.
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
                <Label>Hora termino</Label>
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
            <Button
              className="bg-yellow-400 text-black hover:bg-yellow-500"
              onClick={handleActualizarHorario}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
