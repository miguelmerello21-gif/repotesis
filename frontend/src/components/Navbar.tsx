import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Menu, X, User, LogOut, ShoppingBag, Home, Settings, Users, UserCircle, DollarSign, Calendar, Bell, Phone, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { useNotificacionesNoLeidas } from './MisNotificaciones';
import logo from 'figma:asset/6154c1dfd89bd336b0d8443ab9908761d0d02132.png';
import * as pagosService from '../api/services/pagosService';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [matriculaActiva, setMatriculaActiva] = useState<boolean>(true);
  const { user, logout, isBlocked } = useAuth();
  const notificacionesNoLeidas = useNotificacionesNoLeidas();

  useEffect(() => {
    let cancel = false;
    const checkPeriodos = async () => {
      if (user?.role !== 'public') {
        setMatriculaActiva(false);
        return;
      }
      try {
        const resp = await pagosService.obtenerPeriodosMatricula?.();
        if (cancel) return;
        if (resp?.success && Array.isArray(resp.data)) {
          const hayActivo = resp.data.some((p: any) => p?.estado === 'activo');
          setMatriculaActiva(hayActivo);
        } else {
          setMatriculaActiva(false);
        }
      } catch {
        if (!cancel) setMatriculaActiva(false);
      }
    };
    checkPeriodos();
    return () => {
      cancel = true;
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    onNavigate('home');
    setIsMobileMenuOpen(false);
  };

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const scrollToContact = () => {
    const footer = document.getElementById('contacto');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const getMenuItems = () => {
    // En modo bloqueado solo mostramos Mis Pagos para forzar al usuario a regularizar
    if (isBlocked) {
      return [
        { id: 'mis-pagos', label: 'Mis Pagos', icon: DollarSign },
      ];
    }

    const baseItems = [
      { id: 'home', label: 'Inicio', icon: Home },
    ];

    if (!user) {
      return [
        ...baseItems,
        { id: 'tienda', label: 'Tienda', icon: ShoppingBag },
      ];
    }

    switch (user.role) {
      case 'public':
        const itemsPublic = [
          ...baseItems,
          { id: 'perfil', label: 'Mi Perfil', icon: UserCircle },
          { id: 'tienda', label: 'Tienda', icon: ShoppingBag },
        ];

        if (matriculaActiva) {
          itemsPublic.push({ id: 'matricula', label: 'Matricular', icon: Users });
        }

        return itemsPublic;
      case 'apoderado':
        return [
          ...baseItems,
          { id: 'perfil', label: 'Mi Perfil', icon: UserCircle },
          { id: 'mis-atletas', label: 'Mis Atletas', icon: Users },
          { id: 'horarios', label: 'Horarios', icon: Calendar },
          { id: 'mis-pagos', label: 'Mis Pagos', icon: DollarSign },
          { id: 'tienda', label: 'Tienda Premium', icon: ShoppingBag },
        ];
      case 'entrenador':
        return [
          ...baseItems,
          { id: 'perfil', label: 'Mi Perfil', icon: UserCircle },
        ];
      case 'admin':
        return [
          ...baseItems,
          { id: 'perfil', label: 'Mi Perfil', icon: UserCircle },
          { id: 'horarios', label: 'Horarios', icon: Calendar },
          { id: 'admin', label: 'Admin Panel', icon: Settings },
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      <nav className="bg-gradient-to-r from-black via-gray-900 to-black shadow-xl sticky top-0 z-50 border-b-4 border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => handleNavigate('home')}
            >
              <div className="relative">
                <img src={logo} alt="Reign All Stars" className="h-14 w-14 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -inset-1 bg-yellow-400/20 rounded-full blur-md group-hover:bg-yellow-400/40 transition-all duration-300"></div>
              </div>
              <div>
                <span className="font-bold text-2xl text-white">Reign All Stars</span>
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  🐝 La Colmena 🐝
                </p>
              </div>
            </div>

            {/* Centro - Año de Fundación */}
            <div className="hidden lg:flex items-center">
              <div className="relative px-8 py-2">
                {/* Hexágonos decorativos */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-yellow-400/30 text-2xl">⬡</div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-yellow-400/30 text-2xl">⬡</div>
                <div className="text-center">
                  <div className="text-yellow-400 text-3xl font-black tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>
                    2016
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-widest">
                    Desde
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-3">
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      currentPage === item.id
                        ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/50 scale-105'
                        : 'text-white hover:bg-white/10 hover:scale-105'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}

              {!user && (
                <>
                  <Button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="bg-yellow-400 text-black hover:bg-yellow-500 hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-400/50 font-bold"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                  <Button
                    onClick={scrollToContact}
                    variant="outline"
                    className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-300"
                  >
                    Contáctanos
                  </Button>
                </>
              )}

              {user ? (
                <div className="flex items-center gap-3 pl-3 border-l border-yellow-400/30">
                  {!isBlocked && (
                    <button
                      onClick={() => handleNavigate('notificaciones')}
                      className="relative p-2 rounded-lg hover:bg-white/10 transition-all duration-300 hover:scale-110"
                    >
                      <Bell className="w-5 h-5 text-yellow-400" />
                      {notificacionesNoLeidas > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs animate-pulse">
                          {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
                        </Badge>
                      )}
                    </button>
                  )}

                  {!isBlocked && (
                    <span className="text-sm text-gray-300">
                      Hola, <span className="font-bold text-yellow-400">{user.name}</span>
                    </span>
                  )}
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-red-400 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4" />
                    Salir
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 text-yellow-400"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-yellow-400/30">
              <div className="flex flex-col gap-2">
                {/* Año en móvil */}
                <div className="text-center py-4 mb-2">
                  <div className="text-yellow-400 text-2xl font-black tracking-wider">
                    🐝 2016 🐝
                  </div>
                  <div className="text-xs text-gray-400 uppercase">Desde</div>
                </div>

                {menuItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        currentPage === item.id
                          ? 'bg-yellow-400 text-black'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {user ? (
                  <div className="mt-4 pt-4 border-t border-yellow-400/30 space-y-3">
                    {!isBlocked && (
                      <button
                        onClick={() => handleNavigate('notificaciones')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/10 text-white"
                      >
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-yellow-400" />
                          <span>Notificaciones</span>
                        </div>
                        {notificacionesNoLeidas > 0 && (
                          <Badge className="bg-red-500 text-white">
                            {notificacionesNoLeidas}
                          </Badge>
                        )}
                      </button>
                    )}

                    {!isBlocked && (
                      <div className="px-4">
                        <p className="text-sm text-gray-400">Conectado como:</p>
                        <p className="font-medium text-yellow-400">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                    )}
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 border-red-400 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-yellow-400/30 space-y-3">
                    <Button
                      onClick={() => {
                        setAuthMode('register');
                        setShowAuthModal(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold"
                    >
                      🐝 Únete a la Colmena
                    </Button>
                    <Button
                      onClick={scrollToContact}
                      variant="outline"
                      className="w-full border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                    >
                      Contáctanos
                    </Button>
                    <Button
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuthModal(true);
                        setIsMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full border-white text-white hover:bg-white hover:text-black"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Ingresar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          mode={authMode} 
        />
      )}
    </>
  );
};
