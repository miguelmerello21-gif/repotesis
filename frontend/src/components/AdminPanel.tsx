import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  DollarSign,
  Users,
  FileText,
  Shield,
  UserCog,
  Calendar,
  CreditCard,
  BarChart3,
  AlertTriangle,
  Home,
  TrendingDown,
  Info,
  Bell,
  Award,
  ShoppingBag,
  ChevronDown,
  Menu,
  X,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { UsersManagement } from './UsersManagement';
import { AtletasManagement } from './AtletasManagement';
import { GestionPeriodosMatricula } from './GestionPeriodosMatricula';
import { ConfiguracionMensualidades } from './ConfiguracionMensualidades';
import { ReportesFinancieros } from './ReportesFinancieros';
import { ControlDeuda } from './ControlDeuda';
import { InfoCategorias } from './InfoCategorias';
import { GestionEgresos } from './GestionEgresos';
import { GestionEquipos } from './GestionEquipos';
import { GestionHorarios } from './GestionHorarios';
import { GestionRanking } from './GestionRanking';
import { GestionNotificaciones } from './GestionNotificaciones';
import { GestionTienda } from './GestionTienda';
import { GestionLanding } from './GestionLanding';
import { GestionPedidosClientes } from './GestionPedidosClientes';
import { ValidacionCertificaciones } from './ValidacionCertificaciones';
import { ValidacionCertificacionesEntrenadores } from './ValidacionCertificacionesEntrenadores';
import { usuariosService, pagosService, atletasService } from '../api';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

export const AdminPanel: React.FC = () => {
  const [costoMatricula, setCostoMatricula] = useState(50000);
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [stats, setStats] = useState({ usuarios: 0, atletas: 0, totalMatriculas: 0, ingresosTotales: 0 });
  const [atletasResumen, setAtletasResumen] = useState<any[]>([]);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [errorPanel, setErrorPanel] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
    Principal: true,
    'Usuarios y Atletas': true,
    'Finanzas - Ingresos': true,
    'Finanzas - Egresos': true,
    Control: true,
  });

  useEffect(() => {
    const savedCosto = localStorage.getItem('costoMatricula');
    if (savedCosto) {
      setCostoMatricula(parseInt(savedCosto));
    }
    loadPanelData();
  }, []);

  const loadPanelData = async () => {
    setLoadingPanel(true);
    setErrorPanel(null);
    try {
      const [usersResp, matsResp, atletasResp] = await Promise.all([
        usuariosService.listarUsuarios?.(),
        pagosService.listarMatriculas?.(),
        atletasService.listarAtletas?.(),
      ]);

      const usuariosArray = usersResp?.success && Array.isArray(usersResp.data) ? usersResp.data : [];
      const usuariosCount = usuariosArray.length;
      const atletasList = atletasResp?.success && Array.isArray(atletasResp.data) ? atletasResp.data : [];
      const atletasCount = atletasList.length;

      const usuarioMap: Record<string | number, any> = {};
      usuariosArray.forEach((u: any) => {
        usuarioMap[u.id] = u;
      });

      const atletaMap: Record<string | number, any> = {};
      atletasList.forEach((a: any) => {
        atletaMap[a.id] = a;
      });

      const mats =
        matsResp?.success && Array.isArray(matsResp.data)
          ? matsResp.data.map((m: any) => ({
              ...m,
              atleta_detalle: atletaMap[m.atleta],
              apoderado_detalle: usuarioMap[m.apoderado],
            }))
          : [];
      setMatriculas(mats);

      const recientes = [...atletasList]
        .sort((a, b) => new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime())
        .slice(0, 5);
      setAtletasResumen(recientes);

      const ingresosTotales = mats.reduce((sum, m) => {
        const monto = Number(m.monto_pagado ?? m.monto_total ?? 0);
        return sum + (isNaN(monto) ? 0 : monto);
      }, 0);

      setStats({
        usuarios: usuariosCount,
        atletas: atletasCount,
        totalMatriculas: mats.length,
        ingresosTotales,
      });
    } catch (error) {
      setErrorPanel('No se pudieron cargar las estadisticas');
    } finally {
      setLoadingPanel(false);
    }
  };

  const handleGuardarCosto = () => {
    localStorage.setItem('costoMatricula', costoMatricula.toString());
    toast.success('Costo de matricula actualizado');
  };

  const menuItems = [
    {
      group: 'Principal',
      items: [
        { id: 'overview', label: 'Resumen General', icon: Home },
        { id: 'categorias', label: 'Info Categorias', icon: Info },
      ],
    },
    {
      group: 'Usuarios y Atletas',
      items: [
        { id: 'users', label: 'Gestion de Usuarios', icon: Users },
        { id: 'atletas', label: 'Gestion de Atletas', icon: UserCog },
        { id: 'equipos', label: 'Gestion de Equipos', icon: Users },
        { id: 'horarios', label: 'Gestion de Horarios', icon: Calendar },
        { id: 'validacionCertificaciones', label: 'Certificaciones Atletas', icon: Award },
        { id: 'validacionCertificacionesEntrenadores', label: 'Certificaciones Entrenadores', icon: Award },
        { id: 'ranking', label: 'Gestion de Ranking', icon: BarChart3 },
      ],
    },
    {
      group: 'Finanzas - Ingresos',
      items: [
        { id: 'periodosMatricula', label: 'Periodos de Matricula', icon: Calendar },
        { id: 'pagosOnline', label: 'Pagos Online', icon: CreditCard },
        { id: 'tienda', label: 'Gestion de Tienda', icon: ShoppingBag },
        { id: 'pedidos', label: 'Pedidos de Clientes', icon: ShoppingCart },
        { id: 'reportes', label: 'Reportes Financieros', icon: BarChart3 },
      ],
    },
    {
      group: 'Finanzas - Egresos',
      items: [{ id: 'egresos', label: 'Gestion de Egresos', icon: TrendingDown }],
    },
  {
    group: 'Control',
    items: [
      { id: 'landing', label: 'Gestion de Landing', icon: Home },
      { id: 'notificaciones', label: 'Comunicacion Interna', icon: Bell },
      { id: 'deuda', label: 'Control de Deuda', icon: AlertTriangle },
    ],
  },
];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h2>Resumen General</h2>
              <p className="text-gray-600">Panel de control principal</p>
            </div>

            {loadingPanel && <div className="text-sm text-gray-500">Cargando datos...</div>}
            {errorPanel && <div className="text-sm text-red-600">{errorPanel}</div>}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-l-4 border-yellow-400">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="w-5 h-5 text-yellow-600" />
                    Usuarios Registrados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl">{stats.usuarios}</div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-yellow-400">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserCog className="w-5 h-5 text-yellow-600" />
                    Atletas Registrados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl">{stats.atletas}</div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-yellow-400">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-5 h-5 text-yellow-600" />
                    Total Matriculas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl">{stats.totalMatriculas}</div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-yellow-400">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                    Ingresos por Matriculas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl">
                    ${stats.ingresosTotales.toLocaleString('es-CL')}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Matriculas Registradas</CardTitle>
              </CardHeader>
              <CardContent>
                {matriculas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay matriculas registradas aun
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Atleta</th>
                          <th className="text-left p-2">RUT</th>
                          <th className="text-left p-2">Apoderado</th>
                          <th className="text-left p-2">Categoria</th>
                          <th className="text-left p-2">Fecha Matricula</th>
                          <th className="text-left p-2">Costo</th>
                          <th className="text-left p-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matriculas.map((matricula) => {
                          const atleta = matricula.atleta_detalle;
                          const apoderado = matricula.apoderado_detalle;
                          const nombre =
                            atleta?.nombre_completo ||
                            `${atleta?.nombres || ''} ${atleta?.apellidos || ''}`.trim() ||
                            `Atleta #${matricula.atleta}`;
                          return (
                            <tr key={matricula.id} className="border-b hover:bg-gray-50">
                              <td className="p-2">{nombre}</td>
                              <td className="p-2">{atleta?.rut || '—'}</td>
                              <td className="p-2">
                                {apoderado?.name || apoderado?.email || `Usuario #${matricula.apoderado}`}
                              </td>
                              <td className="p-2 capitalize">{atleta?.categoria || '—'}</td>
                              <td className="p-2">
                                {matricula.fecha_pago
                                  ? new Date(matricula.fecha_pago).toLocaleDateString('es-CL')
                                  : new Date(
                                      matricula.created_at ||
                                        matricula.createdAt ||
                                        Date.now(),
                                    ).toLocaleDateString('es-CL')}
                              </td>
                              <td className="p-2">
                                ${Number(matricula.monto_total ?? 0).toLocaleString('es-CL')}
                              </td>
                              <td className="p-2">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs capitalize">
                                  {matricula.estado_pago || 'pendiente'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atletas recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {atletasResumen.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No hay atletas registrados</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Nombre</th>
                          <th className="text-left p-2">RUT</th>
                          <th className="text-left p-2">Categoria</th>
                          <th className="text-left p-2">Division</th>
                          <th className="text-left p-2">Apoderado</th>
                          <th className="text-left p-2">Ingreso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {atletasResumen.map((a: any) => {
                          const nombre = a.nombre_completo || `${a.nombres || ''} ${a.apellidos || ''}`.trim() || `Atleta #${a.id}`;
                          const apoderadoNombre = a.apoderado?.name || a.apoderado?.email || 'Sin apoderado';
                          return (
                            <tr key={a.id} className="border-b hover:bg-gray-50">
                              <td className="p-2">{nombre}</td>
                              <td className="p-2">{a.rut || '—'}</td>
                              <td className="p-2 capitalize">{a.categoria || '—'}</td>
                              <td className="p-2">{a.division || '—'}</td>
                              <td className="p-2">{apoderadoNombre}</td>
                              <td className="p-2">
                                {a.created_at
                                  ? new Date(a.created_at).toLocaleDateString('es-CL')
                                  : a.createdAt
                                  ? new Date(a.createdAt).toLocaleDateString('es-CL')
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'users':
        return <UsersManagement />;
      case 'atletas':
        return <AtletasManagement />;
      case 'periodosMatricula':
        return <GestionPeriodosMatricula />;
      case 'pagosOnline':
        return <ConfiguracionMensualidades />;
      case 'reportes':
        return <ReportesFinancieros />;
      case 'deuda':
        return <ControlDeuda />;
      case 'categorias':
        return <InfoCategorias />;
      case 'egresos':
        return <GestionEgresos />;
      case 'equipos':
        return <GestionEquipos />;
      case 'horarios':
        return <GestionHorarios />;
      case 'ranking':
        return <GestionRanking />;
      case 'notificaciones':
        return <GestionNotificaciones />;
      case 'validacionCertificaciones':
        return <ValidacionCertificaciones />;
      case 'validacionCertificacionesEntrenadores':
        return <ValidacionCertificacionesEntrenadores />;
      case 'tienda':
        return <GestionTienda />;
      case 'landing':
        return <GestionLanding />;
      case 'pedidos':
        return <GestionPedidosClientes />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-yellow-50/20 to-gray-50 relative overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-gray-200 bg-gradient-to-r from-yellow-400 to-amber-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white">Admin Panel</h3>
                <p className="text-xs text-yellow-50">La Colmena</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-80px)]">
          {menuItems.map((section, idx) => (
            <Collapsible
              key={idx}
              open={openGroups[section.group]}
              onOpenChange={(open) => setOpenGroups({ ...openGroups, [section.group]: open })}
              className="border-b border-gray-200"
            >
              <CollapsibleTrigger className="w-full px-4 py-3 hover:bg-gray-100 flex items-center justify-between group transition-colors">
                <span className="text-xs uppercase text-gray-700 font-semibold tracking-wide">
                  {section.group}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    openGroups[section.group] ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-2">
                <div className="space-y-1 px-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveSection(item.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-yellow-400 text-black shadow-md'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl">Panel de Administracion</h1>
                <p className="text-sm text-gray-600">Reign All Stars</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6 bg-gradient-to-r from-yellow-50 to-amber-50 px-6 py-3 rounded-lg border border-yellow-200">
              <div className="text-center">
                <p className="text-xs text-gray-600">Usuarios</p>
                <p className="text-xl">{stats.usuarios}</p>
              </div>
              <div className="w-px h-10 bg-yellow-300"></div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Atletas</p>
                <p className="text-xl">{stats.atletas}</p>
              </div>
              <div className="w-px h-10 bg-yellow-300"></div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Matriculas</p>
                <p className="text-xl">{stats.totalMatriculas}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
};
