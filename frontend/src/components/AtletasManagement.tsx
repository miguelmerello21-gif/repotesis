import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Users,
  Search,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Award,
  DollarSign,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  Download,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { atletasService, pagosService, usuariosService } from '../api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DIVISIONES, CATEGORIAS, NIVELES } from '../constants/cheerCategories';
import { useAuth, type User as AuthUser } from '../contexts/AuthContext';

interface Atleta {
  id: string;
  nombreAtleta: string;
  rutAtleta: string;
  fechaNacimiento: string;
  division?: string;
  categoria: string;
  nivel: string;
  telefono: string;
  direccion: string;
  emailApoderado: string;
  nombreApoderado: string;
  telefonoApoderado: string;
  fechaMatricula: string;
  costoMatricula: number;
  estadoPago: 'Pagado' | 'Pendiente' | string;
  asistencia: number;
  observaciones: string;
  apoderadoId?: string;
}

export const AtletasManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAtleta, setSelectedAtleta] = useState<Atleta | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAtleta, setEditingAtleta] = useState<Atleta | null>(null);
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    rut: '',
    fechaNacimiento: '',
    division: '',
    categoria: '',
    nivel: '1',
    telefono: '',
    direccion: '',
    emailContacto: '',
    apoderadoId: 'self',
  });
  const [showCertModal, setShowCertModal] = useState(false);
  const [certificaciones, setCertificaciones] = useState<any[]>([]);
  const [certForm, setCertForm] = useState({
    tipo: '',
    nombre: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    notas: '',
    archivo: null as File | null,
  });
  const [apoderados, setApoderados] = useState<AuthUser[]>([]);
  const TIPOS = [
    { id: 'medico', label: 'Médico' },
    { id: 'escolar', label: 'Escolar' },
    { id: 'nacimiento', label: 'Nacimiento' },
    { id: 'otro', label: 'Otro' },
  ];

  useEffect(() => {
    loadAtletas();
    if (currentUser?.role === 'admin') {
      loadApoderados();
    }
  }, []);

  const loadAtletas = async () => {
    const [atsResp, matsResp] = await Promise.all([
      atletasService.listarAtletas(),
      pagosService.listarMatriculas?.(),
    ]);

    if (!atsResp.success) {
      setAtletas([]);
      toast.error(atsResp.error || 'No se pudieron cargar los atletas');
      return;
    }

    const matriculas = matsResp?.success && Array.isArray(matsResp.data) ? matsResp.data : [];
    const matByAtleta: Record<string, any> = {};
    matriculas.forEach((m: any) => {
      if (m.atleta) matByAtleta[String(m.atleta)] = m;
    });

    const atletasData: Atleta[] = (atsResp.data || []).map((m: any) => {
      const mat = matByAtleta[String(m.id)];
      const costo = mat ? Number(mat.monto_total ?? mat.monto_original ?? 0) : Number(m.costo || 0);
      const estadoPago = mat?.estado_pago
        ? mat.estado_pago.toLowerCase() === 'pagado' ? 'Pagado' : 'Pendiente'
        : (m.estado_pago || 'Pendiente');
      return {
        id: String(m.id),
        apoderadoId: m.apoderado?.id ? String(m.apoderado.id) : '',
        nombreAtleta: m.nombre_completo || `${m.nombres || ''} ${m.apellidos || ''}`.trim(),
        rutAtleta: m.rut || '',
        fechaNacimiento: m.fecha_nacimiento || '',
        division: m.division || '',
        categoria: m.categoria || 'recreativo',
        nivel: m.nivel ? String(m.nivel) : '1',
        telefono: m.telefono_contacto || m.telefono || '',
        direccion: m.direccion || '',
        emailApoderado: m.apoderado?.email || m.email_contacto || '',
        nombreApoderado: m.apoderado?.name || m.contacto_emergencia || '',
        telefonoApoderado: m.apoderado?.phone || m.telefono_emergencia || '',
        fechaMatricula: mat?.created_at || m.fecha_ingreso || '',
        costoMatricula: isNaN(costo) ? 0 : costo,
        estadoPago,
        asistencia: m.asistencia || 0,
        observaciones: m.notas || '',
      };
    });
    setAtletas(atletasData);
  };

  const loadApoderados = async () => {
    const resp = await usuariosService.listarUsuarios();
    if (resp.success && Array.isArray(resp.data)) {
      const lista = (resp.data as AuthUser[]).filter((u) => u.role !== 'admin');
      setApoderados(lista);
    } else {
      toast.error('No se pudieron cargar los apoderados');
    }
  };

  const openCertificaciones = async (atleta: Atleta) => {
    setEditingAtleta(atleta);
    setShowCertModal(true);
    let resp = await atletasService.listarCertificacionesPorAtleta?.(Number(atleta.id));
    if (!resp?.success) {
      resp = await atletasService.obtenerCertificaciones(Number(atleta.id));
    }
    if (resp.success && Array.isArray(resp.data)) {
      setCertificaciones(resp.data);
    } else {
      setCertificaciones([]);
      toast.error(resp.error?.message || 'No se pudieron cargar las certificaciones');
    }
  };

  const handleUploadCert = async () => {
    if (!editingAtleta) return;
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
    const resp = await atletasService.subirCertificacion(Number(editingAtleta.id), fd);
    if (resp.success) {
      toast.success('Certificación subida');
      setCertForm({ tipo: '', nombre: '', fecha_emision: '', fecha_vencimiento: '', notas: '', archivo: null });
      openCertificaciones(editingAtleta);
    } else {
      toast.error(resp.error?.message || 'No se pudo subir la certificación');
    }
  };

  const handleDeleteCert = async (id: number) => {
    if (!confirm('¿Eliminar certificación?')) return;
    const resp = await atletasService.eliminarCertificacion(id);
    if (resp.success && editingAtleta) {
      toast.success('Certificación eliminada');
      openCertificaciones(editingAtleta);
    } else {
      toast.error(resp.error?.message || 'No se pudo eliminar');
    }
  };

  const filteredAtletas = useMemo(
    () =>
      atletas.filter((atleta) => {
        const matchesSearch =
          (atleta.nombreAtleta || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (atleta.rutAtleta || '').includes(searchTerm);
        const matchesCategoria = filtroCategoria === 'all' || atleta.categoria === filtroCategoria;
        return matchesSearch && matchesCategoria;
      }),
    [atletas, searchTerm, filtroCategoria]
  );

  const exportAtletasPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = filteredAtletas.map((a) => {
      return `<tr>
        <td>${a.nombreAtleta}</td>
        <td>${a.rutAtleta}</td>
        <td>${a.division || ''}</td>
        <td>${a.categoria}</td>
        <td>${a.nivel}</td>
        <td>${a.nombreApoderado}</td>
        <td>${a.emailApoderado}</td>
      </tr>`;
    }).join('');
    win.document.write(`
      <html><head><title>Atletas</title></head>
      <body>
        <h2>Atletas (${filteredAtletas.length})</h2>
        <table border="1" cellpadding="6" cellspacing="0">
          <thead><tr><th>Nombre</th><th>RUT</th><th>División</th><th>Categoría</th><th>Nivel</th><th>Apoderado</th><th>Email apoderado</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="7">Sin datos</td></tr>'}</tbody>
        </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleViewDetails = (atleta: Atleta) => {
    setSelectedAtleta(atleta);
    setShowDetailModal(true);
  };

  const handleDeleteAtleta = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este atleta?')) return;
    const resp = await atletasService.eliminarAtleta(id);
    if (resp.success) {
      toast.success('Atleta eliminado correctamente');
      loadAtletas();
    } else {
      toast.error(resp.error || 'No se pudo eliminar el atleta');
    }
  };

  const handleOpenCreate = () => {
    setEditingAtleta(null);
    setForm({
      nombres: '',
      apellidos: '',
      rut: '',
      fechaNacimiento: '',
      division: '',
      categoria: '',
      nivel: '1',
      telefono: '',
      direccion: '',
      emailContacto: '',
      apoderadoId: 'self',
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (atleta: Atleta) => {
    const partes = atleta.nombreAtleta.trim().split(' ');
    const nombres =
      partes.length > 1 ? partes.slice(0, partes.length - 1).join(' ') : atleta.nombreAtleta;
    const apellidos = partes.length > 1 ? partes.slice(-1).join(' ') : '';
    setEditingAtleta(atleta);
    setForm({
      nombres,
      apellidos,
      rut: atleta.rutAtleta || '',
      fechaNacimiento: atleta.fechaNacimiento || '',
      division: atleta.division || '',
      categoria: atleta.categoria || '',
      nivel: atleta.nivel || '1',
      telefono: atleta.telefono || '',
      direccion: atleta.direccion || '',
      emailContacto: atleta.emailApoderado || '',
      apoderadoId: atleta.apoderadoId || 'self',
    });
    setShowFormModal(true);
  };

  const handleSubmitForm = async () => {
    if (!form.nombres || !form.apellidos || !form.rut || !form.fechaNacimiento || !form.division || !form.categoria) {
      toast.error('Completa los campos obligatorios (incluye apellidos)');
      return;
    }
    const payload: any = {
      nombres: form.nombres,
      apellidos: form.apellidos,
      rut: form.rut,
      fecha_nacimiento: form.fechaNacimiento,
      division: form.division,
      categoria: form.categoria,
      nivel: Number(form.nivel) || 1,
      telefono_contacto: form.telefono,
      direccion: form.direccion,
      email_contacto: form.emailContacto,
    };
    if (currentUser?.role === 'admin' && form.apoderadoId && form.apoderadoId !== 'self') {
      payload.apoderado_id = form.apoderadoId;
    }
    const resp = editingAtleta
      ? await atletasService.actualizarAtleta(Number(editingAtleta.id), payload)
      : await atletasService.crearAtleta(payload);

    if (resp.success) {
      toast.success(editingAtleta ? 'Atleta actualizado' : 'Atleta creado');
      setShowFormModal(false);
      setEditingAtleta(null);
      loadAtletas();
    } else {
      toast.error(resp.error?.message || 'No se pudo guardar');
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'recreativo':
        return 'bg-blue-100 text-blue-800';
      case 'novice':
        return 'bg-green-100 text-green-800';
      case 'prep':
        return 'bg-purple-100 text-purple-800';
      case 'elite':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'recreativo':
        return 'Recreativo';
      case 'novice':
        return 'Novice';
      case 'prep':
        return 'Prep';
      case 'elite':
        return 'Elite';
      default:
        return categoria;
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <Users className="w-6 h-6 text-yellow-600" />
            Gestión de Atletas
          </h2>
          <p className="text-gray-600 text-sm">Registro completo de atletas de La Colmena</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportAtletasPdf}>
            <Download className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
          <div className="text-right">
            <div className="text-3xl font-semibold text-gray-800">{atletas.length}</div>
            <p className="text-sm text-gray-600">Atletas Registrados</p>
          </div>
          <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Atleta
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Buscar por nombre o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-3 py-3 rounded-xl shadow-sm border-gray-200 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300"
              />
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full md:w-56 rounded-xl border-gray-200 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="recreativo">Recreativo</SelectItem>
                <SelectItem value="novice">Novice</SelectItem>
                <SelectItem value="prep">Prep</SelectItem>
                <SelectItem value="elite">Elite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAtletas.map((atleta) => (
          <Card
            key={atleta.id}
            className="h-full flex flex-col rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 bg-white"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-700 flex items-center justify-center font-semibold uppercase shadow-inner">
                    {(atleta.nombreAtleta || 'A').charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold text-gray-800 leading-tight">
                      {atleta.nombreAtleta || 'Sin nombre'}
                    </span>
                    <span className="text-xs text-gray-500">{atleta.rutAtleta || 'Sin RUT'}</span>
                  </div>
                </div>
                <Badge className={`${getCategoriaColor(atleta.categoria)} rounded-full px-3 py-1 text-xs`}>
                  {getCategoriaLabel(atleta.categoria)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700 flex-1 flex flex-col">
              <div className="flex flex-wrap items-center gap-3 text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {atleta.fechaNacimiento || 'Sin fecha'}
                </span>
                {atleta.fechaNacimiento && (
                  <span className="text-xs text-gray-500">
                    ({calculateAge(atleta.fechaNacimiento)} años)
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  Nivel {atleta.nivel}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{atleta.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{atleta.emailApoderado || 'Sin email apoderado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="line-clamp-1">Apoderado: {atleta.nombreApoderado || 'Sin apoderado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="line-clamp-1">{atleta.direccion || 'Sin dirección'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span>Matrícula: ${atleta.costoMatricula.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {atleta.estadoPago === 'Pagado' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Pago al día</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Pago pendiente</span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-auto flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3 h-9 text-gray-700 border-gray-200 hover:border-yellow-300 hover:text-yellow-700"
                  onClick={() => handleViewDetails(atleta)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver detalle
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full px-3 h-9"
                  onClick={() => handleOpenEdit(atleta)}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3 h-9"
                  onClick={() => openCertificaciones(atleta)}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Certificaciones
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full px-3 h-9"
                  onClick={() => handleDeleteAtleta(atleta.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAtletas.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-2" />
            No hay atletas registrados
          </CardContent>
        </Card>
      )}

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Atleta</DialogTitle>
            <DialogDescription>Información detallada del atleta</DialogDescription>
          </DialogHeader>
          {selectedAtleta && (
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <div>
                <Label>Nombre</Label>
                <p>{selectedAtleta.nombreAtleta}</p>
              </div>
              <div>
                <Label>RUT</Label>
                <p>{selectedAtleta.rutAtleta}</p>
              </div>
              <div>
                <Label>Categoría</Label>
                <p>{getCategoriaLabel(selectedAtleta.categoria)}</p>
              </div>
              <div>
                <Label>Nivel</Label>
                <p>{selectedAtleta.nivel}</p>
              </div>
              <div>
                <Label>Fecha nacimiento</Label>
                <p>{selectedAtleta.fechaNacimiento}</p>
              </div>
              <div>
                <Label>Apoderado</Label>
                <p>{selectedAtleta.nombreApoderado}</p>
              </div>
              <div>
                <Label>Contacto</Label>
                <p>
                  {selectedAtleta.telefonoApoderado} · {selectedAtleta.emailApoderado}
                </p>
              </div>
              <div>
                <Label>Dirección</Label>
                <p>{selectedAtleta.direccion}</p>
              </div>
              <div>
                <Label>Pago matrícula</Label>
                <p>
                  ${selectedAtleta.costoMatricula.toLocaleString('es-CL')} · {selectedAtleta.estadoPago}
                </p>
              </div>
              <div>
                <Label>Observaciones</Label>
                <p>{selectedAtleta.observaciones || 'Sin observaciones'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAtleta ? 'Editar Atleta' : 'Nuevo Atleta'}</DialogTitle>
            <DialogDescription>Los cambios se guardan en el backend.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Nombres *</Label>
              <Input value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
            </div>
            <div>
              <Label>Apellidos *</Label>
              <Input
                value={form.apellidos}
                onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>RUT *</Label>
              <Input value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} required />
            </div>
            <div>
              <Label>Fecha nacimiento *</Label>
              <Input
                type="date"
                value={form.fechaNacimiento}
                onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
              />
            </div>
            <div>
              <Label>División *</Label>
              <Select value={form.division} onValueChange={(v) => setForm({ ...form, division: v })}>
                <SelectTrigger><SelectValue placeholder="División" /></SelectTrigger>
                <SelectContent>
                  {DIVISIONES.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoría *</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nivel</Label>
              <Select value={form.nivel} onValueChange={(v) => setForm({ ...form, nivel: v })}>
                <SelectTrigger><SelectValue placeholder="Nivel" /></SelectTrigger>
                <SelectContent>
                  {NIVELES.map((n) => (
                    <SelectItem key={String(n.id)} value={String(n.id)}>{n.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teléfono contacto</Label>
              <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección</Label>
              <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Email contacto</Label>
              <Input value={form.emailContacto} onChange={(e) => setForm({ ...form, emailContacto: e.target.value })} />
            </div>
            {currentUser?.role === 'admin' && (
              <div className="md:col-span-2">
                <Label>Asignar Apoderado</Label>
                <Select
                  value={form.apoderadoId}
                  onValueChange={(v) => setForm({ ...form, apoderadoId: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona apoderado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Usar mi usuario</SelectItem>
                    {apoderados.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {(u.name || u.email) ?? ''} — {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowFormModal(false)}>Cancelar</Button>
            <Button
              className="bg-yellow-400 text-black hover:bg-yellow-500"
              onClick={handleSubmitForm}
            >
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCertModal} onOpenChange={setShowCertModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Certificaciones del atleta</DialogTitle>
            <DialogDescription>
              Gestiona certificados médicos/escolares asociados al atleta seleccionado.
            </DialogDescription>
          </DialogHeader>
          {editingAtleta ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-700">
                <p className="font-semibold">{editingAtleta.nombreAtleta}</p>
                <p className="text-gray-500">{editingAtleta.rutAtleta}</p>
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
                <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={handleUploadCert}>
                  Subir certificación
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-auto pr-2">
                {certificaciones.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay certificaciones cargadas.</p>
                ) : (
                  certificaciones.map((c) => (
                    <Card key={c.id} className="border border-gray-100 shadow-sm">
                      <CardContent className="p-3 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{c.nombre}</p>
                          <p className="text-xs text-gray-500 capitalize">{c.tipo}</p>
                          <p className="text-xs text-gray-600">
                            Emisión: {c.fecha_emision ? new Date(c.fecha_emision).toLocaleDateString('es-CL') : '-'}
                          </p>
                          {c.fecha_vencimiento && (
                            <p className="text-xs text-gray-600">
                              Vence: {new Date(c.fecha_vencimiento).toLocaleDateString('es-CL')}
                            </p>
                          )}
                          {c.notas && <p className="text-xs text-gray-700">{c.notas}</p>}
                          {(() => {
                            const rawUrl =
                              (c as any).archivo_url ||
                              (typeof (c as any).archivo === 'string' ? (c as any).archivo : null);
                            if (!rawUrl) return null;
                            const url = rawUrl.startsWith('http')
                              ? rawUrl
                              : `${window.location.origin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(url as string, '_blank', 'noopener')}
                              >
                                <FileText className="w-4 h-4 mr-1" /> Ver archivo
                              </Button>
                            );
                          })()}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteCert(c.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Selecciona un atleta para gestionar certificaciones.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
