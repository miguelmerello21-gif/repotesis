import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  UserPlus,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Award,
  DollarSign,
  CheckCircle,
  XCircle,
  TrendingUp,
  Trophy,
  Star,
  Plus,
  Edit2,
  Save,
  X as CloseIcon,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { atletasService } from '../api';
import { Card } from './ui/card';

interface HistorialDeportivoItem {
  id: string;
  fecha: string;
  tipo: 'logro' | 'competencia' | 'evaluacion';
  titulo: string;
  descripcion: string;
  resultado?: string;
}

interface Atleta {
  id: string;
  nombreAtleta: string;
  rutAtleta: string;
  fechaNacimiento: string;
  categoria: string;
  nivel: string;
  telefono: string;
  direccion: string;
  emailApoderado: string;
  nombreApoderado: string;
  telefonoApoderado: string;
  fechaMatricula: string;
  costoMatricula: number;
  estadoPago: 'Pagado' | 'Pendiente';
  asistencia: number;
  historialPagos: Array<{
    fecha: string;
    monto: number;
    concepto: string;
  }>;
  historialDeportivo: HistorialDeportivoItem[];
  observaciones: string;
}

interface FichaAtletaProps {
  atleta: Atleta;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  canEdit: boolean;
}

export const FichaAtleta: React.FC<FichaAtletaProps> = ({
  atleta,
  isOpen,
  onClose,
  onUpdate,
  canEdit,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedAtleta, setEditedAtleta] = useState(atleta);
  const [showAddHistorial, setShowAddHistorial] = useState(false);
  const [nuevoHistorial, setNuevoHistorial] = useState({
    tipo: 'logro' as 'logro' | 'competencia' | 'evaluacion',
    titulo: '',
    descripcion: '',
    resultado: '',
  });

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'recreativo':
        return 'Recreativo';
      case 'novice':
        return 'Novice';
      case 'prep':
        return 'Prep';
      case 'elite':
        return 'Elite';
      default:
        return categoria;
    }
  };

  const handleSaveChanges = async () => {
    const payload: any = {
      telefono_contacto: editedAtleta.telefono,
      direccion: editedAtleta.direccion,
      nivel: editedAtleta.nivel,
      asistencia: editedAtleta.asistencia,
      notas: editedAtleta.observaciones,
      historial_deportivo: editedAtleta.historialDeportivo,
    };
    const resp = await atletasService.actualizarAtleta(Number(atleta.id), payload);
    if (resp.success) {
      toast.success('Datos actualizados correctamente');
      setEditMode(false);
      onUpdate();
    } else {
      toast.error(resp.error?.message || 'No se pudo guardar');
    }
  };

  const handleAddHistorial = async () => {
    if (!nuevoHistorial.titulo.trim() || !nuevoHistorial.descripcion.trim()) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    const newItem: HistorialDeportivoItem = {
      id: `hist-${Date.now()}`,
      fecha: new Date().toISOString(),
      tipo: nuevoHistorial.tipo,
      titulo: nuevoHistorial.titulo,
      descripcion: nuevoHistorial.descripcion,
      resultado: nuevoHistorial.resultado,
    };

    const updatedHistorial = [...editedAtleta.historialDeportivo, newItem];
    setEditedAtleta({ ...editedAtleta, historialDeportivo: updatedHistorial });

    const resp = await atletasService.actualizarAtleta(Number(atleta.id), {
      historial_deportivo: updatedHistorial,
    });
    if (resp.success) {
      setNuevoHistorial({ tipo: 'logro', titulo: '', descripcion: '', resultado: '' });
      setShowAddHistorial(false);
      toast.success('Registro agregado al historial');
      onUpdate();
    } else {
      toast.error(resp.error?.message || 'No se pudo guardar el historial');
    }
  };

  const handleDeleteHistorial = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      const updatedHistorial = editedAtleta.historialDeportivo.filter((h) => h.id !== id);
      setEditedAtleta({ ...editedAtleta, historialDeportivo: updatedHistorial });
      const resp = await atletasService.actualizarAtleta(Number(atleta.id), {
        historial_deportivo: updatedHistorial,
      });
      if (resp.success) {
        toast.success('Registro eliminado');
        onUpdate();
      } else {
        toast.error(resp.error?.message || 'No se pudo eliminar el registro');
      }
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'logro':
        return <Trophy className="w-5 h-5 text-yellow-600" />;
      case 'competencia':
        return <Award className="w-5 h-5 text-blue-600" />;
      case 'evaluacion':
        return <Star className="w-5 h-5 text-purple-600" />;
      default:
        return <Award className="w-5 h-5" />;
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'logro':
        return 'bg-yellow-100 text-yellow-800';
      case 'competencia':
        return 'bg-blue-100 text-blue-800';
      case 'evaluacion':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-yellow-600" />
            Ficha Digital del Atleta
          </DialogTitle>
          <DialogDescription>Ficha completa con información del atleta</DialogDescription>
        </DialogHeader>

        {canEdit && (
          <div className="absolute top-6 right-12 flex gap-2">
            {editMode ? (
              <>
                <Button size="sm" onClick={handleSaveChanges} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-1" />
                  Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                  <CloseIcon className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setEditMode(true)}
                className="bg-yellow-400 text-black hover:bg-yellow-500"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        )}

        <Tabs defaultValue="personal" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Datos Personales</TabsTrigger>
            <TabsTrigger value="deportivo">Historial Deportivo</TabsTrigger>
            <TabsTrigger value="administrativo">Administrativo</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <div>
              <h3 className="mb-4 pb-2 border-b flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-yellow-600" />
                Información Personal
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Nombre Completo</Label>
                  <p className="p-2 bg-gray-50 rounded mt-1">{editedAtleta.nombreAtleta}</p>
                </div>
                <div>
                  <Label className="text-gray-600">RUT</Label>
                  <p className="p-2 bg-gray-50 rounded mt-1">{editedAtleta.rutAtleta}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Fecha de Nacimiento</Label>
                  <p className="p-2 bg-gray-50 rounded mt-1">
                    {new Date(editedAtleta.fechaNacimiento).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Edad</Label>
                  <p className="p-2 bg-gray-50 rounded mt-1">{calculateAge(editedAtleta.fechaNacimiento)} años</p>
                </div>
                <div>
                  <Label className="text-gray-600">Categoría</Label>
                  <p className="p-2 bg-gray-50 rounded mt-1">{getCategoriaLabel(editedAtleta.categoria)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Nivel</Label>
                  {editMode ? (
                    <select
                      value={editedAtleta.nivel}
                      onChange={(e) => setEditedAtleta({ ...editedAtleta, nivel: e.target.value })}
                      className="w-full p-2 border rounded mt-1"
                    >
                      <option value="1">Nivel 1</option>
                      <option value="2">Nivel 2</option>
                      <option value="3">Nivel 3</option>
                      <option value="4">Nivel 4</option>
                      <option value="5">Nivel 5</option>
                      <option value="6">Nivel 6</option>
                      <option value="7">Nivel 7</option>
                    </select>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded mt-1">{editedAtleta.nivel}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 pb-2 border-b flex items-center gap-2">
                <Phone className="w-5 h-5 text-yellow-600" />
                Información de Contacto
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-gray-600">Teléfono</Label>
                  {editMode ? (
                    <Input
                      value={editedAtleta.telefono}
                      onChange={(e) => setEditedAtleta({ ...editedAtleta, telefono: e.target.value })}
                      placeholder="+56 9 1234 5678"
                      className="mt-1"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded mt-1">
                      {editedAtleta.telefono || 'No registrado'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-600">Dirección</Label>
                  {editMode ? (
                    <Input
                      value={editedAtleta.direccion}
                      onChange={(e) => setEditedAtleta({ ...editedAtleta, direccion: e.target.value })}
                      placeholder="Dirección completa"
                      className="mt-1"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded mt-1">
                      {editedAtleta.direccion || 'No registrada'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 pb-2 border-b flex items-center gap-2">
                <Mail className="w-5 h-5 text-yellow-600" />
                Datos del Apoderado
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Nombre</Label>
                  <p className="p-2 bg-gray-50 rounded mt-1">{editedAtleta.nombreApoderado}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="p-2 bg-gray-50 rounded mt-1">{editedAtleta.emailApoderado}</p>
                </div>
                {editedAtleta.telefonoApoderado && (
                  <div>
                    <Label className="text-gray-600">Teléfono</Label>
                    <p className="p-2 bg-gray-50 rounded mt-1">{editedAtleta.telefonoApoderado}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-gray-600">Observaciones</Label>
              {editMode ? (
                <Textarea
                  value={editedAtleta.observaciones}
                  onChange={(e) => setEditedAtleta({ ...editedAtleta, observaciones: e.target.value })}
                  placeholder="Observaciones adicionales..."
                  rows={4}
                  className="mt-1"
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded mt-1 min-h-[100px]">
                  {editedAtleta.observaciones || 'Sin observaciones'}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="deportivo" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Trayectoria Deportiva
              </h3>
              {canEdit && (
                <Button
                  onClick={() => setShowAddHistorial(true)}
                  size="sm"
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Registro
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-4 border-l-4 border-yellow-400">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Logros</span>
                </div>
                <div className="text-2xl">
                  {editedAtleta.historialDeportivo.filter((h) => h.tipo === 'logro').length}
                </div>
              </Card>
              <Card className="p-4 border-l-4 border-blue-400">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Competencias</span>
                </div>
                <div className="text-2xl">
                  {editedAtleta.historialDeportivo.filter((h) => h.tipo === 'competencia').length}
                </div>
              </Card>
              <Card className="p-4 border-l-4 border-purple-400">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Evaluaciones</span>
                </div>
                <div className="text-2xl">
                  {editedAtleta.historialDeportivo.filter((h) => h.tipo === 'evaluacion').length}
                </div>
              </Card>
            </div>

            {showAddHistorial && (
              <Card className="p-4 bg-yellow-50 border-2 border-yellow-200">
                <h4 className="mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Registro Deportivo
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label>Tipo de Registro</Label>
                    <select
                      value={nuevoHistorial.tipo}
                      onChange={(e) =>
                        setNuevoHistorial({ ...nuevoHistorial, tipo: e.target.value as any })
                      }
                      className="w-full p-2 border rounded mt-1"
                    >
                      <option value="logro">Logro</option>
                      <option value="competencia">Competencia</option>
                      <option value="evaluacion">Evaluación</option>
                    </select>
                  </div>
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={nuevoHistorial.titulo}
                      onChange={(e) =>
                        setNuevoHistorial({ ...nuevoHistorial, titulo: e.target.value })
                      }
                      placeholder="Ej: Campeonato Nacional 2024"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={nuevoHistorial.descripcion}
                      onChange={(e) =>
                        setNuevoHistorial({ ...nuevoHistorial, descripcion: e.target.value })
                      }
                      placeholder="Detalles del logro, competencia o evaluación..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Resultado (Opcional)</Label>
                    <Input
                      value={nuevoHistorial.resultado}
                      onChange={(e) =>
                        setNuevoHistorial({ ...nuevoHistorial, resultado: e.target.value })
                      }
                      placeholder="Ej: 1er Lugar, Medalla de Oro, 95/100"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddHistorial} className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-1" />
                      Guardar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddHistorial(false);
                        setNuevoHistorial({ tipo: 'logro', titulo: '', descripcion: '', resultado: '' });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {editedAtleta.historialDeportivo.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay registros deportivos aún</p>
                  <p className="text-sm mt-1">Agrega logros, competencias o evaluaciones</p>
                </Card>
              ) : (
                editedAtleta.historialDeportivo
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  .map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getTipoIcon(item.tipo)}
                            <div>
                              <h4 className="font-medium">{item.titulo}</h4>
                              <p className="text-xs text-gray-500">
                                {new Date(item.fecha).toLocaleDateString('es-CL', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <Badge className={getTipoBadgeColor(item.tipo)}>
                              {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{item.descripcion}</p>
                          {item.resultado && (
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                              <Star className="w-3 h-3" />
                              {item.resultado}
                            </div>
                          )}
                        </div>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteHistorial(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="administrativo" className="space-y-6">
            <div>
              <h3 className="mb-4 pb-2 border-b flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-600" />
                Información Administrativa
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Fecha de Matrícula</Label>
                  <p className="p-2 bg-gray-50 rounded mt-1">
                    {editedAtleta.fechaMatricula
                      ? new Date(editedAtleta.fechaMatricula).toLocaleDateString('es-CL')
                      : '—'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Costo Matrícula</Label>
                  <p className="p-2 bg-gray-50 rounded mt-1 text-green-600 font-medium">
                    ${editedAtleta.costoMatricula.toLocaleString('es-CL')}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Estado de Pago</Label>
                  <div className="mt-1">
                    <Badge
                      className={
                        editedAtleta.estadoPago === 'Pagado'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {editedAtleta.estadoPago === 'Pagado' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {editedAtleta.estadoPago}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Asistencia</Label>
                  {editMode ? (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editedAtleta.asistencia}
                      onChange={(e) =>
                        setEditedAtleta({
                          ...editedAtleta,
                          asistencia: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${editedAtleta.asistencia}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{editedAtleta.asistencia}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 pb-2 border-b">Historial de Pagos</h3>
              <div className="space-y-2">
                {editedAtleta.historialPagos.map((pago, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{pago.concepto}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(pago.fecha).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <p className="text-green-600 font-medium">${pago.monto.toLocaleString('es-CL')}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
