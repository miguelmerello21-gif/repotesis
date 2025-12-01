import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  Package,
  DollarSign,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Save,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Clock
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { tiendaService } from '../api';

interface Producto {
  id?: number | string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  stock_minimo?: number;
  categoria: string;
  nivel_acceso?: string;
  imagen_principal?: string | File;
  activo?: boolean;
  destacado?: boolean;
  slug?: string;
}

export const GestionTienda: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showNuevoProducto, setShowNuevoProducto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');

  const [nuevoProducto, setNuevoProducto] = useState<Producto>({
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    stock_minimo: 5,
    categoria: 'ropa',
    nivel_acceso: 'publico',
    activo: true,
    destacado: false,
  });

  const slugify = (text: string) =>
    text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    const resp = await tiendaService.obtenerProductos();
    if (resp.success && Array.isArray(resp.data)) {
      setProductos(resp.data as any);
    } else {
      toast.error(resp.error?.message || 'No se pudieron cargar productos');
      setProductos([]);
    }
  };

  const handleChange = (field: string, value: any) => {
    setNuevoProducto({ ...nuevoProducto, [field]: value });
  };

  const handleSaveProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.precio) {
      toast.error('Completa nombre y precio');
      return;
    }
    const formData = new FormData();
    formData.append('nombre', nuevoProducto.nombre);
    formData.append('descripcion', nuevoProducto.descripcion || '');
    formData.append('precio', String(nuevoProducto.precio));
    formData.append('stock', String(nuevoProducto.stock));
    formData.append('stock_minimo', String(nuevoProducto.stock_minimo ?? 0));
    formData.append('categoria', nuevoProducto.categoria);
    formData.append('nivel_acceso', nuevoProducto.nivel_acceso || 'publico');
    formData.append('destacado', String(nuevoProducto.destacado ?? false));
    formData.append('activo', String(nuevoProducto.activo ?? true));
    formData.append('slug', productoEditando?.slug || slugify(nuevoProducto.nombre));

    if (nuevoProducto.imagen_principal instanceof File) {
      formData.append('imagen_principal', nuevoProducto.imagen_principal);
    }
    // Solo permitimos una imagen para el producto

    let resp;
    if (productoEditando?.id) {
      resp = await tiendaService.actualizarProducto(productoEditando.id, formData);
    } else {
      resp = await tiendaService.crearProducto(formData);
    }

    if (resp.success) {
      toast.success('Producto guardado');
      setShowNuevoProducto(false);
      setProductoEditando(null);
      setNuevoProducto({
        nombre: '', descripcion: '', precio: 0, stock: 0, stock_minimo: 5,
        categoria: 'ropa', nivel_acceso: 'publico', activo: true, destacado: false,
      });
      loadProductos();
    } else {
      toast.error(resp.error?.message || 'No se pudo guardar');
    }
  };

  const handleEdit = (p: Producto) => {
    setProductoEditando(p);
    setNuevoProducto({
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      stock: p.stock,
      stock_minimo: p.stock_minimo || 5,
      categoria: p.categoria,
      nivel_acceso: p.nivel_acceso || 'publico',
      activo: p.activo ?? true,
      destacado: p.destacado ?? false,
      imagen_principal: undefined,
    });
    setShowNuevoProducto(true);
  };

  const handleDelete = async (id: string | number) => {
    const resp = await tiendaService.eliminarProducto(id);
    if (resp.success) {
      toast.success('Producto eliminado');
      loadProductos();
    } else {
      toast.error(resp.error?.message || 'No se pudo eliminar');
    }
  };

  const productosFiltrados = productos.filter(p => {
    if (filtroCategoria !== 'todas' && p.categoria !== filtroCategoria) return false;
    return true;
  });

  const categorias = [...new Set(productos.map(p => p.categoria))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-yellow-600" />
            Gestión de Tienda (Admin)
          </h2>
          <p className="text-gray-600">Productos, stock y estados</p>
        </div>
        <Button onClick={() => setShowNuevoProducto(true)} className="bg-yellow-400 text-black hover:bg-yellow-500">
          <Plus className="w-4 h-4 mr-1" /> Nuevo Producto
        </Button>
      </div>

      <Tabs defaultValue="productos">
        <TabsList>
          <TabsTrigger value="productos">Productos</TabsTrigger>
        </TabsList>
        <TabsContent value="productos">
          <Card className="p-4 mb-4">
            <div className="flex gap-4">
              <div className="w-48">
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productosFiltrados.map((producto) => (
              <Card key={String(producto.id)} className="border border-gray-200">
                <CardHeader className="pb-2 flex items-center justify-between">
                  <CardTitle>{producto.nombre}</CardTitle>
                  <Badge className={producto.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {producto.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-700">
                  <div className="text-xs text-yellow-600 capitalize">{producto.categoria}</div>
                  <div className="text-lg text-yellow-700 font-semibold">${Number(producto.precio).toLocaleString('es-CL')}</div>
                <div className="flex items-center gap-2 text-sm">
                  <span>Stock: {producto.stock}</span>
                  {Number(producto.stock || 0) <= Number(producto.stock_minimo || 5) && (
                    <Badge className="bg-red-100 text-red-700">Pocas unidades</Badge>
                  )}
                </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(producto)}>
                      <Edit2 className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(producto.id!)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showNuevoProducto} onOpenChange={setShowNuevoProducto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{productoEditando ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            <DialogDescription>Completa la información del producto</DialogDescription>
          </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input value={nuevoProducto.nombre} onChange={(e) => handleChange('nombre', e.target.value)} />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={nuevoProducto.categoria} onValueChange={(v) => handleChange('categoria', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ropa">Ropa</SelectItem>
                    <SelectItem value="accesorios">Accesorios</SelectItem>
                    <SelectItem value="equipamiento">Equipamiento</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nivel de acceso</Label>
                <Select value={nuevoProducto.nivel_acceso} onValueChange={(v) => handleChange('nivel_acceso', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publico">Público</SelectItem>
                    <SelectItem value="exclusivo">Exclusivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Precio</Label>
                <Input type="number" value={nuevoProducto.precio} onChange={(e) => handleChange('precio', Number(e.target.value))} />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={nuevoProducto.stock} onChange={(e) => handleChange('stock', Number(e.target.value))} />
              </div>
              <div>
                <Label>Stock mínimo</Label>
                <Input type="number" value={nuevoProducto.stock_minimo} onChange={(e) => handleChange('stock_minimo', Number(e.target.value))} />
              </div>
            </div>
              <div>
                <Label>Descripción</Label>
                <Textarea value={nuevoProducto.descripcion} onChange={(e) => handleChange('descripcion', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Imagen del producto</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleChange('imagen_principal', e.target.files?.[0] || undefined)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Estado: {nuevoProducto.activo ? 'Activo en tienda' : 'Desactivado'}
                </div>
                <Button
                type="button"
                variant="outline"
                onClick={() => handleChange('activo', !nuevoProducto.activo)}
                className={nuevoProducto.activo ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}
              >
                {nuevoProducto.activo ? 'Desactivar producto' : 'Activar producto'}
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowNuevoProducto(false); setProductoEditando(null); }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProducto} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-1" /> Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
