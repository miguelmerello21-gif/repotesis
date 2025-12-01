import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Bell, Send, Users, AlertTriangle, CheckCircle, Mail, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { notificacionesService, usuariosService } from '../api';

interface Notificacion {
  id: number | string;
  titulo: string;
  mensaje: string;
  tipo: string;
  prioridad: string;
  estado: string;
  created_at?: string;
  fecha_envio?: string;
  destinatarios?: any[];
  no_leidas?: boolean;
}

interface UsuarioOption {
  id: number | string;
  name: string;
  email: string;
  role?: string;
}

export const GestionNotificaciones: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [enviarATodos, setEnviarATodos] = useState(true);
  const [destinatariosSeleccionados, setDestinatariosSeleccionados] = useState<string[]>([]);

  const [form, setForm] = useState({
    titulo: '',
    mensaje: '',
    tipo: 'general',
    prioridad: 'media',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [notiResp, usersResp] = await Promise.all([
      notificacionesService.obtenerNotificaciones(),
      usuariosService.listarUsuarios?.(),
    ]);

    if (notiResp.success) {
      setNotificaciones(notiResp.data || []);
    } else {
      toast.error(notiResp.error?.message || 'No se pudieron cargar las notificaciones');
    }

    if (usersResp?.success) {
      setUsuarios(
        (usersResp.data || []).map((u: any) => ({
          id: u.id,
          name: u.name || u.nombre || u.email,
          email: u.email,
          role: u.role,
        }))
      );
    }
    setLoading(false);
  };

  const destinatariosParaEnvio = useMemo(() => {
    if (enviarATodos) return usuarios.map((u) => String(u.id));
    return destinatariosSeleccionados;
  }, [enviarATodos, destinatariosSeleccionados, usuarios]);

  const handleCrear = async () => {
    if (!form.titulo || !form.mensaje) {
      toast.error('Completa título y mensaje');
      return;
    }
    if (destinatariosParaEnvio.length === 0) {
      toast.error('Selecciona al menos un destinatario');
      return;
    }
    const payload = {
      titulo: form.titulo,
      mensaje: form.mensaje,
      tipo: form.tipo,
      prioridad: form.prioridad,
      estado: 'enviada',
      canales: ['plataforma'],
      destinatarios_ids: destinatariosParaEnvio,
    };
    const resp = await notificacionesService.crearNotificacion(payload);
    if (resp.success) {
      toast.success('Notificación enviada');
      setShowDialog(false);
      setForm({ titulo: '', mensaje: '', tipo: 'general', prioridad: 'media' });
      setDestinatariosSeleccionados([]);
      await loadData();
    } else {
      toast.error(resp.error?.message || 'No se pudo enviar la notificación');
    }
  };

  const handleMarcarLeida = async (id: number | string) => {
    const resp = await notificacionesService.marcarComoLeida(id);
    if (resp.success) {
      await loadData();
    }
  };

  const handleEliminar = async (id: number | string) => {
    const resp = await notificacionesService.eliminarNotificacion(id);
    if (resp.success) {
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notificación eliminada');
    } else {
      toast.error(resp.error?.message || 'No se pudo eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400 rounded-lg">
              <Bell className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Comunicación interna</h2>
              <p className="text-sm text-gray-600">Envía avisos a usuarios, entrenadores y apoderados</p>
            </div>
          </div>
          <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={() => setShowDialog(true)}>
            <Send className="w-4 h-4 mr-2" /> Nueva notificación
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-gray-500">Cargando...</div>
          ) : notificaciones.length === 0 ? (
            <div className="text-sm text-gray-500">No hay notificaciones aún.</div>
          ) : (
            <div className="space-y-3">
              {notificaciones.map((n) => (
                <div key={n.id} className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {n.tipo}
                      </Badge>
                      <Badge className="capitalize">{n.prioridad}</Badge>
                      {n.no_leidas && <Badge className="bg-green-100 text-green-700">Nueva</Badge>}
                    </div>
                    <div className="font-semibold">{n.titulo}</div>
                    <div className="text-sm text-gray-600">{n.mensaje}</div>
                    <div className="text-xs text-gray-500">
                      Enviada: {new Date(n.created_at || n.fecha_envio || Date.now()).toLocaleString('es-CL')} · Destinatarios:{' '}
                      {n.destinatarios ? n.destinatarios.length : '-'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleMarcarLeida(n.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Marcar leída
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEliminar(n.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Enviar notificación</DialogTitle>
            <DialogDescription>Se enviará a los destinatarios seleccionados.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div>
              <Label>Mensaje</Label>
              <Textarea rows={4} value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="horario">Horario</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox checked={enviarATodos} onCheckedChange={(v) => setEnviarATodos(Boolean(v))} id="enviarTodos" />
                <Label htmlFor="enviarTodos">Enviar a todos los usuarios</Label>
              </div>
              {!enviarATodos && (
                <div className="max-h-40 overflow-auto border rounded-md p-3 space-y-2">
                  {usuarios.map((u) => {
                    const checked = destinatariosSeleccionados.includes(String(u.id));
                    return (
                      <label key={u.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            const val = String(u.id);
                            setDestinatariosSeleccionados((prev) =>
                              Boolean(v) ? [...prev, val] : prev.filter((x) => x !== val)
                            );
                          }}
                        />
                        <span>{u.name || u.email}</span>
                        <span className="text-xs text-gray-500">({u.role || 'usuario'})</span>
                      </label>
                    );
                  })}
                  {usuarios.length === 0 && <p className="text-xs text-gray-500">No hay usuarios cargados.</p>}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={handleCrear}>
              <Send className="w-4 h-4 mr-1" /> Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
