import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Users,
  Eye,
  Calendar,
  Award,
  TrendingUp,
  UserPlus,
  Trash,
  Upload,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FichaAtleta } from './FichaAtleta';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { CheckCircle, Info } from 'lucide-react';
import { DIVISIONES, CATEGORIAS, NIVELES } from '../constants/cheerCategories';
import { atletasService, pagosService } from '../api';

interface Atleta {
  id: string;
  nombreAtleta: string;
  rutAtleta: string;
  fechaNacimiento: string;
  categoria: string;
  nivel: string;
  telefono: string;
  direccion: string;
  emailApoderado: string;
  nombreApoderado: string;
  telefonoApoderado: string;
  fechaMatricula: string;
  costoMatricula: number;
  estadoPago: 'Pagado' | 'Pendiente';
  asistencia: number;
  historialPagos: Array<{ fecha: string; monto: number; concepto: string }>;
  historialDeportivo: Array<{
    id: string;
    fecha: string;
    tipo: 'logro' | 'competencia' | 'evaluacion';
    titulo: string;
    descripcion: string;
    resultado?: string;
  }>;
  observaciones: string;
}

export const MisAtletas: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [misAtletas, setMisAtletas] = useState<Atleta[]>([]);
  const [selectedAtleta, setSelectedAtleta] = useState<Atleta | null>(null);
  const [showFicha, setShowFicha] = useState(false);
  const [showMatriculaDialog, setShowMatriculaDialog] = useState(false);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [costoMatricula, setCostoMatricula] = useState(0);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certAtleta, setCertAtleta] = useState<Atleta | null>(null);
  const [certificaciones, setCertificaciones] = useState<any[]>([]);
  const [certForm, setCertForm] = useState({
    tipo: '',
    nombre: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    notas: '',
    archivo: null as File | null,
  });
  const TIPOS = [
    { id: 'medico', label: 'Médico' },
    { id: 'escolar', label: 'Escolar' },
    { id: 'nacimiento', label: 'Nacimiento' },
    { id: 'otro', label: 'Otro' },
  ];

  const estadoBadge = (estado?: string) => {
    const norm = (estado || '').toLowerCase();
    switch (norm) {
      case 'aprobada':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Aprobada</Badge>;
      case 'rechazada':
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Rechazada</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">Pendiente</Badge>;
    }
  };
  const [formData, setFormData] = useState({
    nombreAtleta: '',
    rutAtleta: '',
    fechaNacimiento: '',
    division: '',
    categoria: '',
    nivel: '1',
    telefono: '',
    direccion: '',
    nombreApoderado: user?.name || '',
    emailApoderado: user?.email || '',
    telefonoApoderado: user?.phone || '',
    relacionConAtleta: 'padre/madre'
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token_ws');
    if (token) {
      (async () => {
        setIsProcessing(true);
        const resp = await pagosService.confirmarWebpay(token);
        if (resp.success) {
          toast.success('Pago confirmado');
          toast.success('Atleta matriculado');
          setShowConfirmacion(false);
          // Garantizamos refresco de atletas (preferimos la respuesta y luego re-sync)
          if (resp.data?.atleta) {
            const mapped = mapApiAtleta(resp.data.atleta);
            setMisAtletas(prev => [mapped, ...prev]);
          }
          await loadMisAtletas();
          await loadMisAtletas();
          if (resp.data?.user) {
            localStorage.setItem('user', JSON.stringify(resp.data.user));
          }
          await refreshUser();
          setTimeout(() => {
            window.location.href = '/';
          }, 300);
        } else {
          const errMsg = typeof resp.error === 'string' ? resp.error : (resp.error?.detail || 'No se pudo confirmar el pago');
          toast.error(errMsg);
          await loadMisAtletas();
        }
        setIsProcessing(false);
        params.delete('token_ws');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newUrl);
      })();
    }
    loadMisAtletas();
    loadCostoMatricula();
  }, [user]);

  const mapApiAtleta = (a: any): Atleta => ({
    id: String(a.id),
    nombreAtleta: `${a.nombres ?? ''} ${a.apellidos ?? ''}`.trim() || a.nombreAtleta || '',
    rutAtleta: a.rut || '',
    fechaNacimiento: a.fecha_nacimiento || a.fechaNacimiento || '',
    categoria: a.categoria || '',
    nivel: a.nivel ? String(a.nivel) : 'Principiante',
    telefono: a.telefono_contacto || '',
    direccion: a.direccion || '',
    emailApoderado: a.apoderado?.email || user?.email || '',
    nombreApoderado: a.apoderado?.name || user?.name || '',
    telefonoApoderado: a.apoderado?.phone || '',
    fechaMatricula: a.fecha_ingreso || new Date().toISOString(),
    costoMatricula: 0,
    estadoPago: 'Pagado',
    asistencia: Number(a.asistencia) || 0,
    historialPagos: [],
    historialDeportivo: a.historial_deportivo || [],
    observaciones: a.notas || ''
  });

  const loadMisAtletas = async () => {
    if (!user) return;
    const [respAtletas, respMatriculas] = await Promise.all([
      atletasService.obtenerMisAtletas(),
      pagosService.obtenerMisPagos ? pagosService.obtenerMisPagos() : pagosService.listarMatriculas?.({ apoderado: user.id }),
    ]);

    if (!respAtletas.success) {
      setMisAtletas([]);
      toast.error(respAtletas.error?.message || 'No se pudieron cargar tus atletas');
      return;
    }

    const matriculas = respMatriculas?.success && Array.isArray(respMatriculas.data) ? respMatriculas.data : [];
    const matPorAtleta: Record<string, any> = {};
    matriculas.forEach((m: any) => {
      const key = String(m.atleta || m.atleta_id || m.atletaId || '');
      if (key) matPorAtleta[key] = m;
    });

    const data = Array.isArray(respAtletas.data) ? respAtletas.data : [];
    const atletasMapeados = data.map((a: any) => {
      const base = mapApiAtleta(a);
      const mat = matPorAtleta[String(base.id)];
      const costo = mat
        ? Number(
            mat.monto_total ??
              mat.monto_original ??
              mat.monto ??
              mat.costo_matricula ??
              mat.costo ??
              0,
          )
        : Number(a.costo || a.costo_matricula || 0);
      const estadoPago = mat?.estado_pago
        ? (String(mat.estado_pago).toLowerCase() === 'pagado' ? 'Pagado' : 'Pendiente')
        : base.estadoPago;
      const fechaMatricula = mat?.created_at || mat?.fecha || base.fechaMatricula;
      return {
        ...base,
        costoMatricula: Number.isNaN(costo) ? 0 : costo,
        estadoPago,
        fechaMatricula,
      };
    });
    setMisAtletas(atletasMapeados);
  };

  const loadCostoMatricula = async () => {
    try {
      if (pagosService.obtenerPeriodosMatricula) {
        const resp = await pagosService.obtenerPeriodosMatricula();
        if (resp?.success) {
          const lista = resp.data || [];
          setPeriodos(lista);
          const activo = lista.find((p: any) => p.estado === 'activo') || lista[0];
          if (activo) {
            setPeriodoSeleccionado(String(activo.id));
            if (activo.monto) setCostoMatricula(Number(activo.monto));
            else if (activo.costo_matricula) setCostoMatricula(Number(activo.costo_matricula));
          }
        }
      }
    } catch (e) {
      // Si falla, mantenemos el costo en 0 hasta que el backend responda
    }
  };

  const handleVerFicha = (atleta: Atleta) => {
    setSelectedAtleta(atleta);
    setShowFicha(true);
  };

  const handleUpdateAtleta = () => {
    loadMisAtletas();
    setShowFicha(false);
  };

  const handleEliminarAtleta = async (atletaId: string | number) => {
    const confirmDelete = window.confirm('¿Eliminar este atleta? Esta acción no se puede deshacer.');
    if (!confirmDelete) return;
    const resp = await atletasService.eliminarAtleta(parseInt(String(atletaId), 10));
    if (resp.success) {
      toast.success('Atleta eliminado');
      loadMisAtletas();
    } else {
      toast.error(resp.error?.message || 'No se pudo eliminar el atleta');
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'sub-10': return 'bg-blue-100 text-blue-800';
      case 'sub-14': return 'bg-green-100 text-green-800';
      case 'sub-18': return 'bg-purple-100 text-purple-800';
      case 'adultos': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'sub-10': return 'Sub-10 (6-10 años)';
      case 'sub-14': return 'Sub-14 (11-14 años)';
      case 'sub-18': return 'Sub-18 (15-18 años)';
      case 'adultos': return 'Adultos (18+)';
      default: return categoria;
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleAbrirMatricula = () => {
    setFormData({
      nombreAtleta: '',
      rutAtleta: '',
      fechaNacimiento: '',
      division: '',
      categoria: '',
      nivel: '1',
      telefono: '',
      direccion: '',
      nombreApoderado: user?.name || '',
      emailApoderado: user?.email || '',
      telefonoApoderado: user?.phone || '',
      relacionConAtleta: 'padre/madre'
    });
    setShowMatriculaDialog(true);
  };

  const abrirCertificaciones = async (atleta: Atleta) => {
    setCertAtleta(atleta);
    setShowCertModal(true);
    const resp = await atletasService.obtenerCertificaciones(Number(atleta.id));
    if (resp.success && Array.isArray(resp.data)) {
      setCertificaciones(resp.data);
    } else {
      setCertificaciones([]);
      toast.error(resp.error?.message || 'No se pudieron cargar las certificaciones');
    }
  };

  const subirCertificacion = async () => {
    if (!certAtleta) return;
    if (!certForm.tipo || !certForm.nombre || !certForm.fecha_emision || !certForm.archivo) {
      toast.error('Completa tipo, nombre, fecha de emisión y archivo');
      return;
    }
    const fd = new FormData();
    fd.append('tipo', certForm.tipo);
    fd.append('nombre', certForm.nombre);
    fd.append('fecha_emision', certForm.fecha_emision);
    if (certForm.fecha_vencimiento) fd.append('fecha_vencimiento', certForm.fecha_vencimiento);
    if (certForm.notas) fd.append('notas', certForm.notas);
    fd.append('archivo', certForm.archivo);
    const resp = await atletasService.subirCertificacion(Number(certAtleta.id), fd);
    if (resp.success) {
      toast.success('Certificación enviada para revisión');
      setCertForm({ tipo: '', nombre: '', fecha_emision: '', fecha_vencimiento: '', notas: '', archivo: null });
      abrirCertificaciones(certAtleta);
    } else {
      toast.error(resp.error?.message || 'No se pudo subir la certificación');
    }
  };

  const eliminarCertificacion = async (id: number) => {
    if (!confirm('¿Eliminar certificación?')) return;
    const resp = await atletasService.eliminarCertificacion(id);
    if (resp.success && certAtleta) {
      toast.success('Certificación eliminada');
      abrirCertificaciones(certAtleta);
    } else {
      toast.error(resp.error?.message || 'No se pudo eliminar');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmitMatricula = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombreAtleta || !formData.rutAtleta || !formData.fechaNacimiento || !formData.categoria || !formData.division) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!periodoSeleccionado) {
      toast.error('No hay un periodo de matrícula activo configurado');
      return;
    }

    if (formData.rutAtleta.length < 8) {
      toast.error('RUT inválido');
      return;
    }

    setShowMatriculaDialog(false);
    setShowConfirmacion(true);
  };

  const confirmarPagoMatricula = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    const payload: any = {
      atleta_nombre: formData.nombreAtleta,
      atleta_rut: formData.rutAtleta,
      atleta_fecha_nacimiento: formData.fechaNacimiento,
      division: formData.division,
      categoria: formData.categoria,
      nivel: formData.nivel,
      telefono_contacto: formData.telefono,
      direccion: formData.direccion,
      apoderado_nombre: formData.nombreApoderado,
      apoderado_email: user.email,
      apoderado_telefono: formData.telefonoApoderado,
      monto: costoMatricula,
      periodo: periodoSeleccionado,
    };

    const resp = await pagosService.registrarMatricula(payload);
    if (resp.success) {
      const matriculaId = resp.data?.id;
      const uniqueOrder = `orden-${matriculaId}-${Date.now()}`;
      const session = `sess-${user?.id || 'anon'}-${Date.now()}`;
      const wp = await pagosService.iniciarWebpay(matriculaId, Number(costoMatricula), uniqueOrder, session);
      if (wp.success && wp.data?.url && wp.data?.token) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = wp.data.url;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'token_ws';
        input.value = wp.data.token;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        return;
      }
      const errMsg = typeof wp.error === 'string' ? wp.error : (wp.error?.message || wp.error?.detail || 'No se pudo iniciar Webpay');
      toast.error(errMsg);
    } else {
      toast.error(resp.error?.message || 'No se pudo crear la matrícula');
    }
    setIsProcessing(false);
  };

  const formatCurrency = (value: number) => {
    return `$${Number(value || 0).toLocaleString('es-CL')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="mb-2 flex items-center gap-2">
          <Users className="w-8 h-8 text-yellow-600" />
          Mis Atletas
        </h1>
        <p className="text-gray-600">
          🐝 Gestiona la información de tus atletas en La Colmena
        </p>
      </div>

      {misAtletas.length > 0 && (
        <div className="mb-6">
          <Button
            onClick={handleAbrirMatricula}
            className="bg-yellow-400 text-black hover:bg-yellow-500"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Matricular Nuevo Atleta
          </Button>
        </div>
      )}

      {misAtletas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-yellow-400">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Atletas</div>
                  <div className="text-3xl">{misAtletas.length}</div>
                </div>
                <Users className="w-10 h-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-400">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Asistencia Promedio</div>
                  <div className="text-3xl">
                    {Math.round(misAtletas.reduce((sum, a) => sum + a.asistencia, 0) / misAtletas.length)}%
                  </div>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-purple-400">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Logros</div>
                  <div className="text-3xl">
                    {misAtletas.reduce((sum, a) => sum + a.historialDeportivo.filter(h => h.tipo === 'logro').length, 0)}
                  </div>
                </div>
                <Award className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {misAtletas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="mb-2 text-gray-700">No tienes atletas matriculados</h3>
            <p className="text-gray-500 mb-6">
              Aún no has matriculado ningún atleta en Reign All Stars
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {misAtletas.map((atleta) => (
            <Card key={atleta.id} className="hover:shadow-lg transition-all border border-gray-100 hover:border-yellow-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 font-semibold flex items-center justify-center uppercase">
                      {atleta.nombreAtleta?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{atleta.nombreAtleta}</div>
                      <Badge className={getCategoriaColor(atleta.categoria)}>
                        {getCategoriaLabel(atleta.categoria)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleEliminarAtleta(atleta.id)}
                    title="Eliminar atleta"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Edad
                    </span>
                    <p className="font-medium">{calculateAge(atleta.fechaNacimiento)} años</p>
                  </div>
                  <div>
                    <span className="text-gray-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Asistencia
                    </span>
                    <p className="font-medium">{atleta.asistencia}%</p>
                  </div>
                  <div>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Costo Matrícula
                    </span>
                    <p className="font-medium">{formatCurrency(atleta.costoMatricula)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 flex items-center gap-1">
                      <CheckCircle className={`w-3 h-3 ${atleta.estadoPago === 'Pagado' ? 'text-green-600' : 'text-red-500'}`} />
                      Estado Pago
                    </span>
                    <p className="font-medium">{atleta.estadoPago}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Nivel</span>
                    <p className="font-medium">{atleta.nivel}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Logros
                    </span>
                    <p className="font-medium">
                      {atleta.historialDeportivo.filter(h => h.tipo === 'logro').length}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleVerFicha(atleta)}
                  className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Ficha Completa
                </Button>
                <Button
                  onClick={() => abrirCertificaciones(atleta)}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Certificaciones
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedAtleta && (
        <FichaAtleta
          atleta={selectedAtleta}
          isOpen={showFicha}
          onClose={() => setShowFicha(false)}
          onUpdate={handleUpdateAtleta}
          canEdit={true}
        />
      )}

      <Dialog open={showMatriculaDialog} onOpenChange={setShowMatriculaDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Matricular Nuevo Atleta</DialogTitle>
            <DialogDescription>
              Ingresa los datos del atleta para completar la matrícula
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2">
            <form onSubmit={handleSubmitMatricula} id="matricula-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3 border-b pb-2">Datos del Atleta</h4>
                </div>

                {periodos.length > 1 && (
                  <div className="col-span-full">
                    <Label htmlFor="periodo">Periodo de Matrícula</Label>
                    <Select
                      value={periodoSeleccionado || undefined}
                      onValueChange={(value) => setPeriodoSeleccionado(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona periodo" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodos.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.nombre} ({p.estado})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="nombreAtleta">Nombre Completo *</Label>
                  <Input
                    id="nombreAtleta"
                    value={formData.nombreAtleta}
                    onChange={(e) => handleChange('nombreAtleta', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="rutAtleta">RUT *</Label>
                  <Input
                    id="rutAtleta"
                    placeholder="12.345.678-9"
                    value={formData.rutAtleta}
                    onChange={(e) => handleChange('rutAtleta', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
                  <Input
                    id="fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="division">División *</Label>
                  <Select
                    value={formData.division}
                    onValueChange={(value) => handleChange('division', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona división" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIVISIONES.map(div => (
                        <SelectItem key={div.id} value={div.id}>
                          {div.nombre} ({div.descripcion})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoria">Categoría *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => handleChange('categoria', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nombre} - {cat.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="nivel">Nivel *</Label>
                  <Select
                    value={formData.nivel}
                    onValueChange={(value) => handleChange('nivel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NIVELES.map(niv => (
                        <SelectItem key={niv.id} value={niv.id.toString()}>
                          {niv.nombre} - {niv.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    placeholder="+56 9 1234 5678"
                    value={formData.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                  />
                </div>

                <div className="col-span-full mt-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3 border-b pb-2">Datos del Apoderado</h4>
                </div>

                <div>
                  <Label htmlFor="nombreApoderado">Nombre</Label>
                  <Input
                    id="nombreApoderado"
                    value={formData.nombreApoderado}
                    onChange={(e) => handleChange('nombreApoderado', e.target.value)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="telefonoApoderado">Teléfono</Label>
                  <Input
                    id="telefonoApoderado"
                    placeholder="+56 9 1234 5678"
                    value={formData.telefonoApoderado}
                    onChange={(e) => handleChange('telefonoApoderado', e.target.value)}
                  />
                </div>

                <div className="col-span-full mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-700">Costo de Matrícula</p>
                      <p className="text-sm text-gray-600">Pago único por atleta</p>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      ${costoMatricula.toLocaleString('es-CL')}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMatriculaDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="matricula-form"
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              Continuar al Pago
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmacion} onOpenChange={setShowConfirmacion}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Pago de Matrícula</DialogTitle>
            <DialogDescription>
              Revisa los detalles de la matrícula antes de confirmar el pago
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Nombre del Atleta</div>
              <div className="font-medium">{formData.nombreAtleta}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">RUT del Atleta</div>
              <div className="font-medium">{formData.rutAtleta}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Fecha de Nacimiento</div>
              <div className="font-medium">{formData.fechaNacimiento}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Categoría</div>
              <div className="font-medium">{formData.categoria}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Teléfono del Atleta</div>
              <div className="font-medium">{formData.telefono}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Nombre del Apoderado</div>
              <div className="font-medium">{formData.nombreApoderado}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Teléfono del Apoderado</div>
              <div className="font-medium">{formData.telefonoApoderado}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Nivel</div>
              <div className="font-medium">{formData.nivel}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Relación con el Atleta</div>
              <div className="font-medium">{formData.relacionConAtleta}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Costo de Matrícula</div>
              <div className="font-medium">${costoMatricula}</div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmacion(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="ml-2"
              onClick={confirmarPagoMatricula}
            >
              Confirmar Pago
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCertModal} onOpenChange={setShowCertModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Certificaciones del atleta</DialogTitle>
            <DialogDescription>
              Sube certificados (médico, escolar, etc.) para que sean revisados por el administrador.
            </DialogDescription>
          </DialogHeader>
          {certAtleta ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-700">
                <p className="font-semibold">{certAtleta.nombreAtleta}</p>
                <p className="text-gray-500">{certAtleta.rutAtleta}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={certForm.tipo} onValueChange={(v) => setCertForm({ ...certForm, tipo: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nombre</Label>
                  <Input value={certForm.nombre} onChange={(e) => setCertForm({ ...certForm, nombre: e.target.value })} />
                </div>
                <div>
                  <Label>Fecha emisión</Label>
                  <Input type="date" value={certForm.fecha_emision} onChange={(e) => setCertForm({ ...certForm, fecha_emision: e.target.value })} />
                </div>
                <div>
                  <Label>Fecha vencimiento</Label>
                  <Input type="date" value={certForm.fecha_vencimiento} onChange={(e) => setCertForm({ ...certForm, fecha_vencimiento: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Notas</Label>
                  <Input value={certForm.notas} onChange={(e) => setCertForm({ ...certForm, notas: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Archivo</Label>
                  <Input type="file" accept=".pdf,image/*,.doc,.docx" onChange={(e) => setCertForm({ ...certForm, archivo: e.target.files?.[0] || null })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCertModal(false)}>Cerrar</Button>
                <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={subirCertificacion}>
                  <Upload className="w-4 h-4 mr-2" /> Subir certificación
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {certificaciones.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay certificaciones cargadas.</p>
                ) : (
                  certificaciones.map((c: any) => (
                    <Card key={c.id} className="border border-gray-100 shadow-sm">
                      <CardContent className="p-3 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{c.nombre}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500 capitalize">{c.tipo}</p>
                            {estadoBadge((c as any).estado)}
                          </div>
                          <p className="text-xs text-gray-600">
                            Emisión: {c.fecha_emision ? new Date(c.fecha_emision).toLocaleDateString('es-CL') : '-'}
                          </p>
                          {c.fecha_vencimiento && (
                            <p className="text-xs text-gray-600">
                              Vence: {new Date(c.fecha_vencimiento).toLocaleDateString('es-CL')}
                            </p>
                          )}
                          {c.notas && <p className="text-xs text-gray-700">{c.notas}</p>}
                          {(c as any).comentario_admin && (
                            <p className={`text-xs ${((c as any).estado || '').toLowerCase() === 'rechazada' ? 'text-red-600' : 'text-green-600'}`}>
                              {(c as any).comentario_admin}
                            </p>
                          )}
                          {c.archivo_url && (
                            <Button variant="outline" size="sm" onClick={() => window.open(c.archivo_url as string, '_blank', 'noopener')}>
                              <FileText className="w-4 h-4 mr-1" /> Ver archivo
                            </Button>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => eliminarCertificacion(c.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Selecciona un atleta.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
