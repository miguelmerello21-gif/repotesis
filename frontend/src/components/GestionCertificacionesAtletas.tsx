import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Upload, FileText, Trash2, Shield, User } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { atletasService } from '../api';

const TIPOS = [
  { id: 'medico', label: 'Médico' },
  { id: 'escolar', label: 'Escolar' },
  { id: 'nacimiento', label: 'Nacimiento' },
  { id: 'otro', label: 'Otro' },
];

interface CertAtleta {
  id: number;
  tipo: string;
  nombre: string;
  fecha_emision: string;
  fecha_vencimiento?: string | null;
  notas?: string;
  archivo_url?: string;
}

interface AtletaLite {
  id: number;
  nombre: string;
  rut?: string;
}

export const GestionCertificacionesAtletas: React.FC = () => {
  const [atletas, setAtletas] = useState<AtletaLite[]>([]);
  const [certificaciones, setCertificaciones] = useState<CertAtleta[]>([]);
  const [selectedAtleta, setSelectedAtleta] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    tipo: '',
    nombre: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    notas: '',
    archivo: null as File | null,
  });

  useEffect(() => {
    loadAtletas();
  }, []);

  useEffect(() => {
    if (selectedAtleta) {
      loadCertificaciones(selectedAtleta);
    } else {
      setCertificaciones([]);
    }
  }, [selectedAtleta]);

  const loadAtletas = async () => {
    const resp = await atletasService.listarAtletas();
    if (resp.success && Array.isArray(resp.data)) {
      const mapped = resp.data.map((a: any) => ({
        id: Number(a.id),
        nombre: a.nombre_completo || `${a.nombres || ''} ${a.apellidos || ''}`.trim(),
        rut: a.rut || '',
      }));
      setAtletas(mapped);
      if (mapped.length > 0) setSelectedAtleta(mapped[0].id);
    } else {
      toast.error(resp.error?.message || 'No se pudieron cargar los atletas');
    }
  };

  const loadCertificaciones = async (atletaId: number) => {
    const resp = await atletasService.obtenerCertificaciones(atletaId);
    if (resp.success && Array.isArray(resp.data)) {
      setCertificaciones(resp.data);
    } else {
      setCertificaciones([]);
      toast.error(resp.error?.message || 'No se pudieron cargar las certificaciones');
    }
  };

  const handleUpload = async () => {
    if (!selectedAtleta) return;
    if (!uploadForm.tipo || !uploadForm.nombre || !uploadForm.fecha_emision || !uploadForm.archivo) {
      toast.error('Completa tipo, nombre, fecha y archivo');
      return;
    }
    const formData = new FormData();
    formData.append('tipo', uploadForm.tipo);
    formData.append('nombre', uploadForm.nombre);
    formData.append('fecha_emision', uploadForm.fecha_emision);
    if (uploadForm.fecha_vencimiento) formData.append('fecha_vencimiento', uploadForm.fecha_vencimiento);
    if (uploadForm.notas) formData.append('notas', uploadForm.notas);
    formData.append('archivo', uploadForm.archivo);

    const resp = await atletasService.subirCertificacion(selectedAtleta, formData);
    if (resp.success) {
      toast.success('Certificación subida');
      setShowUpload(false);
      setUploadForm({
        tipo: '',
        nombre: '',
        fecha_emision: '',
        fecha_vencimiento: '',
        notas: '',
        archivo: null,
      });
      loadCertificaciones(selectedAtleta);
    } else {
      toast.error(resp.error?.message || 'No se pudo subir la certificación');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta certificación?')) return;
    const resp = await atletasService.eliminarCertificacion(id);
    if (resp.success) {
      toast.success('Certificación eliminada');
      if (selectedAtleta) loadCertificaciones(selectedAtleta);
    } else {
      toast.error(resp.error?.message || 'No se pudo eliminar');
    }
  };

  const atletaSeleccionado = atletas.find((a) => a.id === selectedAtleta);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-yellow-500" />
            Certificaciones de Atletas
          </h2>
          <p className="text-gray-600 text-sm">Administra certificados médicos/escolares de los atletas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedAtleta ? String(selectedAtleta) : undefined} onValueChange={(v) => setSelectedAtleta(Number(v))}>
            <SelectTrigger className="min-w-[220px]">
              <SelectValue placeholder="Selecciona atleta" />
            </SelectTrigger>
            <SelectContent>
              {atletas.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.nombre} {a.rut ? `(${a.rut})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="bg-yellow-400 text-black hover:bg-yellow-500"
            onClick={() => setShowUpload(true)}
            disabled={!selectedAtleta}
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir Certificación
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            {atletaSeleccionado ? atletaSeleccionado.nombre : 'Selecciona un atleta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certificaciones.length === 0 ? (
            <p className="text-gray-500">No hay certificaciones para este atleta.</p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3 pr-2">
                {certificaciones.map((cert) => (
                  <Card key={cert.id} className="border border-gray-100 shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{cert.nombre}</p>
                          <p className="text-xs text-gray-500">{cert.tipo}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Emisión: {new Date(cert.fecha_emision).toLocaleDateString('es-CL')}
                        </Badge>
                      </div>
                      {cert.fecha_vencimiento && (
                        <p className="text-xs text-gray-600">
                          Vence: {new Date(cert.fecha_vencimiento).toLocaleDateString('es-CL')}
                        </p>
                      )}
                      {cert.notas && <p className="text-sm text-gray-700">{cert.notas}</p>}
                      <div className="flex items-center gap-2">
                        {cert.archivo_url && (
                          <Button variant="outline" size="sm" onClick={() => window.open(cert.archivo_url as string, '_blank', 'noopener')}>
                            <FileText className="w-4 h-4 mr-1" /> Ver archivo
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(cert.id)}>
                          <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subir certificación del atleta</DialogTitle>
            <DialogDescription>Adjunta el documento y completa los datos.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={uploadForm.tipo} onValueChange={(v) => setUploadForm({ ...uploadForm, tipo: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={uploadForm.nombre} onChange={(e) => setUploadForm({ ...uploadForm, nombre: e.target.value })} />
            </div>
            <div>
              <Label>Fecha emisión</Label>
              <Input type="date" value={uploadForm.fecha_emision} onChange={(e) => setUploadForm({ ...uploadForm, fecha_emision: e.target.value })} />
            </div>
            <div>
              <Label>Fecha vencimiento</Label>
              <Input type="date" value={uploadForm.fecha_vencimiento} onChange={(e) => setUploadForm({ ...uploadForm, fecha_vencimiento: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Notas</Label>
              <Input value={uploadForm.notas} onChange={(e) => setUploadForm({ ...uploadForm, notas: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Archivo</Label>
              <Input type="file" accept=".pdf,image/*,.doc,.docx" onChange={(e) => setUploadForm({ ...uploadForm, archivo: e.target.files?.[0] || null })} />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancelar</Button>
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={handleUpload}>
              <Upload className="w-4 h-4 mr-2" /> Subir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
