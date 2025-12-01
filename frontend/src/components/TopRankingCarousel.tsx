import React, { useEffect, useState } from 'react';
import { Trophy, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { rankingService } from '../api';
import { Card, CardContent } from './ui/card';

interface RankingItem {
  id: number;
  atleta: number;
  atleta_nombre: string;
  equipo_nombre?: string;
  posicion: number;
  puntos_totales: number;
}

export const TopRankingCarousel: React.FC = () => {
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);

  const normalizar = (data: any[]) =>
    data
      .sort((a: any, b: any) => (a.posicion ?? 9999) - (b.posicion ?? 9999))
      .slice(0, 3)
      .map((r: any, idx: number) => ({
        id: r.id ?? r.atleta ?? r.atletaId ?? idx,
        atleta: r.atleta ?? r.atletaId ?? r.id ?? idx,
        atleta_nombre: r.atleta_nombre || r.atletaNombre || `Atleta #${r.atleta ?? r.id ?? idx}`,
        equipo_nombre: r.equipo_nombre || r.equipoNombre || 'Sin equipo',
        posicion: r.posicion ?? idx + 1,
        puntos_totales: Number(r.puntos_totales ?? r.puntuacionTotal ?? 0),
      }));

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Solo API (sin cache)
      const resp = await rankingService.obtenerRanking();
      if (resp.success && Array.isArray(resp.data) && resp.data.length) {
        const normalizadoApi = normalizar(resp.data);
        if (normalizadoApi.length) setItems(normalizadoApi);
      }

      setLoading(false);
    };
    load();
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % (items.length || 1));
  const prev = () => setCurrent((prev) => (prev - 1 + (items.length || 1)) % (items.length || 1));

  if (loading) {
    return (
      <div className="w-full flex justify-center py-10">
        <div className="text-gray-500 text-sm">Cargando ranking...</div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="w-full flex justify-center py-10">
        <div className="text-gray-500 text-sm">Aún no hay atletas en el ranking</div>
      </div>
    );
  }

  const item = items[current];
  const medallas = ['#1', '#2', '#3'];
  const medallaLabel = medallas[item.posicion - 1] || `#${item.posicion}`;
  const medallaColor =
    item.posicion === 1
      ? 'text-yellow-500'
      : item.posicion === 2
      ? 'text-gray-400'
      : item.posicion === 3
      ? 'text-orange-500'
      : 'text-gray-600';

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-900">Top 3 Ranking de Atletas</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="p-2 rounded-full border border-yellow-200 text-yellow-600 hover:bg-yellow-50 transition"
            aria-label="Anterior"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="p-2 rounded-full border border-yellow-200 text-yellow-600 hover:bg-yellow-50 transition"
            aria-label="Siguiente"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Card className="border-2 border-yellow-200 shadow-md bg-white">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex flex-col items-center">
            <div className={`text-4xl font-black ${medallaColor}`}>{medallaLabel}</div>
            <div className="text-sm text-gray-500">Posición</div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="text-lg font-bold text-gray-900">{item.atleta_nombre}</div>
            <div className="text-sm text-gray-600">{item.equipo_nombre || 'Sin equipo'}</div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-yellow-700">{Number(item.puntos_totales || 0).toFixed(1)} pts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-2 mt-4">
        {items.map((_, idx) => (
          <span
            key={idx}
            className={`h-2 w-2 rounded-full ${
              idx === current ? 'bg-yellow-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
