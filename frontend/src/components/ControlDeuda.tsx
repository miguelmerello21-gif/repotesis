import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Bell,
  CalendarIcon,
  CheckCircle,
  Clock,
  DollarSign,
  Mail,
  Search,
  Shield,
  User,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { pagosService } from '../api';

interface DeudaDetalle {
  atletaId: number | string;
  atletaNombre: string;
  apoderadoNombre: string;
  apoderadoEmail: string;
  pagosVencidos: any[];
  totalDeuda: number;
  diasAtraso: number;
  nivelGravedad: 'leve' | 'moderado' | 'grave' | 'critico';
  bloqueado: boolean;
  ultimaNotificacion?: string;
  notificacionesEnviadas: number;
}

interface ConfiguracionDeuda {
  diasAlertaAmarilla: number;
  diasAlertaNaranja: number;
  diasAlertaRoja: number;
  diasBloqueo: number;
  notificacionesAutomaticas: boolean;
  frecuenciaNotificaciones: number;
  mensaje: string;
}

export const ControlDeuda: React.FC = () => {
  const [deudas, setDeudas] = useState<DeudaDetalle[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionDeuda>({
    diasAlertaAmarilla: 3,
    diasAlertaNaranja: 7,
    diasAlertaRoja: 15,
    diasBloqueo: 30,
    notificacionesAutomaticas: true,
    frecuenciaNotificaciones: 7,
    mensaje: 'Estimado/a apoderado/a, le recordamos que tiene pagos pendientes. Por favor, regularice su situacion a la brevedad.'
  });
  const [showConfiguracion, setShowConfiguracion] = useState(false);
  const [showDetalleDeuda, setShowDetalleDeuda] = useState(false);
  const [deudaSeleccionada, setDeudaSeleccionada] = useState<DeudaDetalle | null>(null);
  const [filtroGravedad, setFiltroGravedad] = useState('todos');
  const [filtroBloqueados, setFiltroBloqueados] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [cargandoDeudas, setCargandoDeudas] = useState(false);

  const minimos = { amarilla: 1, naranja: 2, roja: 3, bloqueo: 4 };

  const normalizarConfiguracion = (cfg: ConfiguracionDeuda): ConfiguracionDeuda => {
    const amarilla = Math.max(minimos.amarilla, Number(cfg.diasAlertaAmarilla) || 0);
    const naranja = Math.max(minimos.naranja, Number(cfg.diasAlertaNaranja) || 0);
    const roja = Math.max(minimos.roja, Number(cfg.diasAlertaRoja) || 0);
    const bloqueo = Math.max(minimos.bloqueo, Number(cfg.diasBloqueo) || 0);
    return {
      ...cfg,
      diasAlertaAmarilla: amarilla,
      diasAlertaNaranja: naranja,
      diasAlertaRoja: roja,
      diasBloqueo: bloqueo,
      frecuenciaNotificaciones: Number(cfg.frecuenciaNotificaciones) || 7,
      notificacionesAutomaticas: !!cfg.notificacionesAutomaticas,
    };
  };


  useEffect(() => {
    loadConfiguracion();
    loadDeudas();
  }, []);

  const loadConfiguracion = () => {
    const saved = localStorage.getItem('ConfiguracionDeuda');
    if (saved) {
      try {
        setConfiguracion(normalizarConfiguracion(JSON.parse(saved)));
      } catch {
        // si falla parseo, se mantienen los defaults
      }
    }
  };

  const saveConfiguracion = () => {
    const normalizada = normalizarConfiguracion(configuracion);
    setConfiguracion(normalizada);
    localStorage.setItem('ConfiguracionDeuda', JSON.stringify(normalizada));
    toast.success('Configuracion de Control de Deuda actualizada');
    setShowConfiguracion(false);
    // Recalcular con la nueva configuracion
    loadDeudas(normalizada);
  };

  const loadDeudas = async (cfgOverride?: ConfiguracionDeuda) => {
    setCargandoDeudas(true);
    try {
      const resp = await pagosService.listarDeudas?.();
      if (resp?.success && Array.isArray(resp.data)) {
        const hoy = new Date();
        const cfg = normalizarConfiguracion(cfgOverride || configuracion);
        const mapped = resp.data.map((p: any) => {
          const fv = p.fecha_vencimiento ? new Date(p.fecha_vencimiento) : null;
          // Atraso en dias redondeado hacia arriba (evita que 1.2 dias se vea como 1)
          const diasAtraso = fv
            ? Math.max(0, Math.ceil((hoy.getTime() - fv.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;
          const {
            diasAlertaAmarilla,
            diasAlertaNaranja,
            diasAlertaRoja,
            diasBloqueo,
          } = cfg;
          const nivelGravedad =
            diasAtraso >= diasAlertaRoja ? 'critico' :
            diasAtraso >= diasAlertaNaranja ? 'grave' :
            diasAtraso >= diasAlertaAmarilla ? 'moderado' : 'leve';
          const concepto = p.concepto || (p.fuente === 'pago_online' ? 'Pago online' : 'Mensualidad');
          return {
            fuente: p.fuente || 'mensualidad',
            atletaId: p.atleta,
            atletaNombre: p.atleta_nombre || 'Atleta',
            apoderadoNombre: p.apoderado_nombre || '',
            apoderadoEmail: p.apoderado_email || '',
            pagosVencidos: [{ ...p, concepto }],
            totalDeuda: Number(p.monto_total || p.monto_base || 0),
            diasAtraso,
            nivelGravedad,
            bloqueado: diasAtraso >= diasBloqueo,
            notificacionesEnviadas: 0,
          } as DeudaDetalle;
        });
        setDeudas(mapped);
      } else {
        setDeudas([]);
        toast.error(resp?.error?.message || 'No se pudieron cargar deudas (requiere admin)');
      }
    } catch (e: any) {
      setDeudas([]);
      toast.error('No se pudieron cargar deudas (verifica sesion de admin)');
    }
  };

  const deudasFiltradas = deudas.filter(deuda => {
    const term = busqueda.toLowerCase().trim();
    const coincideBusqueda = term === '' ||
      deuda.atletaNombre.toLowerCase().includes(term) ||
      deuda.apoderadoNombre.toLowerCase().includes(term) ||
      deuda.apoderadoEmail.toLowerCase().includes(term) ||
      deuda.pagosVencidos?.some((p: any) => (p.concepto || '').toLowerCase().includes(term));
    const coincideGravedad = filtroGravedad === 'todos' || deuda.nivelGravedad === filtroGravedad;
    const coincideBloqueado = !filtroBloqueados || deuda.bloqueado;
    return coincideBusqueda && coincideGravedad && coincideBloqueado;
  });

  const getNivelGravedadBadge = (nivel: string) => {
    switch (nivel) {
      case 'critico':
        return <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" />Critico</Badge>;
      case 'grave':
        return <Badge className="bg-orange-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Grave</Badge>;
      case 'moderado':
        return <Badge className="bg-yellow-500 text-white"><AlertCircle className="w-3 h-3 mr-1" />Moderado</Badge>;
      case 'leve':
      default:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" />Leve</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            Control de Deuda
          </h2>
          <p className="text-gray-600">Seguimiento de deudas, alertas y bloqueos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowConfiguracion(true)}>
            <Shield className="w-4 h-4 mr-2" />
            Configuracion
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-gradient-to-br from-red-50 to-white border border-red-100 shadow-sm rounded-xl">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Deudores</p>
              <p className="text-3xl font-bold text-gray-900">{deudas.length}</p>
              <p className="text-xs text-red-500 mt-1">Incluye pagos online y mensualidades</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Bloqueados (simulado)</p>
              <p className="text-3xl font-bold text-gray-900">{deudas.filter(d => d.bloqueado).length}</p>
              <p className="text-xs text-gray-500 mt-1">Segun umbral configurado</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 shadow-sm rounded-xl">
          <CardContent className="p-6 text-sm text-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-yellow-500" />
              <p className="font-semibold text-gray-800">Configuracion actual</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span>Amarilla: <strong>{configuracion.diasAlertaAmarilla}d</strong></span>
              <span>Naranja: <strong>{configuracion.diasAlertaNaranja}d</strong></span>
              <span>Roja: <strong>{configuracion.diasAlertaRoja}d</strong></span>
              <span>Bloqueo: <strong>{configuracion.diasBloqueo}d</strong></span>
              <span>Frecuencia notif.: <strong>{configuracion.frecuenciaNotificaciones}d</strong></span>
              <span>Auto notif.: <strong>{configuracion.notificacionesAutomaticas ? 'On' : 'Off'}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por atleta o apoderado..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={filtroGravedad} onValueChange={setFiltroGravedad}>
                <SelectTrigger>
                  <SelectValue placeholder="Gravedad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="critico">Critico</SelectItem>
                  <SelectItem value="grave">Grave</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="leve">Leve</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={filtroBloqueados} onCheckedChange={setFiltroBloqueados} />
              <Label>Solo bloqueados</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Deudores ({deudasFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {deudasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400 opacity-50" />
              <p>Excelente! No hay deudores pendientes (segn la API actual)</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deudasFiltradas.map((deuda) => (
                <Card key={deuda.atletaId} className="border">
                  <CardContent className="p-4 flex items-center justify-between gap-5">
                    <div className="flex-1">
                      <p className="font-semibold">{deuda.atletaNombre}</p>
                      <p className="text-sm text-gray-600">{deuda.apoderadoNombre}  {deuda.apoderadoEmail}</p>
                      <p className="text-xs text-gray-500">Das de atraso: {deuda.diasAtraso}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-600 text-lg">${deuda.totalDeuda.toLocaleString('es-CL')}</p>
                      <div className="mt-1">{getNivelGravedadBadge(deuda.nivelGravedad)}</div>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeudaSeleccionada(deuda);
                          setShowDetalleDeuda(true);
                        }}
                      >
                        Ver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfiguracion} onOpenChange={setShowConfiguracion}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuracion de Control de Deuda</DialogTitle>
            <DialogDescription>
              Configura las alertas (se guarda localmente por ahora)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Dias para Alerta Amarilla</Label>
                <Input
                  type="number"
                  value={configuracion.diasAlertaAmarilla}
                  onChange={(e) => setConfiguracion({ ...configuracion, diasAlertaAmarilla: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dias para Alerta Naranja</Label>
                <Input
                  type="number"
                  value={configuracion.diasAlertaNaranja}
                  onChange={(e) => setConfiguracion({ ...configuracion, diasAlertaNaranja: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dias para Alerta Roja</Label>
                <Input
                  type="number"
                  value={configuracion.diasAlertaRoja}
                  onChange={(e) => setConfiguracion({ ...configuracion, diasAlertaRoja: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dias para Bloqueo Automatico</Label>
                <Input
                  type="number"
                  value={configuracion.diasBloqueo}
                  onChange={(e) => setConfiguracion({ ...configuracion, diasBloqueo: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Frecuencia de Notificaciones (dias)</Label>
              <Input
                type="number"
                value={configuracion.frecuenciaNotificaciones}
                onChange={(e) => setConfiguracion({ ...configuracion, frecuenciaNotificaciones: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500">Dias entre cada notificacion automatica</p>
            </div>

            <div className="flex items-center justify-between">
              <Label>Notificaciones Automaticas</Label>
              <Switch
                checked={configuracion.notificacionesAutomaticas}
                onCheckedChange={(checked) => setConfiguracion({ ...configuracion, notificacionesAutomaticas: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Mensaje de Notificacion</Label>
              <Textarea
                value={configuracion.mensaje}
                onChange={(e) => setConfiguracion({ ...configuracion, mensaje: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfiguracion(false)}>
              Cancelar
            </Button>
            <Button onClick={saveConfiguracion} className="bg-yellow-400 text-black hover:bg-yellow-500">
              Guardar Configuracion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetalleDeuda} onOpenChange={setShowDetalleDeuda}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Deuda</DialogTitle>
            <DialogDescription>Informacin de pagos vencidos</DialogDescription>
          </DialogHeader>

          {deudaSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-5 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-gray-600">Atleta</Label>
                  <p>{deudaSeleccionada.atletaNombre}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Apoderado</Label>
                  <p>{deudaSeleccionada.apoderadoNombre}</p>
                  <p className="text-sm text-gray-500">{deudaSeleccionada.apoderadoEmail}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Total Adeudado</Label>
                  <p className="text-2xl text-red-600">${deudaSeleccionada.totalDeuda.toLocaleString('es-CL')}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Nivel de Gravedad</Label>
                  <div className="mt-1">{getNivelGravedadBadge(deudaSeleccionada.nivelGravedad)}</div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Pagos Vencidos ({deudaSeleccionada.pagosVencidos.length})</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-sm">Concepto</th>
                        <th className="text-left p-3 text-sm">Vencimiento</th>
                        <th className="text-left p-3 text-sm">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deudaSeleccionada.pagosVencidos.map((pago: any, index: number) => {
                        const fechaVenc = pago.fecha_vencimiento ? new Date(pago.fecha_vencimiento) : null;
                        return (
                          <tr key={index} className="border-t">
                            <td className="p-3">{pago.concepto || 'Mensualidad'}</td>
                            <td className="p-3">{fechaVenc ? fechaVenc.toLocaleDateString('es-CL') : '-'}</td>
                            <td className="p-3 text-red-600">${Number(pago.monto_total || pago.monto_base || 0).toLocaleString('es-CL')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2">
                      <tr>
                        <td colSpan={2} className="p-3 text-right"><strong>Total:</strong></td>
                        <td className="p-3 text-red-600"><strong>${deudaSeleccionada.totalDeuda.toLocaleString('es-CL')}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button variant="outline" onClick={() => setShowDetalleDeuda(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};





















