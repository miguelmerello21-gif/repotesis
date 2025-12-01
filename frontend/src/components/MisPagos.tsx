import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DollarSign, CreditCard, Calendar, CheckCircle, AlertCircle, Shield, RefreshCcw, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { pagosService } from '../api';
import { ProcesandoWebpay } from './ProcesandoWebpay';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PagoOnlineObligacion {
  id: string | number;
  pago: number | string;
  pago_titulo: string;
  pago_fecha_vencimiento?: string;
  atleta: number | string;
  atleta_nombre: string;
  monto: number;
  estado: 'pendiente' | 'pagado' | 'vencido';
  fecha_pago?: string;
  metodo_pago?: string;
}

export const MisPagos: React.FC = () => {
  const { user } = useAuth();
  const [obligaciones, setObligaciones] = useState<PagoOnlineObligacion[]>([]);
  const [showPasarela, setShowPasarela] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoOnlineObligacion | null>(null);
  const [showBoleta, setShowBoleta] = useState(false);
  const [boletaSeleccionada, setBoletaSeleccionada] = useState<PagoOnlineObligacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [procesandoWebpay, setProcesandoWebpay] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [cardForm, setCardForm] = useState({ alias: '', brand: '', last4: '', token: '', autopayEnabled: false });
  const [payMethod, setPayMethod] = useState<'webpay' | 'card'>('webpay');
  const [selectedCardId, setSelectedCardId] = useState<string | number | null>(null);
  const [autopayLoading, setAutopayLoading] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadObligaciones();
      loadCards();
    }
  }, [user]);

  const loadObligaciones = async () => {
    const resp = await pagosService.listarObligacionesPagoOnline?.();
    if (resp?.success && Array.isArray(resp.data)) {
      setObligaciones(resp.data as any);
    } else {
      toast.error(resp?.error?.message || 'No se pudieron cargar los pagos online');
    }
  };

  const loadCards = async () => {
    const resp = await pagosService.listarTarjetas?.();
    if (resp?.success && Array.isArray(resp.data)) {
      setCards(resp.data as any);
      const defCard = resp.data.find((c: any) => c.is_default);
      setSelectedCardId(defCard?.id ?? null);
    }
  };

  const guardarTarjeta = async () => {
    if (!cardForm.last4 || !cardForm.brand || !cardForm.token) {
      toast.error('Ingresa marca, últimos 4 y token simulado');
      return;
    }
    const resp = await pagosService.crearTarjeta?.({
      alias: cardForm.alias,
      brand: cardForm.brand,
      last4: cardForm.last4,
      token: cardForm.token,
      is_default: true,
      autopay_enabled: cardForm.autopayEnabled,
    });
    if (resp?.success) {
      toast.success('Tarjeta guardada');
      setCardForm({ alias: '', brand: '', last4: '', token: '', autopayEnabled: false });
      loadCards();
    } else {
      toast.error(resp?.error?.message || 'No se pudo guardar la tarjeta');
    }
  };

  const toggleAutopayCard = async (card: any) => {
    const resp = await pagosService.actualizarTarjeta?.(card.id, { autopay_enabled: !card.autopay_enabled });
    if (resp?.success) {
      toast.success('Autopago actualizado');
      loadCards();
    } else {
      toast.error(resp?.error?.message || 'No se pudo actualizar autopago');
    }
  };

  const setDefaultCard = async (card: any) => {
    const resp = await pagosService.actualizarTarjeta?.(card.id, { is_default: true });
    if (resp?.success) {
      toast.success('Tarjeta marcada como predeterminada');
      loadCards();
    } else {
      toast.error(resp?.error?.message || 'No se pudo actualizar la tarjeta');
    }
  };

  const eliminarTarjeta = async (card: any) => {
    const ok = window.confirm(`Eliminar tarjeta ${card.brand} ****${card.last4}?`);
    if (!ok) return;
    const resp = await pagosService.eliminarTarjeta?.(card.id);
    if (resp?.success) {
      toast.success('Tarjeta eliminada');
      loadCards();
    } else {
      toast.error(resp?.error?.message || 'No se pudo eliminar la tarjeta');
    }
  };

  const handlePagar = (pago: PagoOnlineObligacion) => {
    setPagoSeleccionado(pago);
    setShowPasarela(true);
  };

  const handleVerBoleta = (pago: PagoOnlineObligacion) => {
    setBoletaSeleccionada(pago);
    setShowBoleta(true);
  };

  const descargarComprobante = () => {
    toast.info('Descarga de comprobante no implementada aún');
  };

  const getEstadoBadge = (estado: PagoOnlineObligacion['estado']) => {
    switch (estado) {
      case 'pagado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Pagado</Badge>;
      case 'vencido':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Vencido</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Calendar className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  const pendientes = obligaciones.filter((p) => p.estado !== 'pagado');
  const pagados = obligaciones.filter((p) => p.estado === 'pagado');
  const totalPendiente = pendientes.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
  const totalPagado = pagados.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const iniciarWebpay = async () => {
    if (!pagoSeleccionado) return;
    setLoading(true);
    const uniqueOrder = `po-${pagoSeleccionado.id}-${Date.now()}`;
    const session = `sess-${user?.id || 'anon'}-${Date.now()}`;
    const resp = await pagosService.iniciarWebpayPagoOnline?.(pagoSeleccionado.id, uniqueOrder, session);
    if (resp?.success && resp.data?.url && resp.data?.token) {
      setProcesandoWebpay(true);
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
      return;
    }
    toast.error(resp?.error?.message || 'No se pudo iniciar Webpay');
    setLoading(false);
  };

  return (
    <>
      {procesandoWebpay && <ProcesandoWebpay />}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="mb-2 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-yellow-600" />
            Mis Pagos Online
          </h1>
          <p className="text-gray-600">
            Revisa y paga los cobros asociados a tus atletas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-red-400">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Pagos Pendientes/Vencidos</div>
              <div className="text-2xl text-red-600">{pendientes.length}</div>
              <div className="text-sm text-gray-500">${totalPendiente.toLocaleString('es-CL')}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-400">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Pagado</div>
              <div className="text-2xl text-green-600">${totalPagado.toLocaleString('es-CL')}</div>
              <div className="text-sm text-gray-500">{pagados.length} pagos</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex justify-start">
          <Button variant="outline" onClick={() => setShowCardModal(true)}>
            Gestionar tarjetas
          </Button>
        </div>

        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-gray-600">
            Autopago usa tu tarjeta por defecto con autopago activado (simulado).
          </div>
          <Button
            variant="outline"
            disabled={autopayLoading}
            onClick={async () => {
              setAutopayLoading(true);
              const resp = await pagosService.autopagarObligaciones?.();
              if (resp?.success) {
                toast.success(`Se pagaron ${resp.data?.pagadas || 0} obligaciones`);
                loadObligaciones();
              } else {
                toast.error(resp?.error?.message || 'No se pudo ejecutar el autopago');
              }
              setAutopayLoading(false);
            }}
          >
            {autopayLoading ? 'Procesando...' : 'Pagar todo con autopago'}
          </Button>
        </div>

        <Tabs defaultValue="pendientes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pendientes">Pendientes / Vencidos</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="pendientes" className="space-y-4">
            {pendientes.length === 0 ? (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                No tienes pagos pendientes.
              </div>
            ) : (
              pendientes.map((pago) => (
                <PagoCard key={pago.id} pago={pago} onPagar={handlePagar} onBoleta={handleVerBoleta} />
              ))
            )}
          </TabsContent>

          <TabsContent value="historial" className="space-y-4">
            {pagados.length === 0 ? (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Aún no registras pagos.
              </div>
            ) : (
              pagados.map((pago) => (
                <PagoCard key={pago.id} pago={pago} onPagar={handlePagar} onBoleta={handleVerBoleta} />
              ))
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showPasarela} onOpenChange={setShowPasarela}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Pago en línea
              </DialogTitle>
              <DialogDescription>Completa el pago con Webpay.</DialogDescription>
            </DialogHeader>

            {pagoSeleccionado && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="mb-2">Detalle del Pago</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Cobro:</strong> {pagoSeleccionado.pago_titulo}</p>
                    <p><strong>Atleta:</strong> {pagoSeleccionado.atleta_nombre}</p>
                    {pagoSeleccionado.pago_fecha_vencimiento && (
                      <p><strong>Vence:</strong> {new Date(pagoSeleccionado.pago_fecha_vencimiento).toLocaleDateString('es-CL')}</p>
                    )}
                    <p className="text-lg text-green-600 mt-2">
                      <strong>Total: ${Number(pagoSeleccionado.monto).toLocaleString('es-CL')}</strong>
                    </p>
                  </div>
                </div>

                <Tabs defaultValue={payMethod} onValueChange={(v) => setPayMethod(v as 'webpay' | 'card')}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="webpay">Webpay</TabsTrigger>
                    <TabsTrigger value="card">Tarjeta guardada</TabsTrigger>
                  </TabsList>
                  <TabsContent value="webpay" className="space-y-2 pt-3">
                    <Button
                      onClick={iniciarWebpay}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {loading ? 'Redirigiendo...' : 'Pagar con Webpay'}
                    </Button>
                  </TabsContent>
                  <TabsContent value="card" className="space-y-3 pt-3">
                    {cards.length === 0 ? (
                      <div className="text-sm text-gray-500">Primero guarda una tarjeta en “Gestionar tarjetas”.</div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {cards.map((c) => (
                            <label key={c.id} className="flex items-center gap-2 border rounded p-2">
                              <input
                                type="radio"
                                name="card"
                                checked={selectedCardId === c.id}
                                onChange={() => setSelectedCardId(c.id)}
                              />
                              <div className="text-sm">
                                <div className="font-medium">{c.alias || c.brand} ****{c.last4}</div>
                                <div className="text-xs text-gray-500">{c.autopay_enabled ? 'Autopago activo' : 'Autopago desactivado'}</div>
                              </div>
                              {c.is_default && <Badge className="ml-auto bg-green-100 text-green-800">Default</Badge>}
                            </label>
                          ))}
                        </div>
                        <Button
                          onClick={async () => {
                            if (!selectedCardId) {
                              toast.error('Selecciona una tarjeta');
                              return;
                            }
                            const resp = await pagosService.pagarObligacionConTarjetaGuardada?.(pagoSeleccionado.id, selectedCardId);
                            if (resp?.success) {
                              toast.success('Pago registrado con tarjeta guardada');
                              setShowPasarela(false);
                              setPagoSeleccionado(null);
                              loadObligaciones();
                            } else {
                              toast.error(resp?.error?.message || 'No se pudo cobrar la tarjeta');
                            }
                          }}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Pagar con tarjeta guardada
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <p className="text-xs text-gray-500 text-center">
                  Elige Webpay o una tarjeta guardada (tokenización simulada).
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gestionar tarjetas (simulado)</DialogTitle>
              <DialogDescription>Agrega, elimina o activa/desactiva autopago antes de pagar.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alias</Label>
                <Input value={cardForm.alias} onChange={(e) => setCardForm({ ...cardForm, alias: e.target.value })} placeholder="Mi Visa" />
                <Label>Marca</Label>
                <Input value={cardForm.brand} onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value })} placeholder="VISA/MC" />
                <Label>Últimos 4</Label>
                <Input value={cardForm.last4} maxLength={4} onChange={(e) => setCardForm({ ...cardForm, last4: e.target.value })} />
                <Label>Token simulado</Label>
                <Input value={cardForm.token} onChange={(e) => setCardForm({ ...cardForm, token: e.target.value })} />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={cardForm.autopayEnabled}
                    onChange={(e) => setCardForm({ ...cardForm, autopayEnabled: e.target.checked })}
                  />
                  Activar autopago con esta tarjeta
                </label>
                <Button variant="outline" onClick={guardarTarjeta}>
                  Guardar tarjeta
                </Button>
                <p className="text-xs text-gray-500">Tokenización simulada. En producción usar Oneclick.</p>
              </div>
              <div className="space-y-2">
                {cards.length === 0 ? (
                  <div className="text-sm text-gray-500">No hay tarjetas guardadas.</div>
                ) : (
                  cards.map((c) => (
                    <div key={c.id} className="border rounded p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{c.alias || c.brand} ****{c.last4}</div>
                          <div className="text-xs text-gray-500">
                            {c.autopay_enabled ? 'Autopago activo' : 'Autopago desactivado'}
                          </div>
                        </div>
                        {c.is_default && <Badge className="bg-green-100 text-green-800">Default</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => setDefaultCard(c)}>Hacer default</Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => toggleAutopayCard(c)}>
                          {c.autopay_enabled ? 'Desactivar autopago' : 'Activar autopago'}
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs" onClick={() => eliminarTarjeta(c)}>Eliminar</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBoleta} onOpenChange={setShowBoleta}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Boleta / Comprobante
              </DialogTitle>
              <DialogDescription>Detalle del pago realizado</DialogDescription>
            </DialogHeader>
            {boletaSeleccionada && (
              <div className="space-y-3 text-sm text-gray-700">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">N° Obl.: {boletaSeleccionada.id}</p>
                  <p className="font-semibold text-lg text-gray-800">{boletaSeleccionada.pago_titulo}</p>
                  <p className="text-gray-600">Atleta: {boletaSeleccionada.atleta_nombre}</p>
                  <p className="text-gray-600">Método: {boletaSeleccionada.metodo_pago || 'Webpay'}</p>
                  {boletaSeleccionada.fecha_pago && (
                    <p className="text-gray-600">
                      Fecha pago: {new Date(boletaSeleccionada.fecha_pago).toLocaleDateString('es-CL')}
                    </p>
                  )}
                  <p className="text-lg text-green-700 mt-2">
                    Total: ${Number(boletaSeleccionada.monto).toLocaleString('es-CL')}
                  </p>
                </div>
                <Button onClick={() => setShowBoleta(false)} className="w-full">
                  Cerrar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

const PagoCard: React.FC<{
  pago: PagoOnlineObligacion;
  onPagar: (pago: PagoOnlineObligacion) => void;
  onBoleta?: (pago: PagoOnlineObligacion) => void;
}> = ({ pago, onPagar, onBoleta }) => {
  const getEstadoBadge = (estado: PagoOnlineObligacion['estado']) => {
    switch (estado) {
      case 'pagado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Pagado</Badge>;
      case 'vencido':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Vencido</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Calendar className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-medium">{pago.pago_titulo}</h4>
              {getEstadoBadge(pago.estado)}
            </div>
            <p className="text-sm text-gray-600 mb-1">{pago.atleta_nombre}</p>
            <div className="text-sm text-gray-500 space-y-1">
              {pago.pago_fecha_vencimiento && <p>Vencimiento: {new Date(pago.pago_fecha_vencimiento).toLocaleDateString('es-CL')}</p>}
              {pago.fecha_pago && (
                <p className="text-green-600">Pagado: {new Date(pago.fecha_pago).toLocaleDateString('es-CL')}</p>
              )}
              {pago.metodo_pago && <p>Método: {pago.metodo_pago}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-medium text-green-600 mb-2">
              ${Number(pago.monto).toLocaleString('es-CL')}
            </p>
            {pago.estado === 'pagado' ? (
              <Button size="sm" variant="outline" onClick={() => onBoleta?.(pago)}>
                <RefreshCcw className="w-4 h-4 mr-1" />
                Boleta
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onPagar(pago)}
                className="bg-yellow-400 text-black hover:bg-yellow-500"
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Pagar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
