import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { rankingService } from '../api';

interface PuntuacionAtleta {
  atletaId: string;
  atletaNombre: string;
  equipoNombre: string;
  puntuacionTotal: number;
  posicion: number;
}

interface ConfiguracionRanking {
  visibilidadPublica: boolean;
  mostrarPuntajes: boolean;
  topPublico: number;
}

export const RankingPublico: React.FC = () => {
  const [ranking, setRanking] = useState<PuntuacionAtleta[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionRanking>({
    visibilidadPublica: true,
    mostrarPuntajes: true,
    topPublico: 20,
  });

  useEffect(() => {
    const load = async () => {
      const savedConfig = localStorage.getItem('configuracionRanking');
      if (savedConfig) {
        const cfg = JSON.parse(savedConfig);
        setConfiguracion(cfg);
        if (!cfg.visibilidadPublica) return;
      }
      const resp = await rankingService.obtenerRanking();
      if (resp.success && Array.isArray(resp.data) && resp.data.length) {
        const normalizado = resp.data
          .sort((a: any, b: any) => (a.posicion ?? 9999) - (b.posicion ?? 9999))
          .map((r: any, idx: number) => ({
            atletaId: String(r.atleta),
            atletaNombre: r.atleta_nombre || `Atleta #${r.atleta}`,
            equipoNombre: r.equipo_nombre || 'Sin equipo',
            puntuacionTotal: Number(r.puntos_totales ?? 0),
            posicion: r.posicion ?? idx + 1,
          }));
        setRanking(normalizado);
      } else {
        setRanking([]);
      }
    };
    load();
  }, []);

  const obtenerMedalla = (posicion: number) => {
    if (posicion === 1) return { icon: '#1', color: 'text-yellow-400', bg: 'bg-yellow-50', border: 'border-yellow-300' };
    if (posicion === 2) return { icon: '#2', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-300' };
    if (posicion === 3) return { icon: '#3', color: 'text-orange-400', bg: 'bg-orange-50', border: 'border-orange-300' };
    return { icon: posicion.toString(), color: 'text-gray-600', bg: 'bg-white', border: 'border-gray-200' };
  };

  if (!configuracion.visibilidadPublica) return null;

  return (
    <section id="ranking" className="py-20 bg-gradient-to-b from-white to-yellow-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h2 className="text-4xl">Ranking de Desempeño</h2>
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Reconocemos el esfuerzo, dedicación y logros de nuestros atletas de La Colmena.
          </p>
          <p className="text-sm text-gray-500 mt-2">Actualizado el {new Date().toLocaleDateString('es-CL')}</p>
        </div>

        {ranking.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">El ranking estará disponible próximamente</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Top 3 simultáneo */}
            <div className="max-w-5xl mx-auto mb-10">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-900">Top 3 Ranking</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ranking.slice(0, 3).map((atleta, idx) => {
                  const medalla = obtenerMedalla(atleta.posicion);
                  return (
                    <Card
                      key={atleta.atletaId}
                      className={`border-2 ${medalla.border} ${medalla.bg} transition-all hover:shadow-lg`}
                    >
                      <CardContent className="p-6 text-center space-y-2">
                        <div className="text-4xl font-black">{medalla.icon}</div>
                        <div className="text-lg font-bold">{atleta.atletaNombre}</div>
                        <div className="text-sm text-gray-600">{atleta.equipoNombre || 'Sin equipo'}</div>
                        {configuracion.mostrarPuntajes && (
                          <div className="text-2xl font-bold text-yellow-600">
                            {atleta.puntuacionTotal.toFixed(1)} pts
                          </div>
                        )}
                        {idx === 0 && (
                          <Badge className="bg-yellow-400 text-black">
                            <Star className="w-3 h-3 mr-1" />
                            Mejor Desempeño
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Lista completa (resto top) */}
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-yellow-300">
                <Medal className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-lg">Top {Math.min(configuracion.topPublico, 10)} Atletas</h3>
              </div>

              {ranking.slice(3, 10).map((atleta) => {
                const medalla = obtenerMedalla(atleta.posicion);
                return (
                  <Card key={atleta.atletaId} className="border hover:shadow-md transition-all hover:border-yellow-300">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${medalla.bg} border-2 ${medalla.border} flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-lg font-bold ${medalla.color}`}>{atleta.posicion}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold truncate">{atleta.atletaNombre}</h3>
                          <p className="text-sm text-gray-600 truncate">{atleta.equipoNombre}</p>
                        </div>
                        {configuracion.mostrarPuntajes && (
                          <div className="text-right flex-shrink-0">
                            <div className="text-2xl font-bold text-yellow-600">{atleta.puntuacionTotal.toFixed(1)}</div>
                            <p className="text-xs text-gray-500">puntos</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-12 text-center p-6 bg-gradient-to-r from-yellow-100 via-white to-yellow-100 rounded-lg border-2 border-yellow-300 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <p className="font-bold text-gray-800">¡Sigue esforzándote para alcanzar la cima!</p>
              </div>
              <p className="text-sm text-gray-600">
                El ranking se actualiza continuamente basándose en asistencia, logros, evaluaciones y actitud.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
