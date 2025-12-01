// Divisiones de Cheerleading
export const DIVISIONES = [
  { id: 'tiny', nombre: 'Tiny', edadMin: 0, edadMax: 6, descripcion: 'Hasta 6 años' },
  { id: 'mini', nombre: 'Mini', edadMin: 5, edadMax: 9, descripcion: '5 a 9 años' },
  { id: 'youth', nombre: 'Youth', edadMin: 6, edadMax: 11, descripcion: '6 a 11 años' },
  { id: 'junior', nombre: 'Junior', edadMin: 9, edadMax: 15, descripcion: '9 a 15 años' },
  { id: 'senior', nombre: 'Senior', edadMin: 12, edadMax: 19, descripcion: '12 a 19 años' },
  { id: 'open', nombre: 'Open', edadMin: 15, edadMax: 100, descripcion: '15 años en adelante' }
] as const;

// Categorías de Cheerleading
export const CATEGORIAS = [
  { id: 'recreativo', nombre: 'Recreativo', descripcion: 'Nivel recreativo y de iniciación' },
  { id: 'novice', nombre: 'Novice', descripcion: 'Nivel principiante competitivo' },
  { id: 'prep', nombre: 'Prep', descripcion: 'Nivel preparatorio avanzado' },
  { id: 'elite', nombre: 'Elite', descripcion: 'Nivel competitivo de élite' }
] as const;

// Niveles de Cheerleading
export const NIVELES = [
  { id: 1, nombre: 'Nivel 1', descripcion: 'Nivel básico' },
  { id: 2, nombre: 'Nivel 2', descripcion: 'Nivel intermedio bajo' },
  { id: 3, nombre: 'Nivel 3', descripcion: 'Nivel intermedio' },
  { id: 4, nombre: 'Nivel 4', descripcion: 'Nivel intermedio alto' },
  { id: 5, nombre: 'Nivel 5', descripcion: 'Nivel avanzado' },
  { id: 6, nombre: 'Nivel 6', descripcion: 'Nivel avanzado superior' },
  { id: 7, nombre: 'Nivel 7', descripcion: 'Nivel élite máximo' }
] as const;

export type Division = typeof DIVISIONES[number]['id'];
export type Categoria = typeof CATEGORIAS[number]['id'];
export type Nivel = typeof NIVELES[number]['id'];

// Función helper para obtener la división según la edad
export const getDivisionPorEdad = (edad: number): typeof DIVISIONES[number] | undefined => {
  return DIVISIONES.find(d => edad >= d.edadMin && edad <= d.edadMax);
};

// Función helper para formatear la combinación completa
export const formatearEquipo = (division: string, categoria: string, nivel: number): string => {
  const div = DIVISIONES.find(d => d.id === division);
  const cat = CATEGORIAS.find(c => c.id === categoria);
  return `${div?.nombre || division} ${cat?.nombre || categoria} Nivel ${nivel}`;
};
