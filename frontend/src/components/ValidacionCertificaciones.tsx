import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Calendar,
  User,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { certificacionesService } from '../api';

interface Certificacion {
  id: number;
  entrenador: number;
  entrenador_nombre?: string;
  institucion: string;
  nombre: string;
  fecha_obtencion: string;
  fecha_vencimiento?: string | null;
  descripcion?: string;
  archivo?: string;
  archivo_url?: string | null;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  comentario_admin?: string;
  created_at?: string;
}

export const ValidacionCertificaciones: React.FC = () => {
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);
  const [showDetalle, setShowDetalle] = useState(false);
  const [certSeleccionada, setCertSeleccionada] = useState<Certificacion | null>(null);
  const [comentario, setComentario] = useState('');
  const [filtro, setFiltro] = useState<'todas' | 'pendiente' | 'aprobada' | 'rechazada'>('pendiente');
  const safeMsg = (err: any, fallback: string) =>
    typeof err === 'string' ? err : err?.message || err?.detail || err?.error || fallback;
  const normalizeEstado = (estado?: string) =>
    (estado || '').toString().trim().toLowerCase() as Certificacion['estado'];
  const normalizeCert = (c: any): Certificacion => ({
    ...c,
    estado: normalizeEstado(c?.estado),
  });
  const unwrapCert = (payload: any): Certificacion | null => {
    if (!payload) return null;
    if (Array.isArray(payload)) return null;
    // Si viene envuelto como {data: {...}}
    if (payload.data) return normalizeCert(payload.data);
    if (payload.results) return normalizeCert(payload.results[0]);
    return normalizeCert(payload);
  };

  useEffect(() => {
    loadCertificaciones();
  }, []);

  const toArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (data?.results && Array.isArray(data.results)) return data.results;
    if (data?.data) return toArray(data.data);
    if (data?.items && Array.isArray(data.items)) return data.items;
    if (data && typeof data === 'object' && data.count && Array.isArray(data.results)) return data.results;
    return [];
  };

  const loadCertificaciones = async (silent = false) => {
    setCertificaciones([]); // limpia estado previo para evitar mostrar datos stale
    const resp = await certificacionesService.listar();
    if (resp.success) {
      const arr: Certificacion[] = toArray(resp.data);
      const limpios = arr
        .filter((c: any) => c && (typeof c.id === 'number' || typeof c.id === 'string'))
        .map(normalizeCert)
        .reduce<Certificacion[]>((acc, cur) => {
          if (!acc.find((x) => String(x.id) === String(cur.id))) acc.push(cur);
          return acc;
        }, []);
      setCertificaciones(limpios);
      return limpios;
    } else {
      if (!silent) toast.error(safeMsg(resp.error, 'No se pudieron cargar las certificaciones'));
      setCertificaciones([]);
      return [];
    }
  };

  const handleValidar = async () => {
    if (!certSeleccionada) return;
    const resp = await certificacionesService.actualizar(certSeleccionada.id, {
      estado: 'aprobada',
      comentario_admin: comentario || '',
    });
    if (resp.success) {
      toast.success('Certificación validada correctamente');
      const updated = unwrapCert(resp.data) || { ...certSeleccionada, estado: 'aprobada' as const, comentario_admin: comentario || '' };
      setCertificaciones((prev) =>
        prev.map((c) => (c.id === certSeleccionada.id ? updated : c))
      );
      await loadCertificaciones(true);
      setShowDetalle(false);
      setComentario('');
      setCertSeleccionada(null);
      setFiltro('aprobada');
    } else {
      toast.error(safeMsg(resp.error, 'No se pudo validar'));
    }
  };

  const handleRechazar = async () => {
    if (!certSeleccionada) return;
    if (!comentario.trim()) {
      toast.error('Debes proporcionar un motivo de rechazo');
      return;
    }
    const resp = await certificacionesService.actualizar(certSeleccionada.id, {
      estado: 'rechazada',
      comentario_admin: comentario,
    });
    if (resp.success) {
      toast.success('Certificación rechazada');
      const updated = unwrapCert(resp.data) || { ...certSeleccionada, estado: 'rechazada' as const, comentario_admin: comentario };
      setCertificaciones((prev) =>
        prev.map((c) => (c.id === certSeleccionada.id ? updated : c))
      );
      await loadCertificaciones(true);
      setShowDetalle(false);
      setComentario('');
      setCertSeleccionada(null);
      setFiltro('rechazada');
    } else {
      toast.error(safeMsg(resp.error, 'No se pudo rechazar'));
    }
  };

  const getEstadoBadge = (estado: string) => {
    const normalized = (estado || '').toLowerCase();
    switch (normalized) {
      case 'aprobada':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" /> Validada
          </Badge>
        );
      case 'pendiente':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" /> Pendiente
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

  const certsFiltradas = certificaciones.filter((c) => {
    const estado = normalizeEstado(c.estado);
    if (filtro === 'todas') return true;
    return estado === filtro;
  });

  const estadisticas = {
    total: certificaciones.length,
    pendientes: certificaciones.filter((c) => normalizeEstado(c.estado) === 'pendiente').length,
    validadas: certificaciones.filter((c) => normalizeEstado(c.estado) === 'aprobada').length,
    rechazadas: certificaciones.filter((c) => normalizeEstado(c.estado) === 'rechazada').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2">
          <Award className="w-6 h-6 text-yellow-400" />
          Validación de Certificaciones
        </h2>
        <p className="text-gray-600">Revisa y valida las certificaciones de los entrenadores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{estadisticas.total}</p>
              </div>
              <Award className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold">{estadisticas.pendientes}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Validadas</p>
                <p className="text-2xl font-bold">{estadisticas.validadas}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold">{estadisticas.rechazadas}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas">Todas ({estadisticas.total})</TabsTrigger>
          <TabsTrigger value="pendiente">Pendientes ({estadisticas.pendientes})</TabsTrigger>
          <TabsTrigger value="aprobada">Validadas ({estadisticas.validadas})</TabsTrigger>
          <TabsTrigger value="rechazada">Rechazadas ({estadisticas.rechazadas})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certsFiltradas.map((cert) => (
          <Card key={cert.id} className="hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold mb-1">{cert.nombre}</h4>
                  <p className="text-sm text-gray-600 mb-1">{cert.institucion}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>{cert.entrenador_nombre || `Entrenador ${cert.entrenador}`}</span>
                  </div>
                </div>
                {getEstadoBadge(cert.estado)}
              </div>

              <div className="space-y-2 text-sm mb-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Obtenida: {new Date(cert.fecha_obtencion).toLocaleDateString('es-CL')}</span>
                </div>
                {cert.fecha_vencimiento && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Vence: {new Date(cert.fecha_vencimiento).toLocaleDateString('es-CL')}</span>
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

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCertSeleccionada(cert);
                  setComentario(cert.comentario_admin || '');
                  setShowDetalle(true);
                }}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                {cert.estado === 'pendiente' ? 'Revisar y Validar' : 'Ver Detalle'}
              </Button>
            </CardContent>
          </Card>
        ))}

        {certsFiltradas.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="p-12 text-center">
              <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {filtro === 'pendiente' ? 'No hay certificaciones pendientes de validación' : 'No hay certificaciones con este estado'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDetalle} onOpenChange={setShowDetalle}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-500" />
              Validación de Certificación
            </DialogTitle>
          </DialogHeader>

          {certSeleccionada && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{certSeleccionada.nombre}</h3>
                {getEstadoBadge(certSeleccionada.estado)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Entrenador</Label>
                  <p className="font-medium">{certSeleccionada.entrenador_nombre || `Entrenador ${certSeleccionada.entrenador}`}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Institución</Label>
                  <p className="font-medium">{certSeleccionada.institucion}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Fecha de Obtención</Label>
                  <p>{new Date(certSeleccionada.fecha_obtencion).toLocaleDateString('es-CL')}</p>
                </div>
                {certSeleccionada.fecha_vencimiento && (
                  <div>
                    <Label className="text-sm text-gray-500">Fecha de Vencimiento</Label>
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
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{certSeleccionada.descripcion}</p>
                </div>
              )}

              {certSeleccionada.archivo_url && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Archivo Adjunto</Label>
                  <div className="flex items-center gap-2 mt-1 p-3 bg-blue-50 border border-blue-200 rounded">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <Input readOnly value={certSeleccionada.archivo_url} className="text-xs" />
                    <Button size="sm" variant="outline" onClick={() => window.open(certSeleccionada.archivo_url as string, '_blank', 'noopener')}>
                      <Eye className="w-4 h-4 mr-1" /> Ver
                    </Button>
                  </div>
                </div>
              )}

              {certSeleccionada.estado === 'pendiente' && (
                <div className="space-y-2">
                  <Label>Comentario (opcional)</Label>
                  <Textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Agrega un comentario sobre esta certificación..."
                    rows={3}
                  />
                </div>
              )}

              {certSeleccionada.estado === 'rechazada' && certSeleccionada.comentario_admin && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <Label className="text-sm text-red-800">Motivo del Rechazo</Label>
                  <p className="text-sm text-red-700 mt-1">{certSeleccionada.comentario_admin}</p>
                </div>
              )}

              {certSeleccionada.estado === 'aprobada' && certSeleccionada.comentario_admin && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <Label className="text-sm text-green-800">Comentario del Administrador</Label>
                  <p className="text-sm text-green-700 mt-1">{certSeleccionada.comentario_admin}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {certSeleccionada?.estado === 'pendiente' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetalle(false);
                    setComentario('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRechazar}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                <Button onClick={handleValidar} className="bg-green-600 text-white hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validar Certificación
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowDetalle(false)}>Cerrar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
