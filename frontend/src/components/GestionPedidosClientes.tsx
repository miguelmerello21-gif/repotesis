/**
 * Gestión de Pedidos de Clientes (Admin)
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  ShoppingCart,
  Package,
  XCircle,
  Eye,
  User,
  Mail,
  Search,
  CheckCircle,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { tiendaService } from '../api';

interface ItemPedido {
  productoNombre: string;
  varianteNombre?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Pedido {
  id: string | number;
  usuario?: any;
  usuarioNombre?: string;
  usuarioEmail?: string;
  usuarioTelefono?: string;
  comprador_nombre?: string;
  comprador_email?: string;
  comprador_telefono?: string;
  items: ItemPedido[];
  total: number;
  estado: string;
  created_at?: string;
  metodo_entrega?: string;
  direccion_entrega?: string;
  notas_cliente?: string;
  numero_pedido?: string;
}

// Mapeo de estados backend → etiquetas y estilos que necesitamos en la UI
// Usamos estados existentes en el modelo: pendiente → confirmado → listo → entregado → (final)
const estadoClases: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800', // En Proceso
  listo: 'bg-purple-100 text-purple-800', // Listo para Retirar
  entregado: 'bg-[#00E02D]/10 text-[#00E02D]', // Retirado
  cancelado: 'bg-red-100 text-red-800',
  preparando: 'bg-amber-100 text-amber-800',
};

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'En Proceso',
  listo: 'Listo para Retirar',
  entregado: 'Retirado',
  cancelado: 'Cancelado',
  preparando: 'Preparando',
};

// Secuencia de transición: estado actual -> siguiente
const siguienteEstado: Record<string, string> = {
  pendiente: 'confirmado',
  confirmado: 'listo',
  listo: 'entregado',
};

// Normaliza variantes devueltas por backend (ej: en_proceso/en proceso, listo_retirar, retirado)
const normalizarEstado = (estado?: string): string => {
  const val = (estado || '').toString().trim().toLowerCase();
  if (val === 'pagado') return 'pendiente'; // tras pago inicia el flujo admin
  if (val === 'cancelado') return 'cancelado';
  if (val === 'pendiente' || val.includes('pend')) return 'pendiente';
  if (val.includes('retir') || val === 'entregado') return 'entregado';
  if (val.includes('listo')) return 'listo';
  if (val.includes('proc') || val.includes('conf') || val === 'preparando') return 'confirmado';
  // Cualquier otro estado intermedio se trata como "en proceso" para no cortar el flujo
  return 'confirmado';
};

const formatFecha = (fecha?: string) => {
  if (!fecha) return 'Sin fecha';
  try {
    return new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return fecha;
  }
};

export const GestionPedidosClientes: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [notaAdmin, setNotaAdmin] = useState('');
  const [resumen, setResumen] = useState({
    totalPedidos: 0,
    pendientes: 0,
    ventasTotales: 0,
    ventasHoy: 0,
  });

  useEffect(() => {
    loadPedidos();
  }, []);

  // Recalcula KPIs cada vez que cambian los pedidos
  useEffect(() => {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().slice(0, 10);
    let ventasHoy = 0;
    let ventasTotales = 0;
    let pendientes = 0;

    pedidos.forEach((p) => {
      const estadoNorm = normalizarEstado(p.estado);
      if (estadoNorm === 'pendiente') pendientes += 1;
      const totalNum = Number(p.total || 0) || 0;
      ventasTotales += totalNum;
      if (p.created_at) {
        const fecha = new Date(p.created_at);
        const fechaStr = fecha.toISOString().slice(0, 10);
        if (fechaStr === hoyStr) ventasHoy += totalNum;
      }
    });

    setResumen({
      totalPedidos: pedidos.length,
      pendientes,
      ventasTotales,
      ventasHoy,
    });
  }, [pedidos]);

  const loadPedidos = async () => {
    const resp = await tiendaService.obtenerPedidos();
    if (resp.success && Array.isArray(resp.data)) {
      setPedidos(resp.data as any);
    } else {
      setPedidos([]);
      toast.error(resp.error?.message || 'No se pudieron cargar pedidos');
    }
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    const matchBusqueda =
      busqueda === '' ||
      p.usuarioEmail?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.numero_pedido?.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const handleCambiarEstado = async (pedidoId: string | number, nuevoEstado: string) => {
    const resp = await tiendaService.actualizarPedido(pedidoId, { estado: nuevoEstado, notas_admin: notaAdmin });
    if (resp.success) {
      const label = estadoLabel[nuevoEstado] || nuevoEstado;
      const numero = pedidos.find((p) => p.id === pedidoId)?.numero_pedido || pedidoId;
      toast.success(`Pedido ${numero} actualizado a: ${label}`);
      setShowDetalle(false);
      loadPedidos();
    } else {
      toast.error(resp.error?.message || 'No se pudo actualizar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-yellow-600" />
            Pedidos de Clientes
          </h2>
          <p className="text-gray-600">Administra el estado y detalle de los pedidos</p>
        </div>
      </div>

      {/* Resumen en tiempo real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-yellow-300">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pedidos</p>
              <p className="text-2xl font-semibold text-gray-900">{resumen.totalPedidos}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-yellow-500" />
          </CardContent>
        </Card>
        <Card className="border-blue-300">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{resumen.pendientes}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card className="border-green-300">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventas Totales</p>
              <p className="text-2xl font-semibold text-green-600">${resumen.ventasTotales.toLocaleString('es-CL')}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </CardContent>
        </Card>
        <Card className="border-purple-300">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventas Hoy</p>
              <p className="text-2xl font-semibold text-purple-600">${resumen.ventasHoy.toLocaleString('es-CL')}</p>
            </div>
            <Mail className="w-8 h-8 text-purple-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por email o N° pedido"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="preparando">Preparando</SelectItem>
                <SelectItem value="listo">Listo</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {pedidosFiltrados.map((pedido) => {
          const estado = normalizarEstado(pedido.estado);
          const items = pedido.items || [];

          const renderAcciones = () => {
            const id = pedido.id;
            if (estado === 'pendiente') {
              return (
                <Button
                  onClick={() => handleCambiarEstado(id, siguienteEstado.pendiente)}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 justify-center"
                >
                  <Package className="w-4 h-4" />
                  Procesar
                </Button>
              );
            }
            if (estado === 'confirmado') {
              return (
                <Button
                  onClick={() => handleCambiarEstado(id, siguienteEstado.confirmado)}
                  className="!text-white !border-0 flex items-center gap-2 justify-center"
                  style={{ backgroundColor: '#8A07FA', color: '#FFFFFF' }}
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  Marcar para Retiro
                </Button>
              );
            }
            if (estado === 'listo') {
              return (
                <Button
                  onClick={() => handleCambiarEstado(id, siguienteEstado.listo)}
                  className="!text-white !border-0 flex items-center gap-2 justify-center"
                  style={{ backgroundColor: '#00E02D', color: '#FFFFFF' }}
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  Marcar Retirado
                </Button>
              );
            }
            return null; // entregado/cancelado/otros: solo Ver Detalles
          };

          return (
            <Card key={String(pedido.id)} className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col gap-4">
                  {/* Encabezado pedido */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg font-semibold">Pedido #{pedido.numero_pedido || pedido.id}</CardTitle>
                          <Badge className={`${estadoClases[estado] || 'bg-gray-100 text-gray-700'} text-sm px-3 py-1 rounded-full`}>
                            {estadoLabel[estado] || pedido.estado || 'Sin estado'}
                          </Badge>
                        </div>
                      </div>
                      {(() => {
                        const nombre = pedido.usuarioNombre || pedido.comprador_nombre || 'Cliente';
                        const email = pedido.usuarioEmail || pedido.comprador_email || 'Sin email';
                        const telefono = pedido.usuarioTelefono || pedido.comprador_telefono || 'Sin teléfono';
                        return (
                          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              {nombre}
                            </span>
                            <span className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {email}
                            </span>
                            <span className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {telefono}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 w-full lg:w-64">
                      <div className="flex-1 text-right space-y-1">
                        <div className="text-2xl font-semibold text-emerald-600">
                          ${Number(pedido.total || 0).toLocaleString('es-CL')}
                        </div>
                        <div className="text-sm text-gray-500">{formatFecha(pedido.created_at)}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPedidoSeleccionado(pedido);
                            setShowDetalle(true);
                          }}
                          className="border-gray-300 justify-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                        {renderAcciones()}
                      </div>
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-800 mb-2">Productos:</div>
                    <div className="space-y-2 text-sm text-gray-700">
                      {items.length ? items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">
                              {item.cantidad}x {item.productoNombre || (item as any).producto_nombre || '-'}
                              {item.varianteNombre ? ` (${item.varianteNombre})` : ''}
                            </div>
                          </div>
                          <div className="font-semibold">
                            ${Number(item.subtotal || item.precio_unitario || 0).toLocaleString('es-CL')}
                          </div>
                        </div>
                      )) : <div className="text-gray-500">Sin productos</div>}
                    </div>
                  </div>

                  {/* Nota */}
                  {pedido.notas_cliente ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-md px-4 py-3 text-sm text-gray-800">
                      <span className="font-semibold mr-2">Nota del cliente:</span>
                      {pedido.notas_cliente}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showDetalle} onOpenChange={setShowDetalle}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de Pedido</DialogTitle>
            <DialogDescription>Información completa del pedido</DialogDescription>
          </DialogHeader>

          {pedidoSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-gray-600">Cliente</Label>
                  <p>{pedidoSeleccionado.usuarioNombre || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{pedidoSeleccionado.usuarioEmail}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Total</Label>
                  <p className="text-2xl text-yellow-700">${Number(pedidoSeleccionado.total || 0).toLocaleString('es-CL')}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Estado</Label>
                  <Badge className="bg-blue-100 text-blue-800 capitalize">{pedidoSeleccionado.estado}</Badge>
                </div>
                {pedidoSeleccionado.direccion_entrega && (
                  <div>
                    <Label className="text-gray-600">Dirección</Label>
                    <p className="text-sm text-gray-600">{pedidoSeleccionado.direccion_entrega}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-2 block">Ítems ({pedidoSeleccionado.items?.length || 0})</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-sm">Producto</th>
                        <th className="text-left p-3 text-sm">Cantidad</th>
                        <th className="text-left p-3 text-sm">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidoSeleccionado.items?.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3">{item.productoNombre || (item as any).producto_nombre || '-'}</td>
                          <td className="p-3">{item.cantidad}</td>
                          <td className="p-3">${Number(item.subtotal || item.precio_unitario || 0).toLocaleString('es-CL')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas admin</Label>
                <Textarea value={notaAdmin} onChange={(e) => setNotaAdmin(e.target.value)} placeholder="Notas internas..." />
              </div>

              {pedidoSeleccionado.notas_cliente ? (
                <div className="bg-blue-50 border border-blue-100 rounded-md px-4 py-3 text-sm text-gray-800">
                  <span className="font-semibold mr-2">Nota del cliente:</span>
                  {pedidoSeleccionado.notas_cliente}
                </div>
              ) : null}

              <DialogFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDetalle(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => handleCambiarEstado(pedidoSeleccionado.id, 'cancelado')} variant="destructive">
                  Cancelar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
