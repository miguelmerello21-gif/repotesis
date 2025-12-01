import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  DollarSign,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Search,
  Calendar as CalendarIcon,
  User,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { pagosService } from '../api';

interface PagoManual {
  id?: string | number;
  apoderado?: number | string;
  monto: number;
  metodo_pago: string;
  concepto: string;
  notas?: string;
  comprobante?: string;
  fecha?: string;
  atletaNombre?: string;
  apoderadoNombre?: string;
  apoderadoEmail?: string;
}

export const PagosManuales: React.FC = () => {
  const [pagos, setPagos] = useState<PagoManual[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<PagoManual>({
    monto: 0,
    metodo_pago: 'efectivo',
    concepto: '',
    notas: ''
  });

  useEffect(() => {
    loadPagos();
  }, []);

  const loadPagos = async () => {
    // de momento no hay endpoint de list pagos-manuales; usamos reportes o dejamos vacío
    setPagos([]);
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCreate = async () => {
    if (!formData.monto || !formData.concepto) {
      toast.error('Completa monto y concepto');
      return;
    }
    const resp = await pagosService.registrarPagoManual({
      monto: formData.monto,
      concepto: formData.concepto,
      metodo_pago: formData.metodo_pago,
      notas: formData.notas,
      apoderado: formData.apoderado || undefined,
    });
    if (resp.success) {
      toast.success('Pago manual registrado');
      setShowDialog(false);
      setFormData({ monto: 0, metodo_pago: 'efectivo', concepto: '', notas: '' });
      loadPagos();
    } else {
      toast.error(resp.error?.message || 'No se pudo registrar');
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'validado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Validado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-yellow-600" />
            Pagos Manuales (Admin)
          </h2>
          <p className="text-gray-600">Registra pagos fuera de la pasarela</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-yellow-400 text-black hover:bg-yellow-500">
          <Plus className="w-4 h-4 mr-1" /> Nuevo Pago Manual
        </Button>
      </div>

      <Tabs defaultValue="pendientes">
        <TabsList>
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>
        <TabsContent value="pendientes">
          <Card>
            <CardHeader>
              <CardTitle>Pagos Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              {pagos.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No hay pagos manuales registrados
                </div>
              ) : (
                <div className="space-y-3">
                  {pagos.map((pago) => (
                    <Card key={String(pago.id)} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{pago.concepto}</p>
                          <p className="text-sm text-gray-600">${(pago.monto || 0).toLocaleString('es-CL')}</p>
                        </div>
                        {getEstadoBadge('pendiente')}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="todos">
          <Card>
            <CardHeader>
              <CardTitle>Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {pagos.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No hay pagos manuales
                </div>
              ) : (
                <div className="space-y-3">
                  {pagos.map((pago) => (
                    <Card key={String(pago.id)} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{pago.concepto}</p>
                          <p className="text-sm text-gray-600">${(pago.monto || 0).toLocaleString('es-CL')}</p>
                        </div>
                        {getEstadoBadge('pendiente')}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago Manual</DialogTitle>
            <DialogDescription>Ingresa los datos del pago</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Monto</Label>
              <Input type="number" value={formData.monto} onChange={(e) => handleChange('monto', Number(e.target.value))} />
            </div>
            <div>
              <Label>Concepto</Label>
              <Input value={formData.concepto} onChange={(e) => handleChange('concepto', e.target.value)} />
            </div>
            <div>
              <Label>Método de Pago</Label>
              <Select value={formData.metodo_pago} onValueChange={(v) => handleChange('metodo_pago', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="pos-debito">POS Débito</SelectItem>
                  <SelectItem value="pos-credito">POS Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={formData.notas} onChange={(e) => handleChange('notas', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <CloseIcon className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={handleCreate} className="bg-yellow-400 text-black hover:bg-yellow-500">
              <DollarSign className="w-4 h-4 mr-1" /> Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
