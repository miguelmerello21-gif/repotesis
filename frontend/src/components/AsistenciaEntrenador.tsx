import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { UserCheck, Calendar, Clock, MapPin, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../contexts/AuthContext';
import { atletasService, horariosService } from '../api';

interface HorarioDTO {
  id: number;
  equipo: number;
  equipo_nombre: string;
  entrenador?: any;
  lugar: string;
  dia_semana: number;
  hora_inicio: string;
  hora_termino: string;
  color: string;
  activo: boolean;
  fecha?: string | null;
}

interface AtletaDTO {
  id: number;
  nombre_completo: string;
  division?: string;
  categoria?: string;
  nivel?: string | number;
  equipo?: number;
}

interface AsistenciaDTO {
  id: number;
  atleta: number;
  atleta_nombre: string;
  fecha: string;
  presente: boolean;
  metodo: string;
  hora_registro: string;
}

interface AsistenciaEntrenadorProps {
  equiposAsignados: string[];
  atletasAsignados?: AtletaDTO[];
}

const parseLocalDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const AsistenciaEntrenador: React.FC<AsistenciaEntrenadorProps> = ({
  equiposAsignados,
  atletasAsignados,
}) => {
  const { user } = useAuth();

  const safeMsg = (err: any, fallback: string) => {
    if (typeof err === 'string') return err;
    const pick = err?.message || err?.error || err?.detail;
    if (typeof pick === 'string') return pick;
    if (pick) return JSON.stringify(pick);
    return fallback;
  };

  const normalizarAtletas = (lista: any[] = []): AtletaDTO[] =>
    (lista || []).map((a: any) => {
      const nombre =
        a.nombre_completo ||
        [a.nombres, a.apellidos].filter(Boolean).join(' ').trim() ||
        a.nombre ||
        '';
      return { ...a, nombre_completo: nombre };
    });

  const idsAsignados = (equiposAsignados || []).map((e: any) => String((e as any)?.id ?? e));

  const [horarios, setHorarios] = useState<HorarioDTO[]>([]);
  const [atletasPorEquipo, setAtletasPorEquipo] = useState<Record<number, AtletaDTO[]>>({});
  const [misAtletasCache, setMisAtletasCache] = useState<AtletaDTO[]>([]);
  const [asistenciasPorHorario, setAsistenciasPorHorario] = useState<Record<number, AsistenciaDTO[]>>({});
  const [showTomarAsistencia, setShowTomarAsistencia] = useState(false);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<HorarioDTO | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(new Date().toISOString().split('T')[0]);
  const [busquedaAtleta, setBusquedaAtleta] = useState('');
  const [filtroEquipo, setFiltroEquipo] = useState<string>('todos');
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay(); // 0 domingo
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    cargarHorarios();
    cargarMisAtletas();
  }, [equiposAsignados, atletasAsignados]);

  const cargarMisAtletas = async () => {
    if (atletasAsignados && atletasAsignados.length > 0) {
      setMisAtletasCache(normalizarAtletas(atletasAsignados));
      return;
    }
    const resp = await atletasService.listarAtletas?.();
    if (resp?.success) {
      setMisAtletasCache(normalizarAtletas(resp.data || []));
    }
  };

  const cargarHorarios = async () => {
    const resp = await horariosService.listarHorarios();
    if (resp?.success) {
      const todos = resp.data || [];
      const filtrados = todos.filter(
        (h: HorarioDTO) =>
          idsAsignados.includes(String(h.equipo)) || (user && String(h.entrenador) === String(user.id))
      );
      setHorarios(filtrados);
    } else {
      toast.error(safeMsg(resp, 'No se pudieron cargar los horarios'));
    }
  };

  const cargarAtletasEquipo = async (equipoId: number, force = false) => {
    const cached = atletasPorEquipo[equipoId];
    if (!force && Array.isArray(cached) && cached.length > 0) return;

    // 1) Cache local de misAtletas
    const cacheFiltrado = misAtletasCache.filter((a: any) => {
      const eqId = a.equipo?.id ?? a.equipo ?? a.equipo_id;
      return String(eqId) === String(equipoId);
    });
    if (cacheFiltrado.length > 0) {
      setAtletasPorEquipo((prev) => ({ ...prev, [equipoId]: normalizarAtletas(cacheFiltrado) }));
      return;
    }

    // 2) Endpoint dedicado por equipo
    try {
      const respEquipo = await atletasService.listarAtletasPorEquipo?.(equipoId);
      if (respEquipo?.success) {
        setAtletasPorEquipo((prev) => ({ ...prev, [equipoId]: normalizarAtletas(respEquipo.data || []) }));
        return;
      }
    } catch {
      // fallback
    }

    // 3) Filtro por query param
    try {
      const resp = await atletasService.listarAtletas?.({ equipo: equipoId });
      if (resp?.success) {
        setAtletasPorEquipo((prev) => ({ ...prev, [equipoId]: normalizarAtletas(resp.data || []) }));
        return;
      }
    } catch {
      // fallback
    }

    // 4) Último recurso: lista completa y filtrar
    const respAll = await atletasService.listarAtletas?.();
    if (respAll?.success) {
      const lista = (respAll.data || []).filter((a: any) => String(a.equipo) === String(equipoId));
      setAtletasPorEquipo((prev) => ({ ...prev, [equipoId]: normalizarAtletas(lista) }));
    } else {
      setAtletasPorEquipo((prev) => ({ ...prev, [equipoId]: [] }));
    }
  };

  const cargarAsistenciasHorario = async (horarioId: number) => {
    const resp = await horariosService.listarAsistencias?.(horarioId);
    if (resp?.success) {
      setAsistenciasPorHorario((prev) => ({ ...prev, [horarioId]: resp.data || [] }));
    }
  };

  const abrirAsistencia = async (h: HorarioDTO) => {
    setHorarioSeleccionado(h);
    const fecha = h.fecha || new Date().toISOString().split('T')[0];
    setFechaSeleccionada(fecha);
    await Promise.all([cargarAtletasEquipo(h.equipo, true), cargarAsistenciasHorario(h.id)]);
    setShowTomarAsistencia(true);
  };

  const registrar = async (atletaId: number, presente: boolean) => {
    if (!horarioSeleccionado) return;
    const payload = {
      atleta: atletaId,
      fecha: fechaSeleccionada,
      presente,
      metodo: 'manual',
    };
    const resp = await horariosService.registrarAsistencia(horarioSeleccionado.id, payload);
    if (resp?.success) {
      toast.success('Asistencia registrada');
      // Actualizar estado local para reflejar de inmediato
      setAsistenciasPorHorario((prev) => {
        const current = prev[horarioSeleccionado.id] || [];
        const updated = [...current];
        const idx = updated.findIndex(
          (r) => r.atleta === atletaId && r.fecha === fechaSeleccionada
        );
        const nuevoRegistro = {
          id: resp.data?.id || Date.now(),
          horario: horarioSeleccionado.id,
          atleta: atletaId,
          fecha: fechaSeleccionada,
          presente,
          metodo: 'manual',
          hora_registro: resp.data?.hora_registro || new Date().toISOString(),
          atleta_nombre:
            updated[idx]?.atleta_nombre ||
            (atletasPorEquipo[horarioSeleccionado.equipo]?.find((a) => a.id === atletaId)?.nombre_completo || ''),
        };
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], presente, metodo: 'manual' };
        } else {
          updated.push(nuevoRegistro as any);
        }
        return { ...prev, [horarioSeleccionado.id]: updated };
      });
      // Refrescamos desde backend para mantener consistencia (no bloqueante)
      cargarAsistenciasHorario(horarioSeleccionado.id);
    } else {
      toast.error(safeMsg(resp, 'No se pudo registrar asistencia'));
    }
  };

  const estadoAsistencia = (atletaId: number) => {
    if (!horarioSeleccionado) return null;
    const lista = asistenciasPorHorario[horarioSeleccionado.id] || [];
    const reg = lista.find((r) => r.atleta === atletaId && r.fecha === fechaSeleccionada);
    return reg ? reg.presente : null;
  };

  const resumenAsistencia = useMemo(() => {
    if (!horarioSeleccionado) return { presentes: 0, ausentes: 0, sinMarcar: 0 };
    const lista = atletasPorEquipo[horarioSeleccionado.equipo] || [];
    const asistencias = asistenciasPorHorario[horarioSeleccionado.id] || [];
    let presentes = 0;
    let ausentes = 0;
    lista.forEach((a) => {
      const reg = asistencias.find((r) => r.atleta === a.id && r.fecha === fechaSeleccionada);
      if (reg && reg.presente === true) presentes += 1;
      else if (reg && reg.presente === false) ausentes += 1;
    });
    const sinMarcar = lista.length - presentes - ausentes;
    return { presentes, ausentes, sinMarcar: sinMarcar < 0 ? 0 : sinMarcar };
  }, [horarioSeleccionado, atletasPorEquipo, asistenciasPorHorario, fechaSeleccionada]);

  const horariosFiltrados = useMemo(() => {
    let hs = horarios;
    if (filtroEquipo !== 'todos') {
      hs = hs.filter((h) => String(h.equipo) === filtroEquipo);
    }
    const finSemana = new Date(weekStart);
    finSemana.setDate(finSemana.getDate() + 6);
    hs = hs.filter((h) => {
      if (!h.fecha) return true; // sin fecha específica, se muestran siempre
      const f = parseLocalDate(h.fecha);
      f.setHours(0, 0, 0, 0);
      return f >= weekStart && f <= finSemana;
    });
    const ordenDia = (dia: number) => {
      // Lunes a sábado primero; domingo al final
      if (dia === 0) return 6;
      if (dia < 0 || dia > 6) return 7;
      return dia - 1;
    };
    const byDay = new Map<number, HorarioDTO[]>();
    hs.forEach((h) => {
      const key = h.fecha ? parseLocalDate(h.fecha).getDay() : h.dia_semana;
      const list = byDay.get(key) || [];
      list.push(h);
      byDay.set(key, list);
    });
    return Array.from(byDay.entries())
      .sort((a, b) => ordenDia(a[0]) - ordenDia(b[0]))
      .map(([day, items]) => ({
        day,
        items: items.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
      }));
  }, [horarios, filtroEquipo, weekStart]);

  const moverSemana = (deltaDias: number) => {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + deltaDias);
      const day = next.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      next.setDate(next.getDate() + diff);
      next.setHours(0, 0, 0, 0);
      return next;
    });
  };

  const semanaLabel = useMemo(() => {
    const fin = new Date(weekStart);
    fin.setDate(fin.getDate() + 6);
    const fmt = (d: Date) => {
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${d.getDate()} ${meses[d.getMonth()]}`;
    };
    return `${fmt(weekStart)} - ${fmt(fin)}`;
  }, [weekStart]);

  const atletasFiltrados = useMemo(() => {
    if (!horarioSeleccionado) return [];
    const lista = atletasPorEquipo[horarioSeleccionado.equipo] || [];
    const term = busquedaAtleta.toLowerCase();
    return lista.filter((a) => (a.nombre_completo || '').toLowerCase().includes(term));
  }, [horarioSeleccionado, atletasPorEquipo, busquedaAtleta]);

  const formatHora = (hora: string) => {
    if (!hora) return '00:00';
    const [h, m = '00'] = hora.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  };

  const formatFecha = (f?: string | null) => {
    if (!f) return 'Sin fecha';
    if (/^\d{4}-\d{2}-\d{2}$/.test(f)) {
      const [y, m, d] = f.split('-');
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const idx = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
      return `${parseInt(d, 10)} ${meses[idx]} ${y}`;
    }
    // fallback a Date solo si viene con tiempo
    const dObj = new Date(f);
    if (Number.isNaN(dObj.getTime())) return f;
    return dObj.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => moverSemana(-7)}>
            ←
          </Button>
          <div>
            <h2 className="flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-yellow-400" />
              Asistencia de mis equipos
            </h2>
            <p className="text-gray-600 text-sm">Semana: <span className="font-semibold">{semanaLabel}</span></p>
          </div>
          <Button variant="outline" size="icon" onClick={() => moverSemana(7)}>
            →
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">Filtrar equipo:</p>
          <Select value={filtroEquipo} onValueChange={setFiltroEquipo}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar equipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Todos
                </div>
              </SelectItem>
              {idsAsignados.map((id) => (
                <SelectItem key={id} value={String(id)}>
                  Equipo {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {horariosFiltrados.map(({ day, items }) => (
          <Card key={`day-${day}`} className="border border-yellow-100">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-50 text-yellow-700" variant="outline">
                  {DIAS_SEMANA[day]}
                </Badge>
                <span className="text-sm text-gray-600">
                  {items[0]?.fecha ? formatFecha(items[0].fecha) : 'Evento semanal'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-col gap-2 p-3 rounded-lg border bg-white shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold">{h.equipo_nombre}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="w-4 h-4" />
                        {formatHora(h.hora_inicio)} - {formatHora(h.hora_termino)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin className="w-4 h-4" />
                        {h.lugar}
                      </div>
                    </div>
                    <Button
                      className="bg-yellow-400 text-black hover:bg-yellow-500 px-4"
                      onClick={() => abrirAsistencia(h)}
                    >
                      Tomar asistencia
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        {horariosFiltrados.length === 0 && (
          <p className="text-sm text-gray-500">No hay horarios asignados.</p>
        )}
      </div>

      <Dialog open={showTomarAsistencia} onOpenChange={setShowTomarAsistencia}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tomar asistencia</DialogTitle>
            <DialogDescription>
              {horarioSeleccionado
                ? horarioSeleccionado.fecha
                  ? `Fecha: ${formatFecha(horarioSeleccionado.fecha)}`
                  : `Evento semanal: ${DIAS_SEMANA[horarioSeleccionado.dia_semana]}`
                : 'Selecciona un horario'}
            </DialogDescription>
          </DialogHeader>

          {horarioSeleccionado && (
            <div className="space-y-4">
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-semibold">{horarioSeleccionado.equipo_nombre}</p>
                    <p className="text-sm text-gray-700">
                      {DIAS_SEMANA[horarioSeleccionado.dia_semana]} {formatHora(horarioSeleccionado.hora_inicio)} -{' '}
                      {formatHora(horarioSeleccionado.hora_termino)}
                    </p>
                  </div>
                  <div className="text-sm text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <Input
                      type="date"
                      value={fechaSeleccionada}
                      readOnly
                      disabled
                      className="w-40 bg-gray-100 text-gray-700"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-2 rounded-md bg-green-50 text-green-700 border border-green-200">
                  Presentes: <strong>{resumenAsistencia.presentes}</strong>
                </span>
                <span className="px-3 py-2 rounded-md bg-red-50 text-red-700 border border-red-200">
                  Ausentes: <strong>{resumenAsistencia.ausentes}</strong>
                </span>
                <span className="px-3 py-2 rounded-md bg-gray-50 text-gray-700 border border-gray-200">
                  Sin marcar: <strong>{resumenAsistencia.sinMarcar}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Buscar atleta"
                  value={busquedaAtleta}
                  onChange={(e) => setBusquedaAtleta(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
                {atletasFiltrados.map((a) => {
                  const estado = estadoAsistencia(a.id);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-white shadow-sm"
                    >
                      <div>
                        <p className="font-medium">{a.nombre_completo}</p>
                        <p className="text-xs text-gray-500">
                          {a.division || ''} {a.categoria || ''} {a.nivel ? `Nivel ${a.nivel}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {estado === null && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              onClick={() => registrar(a.id, true)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              onClick={() => registrar(a.id, false)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {estado === true && (
                          <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Presente
                          </span>
                        )}
                        {estado === false && (
                          <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-sm flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Ausente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {atletasFiltrados.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No hay atletas para este equipo.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
