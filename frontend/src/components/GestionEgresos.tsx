import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Calendar as CalendarIcon,
  Download,
  FileText,
  Paperclip,
  Plus,
  Search,
  Trash2,
  Upload,
  DollarSign,
  TrendingDown,
  Package,
  Home,
  Shirt,
  Wrench,
  Users,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { finanzasService } from '../api';

interface Egreso {
  id: string | number;
  concepto: string;
  categoria: string;
  monto: number;
  fecha: string;
  responsable?: string;
  descripcion?: string;
  comprobante?: string | null;
  metodo_pago?: string;
  proveedor?: string;
  created_at?: string;
}

interface CategoriaEgreso {
  id: string;
  nombre: string;
  icono: any;
  color: string;
  descripcion: string;
}

const CATEGORIAS_EGRESOS: CategoriaEgreso[] = [
  { id: 'arriendo', nombre: 'Arriendo', icono: Home, color: 'blue', descripcion: 'Arriendo de instalaciones' },
  { id: 'materiales', nombre: 'Materiales', icono: Package, color: 'purple', descripcion: 'Material deportivo y equipamiento' },
  { id: 'uniformes', nombre: 'Uniformes', icono: Shirt, color: 'yellow', descripcion: 'Uniformes y vestuario' },
  { id: 'servicios', nombre: 'Servicios', icono: Wrench, color: 'green', descripcion: 'Servicios generales (agua, luz, internet)' },
  { id: 'personal', nombre: 'Personal', icono: Users, color: 'red', descripcion: 'Honorarios y salarios' },
  { id: 'otros', nombre: 'Otros', icono: FileText, color: 'gray', descripcion: 'Otros gastos' },
];

export const GestionEgresos: React.FC = () => {
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNuevoEgreso, setShowNuevoEgreso] = useState(false);
  const [showDetalleEgreso, setShowDetalleEgreso] = useState(false);
  const [egresoSeleccionado, setEgresoSeleccionado] = useState<Egreso | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('todos');
  const [adjuntandoId, setAdjuntandoId] = useState<string | number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [nuevoEgreso, setNuevoEgreso] = useState({
    concepto: '',
    categoria: '',
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
    responsable: '',
    descripcion: '',
    metodoPago: 'efectivo',
    proveedor: '',
  });
  const [comprobanteNuevo, setComprobanteNuevo] = useState<File | null>(null);

  useEffect(() => {
    loadEgresos();
  }, []);

  const loadEgresos = () => {
    setLoading(true);
    finanzasService.listarEgresos?.()
      .then((resp) => {
        if (resp?.success && Array.isArray(resp.data)) {
          setEgresos(resp.data as any);
        } else {
          toast.error(resp?.error?.message || 'No se pudieron cargar los egresos (requiere rol admin)');
        }
      })
      .finally(() => setLoading(false));
  };

  const handleCrearEgreso = async () => {
    if (!nuevoEgreso.concepto || !nuevoEgreso.categoria || nuevoEgreso.monto <= 0) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setSaving(true);
    const payload: any = {
      concepto: nuevoEgreso.concepto,
      categoria: nuevoEgreso.categoria,
      monto: nuevoEgreso.monto,
      fecha: nuevoEgreso.fecha,
      responsable: nuevoEgreso.responsable,
      descripcion: nuevoEgreso.descripcion,
      metodo_pago: nuevoEgreso.metodoPago,
      proveedor: nuevoEgreso.proveedor,
    };
    if (comprobanteNuevo) {
      payload.comprobante = comprobanteNuevo;
    }

    const resp = await finanzasService.crearEgreso?.(payload);
    if (resp?.success) {
      toast.success('Egreso registrado correctamente');
      setShowNuevoEgreso(false);
      resetFormulario();
      loadEgresos();
    } else {
      toast.error(resp?.error?.message || 'No se pudo registrar el egreso');
    }
    setSaving(false);
  };

  const handleEliminarEgreso = async (id: string | number) => {
    if (!confirm('¿Estás seguro de eliminar este egreso?')) return;
    const resp = await finanzasService.eliminarEgreso?.(id);
    if (resp?.success) {
      toast.success('Egreso eliminado');
      setShowDetalleEgreso(false);
      loadEgresos();
    } else {
      toast.error(resp?.error?.message || 'No se pudo eliminar el egreso');
    }
  };

  const handleAdjuntarComprobante = (egresoId: string | number) => {
    setAdjuntandoId(egresoId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adjuntandoId) {
      event.target.value = '';
      return;
    }
    const resp = await finanzasService.actualizarEgreso?.(adjuntandoId, { comprobante: file });
    if (resp?.success) {
      toast.success('Comprobante cargado');
      loadEgresos();
    } else {
      toast.error(resp?.error?.message || 'No se pudo cargar el comprobante');
    }
    setAdjuntandoId(null);
    event.target.value = '';
  };

  const resetFormulario = () => {
    setNuevoEgreso({
      concepto: '',
      categoria: '',
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      responsable: '',
      descripcion: '',
      metodoPago: 'efectivo',
      proveedor: '',
    });
    setComprobanteNuevo(null);
  };

  const egresosFiltrados = egresos.filter((egreso) => {
    const coincideBusqueda =
      busqueda === '' ||
      egreso.concepto.toLowerCase().includes(busqueda.toLowerCase()) ||
      (egreso.responsable || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      egreso.proveedor?.toLowerCase().includes(busqueda.toLowerCase());

    const coincideCategoria = filtroCategoria === 'todos' || egreso.categoria === filtroCategoria;

    let coincideFecha = true;
    if (filtroFecha !== 'todos') {
      const fechaEgreso = new Date(egreso.fecha);
      const hoy = new Date();
      if (filtroFecha === 'mes-actual') {
        coincideFecha = fechaEgreso.getMonth() === hoy.getMonth() && fechaEgreso.getFullYear() === hoy.getFullYear();
      } else if (filtroFecha === 'mes-anterior') {
        const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1);
        coincideFecha = fechaEgreso.getMonth() === mesAnterior.getMonth() && fechaEgreso.getFullYear() === mesAnterior.getFullYear();
      } else if (filtroFecha === 'ultimo-trimestre') {
        const tresMesesAtras = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000);
        coincideFecha = fechaEgreso >= tresMesesAtras;
      }
    }

    return coincideBusqueda && coincideCategoria && coincideFecha;
  });

  const estadisticas = {
    totalEgresos: egresos.reduce((sum, e) => sum + (Number(e.monto) || 0), 0),
    egresosMes: egresos
      .filter((e) => {
        const fecha = new Date(e.fecha);
        const hoy = new Date();
        return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
      })
      .reduce((sum, e) => sum + (Number(e.monto) || 0), 0),
    cantidadEgresos: egresos.length,
    sinComprobante: egresos.filter((e) => !e.comprobante).length,
  };

  const egresosPorCategoria = CATEGORIAS_EGRESOS.map((cat) => ({
    categoria: cat,
    total: egresos.filter((e) => e.categoria === cat.id).reduce((sum, e) => sum + (Number(e.monto) || 0), 0),
    cantidad: egresos.filter((e) => e.categoria === cat.id).length,
  }));

  const exportarExcel = () => {
    toast.success('Exportando egresos (simulado).');
    console.log('Exportar egresos:', egresosFiltrados);
  };

  const getCategoriaInfo = (categoriaId: string) => {
    return CATEGORIAS_EGRESOS.find((c) => c.id === categoriaId);
  };

  const buildComprobanteUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
    return `${apiBase}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div className="space-y-6">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelected} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-500" />
            Gestión de Egresos
          </h2>
          <p className="text-gray-600">Registro y control de gastos del club (API)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarExcel}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowNuevoEgreso(true)} className="bg-yellow-400 text-black hover:bg-yellow-500">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Egreso
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-red-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Egresos</p>
                <p className="text-2xl text-red-600">${estadisticas.totalEgresos.toLocaleString('es-CL')}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-orange-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Este Mes</p>
                <p className="text-2xl text-orange-600">${estadisticas.egresosMes.toLocaleString('es-CL')}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cantidad</p>
                <p className="text-2xl">{estadisticas.cantidadEgresos}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sin Comprobante</p>
                <p className="text-2xl text-yellow-600">{estadisticas.sinComprobante}</p>
              </div>
              <Paperclip className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Egresos por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle>Egresos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {egresosPorCategoria.map(({ categoria, total, cantidad }) => {
              const Icono = categoria.icono;
              return (
                <div key={categoria.id} className="p-4 rounded-lg border-2 bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <Icono className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{categoria.nombre}</p>
                      <p className="text-xs text-gray-500">{cantidad} registros</p>
                    </div>
                  </div>
                  <p className="text-xl text-gray-800">${total.toLocaleString('es-CL')}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por concepto, responsable o proveedor..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  {CATEGORIAS_EGRESOS.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={filtroFecha} onValueChange={setFiltroFecha}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los períodos</SelectItem>
                  <SelectItem value="mes-actual">Mes actual</SelectItem>
                  <SelectItem value="mes-anterior">Mes anterior</SelectItem>
                  <SelectItem value="ultimo-trimestre">Último trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Egresos */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Egresos ({egresosFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {egresosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay egresos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3">Concepto</th>
                    <th className="text-left p-3">Categoría</th>
                    <th className="text-left p-3">Responsable</th>
                    <th className="text-left p-3">Monto</th>
                    <th className="text-left p-3">Comprobante</th>
                    <th className="text-left p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {egresosFiltrados.map((egreso) => {
                    const catInfo = getCategoriaInfo(egreso.categoria);
                    const Icono = catInfo?.icono || FileText;

                    return (
                      <tr key={egreso.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{new Date(egreso.fecha).toLocaleDateString('es-CL')}</td>
                        <td className="p-3">
                          <div>
                            <p>{egreso.concepto}</p>
                            {egreso.proveedor && <p className="text-xs text-gray-500">{egreso.proveedor}</p>}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Icono className="w-3 h-3" />
                            {catInfo?.nombre}
                          </Badge>
                        </td>
                        <td className="p-3">{egreso.responsable || '-'}</td>
                        <td className="p-3">
                          <span className="text-red-600">${egreso.monto.toLocaleString('es-CL')}</span>
                        </td>
                        <td className="p-3">
                          {egreso.comprobante ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <Paperclip className="w-3 h-3 mr-1" />
                              Adjunto
                            </Badge>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleAdjuntarComprobante(egreso.id)}>
                              <Upload className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEgresoSeleccionado(egreso);
                              setShowDetalleEgreso(true);
                            }}
                          >
                            Ver
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Nuevo Egreso */}
      <Dialog open={showNuevoEgreso} onOpenChange={setShowNuevoEgreso}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Egreso</DialogTitle>
            <DialogDescription>Registra un nuevo gasto o egreso del club</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Concepto *</Label>
                <Input
                  placeholder="Ej: Arriendo gimnasio mes de enero"
                  value={nuevoEgreso.concepto}
                  onChange={(e) => setNuevoEgreso({ ...nuevoEgreso, concepto: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={nuevoEgreso.categoria} onValueChange={(value) => setNuevoEgreso({ ...nuevoEgreso, categoria: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_EGRESOS.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Monto (CLP) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={nuevoEgreso.monto || ''}
                  onChange={(e) => setNuevoEgreso({ ...nuevoEgreso, monto: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input type="date" value={nuevoEgreso.fecha} onChange={(e) => setNuevoEgreso({ ...nuevoEgreso, fecha: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select value={nuevoEgreso.metodoPago} onValueChange={(value) => setNuevoEgreso({ ...nuevoEgreso, metodoPago: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Responsable</Label>
                <Input
                  placeholder="Nombre del responsable"
                  value={nuevoEgreso.responsable}
                  onChange={(e) => setNuevoEgreso({ ...nuevoEgreso, responsable: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Input
                  placeholder="Nombre del proveedor"
                  value={nuevoEgreso.proveedor}
                  onChange={(e) => setNuevoEgreso({ ...nuevoEgreso, proveedor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Comprobante (opcional)</Label>
                <Input type="file" accept="image/*,.pdf" onChange={(e) => setComprobanteNuevo(e.target.files?.[0] || null)} />
                {comprobanteNuevo && <p className="text-xs text-gray-500">Archivo seleccionado: {comprobanteNuevo.name}</p>}
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Detalles adicionales del egreso..."
                  value={nuevoEgreso.descripcion}
                  onChange={(e) => setNuevoEgreso({ ...nuevoEgreso, descripcion: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNuevoEgreso(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearEgreso} disabled={saving} className="bg-yellow-400 text-black hover:bg-yellow-500">
              Registrar Egreso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalle Egreso */}
      <Dialog open={showDetalleEgreso} onOpenChange={setShowDetalleEgreso}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Egreso</DialogTitle>
            <DialogDescription>Información completa del egreso registrado</DialogDescription>
          </DialogHeader>

          {egresoSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-gray-600">Concepto</Label>
                  <p>{egresoSeleccionado.concepto}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Categoría</Label>
                  <p className="capitalize">{getCategoriaInfo(egresoSeleccionado.categoria)?.nombre}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Monto</Label>
                  <p className="text-2xl text-red-600">${egresoSeleccionado.monto.toLocaleString('es-CL')}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Fecha</Label>
                  <p>{new Date(egresoSeleccionado.fecha).toLocaleDateString('es-CL')}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Responsable</Label>
                  <p>{egresoSeleccionado.responsable || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Método de Pago</Label>
                  <p className="capitalize">{egresoSeleccionado.metodo_pago || 'efectivo'}</p>
                </div>
                {egresoSeleccionado.proveedor && (
                  <div>
                    <Label className="text-gray-600">Proveedor</Label>
                    <p>{egresoSeleccionado.proveedor}</p>
                  </div>
                )}
              </div>

              {egresoSeleccionado.descripcion && (
                <div>
                  <Label>Descripción</Label>
                  <p className="text-sm text-gray-600 mt-1">{egresoSeleccionado.descripcion}</p>
                </div>
              )}

              <div>
                <Label>Comprobante</Label>
                {egresoSeleccionado.comprobante ? (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Comprobante adjunto</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={buildComprobanteUrl(egresoSeleccionado.comprobante) || '#'} target="_blank" rel="noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full mt-2" onClick={() => handleAdjuntarComprobante(egresoSeleccionado.id)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Adjuntar Comprobante
                  </Button>
                )}
              </div>

              <div className="pt-4 border-t flex justify-between">
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleEliminarEgreso(egresoSeleccionado.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Egreso
                </Button>
                <Button onClick={() => setShowDetalleEgreso(false)}>Cerrar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
