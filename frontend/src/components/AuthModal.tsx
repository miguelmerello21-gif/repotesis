import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';
import { Lock, Mail, User as UserIcon, Phone } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
}

type ModalMode = 'login' | 'register' | 'forgot' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode: initialMode }) => {
  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  const { login, register, requestPasswordReset, validateResetCode, resetPassword } = useAuth();

  useEffect(() => {
    setMode(initialMode as ModalMode);
    setCodeValidated(false);
  }, [initialMode]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setCodeValidated(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          toast.error('Ingresa tu email y contraseña');
          setLoading(false);
          return;
        }
        try {
          const result = await login(email, password);
          if (result.success) {
            toast.success('¡Bienvenido a La Colmena!');
            onClose();
            resetForm();
          } else {
            toast.error(result.message || 'Credenciales incorrectas');
          }
        } catch (err) {
          toast.error('No se pudo iniciar sesión. Inténtalo de nuevo.');
        }
      } else if (mode === 'register') {
        if (!name.trim()) {
          toast.error('Por favor ingresa tu nombre');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        const success = await register(email, password, name, phone);
        if (success) {
          toast.success('Cuenta creada exitosamente');
          toast.success('Se ha enviado un email de confirmación');
          onClose();
          resetForm();
        } else {
          toast.error('El email ya está registrado o es inválido');
        }
      } else if (mode === 'forgot') {
        if (!email) {
          toast.error('Ingresa tu email');
          setLoading(false);
          return;
        }
        const success = await requestPasswordReset(email);
        if (success) {
          toast.success('Si el correo existe, se ha enviado un código de recuperación');
          setMode('reset');
          setCodeValidated(false);
        } else {
          toast.error('No se pudo enviar el código');
        }
      } else if (mode === 'reset') {
        if (!email || !resetCode) {
          toast.error('Ingresa email y código de recuperación');
          setLoading(false);
          return;
        }

        if (!codeValidated) {
          const valid = await validateResetCode(email, resetCode);
          if (valid) {
            setCodeValidated(true);
            toast.success('Código validado. Ahora ingresa tu nueva contraseña');
          } else {
            toast.error('El código es inválido o expiró');
          }
          setLoading(false);
          return;
        }

        if (newPassword.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        const success = await resetPassword(email, resetCode, newPassword);
        if (success) {
          toast.success('Tu contraseña ha sido cambiada. Ya puedes iniciar sesión.');
          setMode('login');
          resetForm();
        } else {
          toast.error('El código es inválido o expiró');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (next: ModalMode) => {
    setMode(next);
    if (next !== 'reset') {
      setCodeValidated(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (mode === 'reset') {
      setCodeValidated(false);
    }
  };

  const handleCodeChange = (value: string) => {
    setResetCode(value.toUpperCase());
    if (mode === 'reset') {
      setCodeValidated(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' && 'Iniciar sesión'}
            {mode === 'register' && 'Crear Cuenta'}
            {mode === 'forgot' && 'Recuperar Contraseña'}
            {mode === 'reset' && 'Restablecer Contraseña'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' && 'Ingresa tus credenciales para acceder a tu cuenta'}
            {mode === 'register' && 'Completa el formulario para unirte a Reign All Stars'}
            {mode === 'forgot' && 'Ingresa tu email para recibir un código de recuperación'}
            {mode === 'reset' && 'Valida tu código y define una nueva contraseña'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {mode === 'register' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Nombre Completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono (Opcional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                minLength={6}
              />
              {mode === 'register' && (
                <>
                  <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  disabled={codeValidated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resetCode">Código de Recuperación</Label>
                <Input
                  id="resetCode"
                  type="text"
                  value={resetCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="ABC123"
                  required
                  disabled={codeValidated}
                />
              </div>

              {codeValidated && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPasswordReset">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPasswordReset"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {mode === 'register' && (
            <div className="bg-yellow-50 p-3 rounded-md text-sm border border-yellow-200">
              <p className="text-xs">
                Al registrarte, obtienes acceso como usuario público. Al matricular un atleta, tu cuenta se convertirá en
                Apoderado con acceso a la tienda exclusiva.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
            >
              {loading
                ? 'Procesando...'
                : mode === 'login'
                ? 'Iniciar sesión'
                : mode === 'register'
                ? 'Crear Cuenta'
                : mode === 'forgot'
                ? 'Enviar Código'
                : codeValidated
                ? 'Restablecer Contraseña'
                : 'Validar Código'}
            </Button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => handleModeChange('forgot')}
                className="text-sm text-yellow-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}

            {(mode === 'login' || mode === 'register') && (
              <button
                type="button"
                onClick={() => handleModeChange(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-gray-600 hover:underline"
              >
                {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            )}

            {(mode === 'forgot' || mode === 'reset') && (
              <button
                type="button"
                onClick={() => {
                  handleModeChange('login');
                  resetForm();
                }}
                className="text-sm text-gray-600 hover:underline"
              >
                Volver al inicio de sesión
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
