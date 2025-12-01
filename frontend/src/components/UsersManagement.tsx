import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  Users, 
  Search, 
  UserCog, 
  Shield,
  Trash2,
  Calendar,
  Mail,
  Phone,
  Edit2,
  Download
} from 'lucide-react';
import { useAuth, type User, type UserRole } from '../contexts/AuthContext';
import { usuariosService } from '../api';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export const UsersManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<User>>({});
  const [filtroRole, setFiltroRole] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const resp = await usuariosService.listarUsuarios();
    if (resp.success && Array.isArray(resp.data)) {
      setUsers(resp.data as User[]);
    } else {
      toast.error('No se pudieron cargar los usuarios');
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filtroRole === 'all' || user.role === filtroRole;
    return matchesSearch && matchesRole;
  });

  const exportUsuariosPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = filteredUsers.map((u) => {
      const creado = (u as any).createdAt || (u as any).created_at || '';
      return `<tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${creado ? new Date(creado).toLocaleDateString('es-CL') : ''}</td>
      </tr>`;
    }).join('');
    win.document.write(`
      <html><head><title>Usuarios</title></head>
      <body>
        <h2>Usuarios (${filteredUsers.length})</h2>
        <table border="1" cellpadding="6" cellspacing="0">
          <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Creado</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4">Sin datos</td></tr>'}</tbody>
        </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleUpdateRole = async (newRole: UserRole) => {
    if (selectedUser) {
      const resp = await usuariosService.cambiarRolUsuario(selectedUser.id, newRole);
      if (resp.success) {
        toast.success(`Rol actualizado a ${getRoleLabel(newRole)}`);
        await loadUsers();
      } else {
        toast.error(resp.error?.message || 'Error al actualizar rol');
      }
      setShowRoleModal(false);
    }
  };

  const handleEditProfile = (user: User) => {
    setSelectedUser(user);
    setProfileForm({
      name: user.name,
      phone: user.phone,
      rut: user.rut,
      direccion: user.direccion,
      fechaNacimiento: user.fechaNacimiento,
      ocupacion: user.ocupacion,
      emergencyContact: user.emergencyContact,
      emergencyPhone: user.emergencyPhone,
    });
    setShowProfileModal(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    const payload: Partial<User> = {
      name: profileForm.name,
      phone: profileForm.phone,
      rut: profileForm.rut,
      direccion: profileForm.direccion,
      fechaNacimiento: profileForm.fechaNacimiento,
      ocupacion: profileForm.ocupacion,
      emergencyContact: profileForm.emergencyContact,
      emergencyPhone: profileForm.emergencyPhone,
    };
    const resp = await usuariosService.actualizarUsuario(selectedUser.id, payload);
    if (resp.success) {
      toast.success('Usuario actualizado');
      setShowProfileModal(false);
      await loadUsers();
    } else {
      toast.error(resp.error?.message || 'No se pudo actualizar');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`¿Eliminar al usuario ${user.email}?`)) return;
    const resp = await usuariosService.eliminarUsuario(user.id);
    if (resp.success) {
      toast.success('Usuario eliminado');
      await loadUsers();
    } else {
      toast.error(resp.error?.message || 'No se pudo eliminar el usuario');
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'entrenador': return 'bg-purple-100 text-purple-800';
      case 'apoderado': return 'bg-blue-100 text-blue-800';
      case 'public': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'entrenador': return 'Entrenador';
      case 'apoderado': return 'Apoderado';
      case 'public': return 'Público';
      default: return role;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'entrenador': return <UserCog className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Users className="w-6 h-6 text-yellow-600" />
            Gestión de Usuarios y Roles
          </h2>
          <p className="text-gray-600 mt-1">
            Administra las cuentas y permisos del sistema
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl">{users.length}</div>
          <p className="text-sm text-gray-600">Usuarios Totales</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportUsuariosPdf}>
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Estadísticas por rol */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-red-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Administradores</div>
                <div className="text-2xl">{users.filter(u => u.role === 'admin').length}</div>
              </div>
              <Shield className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Entrenadores</div>
                <div className="text-2xl">{users.filter(u => u.role === 'entrenador').length}</div>
              </div>
              <UserCog className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Apoderados</div>
                <div className="text-2xl">{users.filter(u => u.role === 'apoderado').length}</div>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-gray-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Públicos</div>
                <div className="text-2xl">{users.filter(u => u.role === 'public').length}</div>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda y filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-60">
              <Label className="text-xs text-gray-500 mb-1 block">Filtrar por rol</Label>
              <Select value={filtroRole} onValueChange={(value) => setFiltroRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="entrenador">Entrenadores</SelectItem>
                  <SelectItem value="apoderado">Apoderados</SelectItem>
                  <SelectItem value="public">Públicos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No se encontraron usuarios
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card
              key={user.id}
              className="h-full min-h-[200px] flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all"
            >
              <CardContent className="p-6 flex-1 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-50 text-yellow-700 font-semibold flex items-center justify-center uppercase shadow-inner">
                      {(user.name || user.email).charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800 leading-tight">
                          {user.name || 'Sin nombre'}
                        </h3>
                        <Badge className={`${getRoleColor(user.role)} text-xs px-2 py-1 rounded-full`}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {getRoleLabel(user.role)}
                          </span>
                        </Badge>
                        {currentUser?.id === user.id && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            Tú
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  {(currentUser && (currentUser.role === 'admin' || currentUser.id === user.id)) && (
                    <div className="flex flex-wrap gap-2">
                      {currentUser.role === 'admin' && user.id !== currentUser.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRole(user)}
                          className="text-yellow-700 border-yellow-200 hover:text-yellow-800 hover:border-yellow-300 rounded-full"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Cambiar Rol
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full"
                        onClick={() => handleEditProfile(user)}
                      >
                        Editar Datos
                      </Button>
                      {currentUser.role === 'admin' && user.id !== currentUser.id && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-full"
                          onClick={() => handleDeleteUser(user)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col gap-3 text-sm text-gray-700">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{user.email}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>Registro: {formatDate(user.createdAt)}</span>
                    </span>
                    {user.fechaNacimiento && (
                      <span className="inline-flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Nac.: {formatDate(user.fechaNacimiento)}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {user.phone && (
                      <span className="inline-flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{user.phone}</span>
                      </span>
                    )}
                    {user.rut && (
                      <span className="inline-flex items-center gap-2">
                        <Badge variant="outline" className="border-gray-200 text-gray-700 rounded-full px-2 py-0.5">RUT</Badge>
                        <span>{user.rut}</span>
                      </span>
                    )}
                    {user.direccion && (
                      <span className="inline-flex items-center gap-2">
                        <Badge variant="outline" className="border-gray-200 text-gray-700 rounded-full px-2 py-0.5">Dirección</Badge>
                        <span className="line-clamp-1 max-w-xs">{user.direccion}</span>
                      </span>
                    )}
                  </div>
                </div>

                {(user.ocupacion || user.emergencyContact || user.emergencyPhone) && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-700">
                    <div className="flex flex-wrap gap-3">
                      {user.ocupacion && <span><strong>Ocupación:</strong> {user.ocupacion}</span>}
                      {user.emergencyContact && <span><strong>Contacto emergencia:</strong> {user.emergencyContact}</span>}
                      {user.emergencyPhone && <span><strong>Tel. emergencia:</strong> {user.emergencyPhone}</span>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Información sobre permisos */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <h3 className="mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-600" />
            Información de Roles y Permisos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-1"><strong>👑 Administrador:</strong></p>
              <ul className="ml-4 space-y-1 text-gray-700">
                <li>• Acceso completo al sistema</li>
                <li>• Gestión de usuarios y roles</li>
                <li>• Configuración de matrículas</li>
                <li>• Visualización de reportes</li>
              </ul>
            </div>
            <div>
              <p className="mb-1"><strong>🏋️ Entrenador:</strong></p>
              <ul className="ml-4 space-y-1 text-gray-700">
                <li>• Gestión de atletas</li>
                <li>• Registro de asistencia</li>
                <li>• Visualización de datos deportivos</li>
                <li>• Acceso a tienda</li>
              </ul>
            </div>
            <div>
              <p className="mb-1"><strong>👨‍👩‍👧 Apoderado:</strong></p>
              <ul className="ml-4 space-y-1 text-gray-700">
                <li>• Acceso a tienda exclusiva</li>
                <li>• Productos de competencia</li>
                <li>• Información de su atleta</li>
                <li>• Historial de pagos</li>
              </ul>
            </div>
            <div>
              <p className="mb-1"><strong>👤 Público:</strong></p>
              <ul className="ml-4 space-y-1 text-gray-700">
                <li>• Acceso a tienda básica</li>
                <li>• Visualización de información</li>
                <li>• Formulario de matrícula</li>
                <li>• Se convierte en Apoderado al matricular</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de edición de rol */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-yellow-600" />
              Cambiar Rol de Usuario
            </DialogTitle>
            <DialogDescription>
              Selecciona el nuevo rol para {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Usuario</Label>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>

              <div>
                <Label>Rol Actual</Label>
                <div className="mt-2">
                  <Badge className={getRoleColor(selectedUser.role)}>
                    {getRoleLabel(selectedUser.role)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Nuevo Rol</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button
                    variant={selectedUser.role === 'public' ? 'default' : 'outline'}
                    onClick={() => handleUpdateRole('public')}
                    className="justify-start"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Público
                  </Button>
                  <Button
                    variant={selectedUser.role === 'apoderado' ? 'default' : 'outline'}
                    onClick={() => handleUpdateRole('apoderado')}
                    className="justify-start"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Apoderado
                  </Button>
                  <Button
                    variant={selectedUser.role === 'entrenador' ? 'default' : 'outline'}
                    onClick={() => handleUpdateRole('entrenador')}
                    className="justify-start"
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    Entrenador
                  </Button>
                  <Button
                    variant={selectedUser.role === 'admin' ? 'default' : 'outline'}
                    onClick={() => handleUpdateRole('admin')}
                    className="justify-start"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de edición de perfil/datos */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-yellow-600" />
              Editar datos del usuario
            </DialogTitle>
            <DialogDescription>
              Actualiza la información de contacto y emergencia del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={profileForm.name || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={profileForm.phone || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>RUT</Label>
                  <Input
                    value={profileForm.rut || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, rut: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Input
                    value={profileForm.direccion || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, direccion: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fecha de nacimiento</Label>
                  <Input
                    type="date"
                    value={profileForm.fechaNacimiento || ''}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, fechaNacimiento: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Ocupación</Label>
                  <Input
                    value={profileForm.ocupacion || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, ocupacion: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Contacto de emergencia</Label>
                  <Input
                    value={profileForm.emergencyContact || ''}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, emergencyContact: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Teléfono de emergencia</Label>
                  <Input
                    value={profileForm.emergencyPhone || ''}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, emergencyPhone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowProfileModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveProfile} className="bg-yellow-400 text-black hover:bg-yellow-500">
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
