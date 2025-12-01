import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { pagosService } from '../api';
import { toast } from 'sonner@2.0.3';

export const PagoOnlineReturnPage: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'ok' | 'error'>('processing');
  const [message, setMessage] = useState<string>('Confirmando tu pago, por favor espera...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token_ws') || '';
    const confirmar = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No se encontró el token de pago.');
        return;
      }
      const resp = await pagosService.confirmarWebpayPagoOnline?.(token);
      if (resp?.success) {
        setStatus('ok');
        setMessage('Pago confirmado. Redirigiendo a tus pagos...');
        setTimeout(() => {
          window.location.href = '/?tab=mis-pagos';
        }, 1200);
      } else {
        setStatus('error');
        setMessage(resp?.error?.message || resp?.error?.detail || 'No se pudo confirmar el pago.');
      }
    };
    confirmar();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-lg w-full border-2 border-yellow-200 bg-white/90 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-yellow-100">
              <Shield className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle>Procesando Pago</CardTitle>
          <p className="text-sm text-gray-600">Estamos validando tu transacción con Webpay</p>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === 'processing' && (
            <div className="space-y-2">
              <Badge className="bg-yellow-100 text-yellow-800">Procesando...</Badge>
              <p className="text-sm text-gray-700">{message}</p>
            </div>
          )}
          {status === 'ok' && (
            <div className="space-y-2">
              <Badge className="bg-green-100 text-green-800 flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" /> Pago exitoso
              </Badge>
              <p className="text-sm text-gray-700">{message}</p>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-2">
              <Badge className="bg-red-100 text-red-800 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" /> Error
              </Badge>
              <p className="text-sm text-gray-700">{message}</p>
              <Button className="w-full" onClick={() => (window.location.href = '/?tab=mis-pagos')}>
                Volver a Mis Pagos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
