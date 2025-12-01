import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  Ban, 
  Bell, 
  TrendingDown,
  FileText,
  Paperclip,
  Tag,
  Shield
} from 'lucide-react';

export const ResumenFuncionalidades: React.FC = () => {
  const funcionalidades = [
    {
      titulo: 'Control de Deuda',
      descripcion: 'Gestión completa del seguimiento de deudas pendientes con alertas automáticas y sanciones',
      componentes: [
        {
          nombre: 'Monitoreo de Pagos Vencidos',
          icono: AlertTriangle,
          color: 'orange',
          detalles: [
            'Revisión periódica del estado de pagos',
            'Identificación automática de atrasos',
            'Cálculo de días de atraso por atleta',
            'Agrupación de deudas por responsable económico'
          ]
        },
        {
          nombre: 'Niveles de Gravedad',
          icono: Shield,
          color: 'yellow',
          detalles: [
            'Leve: Atrasos menores configurables',
            'Moderado: Alerta amarilla',
            'Grave: Alerta naranja',
            'Crítico: Alerta roja antes del bloqueo'
          ]
        },
        {
          nombre: 'Alertas Automáticas',
          icono: Bell,
          color: 'blue',
          detalles: [
            'Envío automático de notificaciones por email',
            'Recordatorios con detalle del monto adeudado',
            'Información de fecha de vencimiento',
            'Historial de notificaciones enviadas',
            'Frecuencia configurable de recordatorios'
          ]
        },
        {
          nombre: 'Bloqueo Temporal',
          icono: Ban,
          color: 'red',
          detalles: [
            'Restricción automática después de X días configurables',
            'Limitación de acceso a entrenamientos e inscripciones',
            'Notificación visible en cuenta del usuario',
            'Desbloqueo manual o automático al regularizar pago',
            'Toggle manual de bloqueo para casos especiales'
          ]
        }
      ]
    },
    {
      titulo: 'Gestión de Egresos',
      descripcion: 'Registro y administración completa de gastos operativos del club',
      componentes: [
        {
          nombre: 'Registro de Gastos',
          icono: TrendingDown,
          color: 'purple',
          detalles: [
            'Registro de concepto, monto y fecha',
            'Asignación de responsable del gasto',
            'Selección de método de pago',
            'Campo para proveedor/empresa',
            'Descripción detallada opcional'
          ]
        },
        {
          nombre: 'Clasificación de Egresos',
          icono: Tag,
          color: 'green',
          detalles: [
            'Categoría: Arriendo de instalaciones',
            'Categoría: Materiales y equipamiento deportivo',
            'Categoría: Uniformes y vestuario',
            'Categoría: Servicios (agua, luz, internet)',
            'Categoría: Personal (honorarios y salarios)',
            'Categoría: Otros gastos operativos',
            'Visualización de gastos por categoría',
            'Estadísticas y totales por tipo'
          ]
        },
        {
          nombre: 'Registro de Comprobantes',
          icono: Paperclip,
          color: 'teal',
          detalles: [
            'Adjuntar documentos digitales (facturas, boletas)',
            'Vinculación de comprobante al egreso',
            'Almacenamiento organizado de documentos',
            'Descarga de comprobantes adjuntos',
            'Indicador visual de egresos con/sin comprobante',
            'Disponibilidad para auditoría y revisión'
          ]
        },
        {
          nombre: 'Reportes y Exportación',
          icono: FileText,
          color: 'indigo',
          detalles: [
            'Filtros por categoría, fecha y responsable',
            'Búsqueda por concepto o proveedor',
            'Estadísticas de gastos totales y por período',
            'Exportación a Excel/CSV',
            'Visualización de egresos sin comprobante',
            'Análisis de gastos por categoría'
          ]
        }
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: any = {
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      red: 'bg-red-50 border-red-200 text-red-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      teal: 'bg-teal-50 border-teal-200 text-teal-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    };
    return colors[color] || colors.blue;
  };

  const getIconColorClass = (color: string) => {
    const colors: any = {
      orange: 'text-orange-600',
      yellow: 'text-yellow-600',
      blue: 'text-blue-600',
      red: 'text-red-600',
      purple: 'text-purple-600',
      green: 'text-green-600',
      teal: 'text-teal-600',
      indigo: 'text-indigo-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle className="w-6 h-6 text-green-500" />
          Funcionalidades Implementadas
        </h2>
        <p className="text-gray-600">Sistema completo de gestión financiera y control de deudas</p>
      </div>

      {funcionalidades.map((funcionalidad, idx) => (
        <Card key={idx} className="border-2 border-yellow-400">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardTitle className="text-xl">{funcionalidad.titulo}</CardTitle>
            <p className="text-sm text-gray-600 mt-2">{funcionalidad.descripcion}</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {funcionalidad.componentes.map((componente, compIdx) => {
                const Icono = componente.icono;
                return (
                  <div
                    key={compIdx}
                    className={`p-5 rounded-lg border-2 ${getColorClasses(componente.color)}`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        <Icono className={`w-6 h-6 ${getIconColorClass(componente.color)}`} />
                      </div>
                      <h3 className="font-medium text-lg">{componente.nombre}</h3>
                    </div>
                    <ul className="space-y-2">
                      {componente.detalles.map((detalle, detIdx) => (
                        <li key={detIdx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                          <span>{detalle}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-2 text-green-900">Estado del Sistema</h3>
              <p className="text-gray-700 mb-3">
                Todas las funcionalidades están completamente implementadas y operativas con:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    ✅ Persistencia de datos (localStorage)
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    ✅ Interfaz responsive
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    ✅ Validación de datos
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    ✅ Notificaciones toast
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    ✅ Filtros y búsqueda
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    ✅ Exportación de datos
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
