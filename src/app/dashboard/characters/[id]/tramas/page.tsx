// src/app/dashboard/characters/[id]/tramas/page.tsx
'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { Button } from '../../../../../components/ui/button';
import Textarea from '../../../../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Input} from '../../../../../components/ui/input';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../../components/ui/avatar';
import { Badge } from '../../../../../components/ui/badge';
import { Plus, Users, MessageSquare, MoreHorizontal, Edit3, CheckCircle, BookOpen, Upload, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../../../components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { useCharacter } from '../layout';
import { ref, push, onValue, update } from 'firebase/database';
import { db, storage } from '../../../../../lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sanitize } from '../../../../../lib/sanitize';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
export default function TramasPage() {
  const { character, isOwner, allCharacters } = useCharacter();
  const searchParams = useSearchParams();
  const [tramas, setTramas] = useState<any[]>([]);
  // Efecto para datos del taller
  useEffect(() => {
    const titulo = searchParams.get('titulo');
    const contenido = searchParams.get('contenido');
    const fromTaller = searchParams.get('fromTaller');
    if (fromTaller && titulo && contenido) {
      setNewTramaName(titulo);
      setNewTramaContent(contenido);
      setShowNewTrama(true);
    }
  }, [searchParams]);
  // Cargar tramas desde Firebase al montar
  useEffect(() => {
    if (!character?.id) return;
    const tramasRef = ref(db, `characters/${character.id}/tramas`);
    const unsubscribe = onValue(tramasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convierte el objeto en array y agrega el id de la trama
        const tramasArray = Object.entries(data).map(([key, value]: any) => ({ ...value, id: key }));
        // Ordena por fecha descendente
        tramasArray.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setTramas(tramasArray);
      } else {
        setTramas([]);
      }
    });
    return () => unsubscribe();
  }, [character?.id]);
  const [showNewTrama, setShowNewTrama] = useState(false);
  const [newTramaName, setNewTramaName] = useState('');
  const [newTramaContent, setNewTramaContent] = useState('');
  const [newTramaImageUrl, setNewTramaImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTramaVisibility, setNewTramaVisibility] = useState<'public'|'friends'|'private'>('public');
  const [newTramaResponseConfig, setNewTramaResponseConfig] = useState<'anyone'|'friends'|'collaborators'>('anyone');
  // Estados para edición y respuestas
  const [editingTrama, setEditingTrama] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [responseTexts, setResponseTexts] = useState<{[key: string]: string}>({});
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'friends' | 'private' | 'collaborations'>('all');
  // Filtrado por visibilidad
  let visibleTramas = tramas;
  if (activeTab === 'public') {
    visibleTramas = tramas.filter(t => t.visibility === 'public');
  } else if (activeTab === 'friends') {
    visibleTramas = tramas.filter(t => t.visibility === 'friends' && (
      t.collaborators?.includes(character.id) || character.friends?.some((f: any) => t.collaborators?.includes(f.id))
    ));
  } else if (activeTab === 'private') {
    visibleTramas = tramas.filter(t => t.visibility === 'private' && t.collaborators?.includes(character.id));
  } else if (activeTab === 'collaborations') {
    visibleTramas = tramas.filter(t => 
      t.collaborators?.includes(character.id) && t.author.username !== character.username
    );
  }
  // Efecto para scroll automático desde el menú lateral
  useEffect(() => {
    if (scrollTarget) {
      const element = document.getElementById(`trama-${scrollTarget}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight temporal
        element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.3)';
        setTimeout(() => {
          element.style.boxShadow = '';
        }, 2000);
      }
      setScrollTarget(null);
    }
  }, [scrollTarget, visibleTramas]);
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
  if (!newTramaName.trim() || !newTramaContent.trim()) return;
  const newPost = {
      id: Date.now().toString(),
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
    };
    try {
      // ✅ Guardar en Firebase
      const tramasRef = ref(db, `characters/${character.id}/tramas`);
      await push(tramasRef, newPost);
      // ✅ Actualizar estado local
      setTramas([newPost, ...tramas]);
    } catch (error) {
      console.error('Error al guardar la trama:', error);
      // Puedes mostrar un mensaje de error al usuario
    }
    // ✅ Limpiar formulario
    setNewTramaName('');
    setNewTramaContent('');
    setNewTramaImageUrl('');
    setSelectedChars([]);
    setSearchQuery('');
    setNewTramaVisibility('public');
    setNewTramaResponseConfig('anyone');
    setShowNewTrama(false);
  };
  // Función para editar trama completa
  const handleEditTrama = async (tramaId: string) => {
    if (!editingData.name?.trim() || !editingData.content?.trim()) return;
    try {
      const tramaRef = ref(db, `characters/${character.id}/tramas/${tramaId}`);
      await update(tramaRef, {
        name: sanitize(editingData.name),
        content: sanitize(editingData.content),
        visibility: editingData.visibility,
        responseConfig: editingData.responseConfig
      });
      setEditingTrama(null);
      setEditingData({});
    } catch (error) {
      console.error('Error al editar trama:', error);
    }
  };
  // Función para agregar respuesta
  const handleAddResponse = async (tramaId: string) => {
    const responseText = responseTexts[tramaId]?.trim();
    if (!responseText) return;
    try {
      const responsesRef = ref(db, `characters/${character.id}/tramas/${tramaId}/responses`);
      const newResponse = {
        content: sanitize(responseText),
        author: {
          name: character.name,
          username: character.username,
          avatarUrl: character.avatarUrl
        },
        time: new Date().toISOString()
      };
      await push(responsesRef, newResponse);
      setResponseTexts(prev => ({ ...prev, [tramaId]: '' }));
    } catch (error) {
      console.error('Error al agregar respuesta:', error);
    }
  };
  // Función para cargar respuestas de una trama
  const [tramaResponses, setTramaResponses] = useState<{[key: string]: any[]}>({});
  useEffect(() => {
    if (!character?.id) return;
    // Cargar respuestas para cada trama
    tramas.forEach(trama => {
      const responsesRef = ref(db, `characters/${character.id}/tramas/${trama.id}/responses`);
      onValue(responsesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const responsesArray = Object.entries(data)
            .map(([key, value]: any) => ({ ...value, id: key }))
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
          setTramaResponses(prev => ({ ...prev, [trama.id]: responsesArray }));
        } else {
          setTramaResponses(prev => ({ ...prev, [trama.id]: [] }));
        }
      });
    });
  }, [tramas, character?.id]);
  const toggleCharacter = (charId: string) => {
    setSelectedChars(prev =>
      prev.includes(charId)
        ? prev.filter(id => id !== charId)
        : [...prev, charId]
    );
  };
  const filteredCharacters = searchQuery.trim()
    ? allCharacters.filter((char: any) =>
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  return (
    <div className="flex gap-6 h-screen overflow-hidden">
      {/* Menú lateral */}
      <div className="w-80 flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Índice de Tramas</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {visibleTramas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay tramas en esta categoría
                  </p>
                ) : (
                  visibleTramas.map((trama) => (
                    <div
                      key={trama.id}
                      className="p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => setScrollTarget(trama.id)}
                    >
                      <h4 className="font-medium text-sm leading-tight mb-1">{trama.name}</h4>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(trama.tags ?? []).slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      {activeTab === 'collaborations' && (
                        <p className="text-xs text-muted-foreground">Por: {trama.author.name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          trama.status === 'finished' ? 'bg-green-100 text-green-700' :
                          trama.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {trama.status === 'finished' ? 'Finalizada' :
                           trama.status === 'in-progress' ? 'En proceso' : 'Pendiente'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(trama.time).toLocaleDateString()}
                        </span>
                      </div>
                      {tramaResponses[trama.id]?.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {tramaResponses[trama.id].length} respuesta{tramaResponses[trama.id].length !== 1 ? 's' : ''}
                          {tramaResponses[trama.id].length >= 10 && (
                            <span className="ml-2 text-primary font-medium">• Elegible para capítulos</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      {/* Contenido principal */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tramas</h2>
        {isOwner && (
          <Button onClick={() => setShowNewTrama(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Trama
          </Button>
        )}
      </div>
      {/* Submenú de visibilidad */}
      <div className="flex border-b border-border">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('all')}
          className="rounded-none"
        >
          Todas
        </Button>
        <Button
          variant={activeTab === 'public' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('public')}
          className="rounded-none"
        >
          Pública
        </Button>
        <Button
          variant={activeTab === 'friends' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('friends')}
          className="rounded-none"
        >
          Amigos
        </Button>
        <Button
          variant={activeTab === 'private' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('private')}
          className="rounded-none"
        >
          Privada
        </Button>
        <Button
          variant={activeTab === 'collaborations' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('collaborations')}
          className="rounded-none"
        >
          Colaboraciones
        </Button>
      </div>
      {/* Formulario de nueva trama */}
      {showNewTrama && isOwner && (
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
                      <MoreHorizontal className="h-4 w-4" />
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
                        <MoreHorizontal className="h-4 w-4" />
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
                  {allCharacters
                    .filter((char: any) => 
                      char.id !== character.id &&
                      (char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      char.username.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
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
                    ))}
                  {allCharacters.filter((char: any) => 
                    char.id !== character.id &&
                    (char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     char.username.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).length === 0 && (
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
                            onClick={() => setSelectedChars(selectedChars.filter(id => id !== charId))}
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
                    <Image
                      src={newTramaImageUrl}
                      alt="Banner de la trama"
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
                className="w-full min-h-[300px] text-base leading-relaxed mt-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              />
            </div>
            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewTrama(false);
                  setNewTramaName('');
                  setNewTramaContent('');
                  setNewTramaImageUrl('');
                  setSearchQuery('');
                  setSelectedChars([]);
                  setNewTramaVisibility('public');
                  setNewTramaResponseConfig('anyone');
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleStartTrama}>
                Publicar Trama
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Muro de tramas */}
      <div className="space-y-6">
        {visibleTramas.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay tramas activas.</p>
        ) : (
          visibleTramas.map((trama) => (
            <Card key={trama.id} className="hover:shadow-md transition">
              <CardContent className="pt-6">
                <div id={`trama-${trama.id}`}>
                {editingTrama === trama.id ? (
                  // Modo edición
                  <div className="space-y-4">
                    <Input
                      value={editingData.name || trama.name}
                      onChange={(e) => setEditingData((prev: any) => ({ ...prev, name: e.target.value }))}
                      className="text-2xl font-bold"
                      placeholder="Título de la trama"
                    />
                    {/* Configuraciones de edición con DropdownMenu */}
                    <div className="space-y-3">
                      {/* Visibilidad */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Visibilidad</label>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            {(editingData.visibility || trama.visibility) === 'public' ? 'Pública' :
                             (editingData.visibility || trama.visibility) === 'friends' ? 'Amigos' : 'Privada'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => {
                                const newVis = 'public';
                                setEditingData((prev: any) => ({ ...prev, visibility: newVis }));
                                // Si era privada y cambia, permitir más opciones de respuesta
                                if ((editingData.visibility || trama.visibility) === 'private') {
                                  setEditingData((p: any) => ({ ...p, responseConfig: 'anyone' }));
                                }
                              }}>
                                Pública
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingData((prev: any) => ({ ...prev, visibility: 'friends' }));
                              }}>
                                Amigos
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingData((prev: any) => ({ ...prev, visibility: 'private', responseConfig: 'collaborators' }));
                              }}>
                                Privada (solo colaboradores)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Estado */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Estado</label>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            {(editingData.status || trama.status) === 'finished' ? 'Finalizada' :
                             (editingData.status || trama.status) === 'in-progress' ? 'En proceso' : 'Pendiente'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setEditingData((prev: any) => ({ ...prev, status: 'pending' }))}>
                                Pendiente
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingData((prev: any) => ({ ...prev, status: 'in-progress' }))}>
                                En proceso
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingData((prev: any) => ({ ...prev, status: 'finished' }))}>
                                Finalizada
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Quién puede responder */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">¿Quién puede responder?</label>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            {(editingData.responseConfig || trama.responseConfig) === 'anyone' ? 'Cualquiera' :
                             (editingData.responseConfig || trama.responseConfig) === 'friends' ? 'Solo amigos' : 'Solo colaboradores'}
                          </Badge>
                          {(editingData.visibility || trama.visibility) !== 'private' ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {(editingData.visibility || trama.visibility) === 'public' && (
                                  <DropdownMenuItem onClick={() => setEditingData((prev: any) => ({ ...prev, responseConfig: 'anyone' }))}>
                                    Cualquiera
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setEditingData((prev: any) => ({ ...prev, responseConfig: 'friends' }))}>
                                  Solo amigos
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingData((prev: any) => ({ ...prev, responseConfig: 'collaborators' }))}>
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
                    <Textarea
                      value={editingData.content || trama.content}
                      onChange={(e) => setEditingData((prev: any) => ({ ...prev, content: e.target.value }))}
                      className="min-h-[200px] w-full resize-none"
                      placeholder="Contenido de la trama"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEditTrama(trama.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingTrama(null);
                        setEditingData({});
                      }}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Modo vista normal
                  <>
                    {/* Título prominente */}
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-2xl font-bold flex-1">{trama.name}</h2>
                      {isOwner && trama.author?.username === character?.username && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {tramaResponses[trama.id]?.length >= 5 && (
                              <DropdownMenuItem onClick={() => window.location.href = `/dashboard/characters/${character.id}/tramas/${trama.id}/lectura`}>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Modo Lectura
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => {
                              setEditingTrama(trama.id);
                              setEditingData({
                                name: trama.name,
                                content: trama.content,
                                visibility: trama.visibility,
                                responseConfig: trama.responseConfig
                              });
                            }}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Editar Trama
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    {/* Banner de la trama */}
                    {trama.imageUrl && (
                      <div className="mb-4">
                        <Image
                          src={trama.imageUrl}
                          alt={`Banner de ${trama.name}`}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    {/* Etiquetas */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(trama.tags ?? []).map((tag: string) => (
                        <span key={tag} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    {/* Información del autor y fecha/estado */}
                    <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>Por: <span className="font-medium">{trama.author?.name || 'Autor desconocido'}</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          trama.status === 'finished' ? 'bg-green-100 text-green-700' :
                          trama.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {trama.status === 'finished' ? 'Finalizada' :
                           trama.status === 'in-progress' ? 'En proceso' : 'Pendiente'}
                        </span>
                        <span>{new Date(trama.time).toLocaleString()}</span>
                      </div>
                    </div>
                    {/* Cuerpo del texto */}
                    <div className="mb-4 max-w-none">
                      <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                        {trama.content}
                      </p>
                    </div>
                    {/* Respuestas cronológicas */}
                    {tramaResponses[trama.id]?.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-medium text-sm mb-3 text-muted-foreground">
                          Continuación de la historia ({tramaResponses[trama.id].length} respuesta{tramaResponses[trama.id].length !== 1 ? 's' : ''})
                        </h3>
                        <div className="space-y-4">
                          {tramaResponses[trama.id].map((response) => (
                            <div key={response.id} className="bg-muted/30 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                                <span className="font-medium">{response.author.name}</span>
                                <span>•</span>
                                <span>{new Date(response.time).toLocaleString()}</span>
                              </div>
                              <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                                {response.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Campo de respuesta visible */}
                    <div className="border-t pt-4 mt-4">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">
                          Continúa la historia:
                        </label>
                        <Textarea
                          value={responseTexts[trama.id] || ''}
                          onChange={(e) => setResponseTexts(prev => ({ 
                            ...prev, 
                            [trama.id]: e.target.value 
                          }))}
                          placeholder="Escribe cómo continúa la historia... Mantén la coherencia narrativa y el orden cronológico."
                          className="min-h-[120px] text-base leading-relaxed w-full resize-none"
                        />
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            onClick={() => handleAddResponse(trama.id)}
                            disabled={!responseTexts[trama.id]?.trim()}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Continuar Historia
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Información de participantes */}
                    <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
                      <span>
                        {trama.participants} participante{trama.participants !== 1 ? 's' : ''}
                      </span>
                      <span>
                        Respuestas: {trama.responseConfig === 'anyone' ? 'Cualquiera' : 
                                  trama.responseConfig === 'friends' ? 'Solo amigos' : 'Solo colaboradores'}
                      </span>
                    </div>
                  </>
                )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
