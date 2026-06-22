// src/app/dashboard/characters/[id]/taller/page.tsx
'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Textarea } from '../../../../../components/ui/textarea';
import { Badge } from '../../../../../components/ui/badge';
import { Edit, Save, Trash2, Send, Plus, X } from 'lucide-react';
import { useCharacter } from '../layout';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { db } from '../../../../../lib/firebase';
import { useRouter } from 'next/navigation';

interface Borrador {
  id: string;
  titulo: string;
  contenido: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

export default function TallerEscrituraPage() {
  const { character, isOwner } = useCharacter();
  const router = useRouter();
  const [borradores, setBorradores] = useState<Borrador[]>([]);
  const [editandoBorrador, setEditandoBorrador] = useState<string | null>(null);
  const [nuevoBorrador, setNuevoBorrador] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');

  // Cargar borradores desde Firebase
  useEffect(() => {
    if (!character?.id) return;

    const borradoresRef = ref(db, `characters/${character.id}/borradores`);
    const unsubscribe = onValue(borradoresRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const borradoresArray = Object.entries(data).map(([key, value]: any) => ({
          id: key,
          ...value
        })).sort((a, b) => new Date(b.fechaModificacion).getTime() - new Date(a.fechaModificacion).getTime());
        setBorradores(borradoresArray);
      } else {
        setBorradores([]);
      }
    });

    return () => unsubscribe();
  }, [character?.id]);

  const guardarBorrador = async () => {
    if (!titulo.trim() || !contenido.trim()) return;

    const ahora = new Date().toISOString();
    const borrador = {
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      fechaCreacion: ahora,
      fechaModificacion: ahora
    };

    try {
      if (editandoBorrador) {
        // Actualizar borrador existente
        const borradorRef = ref(db, `characters/${character.id}/borradores/${editandoBorrador}`);
        await update(borradorRef, {
          titulo: titulo.trim(),
          contenido: contenido.trim(),
          fechaModificacion: ahora
        });
        setEditandoBorrador(null);
      } else {
        // Crear nuevo borrador
        const borradoresRef = ref(db, `characters/${character.id}/borradores`);
        await push(borradoresRef, borrador);
        setNuevoBorrador(false);
      }
      
      // Limpiar formulario
      setTitulo('');
      setContenido('');
    } catch (error) {
      console.error('Error al guardar borrador:', error);
    }
  };

  const eliminarBorrador = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este borrador?')) return;

    try {
      const borradorRef = ref(db, `characters/${character.id}/borradores/${id}`);
      await remove(borradorRef);
    } catch (error) {
      console.error('Error al eliminar borrador:', error);
    }
  };

  const editarBorrador = (borrador: Borrador) => {
    setTitulo(borrador.titulo);
    setContenido(borrador.contenido);
    setEditandoBorrador(borrador.id);
    setNuevoBorrador(false);
  };

  const enviarATrama = (borrador: Borrador) => {
    // Navegar a tramas con los datos prellenados
    const params = new URLSearchParams({
      titulo: borrador.titulo,
      contenido: borrador.contenido,
      fromTaller: 'true'
    });
    router.push(`/dashboard/characters/${character.id}/tramas?${params.toString()}`);
  };

  const cancelarEdicion = () => {
    setEditandoBorrador(null);
    setNuevoBorrador(false);
    setTitulo('');
    setContenido('');
  };

  if (!isOwner) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No tienes permisos para acceder al taller de escritura.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Taller de Escritura</h1>
          <p className="text-muted-foreground">Crea y edita borradores antes de publicarlos como tramas</p>
        </div>
        <Button onClick={() => setNuevoBorrador(true)} disabled={nuevoBorrador || !!editandoBorrador}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Borrador
        </Button>
      </div>

      {/* Formulario de edición/creación */}
      {(nuevoBorrador || editandoBorrador) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editandoBorrador ? 'Editar Borrador' : 'Nuevo Borrador'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título de tu historia..."
                className="mt-1"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {titulo.length}/100 caracteres
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Contenido</label>
              <Textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Escribe tu historia aquí... Puedes desarrollar la trama, personajes, diálogos y descripciones."
                className="mt-1 min-h-[300px] resize-none"
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {contenido.length}/5000 caracteres
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={guardarBorrador} disabled={!titulo.trim() || !contenido.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {editandoBorrador ? 'Actualizar' : 'Guardar'} Borrador
              </Button>
              <Button variant="outline" onClick={cancelarEdicion}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de borradores */}
      <div className="space-y-4">
        {borradores.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Edit className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No hay borradores</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer borrador para empezar a escribir tus historias
              </p>
              <Button onClick={() => setNuevoBorrador(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Borrador
              </Button>
            </CardContent>
          </Card>
        ) : (
          borradores.map((borrador) => (
            <Card key={borrador.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{borrador.titulo}</CardTitle>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                      <span>Creado: {new Date(borrador.fechaCreacion).toLocaleDateString()}</span>
                      <span>Modificado: {new Date(borrador.fechaModificacion).toLocaleDateString()}</span>
                      <Badge variant="outline">
                        {borrador.contenido.length} caracteres
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editarBorrador(borrador)}
                      disabled={editandoBorrador === borrador.id || nuevoBorrador}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <div className="relative group">
                      <Button
                        size="sm"
                        onClick={() => enviarATrama(borrador)}
                        disabled={!!editandoBorrador || nuevoBorrador}
                        title="Enviar a Tramas - Completa la configuración y publica tu historia"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Enviar a Tramas
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => eliminarBorrador(borrador.id)}
                      disabled={!!editandoBorrador || nuevoBorrador}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {borrador.contenido}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
