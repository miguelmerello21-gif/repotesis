import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Bell, Send, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { equiposService, notificacionesService } from '../api';

interface NotificacionesEntrenadorProps {
  equipos: any[];
  atletas: any[];
}

interface InfoEquipo {
  apoderados: string[];
  atletas: number;
}

export const NotificacionesEntrenador: React.FC<NotificacionesEntrenadorProps> = ({ equipos, atletas }) => {
  const { user } = useAuth();
  const [showNuevaNotificacion, setShowNuevaNotificacion] = useState(false);
  const [showCancelarEntrenamiento, setShowCancelarEntrenamiento] = useState(false);
  const [loadingEnvio, setLoadingEnvio] = useState(false);
  const [notificacionesEnviadas, setNotificacionesEnviadas] = useState<any[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [apoderadosPorEquipo, setApoderadosPorEquipo] = useState<Record<string, InfoEquipo>>({});

  const [nuevaNotif, setNuevaNotif] = useState({
    titulo: '',
    mensaje: '',
    equiposSeleccionados: [] as string[],
    prioridad: 'media' as 'baja' | 'media' | 'alta',
  });

  const [cancelacion, setCancelacion] = useState({
    equipoId: '',
    fecha: '',
    motivo: '',
  });

  const getEquipoId = (eq: any) => {
    const raw = eq?.id ?? eq?.equipo ?? eq?.equipo_id;
    return raw !== undefined && raw !== null ? String(raw) : '';
  };

  useEffect(() => {
    const cargarApoderados = async () => {
      const map: Record<string, InfoEquipo> = {};
      for (const eq of equipos) {
        const id = getEquipoId(eq);
        if (!id) continue;
        let atletasEquipo: any[] = [];
        const resp = await equiposService.obtenerAtletasEquipo(id);
        if (resp.success && Array.isArray(resp.data)) {
          atletasEquipo = resp.data;
        } else if (Array.isArray(eq.atletas)) {
          // Fallback: usar atletas ya cargados en el perfil si vienen en la prop del equipo
          atletasEquipo = (eq.atletas || []).map((a: any) => ({
            apoderado: a.apoderado,
            user: a.user,
            user_id: a.user_id,
            userId: a.userId,
            emailApoderado: a.emailApoderado,
          }));
        } else if (Array.isArray(atletas)) {
          // Fallback usando prop atletas: filtrar si incluye el equipo
          atletasEquipo = atletas.filter((a: any) => {
            const eqs = a.equipos || a.equiposIds || a.equipos_ids || [];
            return (eqs as any[]).map(String).includes(id) || (eq?.atletasIds || []).map(String).includes(String(a.id));
          });
        }
        const aps = Array.from(
          new Set(
            atletasEquipo
              .map((a: any) => a.apoderado || a.apoderado_id || a.user || a.user_id || a.userId || a.emailApoderado)
              .filter(Boolean)
              .map(String)
          )
        );
        map[id] = { apoderados: aps, atletas: atletasEquipo.length };
      }
      setApoderadosPorEquipo(map);
    };
    cargarApoderados();
  }, [equipos]);

  const equiposConApoderados = equipos.filter((eq) => {
    const id = getEquipoId(eq);
    return (apoderadosPorEquipo[id]?.apoderados.length || 0) > 0;
  });

  const obtenerApoderadosPorEquipos = (equipoIds: string[]) => {
    const apoderadosIds = new Set<string>();
    equipoIds.forEach((id) => {
      const aps = apoderadosPorEquipo[id]?.apoderados || [];
      aps.forEach((a) => apoderadosIds.add(a));
    });
    return Array.from(apoderadosIds);
  };

  const handleEnviarNotificacion = async () => {
    if (!user || !nuevaNotif.titulo || !nuevaNotif.mensaje) {
      toast.error('Completa el título y mensaje');
      return;
    }
    if (nuevaNotif.equiposSeleccionados.length === 0) {
      toast.error('Selecciona al menos un equipo');
      return;
    }
    setLoadingEnvio(true);
    const apoderados = obtenerApoderadosPorEquipos(nuevaNotif.equiposSeleccionados);
    if (apoderados.length === 0) {
      toast.error('No se encontraron apoderados para notificar');
      setLoadingEnvio(false);
      return;
    }
    const resp = await notificacionesService.crearNotificacion({
      titulo: nuevaNotif.titulo,
      mensaje: nuevaNotif.mensaje,
      tipo: 'horario',
      prioridad: nuevaNotif.prioridad,
      estado: 'enviada',
      canales: ['plataforma'],
      destinatarios_ids: apoderados,
    });
    setLoadingEnvio(false);
    if (resp.success) {
      toast.success(`Notificación enviada a ${apoderados.length} apoderado(s)`);
      setShowNuevaNotificacion(false);
      resetFormNotif();
      cargarMisNotificaciones();
    } else {
      toast.error(resp.error?.message || 'No se pudo enviar la notificación');
    }
  };

  const handleCancelarEntrenamiento = async () => {
    if (!user || !cancelacion.equipoId || !cancelacion.fecha || !cancelacion.motivo) {
      toast.error('Completa todos los campos');
      return;
    }
    setLoadingEnvio(true);
    const apoderados = obtenerApoderadosPorEquipos([cancelacion.equipoId]);
    if (apoderados.length === 0) {
      toast.error('No se encontraron apoderados para notificar');
      setLoadingEnvio(false);
      return;
    }
    const equipo = equipos.find((e) => getEquipoId(e) === cancelacion.equipoId);
    const fechaFormateada = new Date(cancelacion.fecha).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const mensaje = `El entrenamiento de ${equipo?.nombre || 'tu equipo'} del ${fechaFormateada} ha sido cancelado.\n\nMotivo: ${cancelacion.motivo}\n\nGracias por su comprensión.`;
    const resp = await notificacionesService.crearNotificacion({
      titulo: 'Cancelación de entrenamiento',
      mensaje,
      tipo: 'horario',
      prioridad: 'alta',
      estado: 'enviada',
      canales: ['plataforma'],
      destinatarios_ids: apoderados,
    });
    setLoadingEnvio(false);
    if (resp.success) {
      toast.success(`Notificación enviada a ${apoderados.length} apoderado(s)`);
      setShowCancelarEntrenamiento(false);
      resetFormCancelacion();
      cargarMisNotificaciones();
    } else {
      toast.error(resp.error?.message || 'No se pudo enviar la notificación');
    }
  };

  const resetFormNotif = () => {
    setNuevaNotif({
      titulo: '',
      mensaje: '',
      equiposSeleccionados: [],
      prioridad: 'media',
    });
  };

  const resetFormCancelacion = () => {
    setCancelacion({
      equipoId: '',
      fecha: '',
      motivo: '',
    });
  };

  const toggleEquipo = (equipoId: string) => {
    if (nuevaNotif.equiposSeleccionados.includes(equipoId)) {
      setNuevaNotif({
        ...nuevaNotif,
        equiposSeleccionados: nuevaNotif.equiposSeleccionados.filter((id) => id !== equipoId),
      });
    } else {
      setNuevaNotif({
        ...nuevaNotif,
        equiposSeleccionados: [...nuevaNotif.equiposSeleccionados, equipoId],
      });
    }
  };

  const seleccionarTodos = () => {
    if (nuevaNotif.equiposSeleccionados.length === equiposConApoderados.length) {
      setNuevaNotif({ ...nuevaNotif, equiposSeleccionados: [] });
    } else {
      setNuevaNotif({ ...nuevaNotif, equiposSeleccionados: equiposConApoderados.map((e) => e.id) });
    }
  };

  const cargarMisNotificaciones = async () => {
    const resp = await notificacionesService.obtenerNotificaciones();
    if (resp.success && Array.isArray(resp.data)) {
      setNotificacionesEnviadas(resp.data.filter((n: any) => String(n.creado_por) === String(user?.id)));
    }
  };

  useEffect(() => {
    cargarMisNotificaciones();
  }, []);

  if (equipos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-2">No tienes equipos asignados</p>
          <p className="text-sm text-gray-400">Contacta al administrador para asignación de equipos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-yellow-400" />
          Comunicación con Apoderados
        </h3>
          <p className="text-sm text-gray-600">Envía avisos y notificaciones a los apoderados de tus equipos</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button className="bg-blue-500 text-white hover:bg-blue-600" onClick={() => setShowNuevaNotificacion(true)}>
          <Send className="w-4 h-4 mr-2" />
          Nueva notificación
        </Button>
        <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => setShowHistorial(true)}>
          Ver historial
        </Button>
        <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setShowCancelarEntrenamiento(true)}>
          <XCircle className="w-4 h-4 mr-2" />
          Cancelar entrenamiento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tus Equipos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {equipos.map((equipo) => {
              const id = getEquipoId(equipo);
              const info = apoderadosPorEquipo[id] || { apoderados: [], atletas: 0 };
              return (
                <div key={equipo.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{equipo.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {info.atletas} atletas · {info.apoderados.length} apoderados
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{info.atletas}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de notificaciones enviadas</CardTitle>
        </CardHeader>
        <CardContent>
          {notificacionesEnviadas.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no has enviado notificaciones.</p>
          ) : (
            <div className="space-y-3">
              {notificacionesEnviadas.map((n) => (
                <div key={n.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{n.titulo}</p>
                      <p className="text-xs text-gray-500">{new Date(n.created_at || n.fecha_envio).toLocaleString('es-CL')}</p>
                    </div>
                    <Badge className="capitalize">{n.prioridad || 'media'}</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{n.mensaje}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNuevaNotificacion} onOpenChange={setShowNuevaNotificacion}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Aviso a Apoderados</DialogTitle>
            <DialogDescription>La notificación se enviará a los apoderados de los equipos seleccionados.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={nuevaNotif.titulo}
                onChange={(e) => setNuevaNotif({ ...nuevaNotif, titulo: e.target.value })}
                placeholder="Ej: Cambio de horario, evento próximo, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Mensaje *</Label>
              <Textarea
                value={nuevaNotif.mensaje}
                onChange={(e) => setNuevaNotif({ ...nuevaNotif, mensaje: e.target.value })}
                placeholder="Escribe el mensaje que deseas enviar a los apoderados..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Equipos Destinatarios *</Label>
                <Button type="button" variant="outline" size="sm" onClick={seleccionarTodos}>
                  {nuevaNotif.equiposSeleccionados.length === equiposConApoderados.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Button>
              </div>
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {equipos.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No hay equipos asignados</p>
                ) : (
                  equipos.map((equipo) => {
                    const id = getEquipoId(equipo);
                    const info = apoderadosPorEquipo[id] || { apoderados: [], atletas: 0 };
                    return (
                      <div key={equipo.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                        <Checkbox checked={nuevaNotif.equiposSeleccionados.includes(equipo.id)} onCheckedChange={() => toggleEquipo(equipo.id)} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{equipo.nombre}</p>
                          <p className="text-xs text-gray-500">
                            {info.apoderados.length} apoderado{info.apoderados.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={nuevaNotif.prioridad} onValueChange={(value: any) => setNuevaNotif({ ...nuevaNotif, prioridad: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNuevaNotificacion(false);
                resetFormNotif();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEnviarNotificacion} className="bg-yellow-400 text-black hover:bg-yellow-500" disabled={loadingEnvio}>
              <Send className="w-4 h-4 mr-2" />
              {loadingEnvio ? 'Enviando...' : 'Enviar Notificación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelarEntrenamiento} onOpenChange={setShowCancelarEntrenamiento}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Cancelar Entrenamiento
            </DialogTitle>
            <DialogDescription>
              Los apoderados recibirán una notificación prioritaria sobre la cancelación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Equipo *</Label>
              <Select value={cancelacion.equipoId} onValueChange={(value) => setCancelacion({ ...cancelacion, equipoId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipos.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No hay equipos disponibles
                    </SelectItem>
                  ) : (
                    equipos.map((equipo) => {
                      const id = getEquipoId(equipo);
                      const info = apoderadosPorEquipo[id] || { apoderados: [], atletas: 0 };
                      return (
                        <SelectItem key={equipo.id} value={equipo.id}>
                          {equipo.nombre} ({info.apoderados.length} apoderado{info.apoderados.length !== 1 ? 's' : ''})
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha del Entrenamiento Cancelado *</Label>
              <Input
                type="date"
                value={cancelacion.fecha}
                onChange={(e) => setCancelacion({ ...cancelacion, fecha: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo de la Cancelación *</Label>
              <Textarea
                value={cancelacion.motivo}
                onChange={(e) => setCancelacion({ ...cancelacion, motivo: e.target.value })}
                placeholder="Ej: clima, emergencia, mantenimiento del gimnasio, etc."
                rows={4}
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Notificación de Alta Prioridad</p>
                <p className="text-red-700">
                  Este aviso se enviará como prioridad alta a todos los apoderados del equipo seleccionado.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelarEntrenamiento(false);
                resetFormCancelacion();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCancelarEntrenamiento}
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={loadingEnvio}
            >
              <XCircle className="w-4 h-4 mr-2" />
              {loadingEnvio ? 'Enviando...' : 'Confirmar Cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Historial de notificaciones enviadas</DialogTitle>
            <DialogDescription>Solo ves las notificaciones que enviaste.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {notificacionesEnviadas.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no has enviado notificaciones.</p>
            ) : (
              notificacionesEnviadas.map((n) => (
                <div key={n.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{n.titulo}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(n.created_at || n.fecha_envio).toLocaleString('es-CL')}
                      </p>
                    </div>
                    <Badge className="capitalize">{n.prioridad || 'media'}</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{n.mensaje}</p>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistorial(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
