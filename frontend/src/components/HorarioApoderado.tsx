import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../contexts/AuthContext';
import { atletasService, horariosService, usuariosService } from '../api';

interface Horario {
  id: number;
  equipo: number;
  equipo_nombre: string;
  entrenador?: string;
  entrenador_nombre?: string;
  fecha?: string;
  lugar: string;
  dia_semana: number;
  hora_inicio: string;
  hora_termino: string;
  color: string;
  activo: boolean;
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_SEMANA_COMPLETO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const HorarioApoderado: React.FC = () => {
  const { user } = useAuth();
  const esAdmin = user?.role === 'admin';
  const [semanaActual, setSemanaActual] = useState(0); // 0 = esta semana
  const [horariosAtletas, setHorariosAtletas] = useState<Horario[]>([]);
  const [atletasUsuario, setAtletasUsuario] = useState<any[]>([]);
  const [entrenadoresMap, setEntrenadoresMap] = useState<Record<string, string>>({});

  useEffect(() => {
    loadHorariosAtletas();
  }, [user]);

  const loadHorariosAtletas = async () => {
    if (!user) return;
    let entrenadoresDict: Record<string, string> = {};
    const [respAtletas, respHorarios, respUsuarios] = await Promise.all([
      esAdmin ? { success: true, data: [] } : atletasService.obtenerMisAtletas(),
      esAdmin ? horariosService.listarHorarios() : horariosService.obtenerMisHorarios(),
      usuariosService.listarUsuarios?.(),
    ]);

    if (respUsuarios && respUsuarios.success) {
      const map: Record<string, string> = {};
      (respUsuarios.data || [])
        .filter((u: any) => u.role === 'entrenador')
        .forEach((u: any) => {
          map[String(u.id)] = u.name || u.email || `Entrenador ${u.id}`;
        });
      entrenadoresDict = map;
      setEntrenadoresMap(map);
    } else {
      entrenadoresDict = {};
      setEntrenadoresMap({});
    }

    if (!esAdmin && respAtletas.success) {
      setAtletasUsuario(respAtletas.data || []);
    } else {
      setAtletasUsuario([]);
    }

    if (respHorarios.success) {
      const list = (respHorarios.data || []).map((h: any) => ({
        ...h,
        entrenador_nombre:
          h.entrenador_nombre ||
          (h.entrenador ? entrenadoresDict[String(h.entrenador)] : undefined) ||
          (h.entrenador ? `Entrenador ${h.entrenador}` : 'Sin entrenador'),
      }));
      setHorariosAtletas(list);
    } else {
      setHorariosAtletas([]);
      const msg =
        typeof respHorarios.error === 'string'
          ? respHorarios.error
          : respHorarios.error?.message || respHorarios.error?.detail || 'No se pudieron cargar los horarios';
      toast.error(msg);
    }
  };

  const obtenerFechasSemana = () => {
    const hoy = new Date();
    const primerDiaSemana = new Date(hoy);
    primerDiaSemana.setDate(hoy.getDate() - hoy.getDay() + 1 + semanaActual * 7); // Lunes

    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(primerDiaSemana);
      fecha.setDate(primerDiaSemana.getDate() + i);
      fechas.push(fecha);
    }
    return fechas;
  };

  const fechasSemana = obtenerFechasSemana();
  const esHoy = (fecha: Date) => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const formatearFecha = (fecha: Date) => {
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString('es-CL', { month: 'short' });
    return { dia, mes };
  };

  // Parse fecha yyyy-mm-dd sin desplazamiento de zona
  const parseApiDateLocal = (dateStr?: string) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const obtenerHorariosDelDia = (fechaObjetivo: Date) => {
    return horariosAtletas.filter((h) => {
      if (h.fecha) {
        const fechaH = parseApiDateLocal(h.fecha);
        if (!fechaH) return false;
        return fechaH.toDateString() === fechaObjetivo.toDateString();
      }
      return h.dia_semana === fechaObjetivo.getDay();
    });
  };

  const formatHora = (hora: string) => (hora ? hora.substring(0, 5) : hora);

  const obtenerNombreSemana = () => {
    if (semanaActual === 0) return 'Esta Semana';
    if (semanaActual === 1) return 'Próxima Semana';
    if (semanaActual === -1) return 'Semana Anterior';

    const primerDia = fechasSemana[0];
    const ultimoDia = fechasSemana[6];
    return `${primerDia.getDate()} ${primerDia.toLocaleDateString('es-CL', { month: 'short' })} - ${ultimoDia.getDate()} ${ultimoDia.toLocaleDateString('es-CL', { month: 'short' })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-yellow-400" />
            Horarios de Entrenamiento
          </h2>
          <p className="text-gray-600">
            {esAdmin ? 'Visualiza todos los horarios creados' : 'Visualiza los horarios de tus atletas'}
          </p>
        </div>
      </div>

      {/* Info de atletas */}
      {!esAdmin && atletasUsuario.length > 0 && (
        <Card className="border-l-4 border-yellow-400">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Mis atletas:</span>
              {atletasUsuario.map((atleta, idx) => (
                <Badge key={idx} variant="outline" className="bg-yellow-50">
                  {atleta.nombre || atleta.nombreAtleta || atleta.nombre_completo}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegación de semanas */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setSemanaActual(semanaActual - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-center">
              <p className="font-medium">{obtenerNombreSemana()}</p>
              <p className="text-sm text-gray-500">
                {fechasSemana[0].toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            <Button variant="outline" size="sm" onClick={() => setSemanaActual(semanaActual + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendario Semanal */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {fechasSemana.map((fecha, idx) => {
          const diaSemana = fecha.getDay();
          const { dia, mes } = formatearFecha(fecha);
          const horariosDelDia = obtenerHorariosDelDia(fecha);
          const esDiaActual = esHoy(fecha);

          return (
            <Card
              key={idx}
              className={`${esDiaActual ? 'border-2 border-yellow-400 bg-yellow-50/50' : ''}`}
            >
              <CardHeader className="p-3 pb-2">
                <div className="text-center">
                  <p className={`text-xs uppercase ${esDiaActual ? 'text-yellow-600 font-bold' : 'text-gray-500'}`}>
                    {DIAS_SEMANA[diaSemana]}
                  </p>
                  <p className={`text-2xl ${esDiaActual ? 'text-yellow-600 font-bold' : ''}`}>{dia}</p>
                  <p className="text-xs text-gray-500 uppercase">{mes}</p>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-2">
                  {horariosDelDia.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-400">Sin entrenamientos</div>
                  ) : (
                    horariosDelDia.map((horario) => (
                      <div
                        key={horario.id}
                        className="p-2 rounded-lg text-xs space-y-1"
                        style={{ backgroundColor: horario.color }}
                      >
                        <p className="font-medium text-gray-900">{horario.equipo_nombre}</p>
                        <div className="flex items-center gap-1 text-gray-700">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatHora(horario.hora_inicio)} - {formatHora(horario.hora_termino)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-700">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{horario.lugar}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-700">
                          <Users className="w-3 h-3" />
                          <span className="line-clamp-1">
                            {horario.entrenador_nombre ||
                              (horario.entrenador ? entrenadoresMap[String(horario.entrenador)] : '') ||
                              (horario.entrenador ? String(horario.entrenador) : 'Sin entrenador')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumen de horarios */}
      {horariosAtletas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fechasSemana.map((fechaDia, idx) => {
                const horariosDelDia = obtenerHorariosDelDia(fechaDia);
                if (horariosDelDia.length === 0) return null;

                const diaLabel = `${DIAS_SEMANA_COMPLETO[fechaDia.getDay()]} ${fechaDia.toLocaleDateString('es-CL', {
                  day: 'numeric',
                  month: 'short',
                })}`;
                return (
                  <div key={idx} className="border-l-4 pl-4 py-2" style={{ borderColor: horariosDelDia[0].color }}>
                    <p className="font-medium mb-2">{diaLabel}</p>
                    {horariosDelDia.map((horario) => (
                      <div key={horario.id} className="flex items-center justify-between text-sm mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{horario.equipo_nombre}</p>
                          <p className="text-gray-600">
                            {formatHora(horario.hora_inicio)} - {formatHora(horario.hora_termino)} · {horario.lugar}
                          </p>
                        </div>
                        <Badge variant="outline" style={{ backgroundColor: horario.color, borderColor: horario.color }}>
                          {horario.entrenador_nombre ||
                            (horario.entrenador ? entrenadoresMap[String(horario.entrenador)] : '') ||
                            (horario.entrenador ? String(horario.entrenador) : 'Sin entrenador')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {horariosAtletas.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{esAdmin ? 'No hay horarios programados' : 'No hay horarios programados para tus atletas'}</p>
            {!esAdmin && (
              <p className="text-sm mt-2">
                Los horarios aparecerán aquí una vez que sean asignados por el administrador
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
