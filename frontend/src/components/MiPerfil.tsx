import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';
import { PerfilEntrenador } from './PerfilEntrenador';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Save, 
  Edit2,
  Shield,
  UserCog,
  Users,
  X as CloseIcon,
  CreditCard as IdCard
} from 'lucide-react';

export const MiPerfil: React.FC = () => {
  const { user, updateUserProfile } = useAuth();

  // Si el usuario es entrenador, mostrar el perfil de entrenador
  if (user?.role === 'entrenador') {
    return <PerfilEntrenador />;
  }

  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    rut: user?.rut || '',
    direccion: user?.direccion || '',
    fechaNacimiento: user?.fechaNacimiento || '',
    ocupacion: user?.ocupacion || '',
    emergencyContact: user?.emergencyContact || '',
    emergencyPhone: user?.emergencyPhone || ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        rut: user.rut || '',
        direccion: user.direccion || '',
        fechaNacimiento: user.fechaNacimiento || '',
        ocupacion: user.ocupacion || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || ''
      });
    }
  }, [user]);

  const handleSaveChanges = () => {
    if (!profileData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const success = updateUserProfile(profileData);
    if (success) {
      toast.success('✅ Perfil actualizado correctamente');
      setEditMode(false);
    } else {
      toast.error('Error al actualizar el perfil');
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrador',
          icon: <Shield className="w-5 h-5" />,
          color: 'bg-red-100 text-red-800',
          description: 'Control total del sistema'
        };
      case 'entrenador':
        return {
          label: 'Entrenador',
          icon: <UserCog className="w-5 h-5" />,
          color: 'bg-purple-100 text-purple-800',
          description: 'Gestión de atletas y entrenamientos'
        };
      case 'apoderado':
        return {
          label: 'Apoderado',
          icon: <Users className="w-5 h-5" />,
          color: 'bg-blue-100 text-blue-800',
          description: 'Acceso a tienda exclusiva y datos de atletas'
        };
      case 'public':
        return {
          label: 'Público',
          icon: <User className="w-5 h-5" />,
          color: 'bg-gray-100 text-gray-800',
          description: 'Acceso básico al sistema'
        };
      default:
        return {
          label: role,
          icon: <User className="w-5 h-5" />,
          color: 'bg-gray-100 text-gray-800',
          description: ''
        };
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="mb-4">Acceso Restringido</h2>
        <p className="text-gray-600">Por favor inicia sesión para ver tu perfil</p>
      </div>
    );
  }

  const roleInfo = getRoleInfo(user.role);
  const age = calculateAge(profileData.fechaNacimiento);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 flex items-center gap-2">
            <User className="w-8 h-8 text-yellow-600" />
            Mi Perfil
          </h1>
          <p className="text-gray-600">
            🐝 Gestiona tu información personal en La Colmena
          </p>
        </div>
        {editMode ? (
          <div className="flex gap-2">
            <Button onClick={handleSaveChanges} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
            <Button variant="outline" onClick={() => {
              setEditMode(false);
              // Restaurar datos originales
              if (user) {
                setProfileData({
                  name: user.name || '',
                  email: user.email || '',
                  phone: user.phone || '',
                  rut: user.rut || '',
                  direccion: user.direccion || '',
                  fechaNacimiento: user.fechaNacimiento || '',
                  ocupacion: user.ocupacion || '',
                  emergencyContact: user.emergencyContact || '',
                  emergencyPhone: user.emergencyPhone || ''
                });
              }
            }}>
              <CloseIcon className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        ) : (
          <Button onClick={() => setEditMode(true)} className="bg-yellow-400 text-black hover:bg-yellow-500">
            <Edit2 className="w-4 h-4 mr-2" />
            Editar Perfil
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Información del Rol */}
        <Card className="border-l-4 border-yellow-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {roleInfo.icon}
              Tipo de Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge className={roleInfo.color + ' text-base px-3 py-1'}>
                  {roleInfo.label}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">{roleInfo.description}</p>
              </div>
              {user.role === 'public' && (
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">¿Quieres ser Apoderado?</p>
                  <p className="text-xs text-gray-500">Matricula un atleta para obtener acceso exclusivo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-yellow-600" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nombre Completo *
                </Label>
                {editMode ? (
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Juan Pérez González"
                    className="mt-1"
                    required
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded mt-1">{profileData.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="rut" className="flex items-center gap-2">
                  <IdCard className="w-4 h-4" />
                  RUT
                </Label>
                {editMode ? (
                  <Input
                    id="rut"
                    value={profileData.rut}
                    onChange={(e) => setProfileData({ ...profileData, rut: e.target.value })}
                    placeholder="12.345.678-9"
                    className="mt-1"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded mt-1">{profileData.rut || 'No registrado'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="fechaNacimiento" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha de Nacimiento
                </Label>
                {editMode ? (
                  <Input
                    id="fechaNacimiento"
                    type="date"
                    value={profileData.fechaNacimiento}
                    onChange={(e) => setProfileData({ ...profileData, fechaNacimiento: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded mt-1">
                    {profileData.fechaNacimiento 
                      ? `${new Date(profileData.fechaNacimiento).toLocaleDateString('es-CL')} (${age} años)` 
                      : 'No registrada'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="ocupacion">Ocupación</Label>
                {editMode ? (
                  <Input
                    id="ocupacion"
                    value={profileData.ocupacion}
                    onChange={(e) => setProfileData({ ...profileData, ocupacion: e.target.value })}
                    placeholder="Profesión u ocupación"
                    className="mt-1"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded mt-1">{profileData.ocupacion || 'No registrada'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-yellow-600" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </Label>
                <p className="p-2 bg-gray-100 rounded mt-1 text-gray-600">
                  {profileData.email}
                  <span className="text-xs ml-2">(No editable)</span>
                </p>
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </Label>
                {editMode ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+56 9 1234 5678"
                    className="mt-1"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded mt-1">{profileData.phone || 'No registrado'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="direccion" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Dirección
                </Label>
                {editMode ? (
                  <Input
                    id="direccion"
                    value={profileData.direccion}
                    onChange={(e) => setProfileData({ ...profileData, direccion: e.target.value })}
                    placeholder="Calle, número, comuna, región"
                    className="mt-1"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded mt-1">{profileData.direccion || 'No registrada'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacto de Emergencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-600" />
              Contacto de Emergencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContact">Nombre del Contacto</Label>
                {editMode ? (
                  <Input
                    id="emergencyContact"
                    value={profileData.emergencyContact}
                    onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                    placeholder="Nombre completo"
                    className="mt-1"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded mt-1">{profileData.emergencyContact || 'No registrado'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="emergencyPhone">Teléfono de Emergencia</Label>
                {editMode ? (
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={profileData.emergencyPhone}
                    onChange={(e) => setProfileData({ ...profileData, emergencyPhone: e.target.value })}
                    placeholder="+56 9 1234 5678"
                    className="mt-1"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded mt-1">{profileData.emergencyPhone || 'No registrado'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Cuenta */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-600" />
              Información de Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Usuario ID:</span>
                <span className="font-mono">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de registro:</span>
                <span>{new Date(user.createdAt).toLocaleDateString('es-CL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo de cuenta:</span>
                <Badge className={roleInfo.color}>
                  {roleInfo.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {user.role === 'apoderado' && (
          <Card className="bg-yellow-50 border-2 border-yellow-200">
            <CardContent className="p-4">
              <p className="text-sm">
                🐝 <strong>Cuenta de Apoderado:</strong> Tienes acceso a la tienda exclusiva y puedes gestionar
                la información de tus atletas desde la sección "Mis Atletas".
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};