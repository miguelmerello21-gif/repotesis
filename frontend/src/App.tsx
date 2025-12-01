import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingDataProvider } from './contexts/LandingDataContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { TiendaPublica } from './components/TiendaPublica';
import { TiendaApoderado } from './components/TiendaApoderado';
import { MatriculaForm } from './components/MatriculaForm';
import { AdminPanel } from './components/AdminPanel';
import { MisAtletas } from './components/MisAtletas';
import { MiPerfil } from './components/MiPerfil';
import { MisPagos } from './components/MisPagos';
import { HorarioApoderado } from './components/HorarioApoderado';
import { MisNotificaciones } from './components/MisNotificaciones';
import { MisPedidos } from './components/MisPedidos';
import { PerfilEntrenador } from './components/PerfilEntrenador';
import { Toaster } from './components/ui/sonner';
import { PagoOnlineReturnPage } from './components/PagoOnlineReturnPage';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const { user, isBlocked } = useAuth();
  const isTiendaWebpayReturn =
    typeof window !== 'undefined' && window.location.pathname.includes('tienda-webpay-retorno');
  const isPagoOnlineReturn =
    typeof window !== 'undefined' && window.location.pathname.includes('pagos-online-retorno');
  const isMatriculaWebpayReturn =
    typeof window !== 'undefined' &&
    window.location.pathname.includes('webpay-retorno') &&
    !isTiendaWebpayReturn;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      setCurrentPage(tab);
    }
    if (isTiendaWebpayReturn) {
      // Al volver desde Webpay de la tienda montamos la vista de tienda para procesar token_ws
      setCurrentPage('tienda');
    }
  }, []);

  useEffect(() => {
    if (isBlocked && currentPage !== 'mis-pagos') {
      setCurrentPage('mis-pagos');
    }
  }, [isBlocked, currentPage]);

  // Si no hay sesión y la página actual es protegida, volvemos al home (permitimos páginas públicas como tienda/home)
  useEffect(() => {
    const requiereSesion = ['perfil', 'mis-atletas', 'mis-pagos', 'mis-pedidos', 'horarios', 'notificaciones', 'admin', 'matricula'];
    if (!user && requiereSesion.includes(currentPage)) {
      setCurrentPage('home');
    }
  }, [user, currentPage]);

  if (isPagoOnlineReturn) {
    // Pantalla de espera dedicada para retorno de pagos online (sin navbar/footers)
    return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50/30 to-gray-50"><PagoOnlineReturnPage /></div>;
  }

  // Bloqueo: mostrar Mis Pagos pero manteniendo navbar para que el usuario pueda cambiar/cerrar sesión
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50/30 to-gray-50">
        <Navbar setCurrentPage={setCurrentPage} />
        <main className="pt-4 max-w-7xl mx-auto px-4">
          <MisPagos />
        </main>
        <Footer />
        <Toaster />
      </div>
    );
  }

  const renderPage = () => {
    if (isMatriculaWebpayReturn) {
      // Forzamos la pantalla de matr?cula para que procese token_ws de Webpay
      return <MatriculaForm />;
    }

    switch (currentPage) {
      case 'home':
        return <LandingPage />;
      case 'perfil':
        if (!user) {
          return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h2 className="mb-4">Acceso Restringido</h2>
              <p className="text-gray-600">Por favor inicia sesión para ver tu perfil</p>
            </div>
          );
        }
        return <MiPerfil />;
      case 'tienda':
        if (!user) {
          return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h2 className="mb-4">Acceso Restringido</h2>
              <p className="text-gray-600">Por favor inicia sesión para acceder a la tienda</p>
            </div>
          );
        }
        return user.role === 'apoderado' || user.role === 'admin' ? <TiendaApoderado /> : <TiendaPublica />;
      case 'mis-atletas':
        if (!user || (user.role !== 'apoderado' && user.role !== 'admin')) {
          return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h2 className="mb-4">Acceso Restringido</h2>
              <p className="text-gray-600">Solo los apoderados pueden acceder a esta sección</p>
            </div>
          );
        }
        return <MisAtletas />;
      case 'mis-pagos':
        if (!user || (user.role !== 'apoderado' && user.role !== 'admin')) {
          return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h2 className="mb-4">Acceso Restringido</h2>
              <p className="text-gray-600">Solo los apoderados pueden acceder a esta sección</p>
            </div>
          );
        }
        return <MisPagos />;
      case 'mis-pedidos':
        if (!user) {
          return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h2 className="mb-4">Acceso Restringido</h2>
              <p className="text-gray-600">Por favor inicia sesión para ver tus pedidos</p>
            </div>
          );
        }
        return <MisPedidos />;
      case 'horarios':
        if (!user || (user.role !== 'apoderado' && user.role !== 'admin')) {
          return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h2 className="mb-4">Acceso Restringido</h2>
              <p className="text-gray-600">Solo los apoderados pueden acceder a esta sección</p>
            </div>
          );
        }
        return <HorarioApoderado />;
      case 'notificaciones':
        if (!user) {
          return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h2 className="mb-4">Acceso Restringido</h2>
              <p className="text-gray-600">Por favor inicia sesión para ver tus notificaciones</p>
            </div>
          );
        }
        return <MisNotificaciones />;
            case 'matricula':
        if (!user) {
          return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h2 className="mb-4">Acceso Restringido</h2>
              <p className="text-gray-600">Por favor inicia sesion para matricular un atleta</p>
            </div>
          );
        }

        if (user.role !== 'public') {
          return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h2 className="mb-4">Acceso Restringido</h2>
              <p className="text-gray-600">Esta opcion esta disponible para usuarios publicos. Si eres apoderado, matricula desde tus atletas.</p>
            </div>
          );
        }

        return <MatriculaForm />;

case 'admin':
        if (!user || user.role !== 'admin') {
          return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h2 className="mb-4">Acceso Denegado</h2>
              <p className="text-gray-600">Solo los administradores pueden acceder a este panel</p>
            </div>
          );
        }
        return <AdminPanel />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50/30 to-gray-50">
      <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
      <main>
        {renderPage()}
      </main>
      <Toaster />
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LandingDataProvider>
        <AppContent />
      </LandingDataProvider>
    </AuthProvider>
  );
}




