import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useLandingData, Membresia, ProximoEvento, CarouselImage, LandingStats } from '../contexts/LandingDataContext';
import { BarChart3, Image, Calendar, DollarSign, Clock, Phone, Plus, Trash2, Save, Edit } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export const GestionLanding: React.FC = () => {
  const {
    landingData,
    updateStats,
    updateMembresias,
    updateProximosEventos,
    updateCarouselImages,
    updateHorarios,
    updateContacto,
    refreshLanding,
    addCarouselImage,
    updateCarouselImageMeta,
    deleteCarouselImage,
  } = useLandingData();

  const [editingStats, setEditingStats] = useState(false);
  const [editingHorarios, setEditingHorarios] = useState(false);
  const [editingContacto, setEditingContacto] = useState(false);

  const [tempStats, setTempStats] = useState<LandingStats>(landingData.stats);
  const [tempMembresias, setTempMembresias] = useState<Membresia[]>(landingData.membresias);
  const [tempEventos, setTempEventos] = useState<ProximoEvento[]>(landingData.proximosEventos);
  const [tempImages, setTempImages] = useState<CarouselImage[]>(landingData.carouselImages);
  const [tempHorarios, setTempHorarios] = useState(landingData.horarios);
  const [tempContacto, setTempContacto] = useState(landingData.contacto);

  const [nuevaMembresia, setNuevaMembresia] = useState({ nombre: '', precio: 0 });
  const [nuevoEvento, setNuevoEvento] = useState({ fecha: '', nombre: '' });
  const [nuevaImagen, setNuevaImagen] = useState({ descripcion: '' });
  const [nuevaImagenFile, setNuevaImagenFile] = useState<File | null>(null);

  useEffect(() => {
    setTempStats(landingData.stats);
    setTempMembresias(landingData.membresias);
    setTempEventos(landingData.proximosEventos);
    setTempImages(landingData.carouselImages);
    setTempHorarios(landingData.horarios);
    setTempContacto(landingData.contacto);
  }, [landingData]);

  const handleSaveStats = async () => {
    await updateStats(tempStats);
    setEditingStats(false);
    toast.success('Estadisticas actualizadas');
  };

  const handleSaveHorarios = async () => {
    await updateHorarios(tempHorarios);
    setEditingHorarios(false);
    toast.success('Horarios actualizados');
  };

  const handleSaveContacto = async () => {
    await updateContacto(tempContacto);
    setEditingContacto(false);
    toast.success('Contacto actualizado');
  };

  const handleAddMembresia = async () => {
    if (!nuevaMembresia.nombre || nuevaMembresia.precio <= 0) {
      toast.error('Completa nombre y precio');
      return;
    }
    const newMembresia: Membresia = { id: Date.now().toString(), ...nuevaMembresia };
    const updated = [...tempMembresias, newMembresia];
    setTempMembresias(updated);
    await updateMembresias(updated);
    setNuevaMembresia({ nombre: '', precio: 0 });
    toast.success('Membresia agregada');
  };

  const handleDeleteMembresia = async (id: string | number) => {
    const updated = tempMembresias.filter((m) => m.id !== id);
    setTempMembresias(updated);
    await updateMembresias(updated);
    toast.success('Membresia eliminada');
  };

  const handleUpdateMembresia = async (id: string | number, field: 'nombre' | 'precio', value: string | number) => {
    const updated = tempMembresias.map((m) => (m.id === id ? { ...m, [field]: value } : m));
    setTempMembresias(updated);
    await updateMembresias(updated);
  };

  const handleAddEvento = async () => {
    if (!nuevoEvento.fecha || !nuevoEvento.nombre) {
      toast.error('Completa fecha y nombre');
      return;
    }
    const newEvento: ProximoEvento = { id: Date.now().toString(), ...nuevoEvento };
    const updated = [...tempEventos, newEvento];
    setTempEventos(updated);
    await updateProximosEventos(updated);
    setNuevoEvento({ fecha: '', nombre: '' });
    toast.success('Evento agregado');
  };

  const handleDeleteEvento = async (id: string | number) => {
    const updated = tempEventos.filter((e) => e.id !== id);
    setTempEventos(updated);
    await updateProximosEventos(updated);
    toast.success('Evento eliminado');
  };

  const handleUpdateEvento = async (id: string | number, field: 'fecha' | 'nombre', value: string) => {
    const updated = tempEventos.map((e) => (e.id === id ? { ...e, [field]: value } : e));
    setTempEventos(updated);
    await updateProximosEventos(updated);
  };

  const handleAddImage = async () => {
    if (!nuevaImagenFile) {
      toast.error('Selecciona una imagen');
      return;
    }
    await addCarouselImage(nuevaImagenFile, { descripcion: nuevaImagen.descripcion });
    setNuevaImagen({ descripcion: '' });
    setNuevaImagenFile(null);
  };

  const handleDeleteImage = async (id: string | number) => {
    await deleteCarouselImage(id);
  };

  const handleUpdateImage = async (id: string | number, value: string) => {
    setTempImages((prev) => prev.map((i) => (i.id === id ? { ...i, descripcion: value } : i)));
    await updateCarouselImageMeta(id, { descripcion: value });
  };

  const handleRefresh = async () => {
    await refreshLanding();
    toast.success('Datos sincronizados');
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-black via-gray-900 to-black text-white p-8 rounded-xl border-4 border-yellow-400">
        <div className="flex items-center gap-3 mb-3">
          <Edit className="w-8 h-8 text-yellow-400" />
          <h2 className="text-3xl font-black">Gestion de Landing Page</h2>
        </div>
        <p className="text-gray-300">Administra el contenido visible en la pagina publica</p>
        <div className="flex items-center gap-2 mt-4 text-yellow-400">
          <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-400" onClick={handleRefresh}>
            Recargar datos
          </Button>
        </div>
      </div>

      <Card className="p-6 border-2 border-yellow-400/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400 rounded-lg">
              <BarChart3 className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Estadisticas del Club</h3>
              <p className="text-sm text-gray-500">Lo que se muestra en la seccion de logros</p>
            </div>
          </div>
          <Button onClick={() => (editingStats ? handleSaveStats() : setEditingStats(true))} className="bg-yellow-400 text-black hover:bg-yellow-500">
            {editingStats ? (
              <>
                <Save className="w-4 h-4 mr-2" /> Guardar
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" /> Editar
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label>Campeonatos</Label>
            <Input
              type="number"
              value={tempStats.campeonatos}
              onChange={(e) => setTempStats({ ...tempStats, campeonatos: parseInt(e.target.value) || 0 })}
              disabled={!editingStats}
              className="mt-2 text-2xl font-bold text-center"
            />
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label>Atletas</Label>
            <Input
              type="number"
              value={tempStats.atletas}
              onChange={(e) => setTempStats({ ...tempStats, atletas: parseInt(e.target.value) || 0 })}
              disabled={!editingStats}
              className="mt-2 text-2xl font-bold text-center"
            />
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label>Entrenadores</Label>
            <Input
              type="number"
              value={tempStats.entrenadores}
              onChange={(e) => setTempStats({ ...tempStats, entrenadores: parseInt(e.target.value) || 0 })}
              disabled={!editingStats}
              className="mt-2 text-2xl font-bold text-center"
            />
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label>Anos de experiencia</Label>
            <Input
              type="number"
              value={tempStats.anos}
              onChange={(e) => setTempStats({ ...tempStats, anos: parseInt(e.target.value) || 0 })}
              disabled={!editingStats}
              className="mt-2 text-2xl font-bold text-center"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-2 border-yellow-400/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-yellow-400 rounded-lg">
            <DollarSign className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Membresias y precios</h3>
            <p className="text-sm text-gray-500">Planes visibles en el landing</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {tempMembresias.map((membresia) => (
            <div key={membresia.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Input value={membresia.nombre} onChange={(e) => handleUpdateMembresia(membresia.id, 'nombre', e.target.value)} placeholder="Nombre de la membresia" className="mb-2" />
              </div>
              <div className="w-40">
                <Input
                  type="number"
                  value={membresia.precio}
                  onChange={(e) => handleUpdateMembresia(membresia.id, 'precio', parseInt(e.target.value) || 0)}
                  placeholder="Precio"
                  className="text-right"
                />
              </div>
              <Badge className="bg-yellow-400 text-black">${membresia.precio.toLocaleString('es-CL')}</Badge>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteMembresia(membresia.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <Label className="mb-2 block">Agregar nueva membresia</Label>
          <div className="flex gap-4">
            <Input value={nuevaMembresia.nombre} onChange={(e) => setNuevaMembresia({ ...nuevaMembresia, nombre: e.target.value })} placeholder="Ej: Semestral" className="flex-1" />
            <Input
              type="number"
              value={nuevaMembresia.precio || ''}
              onChange={(e) => setNuevaMembresia({ ...nuevaMembresia, precio: parseInt(e.target.value) || 0 })}
              placeholder="Precio"
              className="w-40"
            />
            <Button onClick={handleAddMembresia} className="bg-yellow-400 text-black hover:bg-yellow-500">
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-2 border-yellow-400/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-yellow-400 rounded-lg">
            <Calendar className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Proximos eventos</h3>
            <p className="text-sm text-gray-500">Lo que se muestra en la seccion de eventos</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {tempEventos.map((evento) => (
            <div key={evento.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-32">
                <Input value={evento.fecha} onChange={(e) => handleUpdateEvento(evento.id, 'fecha', e.target.value)} placeholder="Fecha" />
              </div>
              <div className="flex-1">
                <Input value={evento.nombre} onChange={(e) => handleUpdateEvento(evento.id, 'nombre', e.target.value)} placeholder="Nombre del evento" />
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteEvento(evento.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <Label className="mb-2 block">Agregar nuevo evento</Label>
          <div className="flex gap-4">
            <Input value={nuevoEvento.fecha} onChange={(e) => setNuevoEvento({ ...nuevoEvento, fecha: e.target.value })} placeholder="Ej: 20-12-2024" className="w-32" />
            <Input value={nuevoEvento.nombre} onChange={(e) => setNuevoEvento({ ...nuevoEvento, nombre: e.target.value })} placeholder="Nombre del evento" className="flex-1" />
            <Button onClick={handleAddEvento} className="bg-yellow-400 text-black hover:bg-yellow-500">
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-2 border-yellow-400/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-yellow-400 rounded-lg">
            <Image className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Carrusel de imagenes</h3>
            <p className="text-sm text-gray-500">Imagenes que se muestran en el carrusel principal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {tempImages.map((imagen) => (
            <div key={imagen.id} className="border rounded-lg p-4 space-y-3">
              <img src={imagen.url} alt={imagen.descripcion} className="w-full h-48 object-cover rounded" />
              <Input
                value={imagen.descripcion || ''}
                onChange={(e) => setTempImages((prev) => prev.map((i) => (i.id === imagen.id ? { ...i, descripcion: e.target.value } : i)))}
                onBlur={(e) => handleUpdateImage(imagen.id, e.target.value)}
                placeholder="Descripcion"
              />
              <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDeleteImage(imagen.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar imagen
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <Label className="mb-2 block">Agregar nueva imagen</Label>
          <div className="space-y-3">
            <Input type="file" accept="image/*" onChange={(e) => setNuevaImagenFile(e.target.files?.[0] || null)} />
            <Input value={nuevaImagen.descripcion} onChange={(e) => setNuevaImagen({ ...nuevaImagen, descripcion: e.target.value })} placeholder="Descripcion de la imagen" />
            <Button onClick={handleAddImage} className="w-full bg-yellow-400 text-black hover:bg-yellow-500" disabled={!nuevaImagenFile}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar imagen
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-2 border-yellow-400/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400 rounded-lg">
              <Clock className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Horarios de atencion</h3>
              <p className="text-sm text-gray-500">Se muestra en landing y footer</p>
            </div>
          </div>
          <Button onClick={() => (editingHorarios ? handleSaveHorarios() : setEditingHorarios(true))} className="bg-yellow-400 text-black hover:bg-yellow-500">
            {editingHorarios ? (
              <>
                <Save className="w-4 h-4 mr-2" /> Guardar
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" /> Editar
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Lunes a viernes</Label>
            <Input
              value={tempHorarios.lunesViernes}
              onChange={(e) => setTempHorarios({ ...tempHorarios, lunesViernes: e.target.value })}
              disabled={!editingHorarios}
              placeholder="Ej: 16:00 - 21:00"
              className="mt-2"
            />
          </div>
          <div>
            <Label>Sabados</Label>
            <Input
              value={tempHorarios.sabado}
              onChange={(e) => setTempHorarios({ ...tempHorarios, sabado: e.target.value })}
              disabled={!editingHorarios}
              placeholder="Ej: 09:00 - 13:00"
              className="mt-2"
            />
          </div>
          <div>
            <Label>Domingos</Label>
            <Input
              value={tempHorarios.domingo}
              onChange={(e) => setTempHorarios({ ...tempHorarios, domingo: e.target.value })}
              disabled={!editingHorarios}
              placeholder="Ej: Cerrado"
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-2 border-yellow-400/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400 rounded-lg">
              <Phone className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Informacion de contacto</h3>
              <p className="text-sm text-gray-500">Visible en landing y footer</p>
            </div>
          </div>
          <Button onClick={() => (editingContacto ? handleSaveContacto() : setEditingContacto(true))} className="bg-yellow-400 text-black hover:bg-yellow-500">
            {editingContacto ? (
              <>
                <Save className="w-4 h-4 mr-2" /> Guardar
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" /> Editar
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={tempContacto.email}
              onChange={(e) => setTempContacto({ ...tempContacto, email: e.target.value })}
              disabled={!editingContacto}
              placeholder="contacto@club.cl"
              className="mt-2"
            />
          </div>
          <div>
            <Label>Telefono</Label>
            <Input
              value={tempContacto.telefono}
              onChange={(e) => setTempContacto({ ...tempContacto, telefono: e.target.value })}
              disabled={!editingContacto}
              placeholder="+56 9 1234 5678"
              className="mt-2"
            />
          </div>
          <div>
            <Label>Direccion</Label>
            <Input
              value={tempContacto.direccion}
              onChange={(e) => setTempContacto({ ...tempContacto, direccion: e.target.value })}
              disabled={!editingContacto}
              placeholder="Calle y ciudad"
              className="mt-2"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
