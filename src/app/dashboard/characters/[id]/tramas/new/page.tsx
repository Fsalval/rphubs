// src/app/dashboard/characters/[id]/tramas/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Textarea from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Upload, X, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useCharacter } from '../../layout'; // Ajusta la ruta si es necesario
import { ref, push } from 'firebase/database';
import { db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sanitize } from '@/lib/sanitize';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function NewTramaPage() {
  const { character, allCharacters } = useCharacter();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [newTramaName, setNewTramaName] = useState('');
  const [newTramaContent, setNewTramaContent] = useState('');
  const [newTramaImageUrl, setNewTramaImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTramaVisibility, setNewTramaVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [newTramaResponseConfig, setNewTramaResponseConfig] = useState<'anyone' | 'friends' | 'collaborators'>('anyone');

  // Efecto para datos del taller (precarga)
  useEffect(() => {
    const titulo = searchParams.get('titulo');
    const contenido = searchParams.get('contenido');
    const fromTaller = searchParams.get('fromTaller');
    if (fromTaller && titulo && contenido) {
      setNewTramaName(titulo);
      setNewTramaContent(contenido);
    }
  }, [searchParams]);

  // Efecto para ajustar automáticamente la configuración de respuestas según la visibilidad
  useEffect(() => {
    if (newTramaVisibility === 'private') {
      setNewTramaResponseConfig('collaborators');
    }
  }, [newTramaVisibility]);

  // Función para manejar upload de imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !character?.id) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('La imagen no debe superar 5MB');
      return;
    }
    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const fileName = `trama-${timestamp}-${file.name}`;
      const imageRef = storageRef(storage, `characters/${character.id}/tramas/${fileName}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      setNewTramaImageUrl(downloadURL);
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setNewTramaImageUrl('');
  };

  const handleStartTrama = async () => {
    if (!newTramaName.trim() || !newTramaContent.trim() || !character?.id) return;

    const newPost = {
      // id: Date.now().toString(), // No es necesario incluir 'id' aquí, Firebase lo genera con 'push'
      name: sanitize(newTramaName),
      content: sanitize(newTramaContent),
      imageUrl: newTramaImageUrl,
      author: {
        name: character.name,
        avatarUrl: character.avatarUrl,
        username: character.username,
      },
      time: new Date().toISOString(),
      participants: selectedChars.length + 1,
      lastActivity: 'ahora',
      tags: [],
      visibility: newTramaVisibility,
      collaborators: [character.id, ...selectedChars],
      responseConfig: newTramaResponseConfig,
      status: 'pending' // <--- Corrección: Incluir 'status'
    };

    try {
      // ✅ Guardar en Firebase
      const tramasRef = ref(db, `characters/${character.id}/tramas`);
      const result = await push(tramasRef, newPost);
      console.log("Trama creada con ID:", result.key);
      // ✅ Redirigir a la lista de tramas
      router.push(`/dashboard/characters/${character.id}/tramas`);
      // Opcional: Mostrar mensaje de éxito al usuario
    } catch (error) {
      console.error('Error al guardar la trama:', error);
      alert('Hubo un error al crear la trama. Por favor, inténtalo de nuevo.');
      // Puedes mostrar un mensaje de error al usuario
    }
  };

  const toggleCharacter = (charId: string) => {
    setSelectedChars(prev =>
      prev.includes(charId)
        ? prev.filter(id => id !== charId)
        : [...prev, charId]
    );
  };

  const filteredCharacters = searchQuery.trim()
    ? allCharacters.filter((char: any) =>
      char.id !== character?.id && // Excluir al propio personaje
      (char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.username.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : [];

  // Si no hay personaje cargado, mostrar un mensaje de carga o redirigir
  if (!character) {
    return <div className="flex items-center justify-center h-screen">Cargando personaje...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Nueva Trama</h1>
        <div></div> {/* Spacer para alinear el título al centro */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escribe tu escena</CardTitle>
          <p className="text-sm text-muted-foreground">
            Define los participantes y escribe tu escena con profundidad.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Título + Configuración en una sola línea */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Título */}
            <div className="flex-1 min-w-[300px]">
              <label className="text-sm font-medium">Título de la trama</label>
              <Input
                value={newTramaName}
                onChange={(e) => setNewTramaName(sanitize(e.target.value))}
                placeholder="Ej: El legado de los Finch"
                className="mt-1 text-base"
              />
            </div>
            {/* Visibilidad */}
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">Visibilidad</label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {newTramaVisibility === 'public' ? 'Pública' :
                    newTramaVisibility === 'friends' ? 'Amigos' : 'Privada'}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Plus className="h-4 w-4" /> {/* Cambié el icono a Plus para que sea más claro */}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      setNewTramaVisibility('public');
                      if (newTramaResponseConfig === 'collaborators') {
                        setNewTramaResponseConfig('anyone');
                      }
                    }}>
                      Pública
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setNewTramaVisibility('friends');
                    }}>
                      Amigos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setNewTramaVisibility('private');
                      setNewTramaResponseConfig('collaborators');
                    }}>
                      Privada + colaboradores
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {/* ¿Quién puede responder? */}
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">¿Quién puede responder?</label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {newTramaResponseConfig === 'anyone' ? 'Cualquiera' :
                    newTramaResponseConfig === 'friends' ? 'Solo amigos' : 'Solo colaboradores'}
                </Badge>
                {newTramaVisibility !== 'private' ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" /> {/* Cambié el icono a Plus */}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {newTramaVisibility === 'public' && (
                        <DropdownMenuItem onClick={() => setNewTramaResponseConfig('anyone')}>
                          Cualquiera puede responder
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setNewTramaResponseConfig('friends')}>
                        Solo amigos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setNewTramaResponseConfig('collaborators')}>
                        Solo colaboradores
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Solo colaboradores (obligatorio)
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* 2. Invitar personajes */}
          <div>
            <label className="text-sm font-medium">Invitar colaboradores</label>
            <Input
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(sanitize(e.target.value))}
              className="mt-1"
            />
            {searchQuery.trim() && (
              <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                {filteredCharacters.length > 0 ? (
                  filteredCharacters
                    .slice(0, 8)
                    .map((char: any) => (
                      <div
                        key={char.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors ${
                          selectedChars.includes(char.id) ? 'bg-muted border-l-4 border-primary' : ''
                        }`}
                        onClick={() => {
                          if (selectedChars.includes(char.id)) {
                            setSelectedChars(selectedChars.filter(id => id !== char.id));
                          } else {
                            setSelectedChars([...selectedChars, char.id]);
                          }
                        }}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={char.avatarUrl} />
                          <AvatarFallback className="text-sm font-bold">
                            {char.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{char.name}</p>
                          <p className="text-xs text-muted-foreground">@{char.username}</p>
                        </div>
                        {selectedChars.includes(char.id) && (
                          <Users className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))
                ) : (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No se encontraron personajes
                  </div>
                )}
              </div>
            )}
            {selectedChars.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-2">Colaboradores seleccionados:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedChars.map((charId) => {
                    const char = allCharacters.find((c: any) => c.id === charId);
                    return char ? (
                      <Badge key={charId} variant="secondary" className="flex items-center gap-1">
                        {char.name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation(); // Evitar que el clic en X active el div padre
                            setSelectedChars(selectedChars.filter(id => id !== charId));
                          }}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Banner/Imagen de la trama */}
          <div>
            <label className="text-sm font-medium">Banner de la trama (opcional)</label>
            {!newTramaImageUrl ? (
              <div className="mt-1">
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-muted/50 transition">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? 'Subiendo imagen...' : 'Haz clic para subir una imagen'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos: JPG, PNG, GIF. Max: 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="mt-1 relative">
                <div className="relative rounded-lg overflow-hidden">
                  {/* Ajusta width y height según tus necesidades y configuración de Next.js Image */}
                  <Image
                    src={newTramaImageUrl}
                    alt="Banner de la trama"
                    width={800}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Cuerpo del texto - Grande, dominante, sin distracciones */}
          <div>
            <label className="text-sm font-medium">Desarrollo narrativo</label>
            <Textarea
              value={newTramaContent}
              onChange={(e) => setNewTramaContent(sanitize(e.target.value))}
              placeholder="Escribe tu escena con detalle. Usa descripciones, diálogos, pensamientos internos. No hay prisa."
              className="w-full min-h-[400px] text-base leading-relaxed mt-1 border focus-visible:ring-1 focus-visible:ring-ring" // Ajusté min-h y ring
            />
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()} // Volver a la página anterior
            >
              Cancelar
            </Button>
            <Button onClick={handleStartTrama} disabled={!newTramaName.trim() || !newTramaContent.trim()}>
              Publicar Trama
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
