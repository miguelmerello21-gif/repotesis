import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Info, Users, Trophy, Target } from 'lucide-react';
import { DIVISIONES, CATEGORIAS, NIVELES } from '../constants/cheerCategories';

export const InfoCategorias: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="flex items-center justify-center gap-2 mb-2">
          <Info className="w-6 h-6 text-yellow-400" />
          Sistema de Categorización Cheerleading
        </h2>
        <p className="text-gray-600">Reign All Stars - La Colmena 🐝</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Divisiones */}
        <Card className="border-t-4 border-yellow-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-yellow-600" />
              Divisiones por Edad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DIVISIONES.map((division) => (
                <div 
                  key={division.id}
                  className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-yellow-900">{division.nombre}</span>
                    <Badge variant="outline" className="bg-white text-xs">
                      {division.edadMin}-{division.edadMax === 100 ? '+' : division.edadMax} años
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{division.descripcion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categorías */}
        <Card className="border-t-4 border-blue-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-blue-600" />
              Categorías Competitivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CATEGORIAS.map((categoria) => (
                <div 
                  key={categoria.id}
                  className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200"
                >
                  <span className="font-medium text-blue-900 block mb-1">
                    {categoria.nombre}
                  </span>
                  <p className="text-sm text-gray-600">{categoria.descripcion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Niveles */}
        <Card className="border-t-4 border-purple-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-purple-600" />
              Niveles Técnicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {NIVELES.map((nivel) => (
                <div 
                  key={nivel.id}
                  className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-purple-900">{nivel.nombre}</span>
                    <Badge variant="outline" className="bg-white text-xs">
                      Nivel {nivel.id}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{nivel.descripcion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ejemplo de combinación */}
      <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-yellow-600" />
            Ejemplo de Nomenclatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-white rounded-lg border-2 border-yellow-200">
              <p className="text-sm text-gray-600 mb-2">Ejemplo 1:</p>
              <p className="text-lg">
                <span className="font-medium text-yellow-900">Junior Elite Nivel 5</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Atletas de 9-15 años, categoría élite competitivo, nivel avanzado
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border-2 border-yellow-200">
              <p className="text-sm text-gray-600 mb-2">Ejemplo 2:</p>
              <p className="text-lg">
                <span className="font-medium text-yellow-900">Youth Novice Nivel 2</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Atletas de 6-11 años, categoría principiante competitivo, nivel intermedio bajo
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border-2 border-yellow-200">
              <p className="text-sm text-gray-600 mb-2">Ejemplo 3:</p>
              <p className="text-lg">
                <span className="font-medium text-yellow-900">Senior Prep Nivel 4</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Atletas de 12-19 años, categoría preparatorio avanzado, nivel intermedio alto
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">
              <strong className="text-blue-900">Nota importante:</strong> La división se determina por la edad del atleta. 
              La categoría y el nivel se asignan según la experiencia y habilidades del equipo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
