import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { landingService } from '../api';
import { toast } from 'sonner@2.0.3';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const mediaBase = API_BASE_URL.replace(/\/api\/?$/, '');
const buildMediaUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${mediaBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export interface LandingStats {
  campeonatos: number;
  atletas: number;
  entrenadores: number;
  anos: number;
}

export interface Membresia {
  id: string | number;
  nombre: string;
  precio: number;
}

export interface ProximoEvento {
  id: string | number;
  fecha: string;
  nombre: string;
}

export interface CarouselImage {
  id: string | number;
  url: string;
  descripcion?: string;
  titulo?: string;
}

export interface LandingData {
  stats: LandingStats;
  membresias: Membresia[];
  proximosEventos: ProximoEvento[];
  carouselImages: CarouselImage[];
  horarios: {
    lunesViernes: string;
    sabado: string;
    domingo: string;
  };
  contacto: {
    email: string;
    telefono: string;
    direccion: string;
  };
}

interface LandingDataContextType {
  landingData: LandingData;
  isLoading: boolean;
  refreshLanding: () => Promise<void>;
  updateStats: (stats: LandingStats) => Promise<void>;
  updateMembresias: (membresias: Membresia[]) => Promise<void>;
  updateProximosEventos: (eventos: ProximoEvento[]) => Promise<void>;
  updateCarouselImages: (images: CarouselImage[]) => Promise<void>;
  addCarouselImage: (file: File, data: { descripcion?: string; titulo?: string; orden?: number }) => Promise<void>;
  updateCarouselImageMeta: (id: string | number, data: { descripcion?: string; titulo?: string; orden?: number; activa?: boolean }) => Promise<void>;
  deleteCarouselImage: (id: string | number) => Promise<void>;
  updateHorarios: (horarios: LandingData['horarios']) => Promise<void>;
  updateContacto: (contacto: LandingData['contacto']) => Promise<void>;
}

const LandingDataContext = createContext<LandingDataContextType | undefined>(undefined);

const defaultLandingData: LandingData = {
  stats: {
    campeonatos: 0,
    atletas: 0,
    entrenadores: 0,
    anos: 0,
  },
  membresias: [],
  proximosEventos: [],
  carouselImages: [],
  horarios: {
    lunesViernes: '',
    sabado: '',
    domingo: '',
  },
  contacto: {
    email: '',
    telefono: '',
    direccion: '',
  },
};

const mapApiToState = (data: any): LandingData => ({
  stats: {
    campeonatos: data?.total_competencias ?? 0,
    atletas: data?.total_atletas ?? 0,
    entrenadores: data?.total_entrenadores ?? 0,
    anos: data?.anos_experiencia ?? 0,
  },
  membresias: data?.membresias ?? [],
  proximosEventos: data?.proximos_eventos ?? [],
  carouselImages: (data?.carousel_imagenes ?? []).map((img: any, idx: number) => ({
    id: img.id ?? idx,
    url: buildMediaUrl(img.url || img.imagen),
    descripcion: img.descripcion,
    titulo: img.titulo,
  })),
  horarios: {
    lunesViernes: data?.horario_lunes_viernes ?? '',
    sabado: data?.horario_sabado ?? '',
    domingo: data?.horario_domingo ?? '',
  },
  contacto: {
    email: data?.email_contacto ?? '',
    telefono: data?.telefono_contacto ?? '',
    direccion: data?.direccion ?? '',
  },
});

export const LandingDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [landingData, setLandingData] = useState<LandingData>(defaultLandingData);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshLanding = async () => {
    setIsLoading(true);
    const [datosResp, carruselResp] = await Promise.all([
      landingService.obtenerDatosLanding(),
      landingService.obtenerCarrusel(),
    ]);

    if (datosResp.success) {
      let mapped = mapApiToState(datosResp.data);
      if (carruselResp.success) {
        mapped = {
          ...mapped,
          carouselImages: (carruselResp.data || []).map((item: any, idx: number) => ({
            id: item.id ?? idx,
            url: buildMediaUrl(item.imagen),
            descripcion: item.descripcion,
            titulo: item.titulo,
          })),
        };
      }
      setLandingData(mapped);
    } else {
      toast.error(datosResp.error?.message || 'No se pudieron cargar los datos de landing');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshLanding();
  }, []);

  const updateStats = async (stats: LandingStats) => {
    setLandingData((prev) => ({ ...prev, stats }));
    const resp = await landingService.actualizarDatosLanding({
      total_competencias: stats.campeonatos,
      total_atletas: stats.atletas,
      total_entrenadores: stats.entrenadores,
      anos_experiencia: stats.anos,
    });
    if (!resp.success) {
      toast.error(resp.error?.message || 'No se pudo guardar las estadísticas');
    }
  };

  const updateMembresias = async (membresias: Membresia[]) => {
    setLandingData((prev) => ({ ...prev, membresias }));
    const resp = await landingService.actualizarDatosLanding({ membresias });
    if (!resp.success) {
      toast.error(resp.error?.message || 'No se pudieron guardar las membresías');
    }
  };

  const updateProximosEventos = async (eventos: ProximoEvento[]) => {
    setLandingData((prev) => ({ ...prev, proximosEventos: eventos }));
    const resp = await landingService.actualizarDatosLanding({ proximos_eventos: eventos });
    if (!resp.success) {
      toast.error(resp.error?.message || 'No se pudieron guardar los eventos');
    }
  };

  const updateCarouselImages = async (images: CarouselImage[]) => {
    setLandingData((prev) => ({ ...prev, carouselImages: images }));
    const resp = await landingService.actualizarDatosLanding({ carousel_imagenes: images });
    if (!resp.success) {
      toast.error(resp.error?.message || 'No se pudieron guardar las imágenes');
    }
  };

  const addCarouselImage = async (file: File, data: { descripcion?: string; titulo?: string; orden?: number }) => {
    const resp = await landingService.crearFotoCarrusel(file, data);
    if (resp.success) {
      await refreshLanding();
    } else {
      toast.error(resp.error?.message || 'No se pudo subir la imagen');
    }
  };

  const updateCarouselImageMeta = async (
    id: string | number,
    data: { descripcion?: string; titulo?: string; orden?: number; activa?: boolean }
  ) => {
    const resp = await landingService.actualizarFotoCarrusel(id, data);
    if (resp.success) {
      await refreshLanding();
    } else {
      toast.error(resp.error?.message || 'No se pudo actualizar la imagen');
    }
  };

  const deleteCarouselImage = async (id: string | number) => {
    const resp = await landingService.eliminarFotoCarrusel(id);
    if (resp.success) {
      setLandingData((prev) => ({
        ...prev,
        carouselImages: prev.carouselImages.filter((img) => img.id !== id),
      }));
    } else {
      toast.error(resp.error?.message || 'No se pudo eliminar la imagen');
    }
  };

  const updateHorarios = async (horarios: LandingData['horarios']) => {
    setLandingData((prev) => ({ ...prev, horarios }));
    const resp = await landingService.actualizarDatosLanding({
      horario_lunes_viernes: horarios.lunesViernes,
      horario_sabado: horarios.sabado,
      horario_domingo: horarios.domingo,
    });
    if (!resp.success) {
      toast.error(resp.error?.message || 'No se pudieron guardar los horarios');
    }
  };

  const updateContacto = async (contacto: LandingData['contacto']) => {
    setLandingData((prev) => ({ ...prev, contacto }));
    const resp = await landingService.actualizarDatosLanding({
      email_contacto: contacto.email,
      telefono_contacto: contacto.telefono,
      direccion: contacto.direccion,
    });
    if (!resp.success) {
      toast.error(resp.error?.message || 'No se pudo guardar el contacto');
    }
  };

  return (
    <LandingDataContext.Provider
      value={{
        landingData,
        isLoading,
        refreshLanding,
        updateStats,
        updateMembresias,
        updateProximosEventos,
        updateCarouselImages,
        addCarouselImage,
        updateCarouselImageMeta,
        deleteCarouselImage,
        updateHorarios,
        updateContacto,
      }}
    >
      {children}
    </LandingDataContext.Provider>
  );
};

export const useLandingData = () => {
  const context = useContext(LandingDataContext);
  if (context === undefined) {
    throw new Error('useLandingData must be used within a LandingDataProvider');
  }
  return context;
};
