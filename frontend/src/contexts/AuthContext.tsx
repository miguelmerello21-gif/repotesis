import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, usuariosService } from '../api';

export type UserRole = 'public' | 'apoderado' | 'admin' | 'entrenador';

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  rut?: string;
  direccion?: string;
  fechaNacimiento?: string;
  ocupacion?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  createdAt: string;
  customRole?: string;
}

interface AuthContextType {
  user: User | null;
  isBlocked: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  upgradeToApoderado: () => void;
  refreshUser: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  validateResetCode: (email: string, code: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  updateUserRole: (userId: string, newRole: UserRole) => boolean;
  getAllUsers: () => User[];
  updateUserProfile: (profileData: Partial<User>) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      await refreshUser();
      setIsLoading(false);
    };
    initSession();
  }, []);

  const evaluateBlock = async (u?: User | null) => {
    // Bloqueo si alguna deuda supera el umbral configurado (por defecto 30 dÃ­as)
    try {
      const effectiveUser = u ?? user;
      if (effectiveUser && effectiveUser.role === 'admin') {
        setIsBlocked(false);
        return;
      }
      let diasBloqueo = 30;
      const cfgStr = localStorage.getItem('configuracionDeuda');
      if (cfgStr) {
        try {
          const cfg = JSON.parse(cfgStr);
          const cfgVal = Number(cfg.diasBloqueo);
          if (!Number.isNaN(cfgVal)) {
            diasBloqueo = Math.max(4, cfgVal);
          }
        } catch {
          // ignoramos parseo invÃ¡lido
        }
      }
      const resp = await (await import('../api')).pagosService.obtenerMisDeudas?.();
      if (resp?.success && Array.isArray(resp.data)) {
        const hoy = new Date();
        const maxAtraso = resp.data.reduce((max: number, d: any) => {
          const fv = d.fecha_vencimiento ? new Date(d.fecha_vencimiento) : null;
          if (!fv) return max;
          const diff = Math.max(0, Math.floor((hoy.getTime() - fv.getTime()) / (1000 * 60 * 60 * 24)));
          return Math.max(max, diff);
        }, 0);
        setIsBlocked(maxAtraso >= diasBloqueo);
        return;
      }
    } catch (e) {
      // silencioso
    }
    setIsBlocked(false);
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const resp = await authService.login(email, password);
    if (resp.success && resp.data?.user) {
      setUser(resp.data.user as User);
      localStorage.setItem('user', JSON.stringify(resp.data.user));
      await evaluateBlock(resp.data.user as User);
      return { success: true };
    }
    const err: any = (resp as any)?.error || {};
    const rawMessage =
      err.detail ||
      err.message ||
      err.data?.detail ||
      '';
    const normalized = String(rawMessage || '').toLowerCase();
    let friendly = 'Credenciales incorrectas';
    if (normalized.includes('no active account')) {
      friendly = 'Credenciales incorrectas';
    } else if (normalized.includes('disabled')) {
      friendly = 'La cuenta está deshabilitada';
    } else if (rawMessage) {
      friendly = rawMessage;
    }
    return { success: false, message: friendly };
  };

  const register = async (email: string, password: string, name: string, phone?: string): Promise<boolean> => {
    const resp = await authService.register({ email, password, name, phone });
    if (resp.success && resp.data?.user) {
      setUser(resp.data.user as User);
      localStorage.setItem('user', JSON.stringify(resp.data.user));
      await evaluateBlock(resp.data.user as User);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    authService.logout();
    localStorage.removeItem('user');
    setIsBlocked(false);
  };

  const refreshUser = async () => {
    const me = await authService.getCurrentUser();
    if (me.success && me.data) {
      setUser(me.data as User);
      localStorage.setItem('user', JSON.stringify(me.data));
      await evaluateBlock(me.data as User);
    }
  };

  const upgradeToApoderado = () => {
    if (user && user.role === 'public') {
      // Actualizamos solo local; el backend promociona tras el pago.
      const updated = { ...user, role: 'apoderado' as UserRole };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    const resp = await authService.requestPasswordReset(email);
    return resp.success;
  };

  const validateResetCode = async (email: string, code: string): Promise<boolean> => {
    const resp = await authService.validatePasswordResetCode(email, code);
    return resp.success;
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<boolean> => {
    const resp = await authService.confirmPasswordReset(email, code, newPassword);
    return resp.success;
  };

  const updateUserRole = (userId: string, newRole: UserRole): boolean => {
    usuariosService.cambiarRolUsuario(userId, newRole);
    if (user && user.id === userId) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return true;
  };

  const getAllUsers = (): User[] => {
    // Solo admin deberÃ­a usar este mÃ©todo
    // Esto es una llamada sÃ­ncrona en la interfaz, por compatibilidad devolvemos arreglo vacÃ­o si falla
    // Para componentes que quieran datos frescos, deberÃ­an migrarse a hooks async.
    return [];
  };

  const updateUserProfile = (profileData: Partial<User>): boolean => {
    if (!user) {
      return false;
    }

    authService.updateProfile(profileData);
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      isBlocked,
      login, 
      register, 
      logout, 
      upgradeToApoderado,
      refreshUser,
      requestPasswordReset,
      validateResetCode,
      resetPassword,
      updateUserRole,
      getAllUsers,
      updateUserProfile
    }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};



