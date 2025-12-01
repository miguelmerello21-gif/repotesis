import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { certificacionesService } from '../api';
import { Shield, FileText, CheckCircle, XCircle, Clock, Trash2, User } from 'lucide-react';

type Estado = 'pendiente' | 'aprobada' | 'rechazada';

interface CertEntrenador {
  id: number;
  entrenador?: number;
  entrenador_nombre?: string;
  entrenador_email?: string;
  nombre: string;
  institucion: string;
  fecha_obtencion: string;
  fecha_vencimiento?: string | null;
  descripcion?: string;
  archivo?: string;
  archivo_url?: string | null;
  estado?: string;
  comentario_admin?: string;
  created_at?: string;
}

const normalizeEstado = (estado?: string): Estado =>
  ((estado || 'pendiente').trim().toLowerCase() as Estado) || 'pendiente';

const EstadoBadge: React.FC<{ estado?: string }> = ({ estado }) => {
  const e = normalizeEstado(estado);
  if (e === 'aprobada') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="w-3 h-3 mr-1" /> Validada
      </Badge>
    );
  }
  if (e === 'rechazada') {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-300">
        <XCircle className="w-3 h-3 mr-1" /> Rechazada
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
      <Clock className="w-3 h-3 mr-1" /> Pendiente
    </Badge>
  );
};

export const ValidacionCertificacionesEntrenadores: React.FC = () => {
  const [certs, setCerts] = useState<CertEntrenador[]>([]);
  const [filtro, setFiltro] = useState<Estado | 'todas'>('pendiente');

  const safeMsg = (err: any, fallback: string) =>
    typeof err === 'string' ? err : err?.message || err?.detail || err?.error || fallback;

  const loadCertificaciones = async () => {
    const resp = await certificacionesService.listar();
    if (resp.success) {
      const arr: CertEntrenador[] = Array.isArray(resp.data) ? resp.data : resp.data?.results || [];
      setCerts(arr.map((c: any) => ({ ...c, estado: normalizeEstado(c.estado) })));
    } else {
      setCerts([]);
      toast.error(safeMsg(resp.error, 'No se pudieron cargar las certificaciones de entrenadores'));
    }
  };

  useEffect(() => {
    loadCertificaciones();
  }, []);

  const stats = {
    total: certs.length,
    pendientes: certs.filter((c) => normalizeEstado(c.estado) === 'pendiente').length,
    aprobadas: certs.filter((c) => normalizeEstado(c.estado) === 'aprobada').length,
    rechazadas: certs.filter((c) => normalizeEstado(c.estado) === 'rechazada').length,
  };

  const filtradas = certs.filter((c) => (filtro === 'todas' ? true : normalizeEstado(c.estado) === filtro));

  const actualizar = async (cert: CertEntrenador, estado: Estado) => {
    const comentario_admin = window.prompt('Motivo (opcional):', '') || '';
    const resp = await certificacionesService.actualizar(cert.id, { estado, comentario_admin });
    if (resp.success) {
      toast.success(`Certificación ${estado === 'aprobada' ? 'aprobada' : 'rechazada'}`);
      setCerts((prev) => prev.map((c) => (c.id === cert.id ? { ...c, estado, comentario_admin } : c)));
    } else {
      toast.error(safeMsg(resp.error, 'No se pudo actualizar la certificación'));
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este certificado de entrenador?')) return;
    const resp = await certificacionesService.eliminar(id);
    if (resp.success) {
      setCerts((prev) => prev.filter((c) => c.id !== id));
      toast.success('Certificación eliminada');
    } else {
      toast.error(safeMsg(resp.error, 'No se pudo eliminar'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-yellow-500" />
            Validación de Certificaciones (Entrenadores)
          </h2>
          <p className="text-gray-600 text-sm">Valida certificados subidos por los entrenadores</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadCertificaciones}>
          Refrescar
        </Button>
      </div>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Estado | 'todas')}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas">Todas ({stats.total})</TabsTrigger>
          <TabsTrigger value="pendiente">Pendientes ({stats.pendientes})</TabsTrigger>
          <TabsTrigger value="aprobada">Validadas ({stats.aprobadas})</TabsTrigger>
          <TabsTrigger value="rechazada">Rechazadas ({stats.rechazadas})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtradas.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="p-10 text-center text-gray-500">
              No hay certificados en esta categoría.
            </CardContent>
          </Card>
        ) : (
          filtradas.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold">{c.nombre}</h4>
                    <p className="text-xs text-gray-500 capitalize">{c.institucion}</p>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <User className="w-3 h-3" />
                      {c.entrenador_nombre || c.entrenador_email || `Entrenador #${c.entrenador}`}
                    </p>
                  </div>
                  <EstadoBadge estado={c.estado} />
                </div>
                <div className="text-xs text-gray-600">
                  Obtención: {c.fecha_obtencion ? new Date(c.fecha_obtencion).toLocaleDateString('es-CL') : '-'}
                </div>
                {c.fecha_vencimiento && (
                  <p className="text-xs text-gray-600">
                    Vence: {new Date(c.fecha_vencimiento).toLocaleDateString('es-CL')}
                  </p>
                )}
                {c.descripcion && <p className="text-sm text-gray-700">{c.descripcion}</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  {c.archivo_url && (
                    <Button variant="outline" size="sm" onClick={() => window.open(c.archivo_url as string, '_blank', 'noopener')}>
                      <FileText className="w-4 h-4 mr-1" /> Ver archivo
                    </Button>
                  )}
                  {normalizeEstado(c.estado) === 'pendiente' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700"
                        onClick={() => actualizar(c, 'rechazada')}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Rechazar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-700"
                        onClick={() => actualizar(c, 'aprobada')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Aprobar
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {c.comentario_admin || 'Sin comentario'}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => eliminar(c.id)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
