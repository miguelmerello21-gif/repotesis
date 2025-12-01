import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';
import { CheckCircle, UserPlus } from 'lucide-react';
import { DIVISIONES, NIVELES } from '../constants/cheerCategories';
import { pagosService, atletasService } from '../api';

export const MatriculaForm: React.FC = () => {
  const { upgradeToApoderado, user, refreshUser } = useAuth();
  const isWebpayReturn = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.has('token_ws');
  }, []);

  const [periodos, setPeriodos] = useState<any[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string | null>(null);
  const [costoMatricula, setCostoMatricula] = useState(0);
  const [formData, setFormData] = useState({
    nombreAtleta: '',
    rutAtleta: '',
    fechaNacimiento: '',
    categoria: '',
    telefono: '',
    direccion: '',
    nombreApoderado: user?.name || '',
    emailApoderado: user?.email || '',
    telefonoApoderado: '',
    nivel: 'Principiante',
    relacionConAtleta: 'padre/madre',
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token_ws');
    if (token) {
      (async () => {
        setIsProcessing(true);
        const resp = await pagosService.confirmarWebpay(token);
        if (resp.success) {
          toast.success('Pago confirmado');
          setShowConfirmation(false);
          setIsProcessing(false);
          await atletasService.obtenerMisAtletas();
          if (resp.data?.user) {
            localStorage.setItem('user', JSON.stringify(resp.data.user));
          }
          await refreshUser();
          setTimeout(() => {
            window.location.href = '/';
          }, 50);
        } else {
          const errMsg =
            typeof resp.error === 'string'
              ? resp.error
              : resp.error?.detail || 'No se pudo confirmar el pago';
          toast.error(errMsg);
          setIsProcessing(false);
        }
        params.delete('token_ws');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newUrl);
      })();
    }
    const loadPeriodos = async () => {
      const resp = await pagosService.obtenerPeriodosMatricula?.();
      if (resp?.success) {
        const lista = resp.data || [];
        setPeriodos(lista);
        const activo = lista.find((p: any) => p.estado === 'activo') || lista[0];
        if (activo) {
          setPeriodoSeleccionado(String(activo.id));
          if (activo.monto) setCostoMatricula(Number(activo.monto));
          else if (activo.costo_matricula) setCostoMatricula(Number(activo.costo_matricula));
        }
      }
    };
    loadPeriodos();
    if (user) {
      setFormData((prev) => ({
        ...prev,
        nombreApoderado: user.name,
        emailApoderado: user.email,
        telefonoApoderado: user.phone || '',
      }));
    }
  }, [user, refreshUser]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombreAtleta || !formData.rutAtleta || !formData.fechaNacimiento || !formData.categoria) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    if (formData.rutAtleta.length < 8) {
      toast.error('RUT inválido');
      return;
    }
    setShowConfirmation(true);
  };

  const confirmarPago = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const payload = {
      atleta_nombre: formData.nombreAtleta,
      atleta_rut: formData.rutAtleta,
      atleta_fecha_nacimiento: formData.fechaNacimiento,
      division: formData.categoria,
      nivel: formData.nivel,
      telefono_contacto: formData.telefono,
      direccion: formData.direccion,
      apoderado_nombre: formData.nombreApoderado,
      apoderado_email: formData.emailApoderado,
      apoderado_telefono: formData.telefonoApoderado,
      monto: costoMatricula,
      periodo: periodoSeleccionado,
    };

    const resp = await pagosService.registrarMatricula(payload);
    if (resp.success) {
      const matriculaId = resp.data?.id;
      const uniqueOrder = `orden-${matriculaId}-${Date.now()}`;
      const session = `sess-${user?.id || 'anon'}-${Date.now()}`;
      const wp = await pagosService.iniciarWebpay(matriculaId, Number(costoMatricula), uniqueOrder, session);
      if (wp.success && wp.data?.url && wp.data?.token) {
        // Cambiamos la vista a procesamiento mientras se navega a Webpay.
        setIsProcessing(true);
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = wp.data.url;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'token_ws';
        input.value = wp.data.token;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        return;
      }
      const errMsg =
        typeof wp.error === 'string'
          ? wp.error
          : wp.error?.message || wp.error?.detail || 'No se pudo iniciar Webpay';
      toast.error(errMsg);
    } else {
      const errMsg = typeof resp.error === 'string' ? resp.error : 'No se pudo registrar la matrícula';
      toast.error(errMsg);
    }
    setIsProcessing(false);
  };

  if (isWebpayReturn || isProcessing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <CheckCircle className="w-6 h-6" />
              Procesando pago...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>Estamos confirmando tu pago con Webpay. Serás redirigido al inicio en unos segundos.</p>
            <p className="text-xs text-gray-500">No cierres esta ventana.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Confirmar Matrícula y Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h3 className="mb-3">Resumen de Matrícula</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600">Atleta:</span> <strong>{formData.nombreAtleta}</strong></p>
                <p><span className="text-gray-600">RUT:</span> {formData.rutAtleta}</p>
                <p><span className="text-gray-600">Categoría:</span> {formData.categoria}</p>
                <p><span className="text-gray-600">Fecha de Nacimiento:</span> {new Date(formData.fechaNacimiento).toLocaleDateString('es-CL')}</p>
                <p><span className="text-gray-600">Nivel:</span> {formData.nivel}</p>
                {formData.telefono && <p><span className="text-gray-600">Teléfono:</span> {formData.telefono}</p>}
                {formData.direccion && <p><span className="text-gray-600">Dirección:</span> {formData.direccion}</p>}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h3 className="mb-2">Costo de Matrícula</h3>
              <div className="text-3xl text-green-600 mb-2">
                ${costoMatricula.toLocaleString('es-CL')}
              </div>
              <p className="text-sm text-gray-600">Pago único de inscripción</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
              <h3 className="mb-2">Beneficios como Apoderado</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>Acceso a la tienda exclusiva de apoderados</li>
                <li>Trajes de competencia Reign All Stars</li>
                <li>Equipamiento profesional de La Colmena</li>
                <li>Descuentos especiales en productos del club</li>
                <li>Prioridad en eventos y competencias</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmation(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmarPago}
                className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500"
                disabled={isProcessing}
              >
                Confirmar y Pagar
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              * Esta es una simulación de pago. En producción se integraría con un gateway de pago real.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            Matricular Atleta
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Complete el formulario para matricular a un atleta. Al completar la matrícula, su cuenta será actualizada a Apoderado.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {periodos.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="periodo">Periodo de Matrícula</Label>
                  <Select
                    value={periodoSeleccionado || undefined}
                    onValueChange={(value) => {
                      setPeriodoSeleccionado(value);
                      const sel = periodos.find((p) => String(p.id) === value);
                      if (sel?.monto) setCostoMatricula(Number(sel.monto));
                      else if (sel?.costo_matricula) setCostoMatricula(Number(sel.costo_matricula));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodos.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nombre} ({p.estado})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nombreAtleta">Nombre Completo del Atleta *</Label>
                <Input
                  id="nombreAtleta"
                  value={formData.nombreAtleta}
                  onChange={(e) => handleChange('nombreAtleta', e.target.value)}
                  placeholder="Juan Pérez González"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rutAtleta">RUT del Atleta *</Label>
                <Input
                  id="rutAtleta"
                  value={formData.rutAtleta}
                  onChange={(e) => handleChange('rutAtleta', e.target.value)}
                  placeholder="12.345.678-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">División *</Label>
                <Select value={formData.categoria} onValueChange={(value) => handleChange('categoria', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar división" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIVISIONES.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.nombre} - {division.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nivel">Nivel *</Label>
                <Select value={formData.nivel} onValueChange={(value) => handleChange('nivel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVELES.map((nivel) => (
                      <SelectItem key={nivel.id} value={nivel.id.toString()}>
                        {nivel.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono de Contacto</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  placeholder="Calle 123, Comuna, Ciudad"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="mb-2">Costo de Matrícula</h3>
              <div className="text-2xl text-blue-600">
                ${costoMatricula.toLocaleString('es-CL')}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Pago único de inscripción (precio establecido por administrador)
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Continuar con la Matrícula
            </Button>

            <p className="text-xs text-gray-500 text-center">
              * Campos obligatorios
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
