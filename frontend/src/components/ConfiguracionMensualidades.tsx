import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { DollarSign, Plus, Calendar as CalendarIcon, RefreshCcw, Eye } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { pagosService } from '../api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface PagoOnline {
  id: number | string;
  titulo: string;
  descripcion?: string;
  monto: number;
  activo: boolean;
  fecha_vencimiento?: string;
  created_at?: string;
  tipo?: string;
}

interface PagoOnlineObligacion {
  id: number | string;
  atleta_nombre: string;
  apoderado_email: string;
  monto: number;
  fecha_pago?: string;
  metodo_pago?: string;
}

// Renombrada lógicamente a Pagos Online, pero mantenemos el nombre del componente para no romper el import en AdminPanel.
export const ConfiguracionMensualidades: React.FC = () => {
  const [pagos, setPagos] = useState<PagoOnline[]>([]);
  const [historialPago, setHistorialPago] = useState<PagoOnlineObligacion[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoOnline | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    monto: '',
    fecha_vencimiento: '',
    tipo: 'otro',
  });
  const [editingPagoId, setEditingPagoId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPagos();
  }, []);

  const loadPagos = async () => {
    const resp = await pagosService.listarPagosOnline?.();
    if (resp?.success && Array.isArray(resp.data)) {
      setPagos(resp.data as any);
    } else {
      toast.error(resp?.error?.message || 'No se pudieron cargar los pagos online');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCrear = async () => {
    if (!formData.titulo || !formData.monto) {
      toast.error('Ingresa un título y un monto');
      return;
    }
    setLoading(true);
    const payload: any = {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      monto: Number(formData.monto) || 0,
      fecha_vencimiento: formData.fecha_vencimiento || null,
      activo: true,
      tipo: formData.tipo || 'otro',
    };
    const resp = editingPagoId
      ? await pagosService.actualizarPagoOnline?.(editingPagoId, payload)
      : await pagosService.crearPagoOnline?.(payload);
    if (resp?.success) {
      toast.success(editingPagoId ? 'Cobro actualizado' : 'Pago online creado y asignado a los atletas activos');
      setFormData({ titulo: '', descripcion: '', monto: '', fecha_vencimiento: '', tipo: 'otro' });
      setEditingPagoId(null);
      loadPagos();
    } else {
      toast.error(resp?.error?.message || 'No se pudo guardar el cobro');
    }
    setLoading(false);
  };

  const toggleActivo = async (pago: PagoOnline) => {
    const resp = await pagosService.actualizarPagoOnline?.(pago.id, { activo: !pago.activo });
    if (resp?.success) {
      loadPagos();
    } else {
      toast.error(resp?.error?.message || 'No se pudo actualizar');
    }
  };

  const regenerarObligaciones = async (pago: PagoOnline) => {
    const resp = await pagosService.regenerarObligacionesPagoOnline?.(pago.id);
    if (resp?.success) {
      toast.success('Obligaciones regeneradas (se crean para atletas activos)');
    } else {
      toast.error(resp?.error?.message || 'No se pudieron regenerar las obligaciones');
    }
  };

  const abrirHistorialPagados = async (pago: PagoOnline) => {
    const resp = await pagosService.listarObligacionesPagoOnline?.({ pago: pago.id, estado: 'pagado' });
    if (resp?.success && Array.isArray(resp.data)) {
      setHistorialPago(resp.data as any);
      setPagoSeleccionado(pago);
      setShowHistorial(true);
    } else {
      toast.error(resp?.error?.message || 'No se pudo cargar el historial');
    }
  };

  const editarPago = (pago: PagoOnline) => {
    setEditingPagoId(pago.id);
    setFormData({
      titulo: pago.titulo,
      descripcion: pago.descripcion || '',
      monto: String(pago.monto ?? ''),
      fecha_vencimiento: pago.fecha_vencimiento || '',
      tipo: pago.tipo || 'otro',
    });
  };

  const eliminarPago = async (pago: PagoOnline) => {
    const confirmDelete = window.confirm(`Vas a eliminar el cobro "${pago.titulo}". ¿Confirmas?`);
    if (!confirmDelete) return;
    const resp = await pagosService.eliminarPagoOnline?.(pago.id);
    if (resp?.success) {
      toast.success('Cobro eliminado');
      if (editingPagoId === pago.id) {
        setEditingPagoId(null);
        setFormData({ titulo: '', descripcion: '', monto: '', fecha_vencimiento: '', tipo: 'otro' });
      }
      loadPagos();
    } else {
      toast.error(resp?.error?.message || 'No se pudo eliminar el cobro');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-yellow-600" />
            Pagos Online (cobros masivos)
          </h2>
          <p className="text-gray-600">Crea cobros para todos los apoderados según sus atletas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingPagoId ? 'Editar cobro' : 'Crear nuevo cobro'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Título *</Label>
              <Input value={formData.titulo} onChange={(e) => handleChange('titulo', e.target.value)} placeholder="Ej: Cuota competencia" />
            </div>
            <div>
              <Label>Monto (CLP) *</Label>
              <Input type="number" value={formData.monto} onChange={(e) => handleChange('monto', e.target.value)} />
            </div>
            <div>
              <Label>Fecha de vencimiento</Label>
              <Input type="date" value={formData.fecha_vencimiento} onChange={(e) => handleChange('fecha_vencimiento', e.target.value)} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v) => handleChange('tipo', v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensualidad">Mensualidad</SelectItem>
                  <SelectItem value="competencia">Competencia</SelectItem>
                  <SelectItem value="musica">Musica</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={formData.descripcion} onChange={(e) => handleChange('descripcion', e.target.value)} placeholder="Detalles del cobro" />
            </div>
          </div>
            <div className="flex justify-end">
              {editingPagoId && (
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => {
                    setEditingPagoId(null);
                    setFormData({ titulo: '', descripcion: '', monto: '', fecha_vencimiento: '', tipo: 'otro' });
                  }}
                >
                  Cancelar
                </Button>
              )}
              <Button onClick={handleCrear} disabled={loading} className="bg-yellow-400 text-black hover:bg-yellow-500">
                <Plus className="w-4 h-4 mr-2" />
                {editingPagoId ? 'Guardar cambios' : 'Crear y asignar'}
              </Button>
            </div>
          </CardContent>
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pagos.map((pago) => (
          <Card key={pago.id} className="border border-gray-200">
            <CardHeader className="pb-2 flex items-center justify-between">
              <CardTitle className="text-base">{pago.titulo}</CardTitle>
              <Badge className={pago.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>
                {pago.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <div className="text-2xl text-yellow-700">${Number(pago.monto || 0).toLocaleString('es-CL')}</div>
              {pago.fecha_vencimiento && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CalendarIcon className="w-4 h-4" /> Vence: {new Date(pago.fecha_vencimiento).toLocaleDateString('es-CL')}
                </div>
              )}
              {pago.tipo && (
                <div className="text-xs text-gray-600">Tipo: {pago.tipo}</div>
              )}
              {pago.descripcion && <p className="text-xs text-gray-600">{pago.descripcion}</p>}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => toggleActivo(pago)}>
                  {pago.activo ? 'Desactivar' : 'Activar'}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => regenerarObligaciones(pago)}>
                  <RefreshCcw className="w-3 h-3 mr-1" />
                  Regenerar
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => abrirHistorialPagados(pago)}>
                  <Eye className="w-3 h-3 mr-1" />
                  Pagados
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => editarPago(pago)}>
                  Editar
                </Button>
                <Button size="sm" variant="destructive" className="text-xs" onClick={() => eliminarPago(pago)}>
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pagos recibidos {pagoSeleccionado ? `- ${pagoSeleccionado.titulo}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            {historialPago.length === 0 ? (
              <div className="text-gray-500 text-sm py-4">Aún no hay pagos registrados.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Atleta</th>
                    <th className="text-left p-2">Apoderado</th>
                    <th className="text-left p-2">Monto</th>
                    <th className="text-left p-2">Fecha pago</th>
                    <th className="text-left p-2">Método</th>
                  </tr>
                </thead>
                <tbody>
                  {historialPago.map((h) => (
                    <tr key={h.id} className="border-b">
                      <td className="p-2">{h.atleta_nombre}</td>
                      <td className="p-2">{h.apoderado_email}</td>
                      <td className="p-2">${Number(h.monto).toLocaleString('es-CL')}</td>
                      <td className="p-2">
                        {h.fecha_pago ? new Date(h.fecha_pago).toLocaleDateString('es-CL') : '-'}
                      </td>
                      <td className="p-2">{h.metodo_pago || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
