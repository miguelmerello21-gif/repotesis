import React, { useState } from 'react';
import { CoachesSection } from './CoachesSection';
import { PhotoCarousel } from './PhotoCarousel';
import { CarruselEntrenadores } from './CarruselEntrenadores';
import { AuthModal } from './AuthModal';
import { RankingPublico } from './RankingPublico';
import { Trophy, Users, Star, Calendar, Clock, MapPin, Phone, Mail, Award, Target, Heart, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { useLandingData } from '../contexts/LandingDataContext';
import logo from 'figma:asset/6154c1dfd89bd336b0d8443ab9908761d0d02132.png';

export const LandingPage: React.FC = () => {
  const { landingData } = useLandingData();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const scrollToContact = () => {
    const footer = document.getElementById('contacto');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Mejorado */}
      <section className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white py-24 border-b-4 border-yellow-400 overflow-hidden">
        {/* Patrón de hexágonos de fondo */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-4 text-6xl text-yellow-400">
            {[...Array(48)].map((_, i) => (
              <div key={i} className="text-center">⬡</div>
            ))}
          </div>
        </div>
        
        {/* Efectos de luz */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Logo con efecto especial */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="h-40 w-40 bg-yellow-400/20 rounded-full blur-2xl"></div>
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                  <div className="text-8xl animate-bounce" style={{ animationDelay: '0.5s' }}>👑</div>
                </div>
              </div>
            </div>
            
            {/* Título principal */}
            <h1 className="mb-6 text-white text-5xl md:text-6xl lg:text-7xl">
              Bienvenido a <span className="text-yellow-400 font-black">Reign All Stars</span>
            </h1>
            
            {/* Subtítulo con abejas */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-3xl animate-bounce" style={{ animationDelay: '0s' }}>🐝</span>
              <p className="text-2xl md:text-3xl text-yellow-400 font-bold">
                La Colmena más poderosa del cheerleading
              </p>
              <span className="text-3xl animate-bounce" style={{ animationDelay: '0.3s' }}>🐝</span>
            </div>
            
            {/* Descripción */}
            <p className="text-xl mb-4 max-w-3xl mx-auto text-gray-300">
              Formando atletas de élite con dedicación, trabajo en equipo y excelencia
            </p>
            
            {/* Badge de año */}
            <div className="inline-flex items-center gap-2 bg-yellow-400/20 border-2 border-yellow-400 rounded-full px-6 py-2 mb-8">
              <span className="text-yellow-400 text-2xl">⬡</span>
              <span className="text-yellow-400 font-black text-xl">DESDE 2016</span>
              <span className="text-yellow-400 text-2xl">⬡</span>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button 
                size="lg" 
                className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold text-lg px-8 py-6 shadow-lg shadow-yellow-400/50 hover:scale-105 transition-all duration-300"
                onClick={() => setShowAuthModal(true)}
              >
                🐝 Únete a la Colmena
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={scrollToContact}
                className="bg-transparent text-yellow-400 border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black font-bold text-lg px-8 py-6 hover:scale-105 transition-all duration-300"
              >
                Contáctanos
              </Button>
            </div>
            
            {/* Hexágonos decorativos inferiores */}
            <div className="flex items-center justify-center gap-2 text-yellow-400 text-3xl">
              <span>⬡</span>
              <span>⬡</span>
              <span>⬡</span>
              <span>⬡</span>
              <span>⬡</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Mejorado con hexágonos */}
      <section className="py-16 bg-gradient-to-b from-white to-yellow-50/30 border-b-4 border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-3">Nuestros Logros</h2>
            <div className="flex items-center justify-center gap-2 text-yellow-400 text-2xl">
              <span>🐝</span>
              <span>⬡⬡⬡</span>
              <span>🐝</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="group relative bg-gradient-to-br from-white to-yellow-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-yellow-400/20 hover:border-yellow-400">
              <div className="absolute -top-4 -right-4 text-6xl text-yellow-400/20 group-hover:text-yellow-400/40 transition-all">⬡</div>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-yellow-400 rounded-full">
                  <Trophy className="w-10 h-10 text-black" />
                </div>
              </div>
              <div className="text-5xl font-black mb-2 text-gray-900 group-hover:text-yellow-600 transition-colors">{landingData.stats.campeonatos}+</div>
              <p className="text-gray-600 font-medium">Campeonatos Ganados</p>
              <div className="mt-3 text-yellow-400 text-xs font-bold">🏆 Campeones</div>
            </div>

            {/* Card 2 */}
            <div className="group relative bg-gradient-to-br from-white to-yellow-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-yellow-400/20 hover:border-yellow-400">
              <div className="absolute -top-4 -right-4 text-6xl text-yellow-400/20 group-hover:text-yellow-400/40 transition-all">⬡</div>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-yellow-400 rounded-full">
                  <Users className="w-10 h-10 text-black" />
                </div>
              </div>
              <div className="text-5xl font-black mb-2 text-gray-900 group-hover:text-yellow-600 transition-colors">{landingData.stats.atletas}+</div>
              <p className="text-gray-600 font-medium">Atletas en La Colmena</p>
              <div className="mt-3 text-yellow-400 text-xs font-bold">🐝 Familia Unida</div>
            </div>

            {/* Card 3 */}
            <div className="group relative bg-gradient-to-br from-white to-yellow-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-yellow-400/20 hover:border-yellow-400">
              <div className="absolute -top-4 -right-4 text-6xl text-yellow-400/20 group-hover:text-yellow-400/40 transition-all">⬡</div>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-yellow-400 rounded-full">
                  <Star className="w-10 h-10 text-black" />
                </div>
              </div>
              <div className="text-5xl font-black mb-2 text-gray-900 group-hover:text-yellow-600 transition-colors">{landingData.stats.entrenadores}+</div>
              <p className="text-gray-600 font-medium">Entrenadores Certificados</p>
              <div className="mt-3 text-yellow-400 text-xs font-bold">⭐ Élite</div>
            </div>

            {/* Card 4 */}
            <div className="group relative bg-gradient-to-br from-white to-yellow-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-yellow-400/20 hover:border-yellow-400">
              <div className="absolute -top-4 -right-4 text-6xl text-yellow-400/20 group-hover:text-yellow-400/40 transition-all">⬡</div>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-yellow-400 rounded-full">
                  <Calendar className="w-10 h-10 text-black" />
                </div>
              </div>
              <div className="text-5xl font-black mb-2 text-gray-900 group-hover:text-yellow-600 transition-colors">{landingData.stats.anos}</div>
              <p className="text-gray-600 font-medium">Años de Experiencia</p>
              <div className="mt-3 text-yellow-400 text-xs font-bold">📅 Desde 2016</div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Carousel - Mejorado */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        {/* Hexágonos decorativos de fondo */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-4 text-6xl text-yellow-400">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="text-center">⬡</div>
            ))}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="text-3xl">🐝</span>
              <h2 className="text-4xl font-black text-gray-900">Nuestra Colmena en Acción</h2>
              <span className="text-3xl">🐝</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-yellow-400 text-2xl">
              <span>⬡⬡⬡</span>
            </div>
          </div>
          
          <div className="relative">
            <PhotoCarousel />
            {/* Bordes decorativos */}
            <div className="absolute -top-4 -left-4 text-6xl text-yellow-400/30">⬡</div>
            <div className="absolute -top-4 -right-4 text-6xl text-yellow-400/30">⬡</div>
            <div className="absolute -bottom-4 -left-4 text-6xl text-yellow-400/30">⬡</div>
            <div className="absolute -bottom-4 -right-4 text-6xl text-yellow-400/30">⬡</div>
          </div>
        </div>
      </section>

      {/* Carrusel de Entrenadores - Manteniendo funcionalidad */}
      <section className="relative bg-gradient-to-b from-white to-yellow-50/30">
        <CarruselEntrenadores />
      </section>

      {/* Ranking completo (misma vista pública) */}
      <section className="relative">
        <RankingPublico />
      </section>

      {/* Valores Section - Nueva */}
      <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-4 text-6xl text-yellow-400">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="text-center">⬡</div>
            ))}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-yellow-400 mb-4">🐝 Somos La Colmena 🐝</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-2">
              En Reign All Stars, trabajamos como una verdadera colmena: unidos, organizados y con un objetivo común.
            </p>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Nuestro gimnasio está decorado con panales de abeja que nos recuerdan la importancia del trabajo en equipo y la dedicación.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Valor 1 */}
            <div className="group bg-gradient-to-br from-yellow-400/10 to-transparent border-2 border-yellow-400/30 rounded-xl p-8 text-center hover:border-yellow-400 hover:scale-105 transition-all duration-300">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🏆</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Excelencia</h3>
              <p className="text-gray-400 text-sm">Buscamos la perfección en cada movimiento</p>
              <div className="mt-4 text-yellow-400 text-2xl">⬡</div>
            </div>

            {/* Valor 2 */}
            <div className="group bg-gradient-to-br from-yellow-400/10 to-transparent border-2 border-yellow-400/30 rounded-xl p-8 text-center hover:border-yellow-400 hover:scale-105 transition-all duration-300">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🤝</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Trabajo en Equipo</h3>
              <p className="text-gray-400 text-sm">Unidos somos más fuertes</p>
              <div className="mt-4 text-yellow-400 text-2xl">⬡</div>
            </div>

            {/* Valor 3 */}
            <div className="group bg-gradient-to-br from-yellow-400/10 to-transparent border-2 border-yellow-400/30 rounded-xl p-8 text-center hover:border-yellow-400 hover:scale-105 transition-all duration-300">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">💪</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Dedicación</h3>
              <p className="text-gray-400 text-sm">Compromiso total con nuestros objetivos</p>
              <div className="mt-4 text-yellow-400 text-2xl">⬡</div>
            </div>

            {/* Valor 4 */}
            <div className="group bg-gradient-to-br from-yellow-400/10 to-transparent border-2 border-yellow-400/30 rounded-xl p-8 text-center hover:border-yellow-400 hover:scale-105 transition-all duration-300">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">👑</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Liderazgo</h3>
              <p className="text-gray-400 text-sm">Formamos líderes dentro y fuera del gimnasio</p>
              <div className="mt-4 text-yellow-400 text-2xl">⬡</div>
            </div>
          </div>

          {/* Decoración de abejas */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 text-3xl">
              <span className="animate-bounce" style={{ animationDelay: '0s' }}>🐝</span>
              <span className="text-yellow-400">⬡⬡⬡</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🐝</span>
              <span className="text-yellow-400">⬡⬡⬡</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🐝</span>
            </div>
          </div>
        </div>
      </section>

      {/* Important Info Section - Mejorado */}
      <section className="py-20 bg-gradient-to-b from-yellow-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Información Importante</h2>
            <div className="flex items-center justify-center gap-2 text-yellow-400 text-2xl">
              <span>🐝</span>
              <span>⬡⬡⬡</span>
              <span>🐝</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card Horarios */}
            <div className="group bg-gradient-to-br from-white to-yellow-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-yellow-400 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-400 rounded-lg">
                  <Clock className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Horarios de Entrenamiento</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-yellow-400">⬡</span>
                  <span>Lunes a Viernes: {landingData.horarios.lunesViernes}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-400">⬡</span>
                  <span>Sábados: {landingData.horarios.sabado}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-400">⬡</span>
                  <span>Domingos: {landingData.horarios.domingo}</span>
                </li>
              </ul>
            </div>

            {/* Card Categorías */}
            <div className="group bg-gradient-to-br from-white to-yellow-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-yellow-400 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-400 rounded-lg">
                  <Users className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Categorías</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <span>🐝</span>
                  <span>Tiny (hasta 6 años)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>🐝</span>
                  <span>Mini (5-9 años)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>🐝</span>
                  <span>Youth (6-11 años)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>🐝</span>
                  <span>Junior (9-15 años)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>🐝</span>
                  <span>Senior (12-19 años)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>🐝</span>
                  <span>Open (15+ años)</span>
                </li>
              </ul>
            </div>

            {/* Card Próximos Eventos */}
            <div className="group bg-gradient-to-br from-white to-yellow-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-yellow-400 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-400 rounded-lg">
                  <Calendar className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Próximos Eventos</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                {landingData.proximosEventos.map((evento) => (
                  <li key={evento.id} className="flex items-center gap-2">
                    <span className="text-yellow-400">📅</span>
                    <span>{evento.fecha} - {evento.nombre}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card Contacto */}
            <div className="group bg-gradient-to-br from-white to-yellow-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-yellow-400 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-400 rounded-lg">
                  <Phone className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Contacto</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-yellow-400" />
                  <span>{landingData.contacto.email}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-yellow-400" />
                  <span>{landingData.contacto.telefono}</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-yellow-400" />
                  <span>{landingData.contacto.direccion}</span>
                </li>
              </ul>
            </div>

            {/* Card Membresías */}
            <div className="group bg-gradient-to-br from-white to-yellow-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-yellow-400 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-400 rounded-lg">
                  <Award className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Membresías</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                {landingData.membresias.map((membresia) => (
                  <li key={membresia.id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-yellow-400">💰</span>
                      {membresia.nombre}
                    </span>
                    <span className="font-bold text-yellow-600">${membresia.precio.toLocaleString('es-CL')}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card Beneficios */}
            <div className="group bg-gradient-to-br from-white to-yellow-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-yellow-400 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-400 rounded-lg">
                  <Target className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Beneficios</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Acceso al gimnasio La Colmena</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Tienda exclusiva para miembros</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Descuentos en competencias</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Final */}
      <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-4 text-6xl text-yellow-400">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="text-center">⬡</div>
            ))}
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="text-6xl mb-6">
            <span className="animate-bounce inline-block" style={{ animationDelay: '0s' }}>🐝</span>
            <span className="animate-bounce inline-block" style={{ animationDelay: '0.1s' }}>👑</span>
            <span className="animate-bounce inline-block" style={{ animationDelay: '0.2s' }}>🐝</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-yellow-400 mb-6">
            ¿Listo para unirte a La Colmena?
          </h2>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Forma parte de la familia Reign All Stars y descubre tu verdadero potencial. ¡Somos más que un equipo, somos una colmena!
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button 
              size="lg" 
              className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold text-lg px-10 py-6 shadow-lg shadow-yellow-400/50 hover:scale-110 transition-all duration-300"
              onClick={() => setShowAuthModal(true)}
            >
              🐝 Matricúlate Ahora
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={scrollToContact}
              className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-bold text-lg px-10 py-6 hover:scale-110 transition-all duration-300"
            >
              Más Información
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-yellow-400 text-3xl">
            <span>⬡</span>
            <span>⬡</span>
            <span>⬡</span>
            <span>⬡</span>
            <span>⬡</span>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} mode="register" />
    </div>
  );
};
