import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  FileText,
  Download,
  DollarSign,
  BarChart3,
  Users,
  CreditCard,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { pagosService } from '../api';

interface Movimiento {
  id?: string | number;
  tipo: string;
  metodo_pago?: string;
  monto: number;
  fecha?: string;
  descripcion?: string;
  responsable?: string;
  apoderado?: string;
  usuario?: string;
  email?: string;
  apoderado_nombre?: string;
  apoderado_email?: string;
  pagador?: string;
  pagador_nombre?: string;
  pagador_email?: string;
  cliente?: string;
  cliente_email?: string;
  cliente_nombre?: string;
  comprador?: string;
  comprador_nombre?: string;
  comprador_email?: string;
  payer_name?: string;
  payer_email?: string;
  nombre?: string;
  nombre_cliente?: string;
  atleta?: string;
  alumno?: string;
  responsable_nombre?: string;
}

interface ReporteData {
  matriculas: number;
  mensualidades: number;
  pagos_online?: number;
  pagos_manuales?: number;
  egresos?: number;
  total_ingresos: number;
  total_egresos?: number;
  balance?: number;
  deudas_pendientes?: number;
  ventas?: number;
  movimientos?: Movimiento[];
}

export const ReportesFinancieros: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [fechaFin, setFechaFin] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [reporteData, setReporteData] = useState<ReporteData | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState<string>('todos');

  useEffect(() => {
    generarReporte();
  }, [fechaInicio, fechaFin, tipoMovimiento]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getMonth() !== fechaInicio.getMonth() || now.getFullYear() !== fechaInicio.getFullYear()) {
        setFechaInicio(new Date(now.getFullYear(), now.getMonth(), 1));
        setFechaFin(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      }
    }, 3600000);
    return () => clearInterval(interval);
  }, [fechaInicio]);

  useEffect(() => {
    const interval = setInterval(() => {
      generarReporte();
    }, 15000);
    return () => clearInterval(interval);
  }, [fechaInicio, fechaFin, tipoMovimiento]);

  const generarReporte = async () => {
    const resp = await pagosService.obtenerReportesFinancieros({
      fecha_inicio: fechaInicio.toISOString().slice(0, 10),
      fecha_fin: fechaFin.toISOString().slice(0, 10),
      tipo: tipoMovimiento,
      estado: 'pagado',
    });
    if (resp.success) {
      setReporteData(resp.data as ReporteData);
    } else {
      toast.error(resp.error?.message || 'No se pudo cargar el reporte');
    }
  };

  const descargarPdf = (filtroTipo?: string) => {
    const movimientos = (reporteData?.movimientos || []).filter((m) => {
      if (!filtroTipo || filtroTipo === 'todos') return true;
      return (m.tipo || '').toLowerCase() === filtroTipo.toLowerCase();
    });
    const win = window.open('', '_blank');
    if (!win) return;
    const resolveResp = (m: Movimiento) =>
      m.responsable ||
      m.responsable_nombre ||
      m.apoderado ||
      m.apoderado_nombre ||
      m.apoderado_email ||
      m.pagador ||
      m.pagador_nombre ||
      m.pagador_email ||
      m.payer_name ||
      m.payer_email ||
      m.comprador ||
      m.comprador_nombre ||
      m.comprador_email ||
      m.cliente ||
      m.cliente_nombre ||
      m.cliente_email ||
      m.nombre_cliente ||
      m.usuario ||
      m.email ||
      m.nombre ||
      m.alumno ||
      m.atleta ||
      '-';
    const rows = movimientos
      .map(
        (m) =>
          `<tr><td>${m.tipo}</td><td>${m.metodo_pago || '-'}</td><td>${m.monto.toLocaleString(
            'es-CL'
          )}</td><td>${m.fecha || ''}</td><td>${m.descripcion || ''}</td><td>${resolveResp(m)}</td></tr>`
      )
      .join('');
    win.document.write(`
      <html><head><title>Ingresos</title></head>
      <body>
        <h2>Detalle de ingresos</h2>
        <table border="1" cellpadding="6" cellspacing="0">
          <thead><tr><th>Tipo</th><th>Metodo</th><th>Monto</th><th>Fecha</th><th>Descripcion</th><th>Responsable</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6">Sin movimientos</td></tr>'}</tbody>
        </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const formatCurrency = (value?: number) => `$${(value || 0).toLocaleString('es-CL')}`;

  const kpis = [
    {
      label: 'Ingresos Totales',
      value: formatCurrency(reporteData?.total_ingresos),
      icon: <BarChart3 className="w-6 h-6 text-green-500" />,
      borderClass: 'border-green-300',
    },
    {
      label: 'Egresos',
      value: formatCurrency(reporteData?.total_egresos ?? reporteData?.egresos),
      icon: <TrendingDown className="w-6 h-6 text-red-500" />,
      borderClass: 'border-red-300',
    },
    {
      label: 'Balance',
      value: formatCurrency(reporteData?.balance),
      icon: <DollarSign className="w-6 h-6 text-blue-500" />,
      borderClass: 'border-blue-300',
    },
    {
      label: 'Matriculas',
      value: formatCurrency(reporteData?.matriculas),
      icon: <Users className="w-6 h-6 text-blue-500" />,
      borderClass: 'border-blue-300',
    },
    {
      label: 'Mensualidades',
      value: formatCurrency(reporteData?.mensualidades),
      icon: <CreditCard className="w-6 h-6 text-purple-500" />,
      borderClass: 'border-purple-300',
    },
    {
      label: 'Pagos Online',
      value: formatCurrency(reporteData?.pagos_online),
      icon: <DollarSign className="w-6 h-6 text-indigo-500" />,
      borderClass: 'border-indigo-300',
    },
    {
      label: 'Deudas Pendientes',
      value: formatCurrency(reporteData?.deudas_pendientes),
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      borderClass: 'border-red-300',
    },
  ];

  const movimientosPorTipo = (tipo: string) =>
    (reporteData?.movimientos || []).filter((m) => (m.tipo || '').toLowerCase() === tipo.toLowerCase());

  const renderPreviewTable = (tipo: string) => {
    const movimientos = movimientosPorTipo(tipo);
    const muestra = movimientos.slice(0, 5);
    const resolverResponsable = (m: Movimiento) =>
      m.responsable ||
      m.responsable_nombre ||
      m.apoderado ||
      m.apoderado_nombre ||
      m.apoderado_email ||
      m.pagador ||
      m.pagador_nombre ||
      m.pagador_email ||
      m.payer_name ||
      m.payer_email ||
      m.comprador ||
      m.comprador_nombre ||
      m.comprador_email ||
      m.cliente ||
      m.cliente_nombre ||
      m.cliente_email ||
      m.nombre_cliente ||
      m.usuario ||
      m.email ||
      m.nombre ||
      m.alumno ||
      m.atleta ||
      '-';
    return (
      <div className="mt-2 border rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50 text-gray-800">
            <tr className="uppercase text-xs tracking-wide">
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Metodo</th>
              <th className="px-3 py-2 text-right">Monto</th>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Descripcion</th>
              <th className="px-3 py-2 text-left">Responsable</th>
            </tr>
          </thead>
          <tbody>
            {muestra.length === 0 ? (
              <tr className="bg-white">
                <td className="px-3 py-4 text-center text-gray-500" colSpan={6}>
                  Sin movimientos
                </td>
              </tr>
            ) : (
              muestra.map((m, idx) => (
                <tr key={`${tipo}-${idx}`} className="border-t border-gray-100 odd:bg-white even:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{m.tipo}</td>
                  <td className="px-3 py-2">{m.metodo_pago || '-'}</td>
                  <td className="px-3 py-2 text-right">{m.monto.toLocaleString('es-CL')}</td>
                  <td className="px-3 py-2">{m.fecha || ''}</td>
                  <td className="px-3 py-2">{m.descripcion || ''}</td>
                  <td className="px-3 py-2">{resolverResponsable(m)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-yellow-600" />
            Reportes Financieros
          </h2>
          <p className="text-gray-600">Analisis detallado de ingresos y deudas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((item) => (
          <div
            key={item.label}
            className={`border ${item.borderClass} rounded-2xl p-4 flex items-start justify-between bg-white shadow-sm`}
          >
            <div>
              <div className="text-gray-700">{item.label}</div>
              <div className="text-2xl font-semibold">{item.value}</div>
              {item.helper && <div className="text-sm text-gray-500">{item.helper}</div>}
            </div>
            {item.icon}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Fecha Inicio</div>
            <Input
              type="date"
              value={fechaInicio.toISOString().slice(0, 10)}
              onChange={(e) => {
                const val = e.target.value;
                if (val) setFechaInicio(new Date(val));
              }}
            />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Fecha Fin</div>
            <Input
              type="date"
              value={fechaFin.toISOString().slice(0, 10)}
              onChange={(e) => {
                const val = e.target.value;
                if (val) setFechaFin(new Date(val));
              }}
            />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Tipo de Movimiento</div>
            <Select value={tipoMovimiento} onValueChange={setTipoMovimiento}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="matriculas">Matriculas</SelectItem>
              <SelectItem value="mensualidades">Mensualidades</SelectItem>
              <SelectItem value="pagos_online_musica">Musica</SelectItem>
              <SelectItem value="pagos_online_competencia">Competencia</SelectItem>
              <SelectItem value="pagos_online_otros">Otros</SelectItem>
              <SelectItem value="egresos">Egresos</SelectItem>
            </SelectContent>
          </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">Desglose de movimientos</h3>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Matriculas', tipo: 'matriculas', color: 'bg-blue-50 text-blue-800 border-blue-200' },
            { label: 'Mensualidades', tipo: 'mensualidades', color: 'bg-purple-50 text-purple-800 border-purple-200' },
            { label: 'Musica', tipo: 'pagos_online_musica', color: 'bg-green-50 text-green-800 border-green-200' },
            { label: 'Competencia', tipo: 'pagos_online_competencia', color: 'bg-green-50 text-green-800 border-green-200' },
            { label: 'Otros', tipo: 'pagos_online_otros', color: 'bg-green-50 text-green-800 border-green-200' },
            { label: 'Egresos', tipo: 'egresos', color: 'bg-red-50 text-red-800 border-red-200' },
          ].map((item) => (
            <div key={item.tipo} className={`${item.color} border rounded-lg p-3`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.label}</span>
                <Button size="sm" variant="outline" onClick={() => descargarPdf(item.tipo)}>
                  <Download className="w-4 h-4 mr-1" /> PDF
                </Button>
              </div>
              {renderPreviewTable(item.tipo)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => descargarPdf()}>
          <Download className="w-4 h-4 mr-2" /> Exportar PDF
        </Button>
      </div>
    </div>
  );
};






