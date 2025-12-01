import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ItemCarrito {
  itemId: string | number;
  productoId: string | number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
  talla?: string;
  subtotal?: number;
}

interface CarritoComprasProps {
  visible: boolean;
  onClose: () => void;
  items: ItemCarrito[];
  onUpdateItem: (productoId: string | number, cantidad: number, talla?: string, itemId?: string | number) => void;
  onRemoveItem: (productoId: string | number, talla?: string, itemId?: string | number) => void;
  onClearCart: () => void;
  onCheckout?: (notas?: string) => Promise<void>;
  loading?: boolean;
}

export const CarritoCompras: React.FC<CarritoComprasProps> = ({
  visible,
  onClose,
  items,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
  onCheckout,
  loading = false,
}) => {
  const { user } = useAuth();
  const [procesandoPago, setProcesandoPago] = useState(loading);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    setProcesandoPago(loading);
  }, [loading]);

  const subtotal = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const total = subtotal;

  const handleProcederPago = async () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    if (!user) {
      toast.error('Debes iniciar sesión para realizar una compra');
      return;
    }
    if (onCheckout) {
      setProcesandoPago(true);
      await onCheckout(notas);
      setProcesandoPago(false);
    }
  };

  if (!visible) return null;

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl p-8 md:p-10 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <span className="p-2 bg-yellow-100 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-yellow-700" />
            </span>
            <span>Tu Carrito</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600">Revisa los productos y completa el pago</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-8">
          <div className="overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Producto</th>
                  <th className="px-5 py-3 text-right">Precio</th>
                  <th className="px-5 py-3 text-center">Cantidad</th>
                  <th className="px-5 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-center">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No tienes productos en el carrito
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr
                      key={item.itemId}
                      className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} hover:bg-gray-50 transition-colors`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 shadow-inner">
                            {item.imagen ? (
                              <ImageWithFallback src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[11px] text-gray-400 text-center px-2">Sin imagen</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{item.nombre}</div>
                            {item.talla && <Badge className="bg-gray-100 text-gray-800 mt-1 rounded-full">Talla: {item.talla}</Badge>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-800">
                        ${item.precio.toLocaleString('es-CL')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full border-gray-200"
                            onClick={() => onUpdateItem(item.productoId, Math.max(1, item.cantidad - 1), item.talla, item.itemId)}
                            disabled={item.cantidad <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            className="w-16 text-center h-9 rounded-lg"
                            value={item.cantidad}
                            onChange={(e) => onUpdateItem(item.productoId, parseInt(e.target.value) || 1, item.talla, item.itemId)}
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full border-gray-200"
                            onClick={() => onUpdateItem(item.productoId, item.cantidad + 1, item.talla, item.itemId)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-yellow-700">
                        ${(item.precio * item.cantidad).toLocaleString('es-CL')}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.productoId, item.talla, item.itemId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-6 items-start">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
              <div className="flex flex-col gap-3 h-full">
                <label className="text-sm font-semibold text-gray-800">Notas del pedido (opcional)</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 min-h-[180px]"
                  placeholder="Indica aclaraciones para la entrega o detalles del pedido..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={5}
                />
              </div>
            </div>

            <Card className="border border-gray-100 shadow-md h-full w-full rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Totales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-700">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">${subtotal.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Envío</span>
                  <span className="font-semibold text-gray-900">$0 <span className="text-xs text-gray-500">(retiro)</span></span>
                </div>
                <div className="flex justify-between items-center border-t pt-4 text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>${total.toLocaleString('es-CL')}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pb-6 px-6">
                <Button
                  className="w-full bg-yellow-400 text-black hover:bg-yellow-500 shadow-lg shadow-yellow-300/50 h-11 text-base"
                  onClick={handleProcederPago}
                  disabled={items.length === 0 || procesandoPago}
                >
                  {procesandoPago ? 'Redirigiendo...' : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Proceder al Pago
                    </>
                  )}
                </Button>
                <Button variant="outline" className="w-full h-11 text-base" onClick={onClearCart}>
                  Vaciar Carrito
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
