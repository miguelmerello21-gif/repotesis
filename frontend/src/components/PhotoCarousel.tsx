import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { useLandingData } from '../contexts/LandingDataContext';
import photo1 from 'figma:asset/8806e4adb9671cf0c546faa49941dff2d1c51a00.png';
import photo2 from 'figma:asset/5f68bbec7cfd53bdf66cd14ab254987ead77a45c.png';

const defaultPhotos = [
  {
    id: 1,
    url: photo1,
    title: 'Nuestro Equipo en Competencia'
  },
  {
    id: 2,
    url: photo2,
    title: 'Excelencia en Cada Presentación'
  },
  {
    id: 3,
    url: photo1,
    title: 'La Colmena en Acción'
  },
  {
    id: 4,
    url: photo2,
    title: 'Reign All Stars'
  }
];

export const PhotoCarousel: React.FC = () => {
  const { landingData } = useLandingData();
  const photos = useMemo(() => {
    const fromApi = (landingData.carouselImages || []).map((img, idx) => ({
      id: img.id || idx,
      url: img.url,
      title: img.descripcion || img.titulo || 'Reign All Stars',
    }));
    return fromApi.length > 0 ? fromApi : defaultPhotos;
  }, [landingData.carouselImages]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      next();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex, photos.length]);

  useEffect(() => {
    // Reset index when the list of photos changes
    setCurrentIndex(0);
  }, [photos.length]);

  const next = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <div className="relative h-96 overflow-hidden rounded-lg bg-gray-200">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0"
          >
            <ImageWithFallback
              src={photos[currentIndex].url}
              alt={photos[currentIndex].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <p className="text-white text-xl">{photos[currentIndex].title}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="icon"
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-yellow-400 w-8'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
