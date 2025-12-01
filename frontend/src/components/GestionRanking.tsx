import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Trophy, Award, Star, Settings, Trash2, Eye, Users, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { rankingService, atletasService, equiposService, horariosService } from '../api';

interface CriterioRanking {
  id: string;
  nombre: string;
  ponderacion: number;
  descripcion: string;
  activo: boolean;
}

interface Logro {
  id: string;
  atletaId: string;
  titulo: string;
  descripcion: string;
  puntos: number;
  fecha: string;
  tipo: 'competencia' | 'entrenamiento' | 'actitud' | 'otro';
}

interface Evaluacion {
  id: string;
  atletaId: string;
  evaluadorId?: string;
  evaluadorNombre?: string;
  categoria: 'tecnica' | 'actitud' | 'esfuerzo' | 'liderazgo';
  puntuacion: number;
  comentarios: string;
  fecha: string;
}

interface PuntuacionAtleta {
  atletaId: string | number;
  atletaNombre: string;
  equipoNombre: string;
  equipoId?: string | number | null;
  puntuacionAsistencia: number;
  puntuacionLogros: number;
  puntuacionEvaluaciones: number;
  puntuacionComportamiento: number;
  entrenamientosAsistidos: number;
  entrenamientosTotales: number;
  logrosCompetencia: number;
  puntuacionTotal: number;
  posicion: number;
}

interface RankingRecord {
  id: number;
  atleta: number;
  atleta_nombre: string;
  posicion: number;
  posicion_anterior: number | null;
  puntos_totales: number;
  puntos_mes: number;
  entrenamientos_asistidos: number;
  entrenamientos_totales: number;
  porcentaje_asistencia: number;
  competencias_participadas: number;
  medallas_oro: number;
  medallas_plata: number;
  medallas_bronce: number;
  ultima_actualizacion: string;
  tendencia?: string;
}

interface AtletaLite {
  id: number;
  nombres: string;
  apellidos: string;
  division?: string;
  categoria?: string;
  nivel?: number;
  equipo_nombre?: string;
  equipo?: number | null;
  equipo_id?: number | null;
}

interface ConfiguracionRanking {
  criterios: CriterioRanking[];
  rangoFechas: number;
  visibilidadPublica: boolean;
  mostrarPuntajes: boolean;
  topPublico: number;
}

const defaultConfig: ConfiguracionRanking = {
  criterios: [
    { id: 'asistencia', nombre: 'Asistencia', ponderacion: 40, descripcion: 'Porcentaje de asistencia a entrenamientos', activo: true },
    { id: 'logros', nombre: 'Logros Deportivos', ponderacion: 30, descripcion: 'Competencias y reconocimientos', activo: true },
    { id: 'evaluaciones', nombre: 'Evaluaciones Tecnicas', ponderacion: 20, descripcion: 'Evaluaciones de entrenadores', activo: true },
    { id: 'comportamiento', nombre: 'Actitud y Comportamiento', ponderacion: 10, descripcion: 'Conducta y compromiso', activo: true },
  ],
  rangoFechas: 90,
  visibilidadPublica: true,
  mostrarPuntajes: true,
  topPublico: 20,
};

const nombreAtleta = (a: AtletaLite) => `${a.nombres ?? ''} ${a.apellidos ?? ''}`.trim() || `Atleta #${a.id}`;

const medalla = (pos: number) => {
  if (pos === 1) return { label: '#1', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300' };
  if (pos === 2) return { label: '#2', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-300' };
  if (pos === 3) return { label: '#3', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-300' };
  return { label: `${pos}`, color: 'text-gray-600', bg: 'bg-white', border: 'border-gray-200' };
};

export const GestionRanking: React.FC = () => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionRanking>(defaultConfig);
  const [logros, setLogros] = useState<Logro[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [rankingServer, setRankingServer] = useState<RankingRecord[]>([]);
  const [rankingCalculado, setRankingCalculado] = useState<PuntuacionAtleta[]>([]);
  const [atletas, setAtletas] = useState<AtletaLite[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [loadingAsistencias, setLoadingAsistencias] = useState(false);

  const [showConfiguracion, setShowConfiguracion] = useState(false);
  const [showAgregarLogro, setShowAgregarLogro] = useState(false);
  const [showAgregarEvaluacion, setShowAgregarEvaluacion] = useState(false);
  const [showRankingPublico, setShowRankingPublico] = useState(false);
  const [filtroEquipo, setFiltroEquipo] = useState<string>('todos');

  const [nuevoLogro, setNuevoLogro] = useState({
    atletaId: '',
    titulo: '',
    descripcion: '',
    puntos: 10,
    tipo: 'competencia' as const,
  });
  const [nuevaEvaluacion, setNuevaEvaluacion] = useState({
    atletaId: '',
    categoria: 'tecnica' as const,
    puntuacion: 8,
    comentarios: '',
  });

  useEffect(() => {
    cargarConfig();
    fetchCatalogos();
    fetchRanking();
    fetchLogros();
    fetchEvaluaciones();
  }, []);

  useEffect(() => {
    if (loadingAsistencias) return;
    calcularRanking();
  }, [configuracion, logros, evaluaciones, atletas, filtroEquipo, asistencias, loadingAsistencias]);
  useEffect(() => {
    if (atletas.length) {
      fetchAsistencias();
    }
  }, [atletas, configuracion.rangoFechas]);


  const cargarConfig = () => {
    try {
      const savedConfig = localStorage.getItem('configuracionRanking');
      if (savedConfig) setConfiguracion(JSON.parse(savedConfig));
    } catch {
      // ignore
    }
  };

  const fetchCatalogos = async () => {
    const [eqResp, atResp] = await Promise.all([equiposService.listarEquipos?.(), atletasService.listarAtletas?.()]);
    if (eqResp?.success && Array.isArray(eqResp.data)) setEquipos(eqResp.data);
    if (atResp?.success && Array.isArray(atResp.data)) setAtletas(atResp.data);
  };

  const fetchRanking = async () => {
    setLoading(true);
    const resp = await rankingService.obtenerRanking();
    if (resp.success && Array.isArray(resp.data)) {
      const ordenado = [...resp.data].sort((a: any, b: any) => (a.posicion ?? 9999) - (b.posicion ?? 9999));
      const normalizado = normalizarBackend(ordenado);
      setRankingServer(normalizado as any);
      try {
        localStorage.setItem('ranking_cache', JSON.stringify(normalizado));
      } catch {
        // ignore
      }
    } else {
      toast.error('No se pudo cargar el ranking desde el servidor');
    }
    setLoading(false);
  };

  const fetchLogros = async () => {
    const resp = await rankingService.listarLogros();
    if (resp.success && Array.isArray(resp.data)) {
      setLogros(
        resp.data.map((l: any) => ({
          id: String(l.id),
          atletaId: String(l.atleta),
          titulo: l.titulo,
          descripcion: l.descripcion || '',
          puntos: Number(l.puntos || 0),
          fecha: l.fecha,
          tipo: l.tipo,
        })),
      );
    }
  };

  const fetchEvaluaciones = async () => {
    const resp = await rankingService.listarEvaluaciones();
    if (resp.success && Array.isArray(resp.data)) {
      setEvaluaciones(
        resp.data.map((e: any) => ({
          id: String(e.id),
          atletaId: String(e.atleta),
          evaluadorId: e.evaluador ? String(e.evaluador) : undefined,
          evaluadorNombre: e.evaluador_nombre,
          categoria: e.categoria,
          puntuacion: Number(e.puntuacion || 0),
          comentarios: e.comentarios || '',
          fecha: e.fecha,
        })),
      );
    }
  };

  const fetchAsistencias = async () => {
    if (!atletas.length) {
      setAsistencias([]);
      return;
    }
    setLoadingAsistencias(true);
    const hoy = new Date();
    const fecha_fin = hoy.toISOString().slice(0, 10);
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - configuracion.rangoFechas);
    const fecha_inicio = inicio.toISOString().slice(0, 10);
    const resp = await horariosService.listarAsistenciasGeneral?.({ desde: fecha_inicio, hasta: fecha_fin });
    if (resp?.success && Array.isArray(resp.data)) {
      setAsistencias(resp.data);
    } else {
      setAsistencias([]);
      if (resp?.error) {
        toast.error(resp.error?.message || 'No se pudo cargar asistencia');
      }
    }
    setLoadingAsistencias(false);
  };

  const saveConfiguracion = (config: ConfiguracionRanking) => {
    localStorage.setItem('configuracionRanking', JSON.stringify(config));
    setConfiguracion(config);
  };

  const obtenerAsistencias = (atletaId: string | number) => {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - configuracion.rangoFechas);
    const registros = asistencias.filter(
      (a: any) => String(a.atleta) === String(atletaId) && new Date(a.fecha) >= fechaLimite,
    );
    const presentes = registros.filter((r: any) => r.presente).length;
    return { registros, presentes };
  };

  const calcularRanking = (): PuntuacionAtleta[] => {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - configuracion.rangoFechas);

    const atletasFiltrados =
      filtroEquipo === 'todos' ? atletas : atletas.filter((a) => `${a.equipo ?? a.equipo_id ?? ''}` === filtroEquipo);
    const criteriosActivos = configuracion.criterios.filter((c) => c.activo);
    const sumaPonderaciones = criteriosActivos.reduce((sum, c) => sum + c.ponderacion, 0) || 1;

    const calculado: PuntuacionAtleta[] = atletasFiltrados.map((atleta) => {
      const { registros, presentes } = obtenerAsistencias(atleta.id);
      const totalRegistros = registros.length;
      const puntuacionAsistencia = totalRegistros ? (presentes / totalRegistros) * 100 : 0;

      const logrosAtleta = logros.filter((l) => l.atletaId === String(atleta.id) && new Date(l.fecha) >= fechaLimite);
      const totalPuntosLogros = logrosAtleta.reduce((sum, l) => sum + l.puntos, 0);
      const puntuacionLogros = Math.min((totalPuntosLogros / 200) * 100, 100);

      const evaluacionesAtleta = evaluaciones.filter(
        (e) => e.atletaId === String(atleta.id) && new Date(e.fecha) >= fechaLimite,
      );
      const promedioEvaluaciones = evaluacionesAtleta.length
        ? evaluacionesAtleta.reduce((sum, e) => sum + e.puntuacion, 0) / evaluacionesAtleta.length
        : 0;
      const puntuacionEvaluaciones = (promedioEvaluaciones / 10) * 100;

      const evaluacionesActitud = evaluacionesAtleta.filter((e) =>
        ['actitud', 'esfuerzo', 'liderazgo'].includes(e.categoria),
      );
      const promedioActitud = evaluacionesActitud.length
        ? evaluacionesActitud.reduce((sum, e) => sum + e.puntuacion, 0) / evaluacionesActitud.length
        : 7;
      const puntuacionComportamiento = (promedioActitud / 10) * 100;

      let puntuacionTotal = 0;
      configuracion.criterios.forEach((criterio) => {
        if (!criterio.activo) return;
        let val = 0;
        if (criterio.id === 'asistencia') val = puntuacionAsistencia;
        if (criterio.id === 'logros') val = puntuacionLogros;
        if (criterio.id === 'evaluaciones') val = puntuacionEvaluaciones;
        if (criterio.id === 'comportamiento') val = puntuacionComportamiento;
        puntuacionTotal += (val * criterio.ponderacion) / sumaPonderaciones;
      });

      const equipoNombre =
        equipos.find((e) => e.id === (atleta.equipo ?? atleta.equipo_id))?.nombre || atleta.equipo_nombre || 'Sin equipo';

      return {
        atletaId: atleta.id,
        atletaNombre: nombreAtleta(atleta),
        equipoNombre,
        equipoId: atleta.equipo ?? atleta.equipo_id,
        puntuacionAsistencia,
        puntuacionLogros,
        puntuacionEvaluaciones,
        puntuacionComportamiento,
        entrenamientosAsistidos: presentes,
        entrenamientosTotales: totalRegistros,
        logrosCompetencia: logrosAtleta.filter((l) => l.tipo === 'competencia').length,
        puntuacionTotal,
        posicion: 0,
      };
    });

    calculado.sort((a, b) => b.puntuacionTotal - a.puntuacionTotal);
    calculado.forEach((p, idx) => (p.posicion = idx + 1));
    setRankingCalculado(calculado);
    return calculado;
  };

  const sincronizarConBackend = async (silent: boolean = false) => {
    const calculado = calcularRanking();
    if (!calculado.length) {
      if (!silent) toast.error('No hay atletas para calcular el ranking');
      return;
    }

    setSyncing(true);
    try {
      const mapExistentes = new Map<number, RankingRecord>();
      rankingServer.forEach((r) => mapExistentes.set(r.atleta, r));

      await Promise.all(
        calculado.map(async (r) => {
          const existente = mapExistentes.get(Number(r.atletaId));
          const payload = {
            atleta: r.atletaId,
            posicion: r.posicion,
            posicion_anterior: existente?.posicion ?? null,
            puntos_totales: Math.round(r.puntuacionTotal),
            puntos_mes: Math.round(r.puntuacionLogros),
            entrenamientos_asistidos: r.entrenamientosAsistidos,
            entrenamientos_totales: r.entrenamientosTotales,
            porcentaje_asistencia: Number(r.puntuacionAsistencia.toFixed(2)),
            competencias_participadas: r.logrosCompetencia,
            medallas_oro: existente?.medallas_oro ?? 0,
            medallas_plata: existente?.medallas_plata ?? 0,
            medallas_bronce: existente?.medallas_bronce ?? 0,
          };

          const resp = existente
            ? await rankingService.actualizarRanking(existente.id, payload)
            : await rankingService.crearActualizarRanking(payload);

          if (!resp?.success) {
            throw new Error(resp?.error?.message || 'No se pudo sincronizar');
          }
        }),
      );

      if (!silent) toast.success('Informacion actualizada');
      fetchRanking();
      try {
        const cachePayload = normalizarBackend(rankingLocalRecords);
        localStorage.setItem('ranking_cache', JSON.stringify(cachePayload));
      } catch {
        // ignore
      }
    } catch (e: any) {
      if (!silent) toast.error(e?.message || 'No se pudo actualizar la informacion');
    } finally {
      setSyncing(false);
    }
  };

  const rankingLocalRecords = useMemo(
    () =>
      rankingCalculado.map((r) => ({
        id: Number(r.atletaId),
        atleta: Number(r.atletaId),
        atleta_nombre: r.atletaNombre,
        posicion: r.posicion,
        posicion_anterior: null,
        puntos_totales: Math.round(r.puntuacionTotal),
        puntos_mes: Math.round(r.puntuacionLogros),
        entrenamientos_asistidos: r.entrenamientosAsistidos,
        entrenamientos_totales: r.entrenamientosTotales,
        porcentaje_asistencia: Number(r.puntuacionAsistencia.toFixed(2)),
        competencias_participadas: r.logrosCompetencia,
        medallas_oro: 0,
        medallas_plata: 0,
        medallas_bronce: 0,
        ultima_actualizacion: new Date().toISOString(),
        tendencia: undefined,
        equipo_nombre: r.equipoNombre,
      })),
    [rankingCalculado],
  );

  const rankingFuente = useMemo(
    () => (rankingLocalRecords.length ? rankingLocalRecords : rankingServer),
    [rankingLocalRecords, rankingServer],
  );

  const normalizarBackend = (data: any[]) =>
    data.map((r: any) => ({
      id: r.id ?? r.atleta ?? r.atletaId,
      atleta: r.atleta ?? r.atletaId ?? r.id,
      atleta_nombre: r.atleta_nombre ?? r.atletaNombre ?? `Atleta #${r.atleta ?? r.id ?? ''}`,
      equipo_nombre: r.equipo_nombre ?? r.equipoNombre ?? 'Sin equipo',
      posicion: r.posicion ?? 0,
      puntos_totales: Number(r.puntos_totales ?? r.puntuacionTotal ?? 0),
      puntos_mes: r.puntos_mes ?? r.puntuacionLogros ?? 0,
      entrenamientos_asistidos: r.entrenamientos_asistidos ?? 0,
      entrenamientos_totales: r.entrenamientos_totales ?? 0,
      porcentaje_asistencia: r.porcentaje_asistencia ?? 0,
      competencias_participadas: r.competencias_participadas ?? r.logrosCompetencia ?? 0,
      medallas_oro: r.medallas_oro ?? 0,
      medallas_plata: r.medallas_plata ?? 0,
      medallas_bronce: r.medallas_bronce ?? 0,
      ultima_actualizacion: r.ultima_actualizacion ?? new Date().toISOString(),
      tendencia: r.tendencia,
    }));

  const rankingOrdenado = useMemo(() => {
    const score = (at: RankingRecord) => at.puntos_totales ?? 0;
    return [...rankingFuente].sort((a, b) => score(b) - score(a));
  }, [rankingFuente]);

  const obtenerColorPuntuacion = (p: number) => {
    if (p >= 85) return 'text-green-600';
    if (p >= 70) return 'text-blue-600';
    if (p >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAgregarLogro = async () => {
    if (!nuevoLogro.atletaId || !nuevoLogro.titulo) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    const resp = await rankingService.crearLogro({
      atleta: nuevoLogro.atletaId,
      titulo: nuevoLogro.titulo,
      descripcion: nuevoLogro.descripcion,
      puntos: nuevoLogro.puntos,
      tipo: nuevoLogro.tipo,
    });
    if (!resp.success) {
      toast.error('No se pudo crear el logro');
      return;
    }
    await fetchLogros();
    toast.success('Logro agregado');
    setShowAgregarLogro(false);
    setNuevoLogro({ atletaId: '', titulo: '', descripcion: '', puntos: 10, tipo: 'competencia' });
    calcularRanking();
  };

  const handleAgregarEvaluacion = async () => {
    if (!nuevaEvaluacion.atletaId) {
      toast.error('Selecciona un atleta');
      return;
    }
    const resp = await rankingService.crearEvaluacion({
      atleta: nuevaEvaluacion.atletaId,
      categoria: nuevaEvaluacion.categoria,
      puntuacion: nuevaEvaluacion.puntuacion,
      comentarios: nuevaEvaluacion.comentarios,
    });
    if (!resp.success) {
      toast.error('No se pudo crear la evaluacion');
      return;
    }
    await fetchEvaluaciones();
    toast.success('Evaluacion agregada');
    setShowAgregarEvaluacion(false);
    setNuevaEvaluacion({ atletaId: '', categoria: 'tecnica', puntuacion: 8, comentarios: '' });
    calcularRanking();
  };

  const eliminarLogro = async (id: string) => {
    if (!confirm('Eliminar este logro?')) return;
    const resp = await rankingService.eliminarLogro(id);
    if (!resp.success) {
      toast.error('No se pudo eliminar el logro');
      return;
    }
    await fetchLogros();
    calcularRanking();
  };

  const eliminarEvaluacion = async (id: string) => {
    if (!confirm('Eliminar esta evaluacion?')) return;
    const resp = await rankingService.eliminarEvaluacion(id);
    if (!resp.success) {
      toast.error('No se pudo eliminar la evaluacion');
      return;
    }
    await fetchEvaluaciones();
    calcularRanking();
  };

  const getBreakdown = (atletaId: number | string) => rankingCalculado.find((r) => `${r.atletaId}` === `${atletaId}`);

  useEffect(() => {
    const id = setInterval(() => {
      sincronizarConBackend(true);
    }, 1000 * 60 * 60 * 5);
    return () => clearInterval(id);
  }, [rankingCalculado, configuracion, logros, evaluaciones, atletas, equipos]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Ranking de Desempeno
          </h2>
          <p className="text-gray-600">Calcula con criterios locales y se sincroniza cada 5 horas o al actualizar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRankingPublico(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Vista Publica
          </Button>
          <Button variant="outline" onClick={() => setShowConfiguracion(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button onClick={() => sincronizarConBackend(false)} disabled={syncing} className="bg-yellow-400 text-black hover:bg-yellow-500">
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Filtrar por Equipo</Label>
              <Select value={filtroEquipo} onValueChange={setFiltroEquipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Equipos</SelectItem>
                  {equipos.map((eq) => (
                    <SelectItem key={eq.id} value={`${eq.id}`}>
                      {eq.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <Button onClick={() => setShowAgregarLogro(true)} className="bg-yellow-400 text-black hover:bg-yellow-500">
                <Award className="w-4 h-4 mr-2" />
                Agregar Logro
              </Button>
              <Button onClick={() => setShowAgregarEvaluacion(true)} variant="outline">
                <Star className="w-4 h-4 mr-2" />
                Agregar Evaluacion
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ranking">Ranking General</TabsTrigger>
          <TabsTrigger value="logros">Logros</TabsTrigger>
          <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">Cargando ranking...</CardContent>
            </Card>
          ) : rankingFuente.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">Sin datos de ranking aun</CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {rankingOrdenado.map((atleta, idx) => {
                const displayPos = idx + 1;
                const med = medalla(displayPos);
                const breakdown = getBreakdown(atleta.atleta);
                return (
                  <Card key={atleta.id} className={`border-2 ${med.border} ${med.bg} transition-all hover:shadow-md`}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-full ${med.bg} border-2 ${med.border} flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-xl font-bold ${med.color}`}>{med.label}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg truncate">{atleta.atleta_nombre}</h3>
                            {displayPos <= 3 && <Badge className="bg-yellow-400 text-black">Top {displayPos}</Badge>}
                          </div>
                          <p className="text-sm text-gray-600">
                            {equipos.find((e) => e.id === breakdown?.equipoId)?.nombre || 'Sin equipo'}
                          </p>
              <div className="mt-3 space-y-1">
                {(() => {
                  const totalScore = Number(breakdown?.puntuacionTotal ?? atleta.puntos_totales ?? 0);
                  return (
                    <>
                      <div className="flex justify-between text-xs">
                        <span>Puntuacion Total</span>
                        <span className={`font-bold ${obtenerColorPuntuacion(totalScore)}`}>
                          {totalScore.toFixed(1)} pts
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            totalScore >= 85
                              ? 'bg-green-500'
                              : totalScore >= 70
                              ? 'bg-blue-500'
                              : totalScore >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, totalScore)}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-4 gap-3 flex-shrink-0">
              {configuracion.criterios
                .filter((c) => c.activo)
                .map((criterio) => {
                  let puntuacion = 0;
                  if (criterio.id === 'asistencia') puntuacion = breakdown?.puntuacionAsistencia ?? atleta.porcentaje_asistencia ?? 0;
                  if (criterio.id === 'logros') puntuacion = breakdown?.puntuacionLogros ?? atleta.puntos_mes ?? 0;
                  if (criterio.id === 'evaluaciones') puntuacion = breakdown?.puntuacionEvaluaciones ?? 0;
                  if (criterio.id === 'comportamiento') puntuacion = breakdown?.puntuacionComportamiento ?? 0;
                  const puntVal = Number(puntuacion ?? 0);
                  return (
                    <div key={criterio.id} className="text-center p-2 bg-white rounded border">
                      <p className="text-xs text-gray-600 mb-1">{criterio.nombre}</p>
                      <p className={`font-bold ${obtenerColorPuntuacion(puntVal)}`}>{puntVal.toFixed(0)}</p>
                      <p className="text-xs text-gray-500">{criterio.ponderacion}%</p>
                    </div>
                  );
                })}
            </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logros" className="space-y-4">
          {logros.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Award className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                No hay logros registrados
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logros.map((logro) => {
                const atleta = atletas.find((a) => `${a.id}` === logro.atletaId);
                return (
                  <Card key={logro.id} className="border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="bg-yellow-100 text-yellow-800 capitalize">{logro.tipo}</Badge>
                          <h4 className="font-bold mt-2">{logro.titulo}</h4>
                          <p className="text-sm text-gray-600">{logro.descripcion}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => eliminarLogro(logro.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {atleta ? nombreAtleta(atleta) : 'Atleta'}
                        <Badge variant="outline">+{logro.puntos} pts</Badge>
                      </div>
                      <div className="text-xs text-gray-500">Registrado el {new Date(logro.fecha).toLocaleDateString('es-CL')}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evaluaciones" className="space-y-4">
          {evaluaciones.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                No hay evaluaciones registradas
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluaciones.map((evalua) => {
                const atleta = atletas.find((a) => `${a.id}` === evalua.atletaId);
                return (
                  <Card key={evalua.id} className="border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="bg-blue-100 text-blue-800 capitalize">{evalua.categoria}</Badge>
                          <h4 className="font-bold mt-2">{atleta ? nombreAtleta(atleta) : 'Atleta'}</h4>
                          <p className="text-sm text-gray-600">{evalua.comentarios || 'Sin comentarios'}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => eliminarEvaluacion(evalua.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Puntuacion: <strong>{evalua.puntuacion}/10</strong>
                        <span className="text-xs text-gray-500">por {evalua.evaluadorNombre}</span>
                      </div>
                      <div className="text-xs text-gray-500">Registrado el {new Date(evalua.fecha).toLocaleDateString('es-CL')}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showConfiguracion} onOpenChange={setShowConfiguracion}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Configuracion del Ranking</DialogTitle>
            <DialogDescription>Ajusta ponderaciones y parametros de visibilidad.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Criterios y Ponderaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {configuracion.criterios.map((criterio, idx) => (
                  <div key={criterio.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={criterio.activo}
                          onCheckedChange={(checked) => {
                            const nuevos = [...configuracion.criterios];
                            nuevos[idx].activo = checked;
                            setConfiguracion({ ...configuracion, criterios: nuevos });
                          }}
                        />
                        <div>
                          <Label className="font-medium">{criterio.nombre}</Label>
                          <p className="text-xs text-gray-500">{criterio.descripcion}</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-yellow-600">{criterio.ponderacion}%</span>
                    </div>
                    {criterio.activo && (
                      <Slider
                        value={[criterio.ponderacion]}
                        onValueChange={(value) => {
                          const nuevos = [...configuracion.criterios];
                          nuevos[idx].ponderacion = value[0];
                          setConfiguracion({ ...configuracion, criterios: nuevos });
                        }}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    )}
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total de ponderaciones:</span>
                    <Badge
                      className={
                        configuracion.criterios.filter((c) => c.activo).reduce((sum, c) => sum + c.ponderacion, 0) === 100
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }
                    >
                      {configuracion.criterios.filter((c) => c.activo).reduce((sum, c) => sum + c.ponderacion, 0)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Las ponderaciones de criterios activos deben sumar 100%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuracion General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Periodo de Evaluacion (dias)</Label>
                    <Input
                      type="number"
                      value={configuracion.rangoFechas}
                      onChange={(e) => setConfiguracion({ ...configuracion, rangoFechas: parseInt(e.target.value) || 90 })}
                      min={7}
                      max={365}
                    />
                    <p className="text-xs text-gray-500">Rango de fechas para calcular puntuaciones.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Top Atletas en Ranking Publico</Label>
                    <Input
                      type="number"
                      value={configuracion.topPublico}
                      onChange={(e) => setConfiguracion({ ...configuracion, topPublico: parseInt(e.target.value) || 20 })}
                      min={5}
                      max={50}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Visibilidad Publica</Label>
                    <p className="text-xs text-gray-500">Mostrar ranking en la pagina publica</p>
                  </div>
                  <Switch
                    checked={configuracion.visibilidadPublica}
                    onCheckedChange={(checked) => setConfiguracion({ ...configuracion, visibilidadPublica: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Mostrar Puntajes</Label>
                    <p className="text-xs text-gray-500">Mostrar puntuaciones numericas en ranking publico</p>
                  </div>
                  <Switch
                    checked={configuracion.mostrarPuntajes}
                    onCheckedChange={(checked) => setConfiguracion({ ...configuracion, mostrarPuntajes: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfiguracion(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                saveConfiguracion(configuracion);
                toast.success('Configuracion guardada');
                setShowConfiguracion(false);
              }}
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAgregarLogro} onOpenChange={setShowAgregarLogro}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Logro Deportivo</DialogTitle>
            <DialogDescription>Registra un logro o reconocimiento para un atleta.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Atleta *</Label>
              <Select value={nuevoLogro.atletaId} onValueChange={(value) => setNuevoLogro({ ...nuevoLogro, atletaId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar atleta" />
                </SelectTrigger>
                <SelectContent>
                  {atletas.map((m) => (
                    <SelectItem key={m.id} value={`${m.id}`}>
                      {nombreAtleta(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Logro *</Label>
                <Select value={nuevoLogro.tipo} onValueChange={(value: any) => setNuevoLogro({ ...nuevoLogro, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="competencia">Competencia</SelectItem>
                    <SelectItem value="entrenamiento">Entrenamiento</SelectItem>
                    <SelectItem value="actitud">Actitud</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Puntos *</Label>
                <Input
                  type="number"
                  value={nuevoLogro.puntos}
                  onChange={(e) => setNuevoLogro({ ...nuevoLogro, puntos: parseInt(e.target.value) || 0 })}
                  min={1}
                  max={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Titulo del Logro *</Label>
              <Input
                value={nuevoLogro.titulo}
                onChange={(e) => setNuevoLogro({ ...nuevoLogro, titulo: e.target.value })}
                placeholder="Ej: 1er Lugar Regional"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                value={nuevoLogro.descripcion}
                onChange={(e) => setNuevoLogro({ ...nuevoLogro, descripcion: e.target.value })}
                placeholder="Detalles del logro..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAgregarLogro(false);
                setNuevoLogro({ atletaId: '', titulo: '', descripcion: '', puntos: 10, tipo: 'competencia' });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAgregarLogro} className="bg-yellow-400 text-black hover:bg-yellow-500">
              <Award className="w-4 h-4 mr-2" />
              Agregar Logro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAgregarEvaluacion} onOpenChange={setShowAgregarEvaluacion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Evaluacion</DialogTitle>
            <DialogDescription>Registra una evaluacion de desempeno para un atleta.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Atleta *</Label>
              <Select value={nuevaEvaluacion.atletaId} onValueChange={(value) => setNuevaEvaluacion({ ...nuevaEvaluacion, atletaId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar atleta" />
                </SelectTrigger>
                <SelectContent>
                  {atletas.map((m) => (
                    <SelectItem key={m.id} value={`${m.id}`}>
                      {nombreAtleta(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria de Evaluacion *</Label>
              <Select value={nuevaEvaluacion.categoria} onValueChange={(value: any) => setNuevaEvaluacion({ ...nuevaEvaluacion, categoria: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnica">Tecnica</SelectItem>
                  <SelectItem value="actitud">Actitud</SelectItem>
                  <SelectItem value="esfuerzo">Esfuerzo</SelectItem>
                  <SelectItem value="liderazgo">Liderazgo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Puntuacion (1-10) *</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[nuevaEvaluacion.puntuacion]}
                  onValueChange={(value) => setNuevaEvaluacion({ ...nuevaEvaluacion, puntuacion: value[0] })}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-yellow-600 w-12 text-center">{nuevaEvaluacion.puntuacion}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 cursor-pointer ${
                      i < nuevaEvaluacion.puntuacion ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                    onClick={() => setNuevaEvaluacion({ ...nuevaEvaluacion, puntuacion: i + 1 })}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Comentarios</Label>
              <Textarea
                value={nuevaEvaluacion.comentarios}
                onChange={(e) => setNuevaEvaluacion({ ...nuevaEvaluacion, comentarios: e.target.value })}
                placeholder="Observaciones..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAgregarEvaluacion(false);
                setNuevaEvaluacion({ atletaId: '', categoria: 'tecnica', puntuacion: 8, comentarios: '' });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAgregarEvaluacion} className="bg-yellow-400 text-black hover:bg-yellow-500">
              <Star className="w-4 h-4 mr-2" />
              Agregar Evaluacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRankingPublico} onOpenChange={setShowRankingPublico}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Ranking Publico - Reign All Stars
            </DialogTitle>
            <DialogDescription>Vista publica basada en datos del backend.</DialogDescription>
          </DialogHeader>

          {!configuracion.visibilidadPublica ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Eye className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">El ranking publico esta desactivado</p>
              </CardContent>
            </Card>
          ) : rankingFuente.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">El ranking estara disponible proximamente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-white rounded-lg border-2 border-yellow-300">
                <h2 className="text-2xl font-bold mb-2">Ranking de Desempeno - La Colmena</h2>
                <p className="text-gray-600">Top {configuracion.topPublico} Atletas Destacados</p>
                <p className="text-sm text-gray-500 mt-2">Actualizado el {new Date().toLocaleDateString('es-CL')}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {rankingFuente.slice(0, 3).map((atleta, idx) => {
                  const med = medalla(idx + 1);
                  return (
                    <Card key={atleta.id} className={`border-2 ${med.border} ${med.bg}`}>
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">{med.label}</div>
                        <h3 className="font-bold text-lg mb-1">{atleta.atleta_nombre}</h3>
                        <p className="text-sm text-gray-600">
                          {equipos.find((e) => e.id === getBreakdown(atleta.atleta)?.equipoId)?.nombre || 'Sin equipo'}
                        </p>
                        {configuracion.mostrarPuntajes && (
                          <div className="text-3xl font-bold text-yellow-600">
                            {(getBreakdown(atleta.atleta)?.puntuacionTotal ?? atleta.puntos_totales).toFixed(1)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="space-y-2">
                {rankingFuente.slice(3, configuracion.topPublico).map((atleta) => {
                  const med = medalla(atleta.posicion);
                  return (
                    <Card key={atleta.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full ${med.bg} border-2 ${med.border} flex items-center justify-center flex-shrink-0`}>
                            <span className={`text-lg font-bold ${med.color}`}>{atleta.posicion}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold">{atleta.atleta_nombre}</h3>
                            <p className="text-sm text-gray-600">
                              {equipos.find((e) => e.id === getBreakdown(atleta.atleta)?.equipoId)?.nombre || 'Sin equipo'}
                            </p>
                          </div>
                          {configuracion.mostrarPuntajes && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-yellow-600">
                                {(getBreakdown(atleta.atleta)?.puntuacionTotal ?? atleta.puntos_totales).toFixed(1)}
                              </div>
                              <p className="text-xs text-gray-500">puntos</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-600">Reign All Stars - La Colmena</p>
                <p className="text-xs text-gray-500 mt-1">Sistema de Ranking conectado al backend</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowRankingPublico(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};