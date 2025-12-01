import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, Calendar, DollarSign, Clock, CheckCircle, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { notificacionesService } from '../api';
import { toast } from 'sonner@2.0.3';

interface Notificacion {
  id: number;
  tipo: 'general' | 'horario' | 'financiera' | 'recordatorio';
  titulo: string;
  mensaje: string;
  prioridad: 'baja' | 'media' | 'alta';
  fecha_creacion: string;
  leida: boolean;
}

export const MisNotificaciones: React.FC = () => {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [showDetalle, setShowDetalle] = useState(false);
  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState<Notificacion | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'noLeidas'>('todas');

  useEffect(() => {
    loadNotificaciones();
  }, [user]);

  const loadNotificaciones = async () => {
    if (!user) return;
    const resp = await notificacionesService.obtenerNotificaciones();
    if (resp.success) {
      setNotificaciones(resp.data || []);
    } else {
      setNotificaciones([]);
      toast.error(resp.error || 'No se pudieron cargar las notificaciones');
    }
  };

  const marcarComoLeida = async (notificacionId: number) => {
    await notificacionesService.marcarComoLeida(notificacionId);
    loadNotificaciones();
  };

  const eliminarNotificacion = async (notificacionId: number) => {
    await notificacionesService.marcarComoLeida(notificacionId);
    loadNotificaciones();
  };

  const marcarTodasLeidas = async () => {
    const pendientes = notificaciones.filter((n) => !n.leida);
    await Promise.all(pendientes.map((n) => notificacionesService.marcarComoLeida(n.id)));
    loadNotificaciones();
  };

  const abrirDetalle = (notificacion: Notificacion) => {
    setNotificacionSeleccionada(notificacion);
    setShowDetalle(true);
    if (!notificacion.leida) {
      marcarComoLeida(notificacion.id);
    }
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'general':
        return <Bell className="w-5 h-5" />;
      case 'horario':
        return <Calendar className="w-5 h-5" />;
      case 'financiera':
        return <DollarSign className="w-5 h-5" />;
      case 'recordatorio':
        return <Clock className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getColorPrioridad = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'baja':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const notificacionesFiltradas = notificaciones
    .filter((n) => {
      if (filtro === 'noLeidas') {
        return !n.leida;
      }
      return true;
    })
    .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-yellow-400" />
              Mis Notificaciones
            </h2>
            <p className="text-gray-600">Centro de avisos y comunicaciones</p>
          </div>
          {noLeidas > 0 && (
            <Button variant="outline" onClick={marcarTodasLeidas} size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            Total: <span className="font-bold">{notificaciones.length}</span>
          </span>
          {noLeidas > 0 && <Badge className="bg-red-500">{noLeidas} no leídas</Badge>}
        </div>
      </div>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="todas">Todas ({notificaciones.length})</TabsTrigger>
          <TabsTrigger value="noLeidas">No leídas ({noLeidas})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {notificacionesFiltradas.map((notificacion) => {
          const esLeida = notificacion.leida;
          return (
            <Card key={notificacion.id} className={`border ${esLeida ? 'opacity-80' : 'border-yellow-200'}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={getColorPrioridad(notificacion.prioridad)}>
                        {getIconoTipo(notificacion.tipo)}
                        <span className="ml-1 capitalize">{notificacion.tipo}</span>
                      </Badge>
                      {!esLeida && <Badge className="bg-yellow-400 text-black">Nueva</Badge>}
                    </div>
                    <h3 className="text-lg font-semibold mt-2">{notificacion.titulo}</h3>
                    <p className="text-gray-700 mt-1 line-clamp-2">{notificacion.mensaje}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notificacion.fecha_creacion).toLocaleString('es-CL', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!esLeida && (
                      <Button variant="ghost" size="sm" onClick={() => marcarComoLeida(notificacion.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Marcar leída
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => eliminarNotificacion(notificacion.id)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => abrirDetalle(notificacion)}>
                      Ver
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {notificacionesFiltradas.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {filtro === 'noLeidas' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDetalle} onOpenChange={setShowDetalle}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {notificacionSeleccionada && getIconoTipo(notificacionSeleccionada.tipo)}
              {notificacionSeleccionada?.titulo}
            </DialogTitle>
          </DialogHeader>

          {notificacionSeleccionada && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline" className="capitalize">
                  {notificacionSeleccionada.tipo}
                </Badge>
                <Badge className={getColorPrioridad(notificacionSeleccionada.prioridad)}>
                  {notificacionSeleccionada.prioridad}
                </Badge>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{notificacionSeleccionada.mensaje}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  Enviado el {new Date(notificacionSeleccionada.fecha_creacion).toLocaleDateString('es-CL')} a las{' '}
                  {new Date(notificacionSeleccionada.fecha_creacion).toLocaleTimeString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowDetalle(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const useNotificacionesNoLeidas = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = async () => {
      if (!user) {
        setCount(0);
        return;
      }
      const resp = await notificacionesService.obtenerNoLeidasCount();
      if (resp.success && typeof resp.data?.count === 'number') {
        setCount(resp.data.count);
      } else {
        setCount(0);
      }
    };

    updateCount();
    const interval = setInterval(updateCount, 10000);
    return () => clearInterval(interval);
  }, [user]);

  return count;
};
