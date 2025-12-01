import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  User,
  Award,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Calendar,
  Edit,
  Save,
  FileText,
  Trash2,
  Eye,
  Plus,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { GestionHorariosEntrenador } from './GestionHorariosEntrenador';
import { NotificacionesEntrenador } from './NotificacionesEntrenador';
import { AsistenciaEntrenador } from './AsistenciaEntrenador';
import { certificacionesService, equiposService, atletasService, horariosService } from '../api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

interface Certificacion {
  id: number;
  entrenador: number;
  entrenador_nombre?: string;
  nombre: string;
  institucion: string;
  fecha_obtencion: string;
  fecha_vencimiento?: string | null;
  descripcion?: string;
  archivo?: string;
  archivo_url?: string | null;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  comentario_admin?: string;
  created_at?: string;
}

interface PerfilEntrenador {
  id: string;
  userId: string;
  nombre: string;
  email: string;
  telefono?: string;
  experienciaAnios: number;
  resena: string;
  especialidades: string[];
  equiposAsignados: string[];
  foto?: string;
}

export const PerfilEntrenador: React.FC = () => {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<PerfilEntrenador | null>(null);
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);
  const [editando, setEditando] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNuevaCertificacion, setShowNuevaCertificacion] = useState(false);
  const [showDetalleCert, setShowDetalleCert] = useState(false);
  const [certSeleccionada, setCertSeleccionada] = useState<Certificacion | null>(null);
  const [activeTab, setActiveTab] = useState('perfil');

  const [formPerfil, setFormPerfil] = useState({
    telefono: '',
    experienciaAnios: 0,
    resena: '',
    especialidades: [] as string[],
  });

  const [nuevaCert, setNuevaCert] = useState({
    nombre: '',
    institucion: '',
    fechaObtencion: '',
    fechavencimiento: '',
    descripcion: '',
  });
  const [archivoFile, setArchivoFile] = useState<File | null>(null);

  const [nuevaEspecialidad, setNuevaEspecialidad] = useState('');
  const [equiposAsignados, setEquiposAsignados] = useState<any[]>([]);
  const [atletasAsignados, setAtletasAsignados] = useState<any[]>([]);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [loadingAsistencias, setLoadingAsistencias] = useState(false);
  const [filtroEquipo, setFiltroEquipo] = useState<string>('todos');
  const [tipoGrafico, setTipoGrafico] = useState<'barras' | 'lineas' | 'pastel'>('barras');
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'custom'>('mes');
  const [rangoCustom, setRangoCustom] = useState({ desde: '', hasta: '' });
  const [showGraficosAsistencia, setShowGraficosAsistencia] = useState(false);
  const safeMsg = (err: any, fallback: string) =>
    typeof err === 'string' ? err : err?.message || err?.detail || err?.error || fallback;

  const parseLocalDate = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  useEffect(() => {
    if (user) {
      loadPerfil();
      loadCertificaciones();
      loadEquiposYAtletas();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAsistencias();
    }
  }, [user, filtroEquipo, periodo, rangoCustom]);

  const loadPerfil = () => {
    if (!user) return;
    // Perfil básico desde el usuario autenticado
    const perfilBasico: PerfilEntrenador = {
      id: String(user.id),
      userId: String(user.id),
      nombre: user.name,
      email: user.email,
      telefono: user.phone || '',
      experienciaAnios: 0,
      resena: '',
      especialidades: [],
      equiposAsignados: [],
    };
    setPerfil(perfilBasico);
    setFormPerfil({
      telefono: perfilBasico.telefono || '',
      experienciaAnios: perfilBasico.experienciaAnios || 0,
      resena: perfilBasico.resena || '',
      especialidades: perfilBasico.especialidades || [],
    });
  };

  const loadCertificaciones = () => {
    if (!user) return;
    certificacionesService.listar().then((resp) => {
      if (resp.success) {
        const payload = resp.data?.results ?? resp.data?.data ?? resp.data ?? [];
        const misCerts = (Array.isArray(payload) ? payload : [])
          .filter((c: any) => String(c.entrenador) === String(user.id))
          .map((c: any) => ({
            ...c,
            estado: (c.estado || 'pendiente') as any,
            fechaObtencion: c.fecha_obtencion,
            fechavencimiento: c.fecha_vencimiento,
          }));
        setCertificaciones(misCerts);
      } else {
        toast.error(safeMsg(resp.error, 'No se pudieron cargar las certificaciones'));
        setCertificaciones([]);
      }
    });
  };

  const loadEquiposYAtletas = async () => {
    try {
      const [respEquipos, respAtletas] = await Promise.all([
        equiposService.listarEquipos?.(),
        atletasService.listarAtletas?.(),
      ]);

      const equipos = respEquipos?.success ? respEquipos.data || [] : [];
      const atletas = respAtletas?.success ? respAtletas.data || [] : [];

      // Equipos donde el entrenador actual está asignado
      const misEquipos = equipos.filter((e: any) => {
        if (!Array.isArray(e.entrenadores)) return false;
        return e.entrenadores.some((ent: any) => {
          const entId = ent?.id ?? ent;
          return String(entId) === String(user?.id);
        });
      });
      setEquiposAsignados(misEquipos);

      // Atletas que pertenecen a esos equipos (ya vienen filtrados por backend si el rol es entrenador)
      const equipoIds = new Set(misEquipos.map((e: any) => String(e.id)));
      const misAtletas = atletas.filter((a: any) => {
        const eqId = a.equipo?.id ?? a.equipo ?? a.equipo_id;
        return eqId && equipoIds.has(String(eqId));
      });
      setAtletasAsignados(misAtletas);
    } catch (error) {
      toast.error('No se pudieron cargar equipos o atletas asignados');
      setEquiposAsignados([]);
      setAtletasAsignados([]);
    }
  };

  const getRangoFechas = () => {
    const hoy = new Date();
    let desde: Date;
    let hasta: Date;
    if (periodo === 'mes') {
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    } else if (periodo === 'trimestre') {
      const mesActual = hoy.getMonth();
      const inicioTrim = mesActual - (mesActual % 3);
      desde = new Date(hoy.getFullYear(), inicioTrim, 1);
      hasta = new Date(hoy.getFullYear(), inicioTrim + 3, 0);
    } else {
      // custom
      desde = rangoCustom.desde ? parseLocalDate(rangoCustom.desde) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      hasta = rangoCustom.hasta ? parseLocalDate(rangoCustom.hasta) : hoy;
    }
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { desde: fmt(desde), hasta: fmt(hasta) };
  };

  const fetchAsistencias = async () => {
    if (!user) return;
    setLoadingAsistencias(true);
    const { desde, hasta } = getRangoFechas();
    const params: any = { desde, hasta };
    if (filtroEquipo !== 'todos') params.equipo = filtroEquipo;
    const resp = await horariosService.listarAsistenciasGeneral?.(params);
    if (resp?.success && Array.isArray(resp.data)) {
      setAsistencias(resp.data);
    } else {
      setAsistencias([]);
      if (resp?.error) toast.error(safeMsg(resp.error, 'No se pudo cargar asistencia'));
    }
    setLoadingAsistencias(false);
  };

  const handleGuardarPerfil = () => {
    if (!perfil) return;
    // Aquí podrías persistir en backend un perfil de entrenador (no existe endpoint actual).
    // Por ahora solo guardamos en estado local sin tocar localStorage para no desalinear con el backend.
    const perfilActualizado = {
      ...perfil,
      telefono: formPerfil.telefono,
      experienciaAnios: formPerfil.experienciaAnios,
      resena: formPerfil.resena,
      especialidades: formPerfil.especialidades,
    };
    setPerfil(perfilActualizado);
    setEditando(false);
    toast.success('Perfil actualizado correctamente');
  };

  const handleAgregarEspecialidad = () => {
    if (!nuevaEspecialidad.trim()) return;
    if (formPerfil.especialidades.includes(nuevaEspecialidad.trim())) {
      toast.error('Esta especialidad ya está agregada');
      return;
    }
    setFormPerfil({
      ...formPerfil,
      especialidades: [...formPerfil.especialidades, nuevaEspecialidad.trim()],
    });
    setNuevaEspecialidad('');
  };

  const handleEliminarEspecialidad = (esp: string) => {
    setFormPerfil({
      ...formPerfil,
      especialidades: formPerfil.especialidades.filter((e) => e !== esp),
    });
  };

  const handleSubirCertificacion = async () => {
    if (!user || !nuevaCert.nombre || !nuevaCert.institucion || !nuevaCert.fechaObtencion) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    const payload = {
      nombre: nuevaCert.nombre,
      institucion: nuevaCert.institucion,
      fecha_obtencion: nuevaCert.fechaObtencion,
      fecha_vencimiento: nuevaCert.fechavencimiento || null,
      descripcion: nuevaCert.descripcion,
    };
    const formData = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v));
    });
    if (archivoFile) formData.append('archivo', archivoFile);
    const resp = await certificacionesService.crear(formData);
    if (resp.success) {
      toast.success('Certificación enviada para validación');
      setShowNuevaCertificacion(false);
      resetFormCert();
      loadCertificaciones();
    } else {
      toast.error(safeMsg(resp.error, 'No se pudo enviar la certificación'));
    }
  };

  const handleEliminarCertificacion = async (id: number) => {
    if (!confirm('¿Eliminar esta certificación?')) return;
    const resp = await certificacionesService.eliminar(id);
    if (resp.success) {
      toast.success('Certificación eliminada');
      loadCertificaciones();
    } else {
      toast.error(safeMsg(resp.error, 'No se pudo eliminar'));
    }
  };

  const resetFormCert = () => {
    setNuevaCert({ nombre: '', institucion: '', fechaObtencion: '', fechavencimiento: '', descripcion: '' });
    setArchivoFile(null);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" /> Validada
          </Badge>
        );
      case 'pendiente':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" /> En Revisión
          </Badge>
        );
      case 'rechazada':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="w-3 h-3 mr-1" /> Rechazada
          </Badge>
        );
      default:
        return null;
    }
  };

  const certsValidadas = certificaciones.filter((c) => c.estado === 'aprobada').length;
  const certsPendientes = certificaciones.filter((c) => c.estado === 'pendiente').length;

  // Equipos asignados al entrenador (backend)
  const misEquipos = equiposAsignados;
  const misAtletas = atletasAsignados;

  const asistenciaAggregates = useMemo(() => {
    const porAtleta = new Map<
      string,
      { nombre: string; presentes: number; total: number; porcentaje: number }
    >();
    const porFecha = new Map<string, { presentes: number; total: number }>();
    let presentesGlobal = 0;
    let totalGlobal = 0;

    const nombres = (id: any) => {
      const a = misAtletas.find((x: any) => String(x.id) === String(id));
      return (
        a?.nombre_completo ||
        a?.nombre ||
        [a?.nombres, a?.apellidos].filter(Boolean).join(' ').trim() ||
        `Atleta #${id}`
      );
    };

    asistencias.forEach((a: any) => {
      const key = String(a.atleta);
      const entry = porAtleta.get(key) || { nombre: nombres(key), presentes: 0, total: 0, porcentaje: 0 };
      entry.total += 1;
      if (a.presente) entry.presentes += 1;
      porAtleta.set(key, entry);

      const fecha = a.fecha;
      const ef = porFecha.get(fecha) || { presentes: 0, total: 0 };
      ef.total += 1;
      if (a.presente) ef.presentes += 1;
      porFecha.set(fecha, ef);

      totalGlobal += 1;
      if (a.presente) presentesGlobal += 1;
    });

    porAtleta.forEach((v) => {
      v.porcentaje = Math.min(100, Math.round((v.presentes || 0) * 3));
    });

    const barras = Array.from(porAtleta.entries())
      .map(([id, data]) => ({ atletaId: id, atleta: data.nombre, porcentaje: data.porcentaje }))
      .sort((a, b) => b.porcentaje - a.porcentaje);

    const lineas = Array.from(porFecha.entries())
      .map(([fecha, data]) => ({
        fecha,
        porcentaje: Math.min(100, Math.round((data.presentes || 0) * 3)),
      }))
      .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

    const presentes = presentesGlobal;
    const ausentes = totalGlobal - presentesGlobal;
    const promedio = totalGlobal ? Math.min(100, Math.round((presentesGlobal || 0) * 3 / Math.max(1, porAtleta.size))) : 0;
    const top = barras[0];
    return {
      barras,
      lineas,
      pastel: [
        { name: 'Presentes', value: presentes },
        { name: 'Ausentes', value: ausentes < 0 ? 0 : ausentes },
      ],
      promedio,
      top,
      porAtleta,
    };
  }, [asistencias, misAtletas]);

  const asistenciaTarjetas = useMemo(() => {
    const map = new Map<string, number>();
    asistenciaAggregates.porAtleta?.forEach((v, k) => {
      // Regla negocio: cada presente suma 3% hasta 100%
      const pct = Math.min(100, Math.round((v.presentes || 0) * 3));
      map.set(k, pct);
    });
    return map;
  }, [asistenciaAggregates]);

  if (!user || !perfil) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Cargando perfil...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="flex items-center gap-2">
          <User className="w-6 h-6 text-yellow-400" /> Perfil de Entrenador
        </h2>
        <p className="text-gray-600">Gestiona tu información profesional y certificaciones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Equipos Asignados</p>
                <p className="text-2xl font-bold">{misEquipos.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Atletas</p>
                <p className="text-2xl font-bold">{misAtletas.length}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-yellow-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Certificaciones</p>
                <p className="text-2xl font-bold">{certsValidadas}</p>
              </div>
              <Award className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold">{certsPendientes}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="perfil">Mi Perfil</TabsTrigger>
          <TabsTrigger value="certificaciones">Certificaciones</TabsTrigger>
          <TabsTrigger value="atletas">Mis Atletas</TabsTrigger>
          <TabsTrigger value="horarios">Horarios</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="comunicacion">Comunicación</TabsTrigger>
        </TabsList>

        {/* Perfil */}
        <TabsContent value="perfil" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información Personal</CardTitle>
                <Button onClick={() => setShowEditModal(true)} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" /> Editar Perfil
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input value={perfil.nombre} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Correo Electrónico</Label>
                  <Input value={perfil.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={formPerfil.telefono}
                    onChange={(e) => setFormPerfil({ ...formPerfil, telefono: e.target.value })}
                    disabled={!editando}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Años de Experiencia</Label>
                  <Input
                    type="number"
                    value={formPerfil.experienciaAnios}
                    onChange={(e) => setFormPerfil({ ...formPerfil, experienciaAnios: parseInt(e.target.value) || 0 })}
                    disabled={!editando}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reseña Profesional</Label>
                <Textarea
                  value={formPerfil.resena}
                  onChange={(e) => setFormPerfil({ ...formPerfil, resena: e.target.value })}
                  disabled={!editando}
                  placeholder="Describe tu experiencia, logros y metodología de entrenamiento..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Especialidades</Label>
                {editando && (
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={nuevaEspecialidad}
                      onChange={(e) => setNuevaEspecialidad(e.target.value)}
                      placeholder="Ej: Tumbling, Stunts, Coreografía..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAgregarEspecialidad()}
                    />
                    <Button onClick={handleAgregarEspecialidad} type="button" className="bg-yellow-400 text-black hover:bg-yellow-500">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {formPerfil.especialidades.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay especialidades agregadas</p>
                  ) : (
                    formPerfil.especialidades.map((esp, index) => (
                      <Badge key={index} variant="outline" className="px-3 py-1">
                        {esp}
                        {editando && (
                          <button onClick={() => handleEliminarEspecialidad(esp)} className="ml-2 text-red-500 hover:text-red-700">
                            ×
                          </button>
                        )}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Equipos Asignados</Label>
                <div className="flex flex-wrap gap-2">
                  {misEquipos.length === 0 ? (
                    <p className="text-sm text-gray-500">No tienes equipos asignados</p>
                  ) : (
                    misEquipos.map((equipo: any) => (
                      <Badge key={equipo.id} className="bg-blue-100 text-blue-800 border-blue-300">
                        {equipo.nombre}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificaciones */}
        <TabsContent value="certificaciones" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3>Mis Certificaciones</h3>
              <p className="text-sm text-gray-600">Gestiona tus acreditaciones profesionales</p>
            </div>
            <Button onClick={() => setShowNuevaCertificacion(true)} className="bg-yellow-400 text-black hover:bg-yellow-500">
              <Plus className="w-4 h-4 mr-2" />
              Subir Certificación
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificaciones.map((cert) => (
              <Card key={cert.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold mb-1">{cert.nombre}</h4>
                      <p className="text-sm text-gray-600">{cert.institucion}</p>
                    </div>
                    {getEstadoBadge(cert.estado)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Obtenida: {new Date(cert.fechaObtencion).toLocaleDateString('es-CL')}</span>
                    </div>
                    {cert.fechavencimiento && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Vence: {new Date(cert.fechavencimiento).toLocaleDateString('es-CL')}</span>
                      </div>
                    )}
                  {cert.archivo_url && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4" />
                      <a className="text-xs text-blue-600 underline" href={cert.archivo_url} target="_blank" rel="noreferrer">
                        Ver archivo
                      </a>
                    </div>
                  )}
                </div>

                  {cert.estado === 'rechazada' && cert.comentario_admin && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                      <p className="font-semibold text-red-800">Motivo del rechazo:</p>
                      <p className="text-red-700">{cert.comentario_admin}</p>
                    </div>
                  )}
                  {cert.estado === 'aprobada' && cert.comentario_admin && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                      <p className="font-semibold text-green-800">Comentario del administrador:</p>
                      <p className="text-green-700">{cert.comentario_admin}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCertSeleccionada(cert);
                        setShowDetalleCert(true);
                      }}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalle
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEliminarCertificacion(cert.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {certificaciones.length === 0 && (
              <Card className="md:col-span-2">
                <CardContent className="p-12 text-center">
                  <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">No tienes certificaciones cargadas</p>
                  <Button onClick={() => setShowNuevaCertificacion(true)} className="bg-yellow-400 text-black hover:bg-yellow-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Subir Primera Certificación
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Mis Atletas */}
        <TabsContent value="atletas" className="space-y-6">
          <div className="mb-4">
            <h3>Atletas Bajo Mi Cargo</h3>
            <p className="text-sm text-gray-600">Atletas de los equipos que entrenas</p>
          </div>
          {misEquipos.map((equipo: any) => {
            const atletasEquipo = misAtletas.filter((a: any) => {
              const eqId = a.equipo?.id ?? a.equipo ?? a.equipo_id;
              return String(eqId) === String(equipo.id);
            });
            return (
              <Card key={equipo.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    {equipo.nombre} <Badge variant="outline">{atletasEquipo.length} atletas</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {atletasEquipo.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No hay atletas asignados a este equipo</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {atletasEquipo.map((atleta: any) => {
                        const nombre =
                          atleta.nombreAtleta ||
                          atleta.nombre ||
                          [atleta.nombres, atleta.apellidos].filter(Boolean).join(' ') ||
                          `Atleta #${atleta.id}`;
                        const asistenciaPct =
                          asistenciaTarjetas.get(String(atleta.id)) ??
                          (Number(atleta.asistencia) || 0);
                        const apoderadoNombre =
                          atleta.apoderado?.name || atleta.apoderado?.email || atleta.apoderado?.nombre || 'Sin apoderado';
                        return (
                          <div key={atleta.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{nombre}</p>
                              <p className="text-xs text-gray-500">
                                {atleta.division} · {atleta.categoria} · Nivel {atleta.nivel}
                              <p className="text-xs text-gray-600 mt-1">Asistencia: {asistenciaPct}%</p>
                              </p>
                              <p className="text-xs text-gray-500">Apoderado: {apoderadoNombre}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="horarios">
          <GestionHorariosEntrenador equiposAsignados={(perfil?.equiposAsignados || []).map((e: any) => String(e.id))} />
        </TabsContent>

        <TabsContent value="asistencia" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <h3 className="text-base font-semibold">Asistencia</h3>
            <div className="flex gap-2">
              <Button
                variant={showGraficosAsistencia ? 'outline' : 'default'}
                onClick={() => setShowGraficosAsistencia(false)}
                className={showGraficosAsistencia ? '' : 'bg-yellow-400 text-black hover:bg-yellow-500'}
              >
                Tomar asistencia
              </Button>
              <Button
                variant={showGraficosAsistencia ? 'default' : 'outline'}
                onClick={() => setShowGraficosAsistencia(true)}
                className={showGraficosAsistencia ? 'bg-yellow-400 text-black hover:bg-yellow-500' : ''}
              >
                Ver gráficos
              </Button>
            </div>
          </div>

          {showGraficosAsistencia ? (
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Gráficos de asistencia</CardTitle>
                  <p className="text-sm text-gray-600">
                    Visualiza asistencia mensual o trimestral y cambia el tipo de gráfico.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500">Periodo</Label>
                    <select
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value as any)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="mes">Mes actual</option>
                      <option value="trimestre">Trimestre actual</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  {periodo === 'custom' && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={rangoCustom.desde}
                        onChange={(e) => setRangoCustom({ ...rangoCustom, desde: e.target.value })}
                        className="h-9"
                      />
                      <span className="text-sm text-gray-500">a</span>
                      <Input
                        type="date"
                        value={rangoCustom.hasta}
                        onChange={(e) => setRangoCustom({ ...rangoCustom, hasta: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500">Equipo</Label>
                    <select
                      value={filtroEquipo}
                      onChange={(e) => setFiltroEquipo(e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="todos">Todos</option>
                      {misEquipos.map((eq: any) => (
                        <option key={eq.id} value={String(eq.id)}>
                          {eq.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500">Gráfico</Label>
                    <select
                      value={tipoGrafico}
                      onChange={(e) => setTipoGrafico(e.target.value as any)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="barras">Barras</option>
                      <option value="lineas">Líneas</option>
                      <option value="pastel">Pastel</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    Promedio: {asistenciaAggregates.promedio || 0}%
                  </Badge>
                  {asistenciaAggregates.top && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                      Top: {asistenciaAggregates.top.atleta} ({asistenciaAggregates.top.porcentaje}%)
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    Registros: {asistencias.length}
                  </Badge>
                </div>

                {loadingAsistencias ? (
                  <p className="text-sm text-gray-500">Cargando asistencia...</p>
                ) : asistenciaAggregates.barras.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay datos de asistencia en el rango seleccionado.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        {tipoGrafico === 'barras' && <BarChart2 className="w-4 h-4" />}
                        {tipoGrafico === 'lineas' && <LineChartIcon className="w-4 h-4" />}
                        {tipoGrafico === 'pastel' && <PieChartIcon className="w-4 h-4" />}
                        <span>Visualización de asistencia</span>
                      </div>
                      {tipoGrafico === 'barras' && (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={asistenciaAggregates.barras}>
                            <XAxis dataKey="atleta" hide />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="porcentaje" fill="#FACC15" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                      {tipoGrafico === 'lineas' && (
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={asistenciaAggregates.lineas}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="porcentaje" stroke="#F59E0B" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                      {tipoGrafico === 'pastel' && (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie data={asistenciaAggregates.pastel} dataKey="value" nameKey="name" outerRadius={90} label>
                              {asistenciaAggregates.pastel.map((_, idx) => (
                                <Cell key={idx} fill={idx === 0 ? '#10B981' : '#F87171'} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="border rounded-lg p-3 max-h-[320px]">
                      <div className="text-sm text-gray-600 mb-2">Ranking de atletas por asistencia</div>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {asistenciaAggregates.barras.map((b) => (
                          <div key={b.atletaId} className="flex items-center justify-between text-sm border rounded p-2">
                            <span className="truncate w-2/3">{b.atleta}</span>
                            <span className="font-semibold">{b.porcentaje}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <AsistenciaEntrenador
              equiposAsignados={(perfil?.equiposAsignados || []).map((e: any) => String(e.id))}
              atletasAsignados={atletasAsignados}
            />
          )}
        </TabsContent>

        <TabsContent value="comunicacion">
          <NotificacionesEntrenador equipos={misEquipos} atletas={misAtletas} />
        </TabsContent>
      </Tabs>

      {/* Dialog Nueva Certificación */}
      <Dialog open={showNuevaCertificacion} onOpenChange={setShowNuevaCertificacion}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subir Nueva Certificación</DialogTitle>
            <DialogDescription>La Certificación será revisada por un administrador antes de ser publicada</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de la Certificación *</Label>
                <Input value={nuevaCert.nombre} onChange={(e) => setNuevaCert({ ...nuevaCert, nombre: e.target.value })} placeholder="Ej: Certificación USASF" />
              </div>
              <div className="space-y-2">
                <Label>Institución Emisora *</Label>
                <Input value={nuevaCert.institucion} onChange={(e) => setNuevaCert({ ...nuevaCert, institucion: e.target.value })} placeholder="Ej: USASF, FECH, etc." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Obtención *</Label>
                <Input type="date" value={nuevaCert.fechaObtencion} onChange={(e) => setNuevaCert({ ...nuevaCert, fechaObtencion: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de vencimiento (opcional)</Label>
                <Input type="date" value={nuevaCert.fechavencimiento} onChange={(e) => setNuevaCert({ ...nuevaCert, fechavencimiento: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={nuevaCert.descripcion} onChange={(e) => setNuevaCert({ ...nuevaCert, descripcion: e.target.value })} placeholder="Describe el contenido o especialidad de esta Certificación..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Archivo del Certificado</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">Sube el documento de la Certificación (PDF, imágenes o Word)</p>
                <p className="text-xs text-gray-500">Formatos: PDF, JPG, PNG, DOC, DOCX (máx. 5MB)</p>
                <Input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => setArchivoFile(e.target.files?.[0] || null)} className="mt-3" />
                {archivoFile && <p className="text-xs text-gray-600 mt-2">Archivo seleccionado: {archivoFile.name}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNuevaCertificacion(false); resetFormCert(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubirCertificacion} className="bg-yellow-400 text-black hover:bg-yellow-500">
              <Upload className="w-4 h-4 mr-2" />
              Subir Certificación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle Certificación */}
      <Dialog open={showDetalleCert} onOpenChange={setShowDetalleCert}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" /> Detalle de Certificación
            </DialogTitle>
          </DialogHeader>

          {certSeleccionada && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{certSeleccionada.nombre}</h3>
                {getEstadoBadge(certSeleccionada.estado)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Institución</Label>
                  <p>{certSeleccionada.institucion}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Fecha de Obtención</Label>
                  <p>{new Date(certSeleccionada.fecha_obtencion).toLocaleDateString('es-CL')}</p>
                </div>
                {certSeleccionada.fecha_vencimiento && (
                  <div>
                    <Label className="text-sm text-gray-500">Fecha de vencimiento</Label>
                    <p>{new Date(certSeleccionada.fecha_vencimiento).toLocaleDateString('es-CL')}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-gray-500">Fecha de Carga</Label>
                  <p>{certSeleccionada.created_at ? new Date(certSeleccionada.created_at).toLocaleDateString('es-CL') : '-'}</p>
                </div>
              </div>

              {certSeleccionada.descripcion && (
                <div>
                  <Label className="text-sm text-gray-500">Descripción</Label>
                  <p className="text-sm mt-1">{certSeleccionada.descripcion}</p>
                </div>
              )}

              {certSeleccionada.archivo_url && (
                <div>
                  <Label className="text-sm text-gray-500">Archivo</Label>
                  <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <a className="text-sm text-blue-600 underline" href={certSeleccionada.archivo_url} target="_blank" rel="noreferrer">
                      Ver archivo
                    </a>
                  </div>
                </div>
              )}

              {certSeleccionada.estado === 'rechazada' && certSeleccionada.comentario_admin && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center gap-2 text-red-800 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span className="font-semibold">Certificación Rechazada</span>
                  </div>
                  <p className="text-sm text-red-700">{certSeleccionada.comentario_admin}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowDetalleCert(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

