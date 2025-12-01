import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  ChevronLeft, 
  ChevronRight,
  Award,
  Users,
  Star
} from 'lucide-react';
import { Button } from './ui/button';

interface PerfilEntrenador {
  id: string;
  userId: string;
  nombre: string;
  email: string;
  telefono?: string;
  experienciaAnios: number;
  resena: string;
  especialidades: string[];
  equiposAsignados: string[];
  foto?: string;
}

export const CarruselEntrenadores: React.FC = () => {
  const [entrenadores, setEntrenadores] = useState<PerfilEntrenador[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [certificacionesCount, setCertificacionesCount] = useState<Record<string, number>>({});

  useEffect(() => {
    loadEntrenadores();
    loadCertificacionesCount();
  }, []);

  const loadEntrenadores = () => {
    const perfiles = JSON.parse(localStorage.getItem('perfilesEntrenadores') || '[]');
    // Solo mostrar entrenadores que tengan reseña y experiencia
    const entrenadoresActivos = perfiles.filter((p: PerfilEntrenador) => 
      p.resena && p.experienciaAnios > 0
    );
    setEntrenadores(entrenadoresActivos);
  };

  const loadCertificacionesCount = () => {
    const certificaciones = JSON.parse(localStorage.getItem('certificaciones') || '[]');
    const count: Record<string, number> = {};
    
    certificaciones.forEach((cert: any) => {
      if (cert.estado === 'validado') {
        count[cert.entrenadorId] = (count[cert.entrenadorId] || 0) + 1;
      }
    });
    
    setCertificacionesCount(count);
  };

  const getEquiposNombres = (equiposIds: string[]) => {
    const equipos = JSON.parse(localStorage.getItem('equipos') || '[]');
    return equipos
      .filter((e: any) => equiposIds.includes(e.id))
      .map((e: any) => e.nombre);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % entrenadores.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + entrenadores.length) % entrenadores.length);
  };

  useEffect(() => {
    if (entrenadores.length === 0) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Cambio automático cada 5 segundos
    
    return () => clearInterval(interval);
  }, [entrenadores.length]);

  if (entrenadores.length === 0) {
    return null;
  }

  const entrenador = entrenadores[currentIndex];
  const equiposNombres = getEquiposNombres(entrenador.equiposAsignados);

  return (
    <section className="py-16 bg-gradient-to-br from-yellow-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="mb-4 flex items-center justify-center gap-2">
            <Star className="w-8 h-8 text-yellow-400" />
            Nuestro Equipo de Entrenadores
          </h2>
          <p className="text-xl text-gray-600">
            🐝 Profesionales certificados dedicados a la excelencia de La Colmena
          </p>
        </div>

        <div className="relative">
          <Card className="overflow-hidden shadow-xl border-2 border-yellow-200">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Foto del entrenador */}
                <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-200 p-12 flex items-center justify-center">
                  {entrenador.foto ? (
                    <img 
                      src={entrenador.foto} 
                      alt={entrenador.nombre}
                      className="w-64 h-64 rounded-full object-cover border-8 border-white shadow-2xl"
                    />
                  ) : (
                    <div className="w-64 h-64 rounded-full bg-white flex items-center justify-center border-8 border-yellow-100 shadow-2xl">
                      <div className="text-center">
                        <div className="w-32 h-32 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Users className="w-16 h-16 text-yellow-600" />
                        </div>
                        <p className="text-xl font-bold text-gray-700">{entrenador.nombre.split(' ').map(n => n[0]).join('')}</p>
                      </div>
                    </div>
                  )}

                  {/* Insignia de experiencia */}
                  <div className="absolute top-8 right-8 bg-white rounded-full p-4 shadow-lg">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-yellow-600">{entrenador.experienciaAnios}</p>
                      <p className="text-xs text-gray-600">años</p>
                    </div>
                  </div>
                </div>

                {/* Información del entrenador */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="mb-6">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{entrenador.nombre}</h3>
                    <p className="text-lg text-yellow-600 font-semibold">Coach Profesional</p>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{entrenador.experienciaAnios}</p>
                      <p className="text-xs text-gray-600">Años</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{certificacionesCount[entrenador.userId] || 0}</p>
                      <p className="text-xs text-gray-600">Certificaciones</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{equiposNombres.length}</p>
                      <p className="text-xs text-gray-600">Equipos</p>
                    </div>
                  </div>

                  {/* Reseña */}
                  <div className="mb-6">
                    <p className="text-gray-700 italic line-clamp-4">
                      "{entrenador.resena}"
                    </p>
                  </div>

                  {/* Especialidades */}
                  {entrenador.especialidades.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm font-semibold text-gray-700">Especialidades:</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entrenador.especialidades.slice(0, 4).map((esp, index) => (
                          <Badge key={index} className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            {esp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Equipos */}
                  {equiposNombres.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-semibold text-gray-700">Entrena a:</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {equiposNombres.slice(0, 3).map((nombre, index) => (
                          <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                            {nombre}
                          </Badge>
                        ))}
                        {equiposNombres.length > 3 && (
                          <Badge variant="outline" className="text-gray-500">
                            +{equiposNombres.length - 3} más
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controles del carrusel */}
          {entrenadores.length > 1 && (
            <>
              <Button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-yellow-50 text-yellow-600 rounded-full w-12 h-12 p-0 shadow-lg"
                aria-label="Entrenador anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-yellow-50 text-yellow-600 rounded-full w-12 h-12 p-0 shadow-lg"
                aria-label="Siguiente entrenador"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              {/* Indicadores */}
              <div className="flex justify-center gap-2 mt-6">
                {entrenadores.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentIndex 
                        ? 'bg-yellow-400 w-8' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Ir a entrenador ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Contador de entrenadores */}
        {entrenadores.length > 1 && (
          <div className="text-center mt-4 text-sm text-gray-500">
            Entrenador {currentIndex + 1} de {entrenadores.length}
          </div>
        )}
      </div>
    </section>
  );
};
