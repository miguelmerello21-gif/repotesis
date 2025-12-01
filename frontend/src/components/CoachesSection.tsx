import React from 'react';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

const coaches = [
  {
    id: 1,
    name: 'Carlos Martínez',
    specialty: 'Entrenador Principal',
    experience: '15 años de experiencia',
    certifications: 'UEFA Pro License',
    image: 'https://images.unsplash.com/photo-1540206063137-4a88ca974d1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb2FjaCUyMHRyYWluaW5nfGVufDF8fHx8MTc2MzM2NzAwN3ww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 2,
    name: 'María González',
    specialty: 'Preparadora Física',
    experience: '10 años de experiencia',
    certifications: 'Certificación NSCA-CPT',
    image: 'https://images.unsplash.com/photo-1761039807688-f5b154a8827a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMHNwb3J0cyUyMHRyYWluaW5nfGVufDF8fHx8MTc2MzQwNzI1OXww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 3,
    name: 'Roberto Silva',
    specialty: 'Entrenador Categorías Menores',
    experience: '12 años de experiencia',
    certifications: 'Licencia CONMEBOL B',
    image: 'https://images.unsplash.com/photo-1540206063137-4a88ca974d1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb2FjaCUyMHRyYWluaW5nfGVufDF8fHx8MTc2MzM2NzAwN3ww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 4,
    name: 'Ana Rodríguez',
    specialty: 'Nutricionista Deportiva',
    experience: '8 años de experiencia',
    certifications: 'Máster en Nutrición Deportiva',
    image: 'https://images.unsplash.com/photo-1761039807688-f5b154a8827a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMHNwb3J0cyUyMHRyYWluaW5nfGVufDF8fHx8MTc2MzQwNzI1OXww&ixlib=rb-4.1.0&q=80&w=1080'
  }
];

export const CoachesSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {coaches.map((coach) => (
        <Card key={coach.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="aspect-square overflow-hidden bg-gray-200">
            <ImageWithFallback
              src={coach.image}
              alt={coach.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="mb-1">{coach.name}</h3>
            <p className="text-blue-600 mb-2">{coach.specialty}</p>
            <p className="text-sm text-gray-600 mb-1">{coach.experience}</p>
            <p className="text-sm text-gray-500">{coach.certifications}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
