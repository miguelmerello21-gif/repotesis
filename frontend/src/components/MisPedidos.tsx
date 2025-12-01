import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ShoppingBag, CreditCard, Clock, Truck, RefreshCw } from 'lucide-react';
import { tiendaService } from '../api';
import { toast } from 'sonner@2.0.3';

interface Pedido {
  id: number | string;
  numero_pedido?: string;
  total?: number;
  estado?: string;
  notas_admin?: string;
  notas_cliente?: string;
  metodo_pago?: string;
  created_at?: string;
  direccion_envio?: string;
}

const estadoColor = (estado?: string) => {
  const val = (estado || '').toLowerCase();
  if (val.includes('retirado') || val.includes('entregado')) return 'bg-green-100 text-green-700';
  if (val.includes('listo')) return 'bg-blue-100 text-blue-700';
  if (val.includes('proceso') || val.includes('en proceso') || val.includes('confirmado')) return 'bg-amber-100 text-amber-700';
  if (val.includes('pago') || val.includes('pagado') || val.includes('pag')) return 'bg-emerald-100 text-emerald-700';
  if (val.includes('cancel') || val.includes('rechaz')) return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-800';
};

export const MisPedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPedidos = async () => {
    setLoading(true);
    const resp = await tiendaService.obtenerPedidos();
    if (resp.success) {
      setPedidos(resp.data || []);
    } else {
      toast.error(resp.error?.message || 'No se pudieron cargar tus pedidos');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPedidos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-400 rounded-lg">
            <ShoppingBag className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Mis pedidos</h2>
            <p className="text-gray-600">Revisa el estado de tus compras en la tienda</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadPedidos} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Cargando tus pedidos...</div>
      ) : pedidos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-600">
            No tienes pedidos aún.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pedidos.map((pedido) => (
            <Card key={pedido.id} className="border border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Pedido #{pedido.numero_pedido || pedido.id}
                </CardTitle>
                <Badge className={estadoColor(pedido.estado)}>{pedido.estado || 'Pendiente'}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span>Método: {pedido.metodo_pago || 'No especificado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>
                    Fecha: {pedido.created_at ? new Date(pedido.created_at).toLocaleString('es-CL') : 'N/D'}
                  </span>
                </div>
                {pedido.direccion_envio && (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-500" />
                    <span>Envío: {pedido.direccion_envio}</span>
                  </div>
                )}
                {pedido.notas_admin && (
                  <div className="p-3 rounded-md bg-yellow-50 border text-gray-800">
                    <div className="text-xs uppercase text-yellow-700 font-semibold">Actualización</div>
                    <div>{pedido.notas_admin}</div>
                  </div>
                )}
                {pedido.notas_cliente && (
                  <div className="p-3 rounded-md bg-gray-50 border text-gray-700">
                    <div className="text-xs uppercase text-gray-500 font-semibold">Notas que enviaste</div>
                    <div>{pedido.notas_cliente}</div>
                  </div>
                )}
                <div className="text-right font-semibold text-lg">
                  Total: ${Number(pedido.total || 0).toLocaleString('es-CL')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
