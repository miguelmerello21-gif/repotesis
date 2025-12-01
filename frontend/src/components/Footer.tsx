import React from 'react';
import { Phone, Mail, MapPin, Instagram, Facebook, Twitter, Clock } from 'lucide-react';
import logo from 'figma:asset/6154c1dfd89bd336b0d8443ab9908761d0d02132.png';

export const Footer: React.FC = () => {
  return (
    <footer id="contacto" className="bg-gradient-to-b from-black via-gray-900 to-black text-white border-t-4 border-yellow-400">
      {/* Patrón de hexágonos decorativos */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-4 text-6xl text-yellow-400">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="text-center">⬡</div>
            ))}
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Sección Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Columna 1: Logo y Descripción */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={logo} alt="Reign All Stars" className="h-16 w-16" />
                  <div className="absolute -inset-2 bg-yellow-400/20 rounded-full blur-lg"></div>
                </div>
                <div>
                  <h3 className="font-bold text-xl">Reign All Stars</h3>
                  <p className="text-yellow-400 text-sm">🐝 La Colmena 🐝</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Club de cheerleading fundado en 2016, dedicado a formar campeones y construir una familia deportiva sólida.
              </p>
              <div className="flex items-center gap-2 text-yellow-400">
                <div className="text-2xl">⬡</div>
                <span className="text-sm font-bold">Desde 2016</span>
                <div className="text-2xl">⬡</div>
              </div>
            </div>

            {/* Columna 2: Contacto */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-yellow-400 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contacto
              </h3>
              <div className="space-y-3 text-sm">
                <a 
                  href="tel:+56912345678" 
                  className="flex items-start gap-3 text-gray-300 hover:text-yellow-400 transition-colors group"
                >
                  <Phone className="w-4 h-4 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <p>+56 9 1234 5678</p>
                  </div>
                </a>
                
                <a 
                  href="mailto:contacto@reignallstars.cl" 
                  className="flex items-start gap-3 text-gray-300 hover:text-yellow-400 transition-colors group"
                >
                  <Mail className="w-4 h-4 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p>contacto@reignallstars.cl</p>
                  </div>
                </a>
                
                <div className="flex items-start gap-3 text-gray-300">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-yellow-400" />
                  <div>
                    <p className="font-medium">Dirección</p>
                    <p>Gimnasio La Colmena</p>
                    <p className="text-xs text-gray-500">Santiago, Chile</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna 3: Horarios */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-yellow-400 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Horarios
              </h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span>Lunes - Viernes</span>
                  <span className="text-yellow-400 font-medium">16:00 - 21:00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span>Sábados</span>
                  <span className="text-yellow-400 font-medium">09:00 - 13:00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span>Domingos</span>
                  <span className="text-gray-500">Cerrado</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                <p className="text-xs text-yellow-400">
                  💡 Horarios sujetos a cambios por eventos y competencias
                </p>
              </div>
            </div>

            {/* Columna 4: Redes Sociales */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-yellow-400">Síguenos</h3>
              <div className="space-y-3">
                <a 
                  href="https://www.instagram.com/reign_all_stars/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-yellow-400 transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium">@reign_all_stars</span>
                </a>

                <a 
                  href="https://www.facebook.com/REIGN.allstar/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-yellow-400 transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Facebook className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium">Reign All Stars</span>
                </a>

                <a 
                  href="https://twitter.com/reignallstars" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-yellow-400 transition-all group"
                >
                  <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Twitter className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium">@reignallstars</span>
                </a>
              </div>

              {/* Decoración de abejas */}
              <div className="mt-6 flex items-center justify-center gap-2 text-3xl animate-pulse">
                <span>🐝</span>
                <span className="text-yellow-400">⬡</span>
                <span>🐝</span>
              </div>
            </div>
          </div>

          {/* Sección de Hexágonos Informativos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-yellow-400/10 to-transparent border border-yellow-400/30 rounded-lg p-4 text-center hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">⬡</div>
              <div className="text-2xl font-bold text-yellow-400">+200</div>
              <div className="text-xs text-gray-400">Atletas Activos</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-400/10 to-transparent border border-yellow-400/30 rounded-lg p-4 text-center hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">⬡</div>
              <div className="text-2xl font-bold text-yellow-400">8</div>
              <div className="text-xs text-gray-400">Años de Historia</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-400/10 to-transparent border border-yellow-400/30 rounded-lg p-4 text-center hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">⬡</div>
              <div className="text-2xl font-bold text-yellow-400">15+</div>
              <div className="text-xs text-gray-400">Entrenadores</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-400/10 to-transparent border border-yellow-400/30 rounded-lg p-4 text-center hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">⬡</div>
              <div className="text-2xl font-bold text-yellow-400">50+</div>
              <div className="text-xs text-gray-400">Competencias</div>
            </div>
          </div>

          {/* Sección Inferior */}
          <div className="border-t border-yellow-400/30 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-400">
                  © 2016-2024 Reign All Stars. Todos los derechos reservados.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  🐝 Construyendo campeones, forjando familia 🐝
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="text-yellow-400">⬡</span>
                <a href="#" className="hover:text-yellow-400 transition-colors">Términos y Condiciones</a>
                <span className="text-yellow-400">⬡</span>
                <a href="#" className="hover:text-yellow-400 transition-colors">Política de Privacidad</a>
                <span className="text-yellow-400">⬡</span>
              </div>
            </div>
          </div>

          {/* Decoración final de abejas */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-2xl">
              <span className="animate-bounce" style={{ animationDelay: '0s' }}>🐝</span>
              <span className="text-yellow-400">⬡⬡⬡</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🐝</span>
              <span className="text-yellow-400">⬡⬡⬡</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🐝</span>
            </div>
            <p className="text-xs text-yellow-400 mt-2 font-medium">
              LA COLMENA - DONDE LOS CAMPEONES SE FORMAN
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
