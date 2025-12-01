import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Shield } from 'lucide-react';

export const ProcesandoWebpay: React.FC = () => (
  <div className="max-w-2xl mx-auto px-4 py-8">
    <Card className="border-2 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700">
          <Shield className="w-6 h-6" />
          Procesando pago...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-gray-700">
        <p>Estamos confirmando tu pago con Webpay. No cierres esta ventana.</p>
      </CardContent>
    </Card>
  </div>
);
