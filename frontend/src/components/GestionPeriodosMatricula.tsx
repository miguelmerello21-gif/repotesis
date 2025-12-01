import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Plus, Edit2, X as CloseIcon, CheckCircle, XCircle, AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { pagosService } from '../api';

interface PeriodoMatricula {
  id: number | string;
  nombre: string;
  fecha_inicio: string;
  fecha_termino: string;
  monto: number;
  descuento_hermanos?: number;
  estado: 'activo' | 'cerrado' | 'programado';
  descripcion?: string;
}

export const GestionPeriodosMatricula: React.FC = () => {
  const [periodos, setPeriodos] = useState<PeriodoMatricula[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPeriodo, setEditingPeriodo] = useState<PeriodoMatricula | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_termino: '',
    monto: 0,
    descuento_hermanos: 0,
    descripcion: '',
    estado: 'programado'
  });

  useEffect(() => {
    loadPeriodos();
  }, []);

  const loadPeriodos = async () => {
    const resp = await pagosService.obtenerPeriodosMatricula();
    if (resp.success && Array.isArray(resp.data)) {
      setPeriodos(resp.data as any);
    } else {
      setPeriodos([]);
      toast.error(resp.error?.message || 'No se pudieron cargar los periodos');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.fecha_inicio || !formData.fecha_termino) {
      toast.error('Completa nombre y fechas');
      return;
    }
    const payload: any = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      fecha_inicio: formData.fecha_inicio,
      fecha_termino: formData.fecha_termino,
      monto: formData.monto,
      descuento_hermanos: formData.descuento_hermanos || 0,
      estado: formData.estado,
    };

    let resp;
    if (editingPeriodo) {
      resp = await pagosService.actualizarPeriodoMatricula?.(editingPeriodo.id, payload);
    } else {
      resp = await pagosService.crearPeriodoMatricula?.(payload);
    }

    if (resp?.success) {
      toast.success('Periodo guardado');
      setShowForm(false);
      setEditingPeriodo(null);
      setFormData({ nombre: '', fecha_inicio: '', fecha_termino: '', descripcion: '', estado: 'programado' });
      loadPeriodos();
    } else {
      toast.error(resp?.error?.message || 'No se pudo guardar');
    }
  };

  const handleEdit = (periodo: PeriodoMatricula) => {
    setEditingPeriodo(periodo);
    setFormData({
      nombre: periodo.nombre,
      fecha_inicio: periodo.fecha_inicio,
      fecha_termino: periodo.fecha_termino,
      monto: Number((periodo as any).monto || 0),
      descuento_hermanos: Number((periodo as any).descuento_hermanos || 0),
      descripcion: periodo.descripcion || '',
      estado: periodo.estado,
    });
    setShowForm(true);
  };

  const handleDelete = async (periodoId: number | string) => {
    if (!confirm('¿Eliminar este periodo de matrícula?')) return;
    const resp = await pagosService.eliminarPeriodoMatricula?.(periodoId);
    if (resp?.success === false) {
      toast.error(resp.error?.message || 'No se pudo eliminar');
      return;
    }
    toast.success('Periodo eliminado');
    loadPeriodos();
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>;
      case 'cerrado':
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Cerrado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Programado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-yellow-600" />
            Periodos de Matrícula
          </h2>
          <p className="text-gray-600">Administra periodos activos y programados</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingPeriodo(null); }}><Plus className="w-4 h-4 mr-1" />Nuevo Periodo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {periodos.map((p) => (
              <Card key={p.id} className="border border-gray-200">
                <CardHeader className="pb-2 flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {p.nombre}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getEstadoBadge(p.estado)}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-600">
                      <CloseIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(p.fecha_inicio).toLocaleDateString('es-CL')} - {new Date(p.fecha_termino).toLocaleDateString('es-CL')}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-semibold text-gray-700">Monto matrícula:</span>{' '}
                  <span className="text-gray-800">${Number((p as any).monto || 0).toLocaleString('es-CL')}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Desc. hermanos:</span>{' '}
                  <span className="text-gray-800">{Number((p as any).descuento_hermanos || 0)}%</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Inicio:</span>{' '}
                  <span className="text-gray-800">{new Date(p.fecha_inicio).toLocaleDateString('es-CL')}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Término:</span>{' '}
                  <span className="text-gray-800">{new Date(p.fecha_termino).toLocaleDateString('es-CL')}</span>
                </div>
              </div>
              {p.descripcion && <p className="text-gray-600">{p.descripcion}</p>}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                  <Edit2 className="w-4 h-4 mr-1" /> Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingPeriodo(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPeriodo ? 'Editar Periodo' : 'Crear Periodo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)} />
              </div>
              <div>
                <Label>Estado</Label>
                <select className="w-full border rounded p-2" value={formData.estado} onChange={(e) => handleChange('estado', e.target.value)}>
                  <option value="programado">Programado</option>
                  <option value="activo">Activo</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>
              <div>
                <Label>Fecha Inicio</Label>
                <Input type="date" value={formData.fecha_inicio} onChange={(e) => handleChange('fecha_inicio', e.target.value)} />
              </div>
              <div>
                <Label>Fecha Término</Label>
                <Input type="date" value={formData.fecha_termino} onChange={(e) => handleChange('fecha_termino', e.target.value)} />
              </div>
              <div>
                <Label>Monto de Matrícula</Label>
                <Input type="number" value={formData.monto} onChange={(e) => handleChange('monto', e.target.value)} />
              </div>
              <div>
                <Label>Descuento hermanos (%)</Label>
                <Input type="number" value={formData.descuento_hermanos} onChange={(e) => handleChange('descuento_hermanos', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Descripción</Label>
                <Input value={formData.descripcion} onChange={(e) => handleChange('descripcion', e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingPeriodo(null); }}>
                <CloseIcon className="w-4 h-4 mr-1" /> Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-1" /> Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
