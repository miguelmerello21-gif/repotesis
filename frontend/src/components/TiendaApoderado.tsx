import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ShoppingCart, Award, ShoppingBag, Lock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { CarritoCompras } from './CarritoCompras';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { tiendaService, atletasService } from '../api';
import { MisPedidos } from './MisPedidos';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const mediaBase = API_BASE_URL.replace(/\/api\/?$/, '');
const buildMediaUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${mediaBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface Producto {
  id: number | string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  stock_minimo?: number;
  categoria: string;
  imagen_principal?: string;
  nivel_acceso?: string;
  destacado?: boolean;
}

interface ItemCarrito {
  itemId: number | string;
  productoId: number | string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
  talla?: string;
}

export const TiendaApoderado: React.FC = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [showCarrito, setShowCarrito] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [tieneAtletasActivos, setTieneAtletasActivos] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);

  useEffect(() => {
    verificarAcceso();
    loadProductos();
    loadCarrito();
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token_ws');
    if (token) {
      confirmarWebpayPedido(token);
      params.delete('token_ws');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [user]);

  const verificarAcceso = async () => {
    if (!user) return;
    const resp = await atletasService.obtenerMisAtletas();
    if (resp.success && Array.isArray(resp.data)) {
      setTieneAtletasActivos(resp.data.length > 0);
    } else {
      setTieneAtletasActivos(false);
    }
  };

  const loadProductos = async () => {
    const resp = await tiendaService.obtenerProductos();
    if (resp.success && Array.isArray(resp.data)) {
      setProductos(resp.data as any);
    } else {
      setProductos([]);
      toast.error(resp.error?.message || 'No se pudieron cargar productos');
    }
  };

  const mapCarrito = (data: any[]): ItemCarrito[] => {
    return data.map((item: any) => ({
      itemId: item.id,
      productoId: item.producto,
      nombre: item.producto_nombre || item.producto?.nombre || 'Producto',
      precio: Number(item.subtotal || item.producto?.precio || 0) / (item.cantidad || 1),
      cantidad: item.cantidad || 1,
      imagen: buildMediaUrl(item.producto?.imagen_principal),
      talla: item.variante?.nombre,
    }));
  };

  const loadCarrito = async () => {
    if (!user) {
      setCarrito([]);
      return;
    }
    const resp = await tiendaService.obtenerCarrito();
    if (resp.success && resp.data?.items) {
      setCarrito(mapCarrito(resp.data.items));
    } else {
      setCarrito([]);
    }
  };

  const agregarAlCarrito = async (producto: Producto, talla?: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }
    if (producto.nivel_acceso === 'exclusivo' && !tieneAtletasActivos) {
      toast.error('Debes tener atletas activos para comprar productos exclusivos');
      return;
    }
    const resp = await tiendaService.agregarAlCarrito(Number(producto.id), 1, talla || null);
    if (resp.success) {
      toast.success('Producto agregado');
      loadCarrito();
    } else {
      toast.error(resp.error?.message || 'No se pudo agregar');
    }
  };

  const actualizarCantidad = async (itemId: string | number, cantidad: number) => {
    if (!user) return;
    const resp = await tiendaService.actualizarItemCarrito(itemId as any, cantidad);
    if (resp.success) {
      loadCarrito();
    } else {
      toast.error(resp.error?.message || 'No se pudo actualizar');
    }
  };

  const eliminarDelCarrito = async (itemId: string | number) => {
    if (!user) return;
    const resp = await tiendaService.eliminarDelCarrito(itemId as any);
    if (resp.success) {
      loadCarrito();
      toast.success('Producto eliminado');
    } else {
      toast.error(resp.error?.message || 'No se pudo eliminar');
    }
  };

  const limpiarCarrito = async () => {
    for (const item of carrito) {
      await tiendaService.eliminarDelCarrito(item.itemId as any);
    }
    setCarrito([]);
  };

  const iniciarWebpayPedido = async (pedidoId: any, montoTotal: number) => {
    setProcesandoPago(true);
    const resp = await tiendaService.iniciarPagoPedidoWebpay(pedidoId);
    setProcesandoPago(false);
    if (resp.success && resp.data?.url && resp.data?.token) {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = resp.data.url;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'token_ws';
      input.value = resp.data.token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      return true;
    }
    toast.error(resp.error?.message || resp.error?.detail || 'No se pudo iniciar Webpay');
    return false;
  };

  const handleCheckout = async (notas?: string) => {
    const resp = await tiendaService.crearPedido({ notas_cliente: notas || '' });
    if (resp.success && resp.data?.id) {
      await iniciarWebpayPedido(resp.data.id, resp.data.total);
      loadCarrito();
    } else {
      toast.error(resp.error?.message || 'No se pudo crear el pedido');
    }
  };

  const confirmarWebpayPedido = async (token: string) => {
    const resp = await tiendaService.confirmarPagoPedidoWebpay(token);
    if (resp.success) {
      toast.success('Pago confirmado');
      loadCarrito();
    } else {
      toast.error(resp.error?.message || 'Pago rechazado');
    }
  };

  const productosFiltrados = productos.filter(p => {
    if (filtroCategoria !== 'todas' && p.categoria !== filtroCategoria) return false;
    if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const categorias = [...new Set(productos.map(p => p.categoria))];
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="mb-2 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-yellow-600" />
            Tienda Exclusiva Apoderados
          </h1>
          <p className="text-gray-600">Productos premium de competencia y exclusivos</p>
        </div>
        <div className="flex items-center gap-3">
          {tieneAtletasActivos ? (
            <Badge className="bg-green-100 text-green-800">Acceso Premium</Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800 flex gap-1 items-center">
              <Lock className="w-3 h-3" /> Sin atletas activos
            </Badge>
          )}
          <Button
            onClick={() => setShowCarrito(true)}
            className="bg-yellow-400 text-black hover:bg-yellow-500 relative"
          >
            <ShoppingCart className="w-5 h-5 mr-2" /> Ver Carrito
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                {totalItems}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tienda" className="mb-6">
        <TabsList>
          <TabsTrigger value="tienda">Tienda</TabsTrigger>
          <TabsTrigger value="mis-pedidos">Mis Pedidos</TabsTrigger>
        </TabsList>
        <TabsContent value="tienda">
          <TiendaGrid
            productos={productosFiltrados}
            categorias={categorias}
            filtroCategoria={filtroCategoria}
            setFiltroCategoria={setFiltroCategoria}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            onAgregarAlCarrito={agregarAlCarrito}
          />
        </TabsContent>
        <TabsContent value="mis-pedidos">
          <MisPedidos />
        </TabsContent>
      </Tabs>

      <CarritoCompras
        visible={showCarrito}
        onClose={() => setShowCarrito(false)}
        items={carrito}
        onUpdateItem={(productoId, cantidad, _talla, itemId) => actualizarCantidad(itemId || productoId, cantidad)}
        onRemoveItem={(productoId, _talla, itemId) => eliminarDelCarrito(itemId || productoId)}
        onClearCart={limpiarCarrito}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

interface TiendaGridProps {
  productos: Producto[];
  categorias: string[];
  filtroCategoria: string;
  setFiltroCategoria: (v: string) => void;
  busqueda: string;
  setBusqueda: (v: string) => void;
  onAgregarAlCarrito: (producto: Producto, talla?: string) => void;
}

const TiendaGrid: React.FC<TiendaGridProps> = ({ productos, categorias, filtroCategoria, setFiltroCategoria, busqueda, setBusqueda, onAgregarAlCarrito }) => {
  return (
    <>
      <Card className="p-4 mb-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {productos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No se encontraron productos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map((producto) => (
            <ProductoCard key={producto.id} producto={producto} onAgregarAlCarrito={onAgregarAlCarrito} />
          ))}
        </div>
      )}
    </>
  );
};

interface ProductoCardProps {
  producto: Producto;
  onAgregarAlCarrito: (producto: Producto, talla?: string) => void;
}


const ProductoCard: React.FC<ProductoCardProps> = ({ producto, onAgregarAlCarrito }) => {
  const lowStock = Number(producto.stock || 0) <= Number((producto as any).stock_minimo || 5);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-yellow-400/30">
      <div className="aspect-square overflow-hidden bg-gray-200 relative">
        <ImageWithFallback
          src={producto.imagen_principal || ''}
          alt={producto.nombre}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {lowStock && producto.stock > 0 && (
          <Badge className="absolute top-2 right-2 bg-orange-500 text-white shadow">Pocas unidades</Badge>
        )}
        {producto.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge className="bg-red-500 text-lg">Agotado</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="text-xs text-yellow-600 mb-1 capitalize">{producto.categoria}</div>
        <h3 className="mb-2">{producto.nombre}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{producto.descripcion}</p>

        <div className="flex items-center justify-between">
          <div className="text-xl text-yellow-600">
            ${Number(producto.precio).toLocaleString('es-CL')}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${lowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            Stock: {producto.stock}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
          onClick={() => onAgregarAlCarrito(producto)}
          disabled={producto.stock === 0}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {producto.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
        </Button>
      </CardFooter>
    </Card>
  );
};
