'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Edit, Save, X, Plus, Trash2, Eye, Users, Lock, Camera } from 'lucide-react';
import { useCharacter } from '../layout';
import { db } from '@/lib/firebase';
import { ref, update, push } from 'firebase/database';
import { ImageUpload } from '@/components/ui/image-upload';

// Componente para selector de visibilidad
const VisibilitySelector = ({ 
  value, 
  onChange, 
  className = "" 
}: { 
  value: 'public' | 'friends' | 'private';
  onChange: (value: 'public' | 'friends' | 'private') => void;
  className?: string;
}) => {
  const getIcon = () => {
    switch (value) {
      case 'public': return <Eye className="h-3 w-3" />;
      case 'friends': return <Users className="h-3 w-3" />;
      case 'private': return <Lock className="h-3 w-3" />;
    }
  };

  const getLabel = () => {
    switch (value) {
      case 'public': return 'Público';
      case 'friends': return 'Amigos';
      case 'private': return 'Privado';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
          {getIcon()}
          <span>{getLabel()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onChange('public')}>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Público</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('friends')}>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Amigos</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('private')}>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Privado</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function FichaPage() {
  const { character, updateCharacterData } = useCharacter();
  
  // Estados para edición
  const [editingPersonalidad, setEditingPersonalidad] = useState(false);
  const [editingHistoria, setEditingHistoria] = useState(false);
  const [editingExtras, setEditingExtras] = useState(false);
  const [editingEnlaces, setEditingEnlaces] = useState(false);
  const [editingAboutme, setEditingAboutme] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  
  // Estados para contenido
  const [personalidad, setPersonalidad] = useState('');
  const [historia, setHistoria] = useState('');
  const [extras, setExtras] = useState('');
  const [enlaces, setEnlaces] = useState<Array<{name: string, url: string}>>([]);
  const [nuevoEnlace, setNuevoEnlace] = useState('');
  const [nuevoTag, setNuevoTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [aboutme, setAboutme] = useState('');
  const [avatarPhoto, setAvatarPhoto] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Estados para visibilidad
  const [personalidadVisibility, setPersonalidadVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [historiaVisibility, setHistoriaVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [extrasVisibility, setExtrasVisibility] = useState<'public' | 'friends' | 'private'>('public');

  // Cargar datos del personaje
// Cargar datos del personaje
useEffect(() => {
  if (character) {
    setPersonalidad(character.personalidad || '');
    setHistoria(character.historia || character.trama || '');
    setExtras(character.extras || '');
    setEnlaces(character.socialLinks || []); // Para enlaces sociales
    setTags(character.tags || []); // Para etiquetas
    setAboutme(character.profile || ''); // Para About me 
    setAvatarPhoto(character.avatarPhoto || ''); // Para foto de avatar
    
    // Cargar configuraciones de visibilidad
    setPersonalidadVisibility(character.personalidadVisibility || 'public');
    setHistoriaVisibility(character.historiaVisibility || character.tramaVisibility || 'public');
    setExtrasVisibility(character.extrasVisibility || 'public');
  }
}, [character]);
  // Función para subir foto de avatar
  const handleAvatarUpload = async (imageUrl: string) => {
    if (!character) return;
    
    setUploadingPhoto(true);
    try {
      // Actualizar la foto de avatar del personaje
      const updates = { 
        avatarPhoto: imageUrl,
        avatarUpdatedAt: Date.now()
      };
      
      await update(ref(db, `characters/${character.id}`), updates);
      updateCharacterData(updates);
      setAvatarPhoto(imageUrl);
      
      // Crear un post en el feed con la nueva foto
      const feedPost = {
        characterId: character.id,
        characterName: character.name,
        content: 'Nueva foto de avatar',
        image: imageUrl,
        type: 'avatar',
        timestamp: Date.now(),
        reactions: {
          heart: 0
        },
        visibility: 'public'
      };
      
      await push(ref(db, 'feed'), feedPost);
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Función para manejar cambios de visibilidad
  const handleVisibilityChange = async (field: string, visibility: 'public' | 'friends' | 'private') => {
    try {
      const updates: Record<string, 'public' | 'friends' | 'private'> = {};
      updates[`${field}Visibility`] = visibility;
      
      await update(ref(db, `characters/${character.id}`), updates);
      updateCharacterData(updates);
      
      // Actualizar estado local
      switch (field) {
        case 'personalidad':
          setPersonalidadVisibility(visibility);
          break;
        case 'historia':
          setHistoriaVisibility(visibility);
          break;
        case 'extras':
          setExtrasVisibility(visibility);
          break;
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  // Función para guardar personalidad
  const savePersonalidad = async () => {
    try {
      const updates = { personalidad };
      await update(ref(db, `characters/${character.id}`), updates);
      updateCharacterData(updates);
      setEditingPersonalidad(false);
    } catch (error) {
      console.error('Error saving personalidad:', error);
    }
  };

  // Función para guardar historia
  const saveHistoria = async () => {
    try {
      const updates = { 
        historia,
        trama: null // Eliminar campo antiguo
      };
      await update(ref(db, `characters/${character.id}`), updates);
      updateCharacterData(updates);
      setEditingHistoria(false);
    } catch (error) {
      console.error('Error saving historia:', error);
    }
  };

  // Función para guardar extras
  const saveExtras = async () => {
    try {
      const updates = { extras };
      await update(ref(db, `characters/${character.id}`), updates);
      updateCharacterData(updates);
      setEditingExtras(false);
    } catch (error) {
      console.error('Error saving extras:', error);
    }
  };

  // Función para guardar enlaces

 // Función para guardar About me (profile)
const saveAboutme = async () => {
  try {
    const updates = { profile: aboutme };
    await update(ref(db, `characters/${character.id}`), updates);
    updateCharacterData(updates);
    setEditingAboutme(false);
  } catch (error) {
    console.error('Error saving profile:', error);
  }
};

  // Función para guardar Etiquetas (tags)
  const saveTags = async () => {
    try {
      const updates = { tags: tags };
      await update(ref(db, `characters/${character.id}`), updates);
      updateCharacterData({ ...character, ...updates });
      setEditingTags(false);
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  };

  // Función para guardar Enlaces sociales (socialLinks)
  const saveEnlaces = async () => {
    try {
      const updates = { socialLinks: enlaces };
      await update(ref(db, `characters/${character.id}`), updates);
      updateCharacterData({ ...character, ...updates });
      setEditingEnlaces(false);
    } catch (error) {
      console.error('Error saving social links:', error);
    }
  };

  // Función para eliminar enlace o etiqueta
  const removeEnlace = (index: number) => {
    setEnlaces(enlaces.filter((_, i) => i !== index));
  };

  if (!character) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="grid gap-8 md:grid-cols-12">
    {/* Sidebar izquierda */}
    <div className="md:col-span-4 lg:col-span-3 space-y-6">
      {/* About Me - Editable */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>About me</CardTitle>
            {editingAboutme ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={saveAboutme}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setAboutme(character.profile || '');
                  setEditingAboutme(false);
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => {
                setEditingAboutme(true);
                setAboutme(character.profile || '');
              }}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingAboutme ? (
            <div className="space-y-2">
              <Textarea
                value={aboutme}
                onChange={(e) => setAboutme(e.target.value.slice(0, 1500))}
                placeholder="Escribe algo sobre tu personaje..."
                className="min-h-24"
              />
              <p className="text-xs text-right text-muted-foreground">
                {aboutme.length}/1500 caracteres
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {character.profile || (
                <span className="italic text-muted-foreground">No hay perfil definido. Haz clic en editar para agregar contenido.</span>
              )}
            </p>
          )}
        </CardContent>
      </Card>
      {/* Etiquetas - Editable */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Etiquetas</CardTitle>
            {editingTags ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={saveTags}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setTags(character.tags || []);
                  setEditingTags(false);
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => {
                setEditingTags(true);
                setTags(character.tags || []);
              }}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingTags ? (
            <div className="space-y-2">
              <Input
                value={nuevoTag}
                onChange={(e) => setNuevoTag(e.target.value)}
                placeholder="#etiqueta"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nuevoTag.trim()) {
                    e.preventDefault();
                    const tag = nuevoTag.trim().startsWith('#') 
                      ? nuevoTag.trim() 
                      : `#${nuevoTag.trim()}`;
                    if (tags.length < 10 && !tags.includes(tag)) {
                      setTags([...tags, tag]);
                    }
                    setNuevoTag('');
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((_, i) => i !== index))}
                      className="ml-1 text-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-right text-muted-foreground">
                {tags.length}/10 etiquetas
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {character.tags && character.tags.length > 0 ? (
                character.tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No hay etiquetas definidas. Haz clic en editar para agregar etiquetas.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enlaces sociales - Editable */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Enlaces</CardTitle>
            {editingEnlaces ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => {
                  saveEnlaces();
                  setEditingEnlaces(false);
                }}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setEnlaces(character.socialLinks || []);
                  setEditingEnlaces(false);
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => {
                setEditingEnlaces(true);
                setEnlaces(character.socialLinks || []);
              }}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingEnlaces ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre de la red (ej: Instagram)"
                  value={nuevoEnlace.split('|')[0] || ''}
                  onChange={(e) => {
                    const url = nuevoEnlace.split('|')[1] || '';
                    setNuevoEnlace(`${e.target.value}|${url}`);
                  }}
                  className="flex-1"
                />
                <Input
                  placeholder="URL completa"
                  value={nuevoEnlace.split('|')[1] || ''}
                  onChange={(e) => {
                    const name = nuevoEnlace.split('|')[0] || '';
                    setNuevoEnlace(`${name}|${e.target.value}`);
                  }}
                  className="flex-1"
                />
                <Button size="sm" onClick={() => {
                  if (nuevoEnlace.includes('|')) {
                    const [name, url] = nuevoEnlace.split('|');
                    if (name.trim() && url.trim() && enlaces.length < 3) {
                      const newLink = { name: name.trim(), url: url.trim() };
                      setEnlaces([...enlaces, newLink]);
                      setNuevoEnlace('');
                    }
                  }
                }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {enlaces.map((link: { name: string; url: string }, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{link.name}</span>
                    <div className="flex gap-2">
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Ver
                      </a>
                      <Button size="sm" variant="ghost" onClick={() => removeEnlace(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-right text-muted-foreground">
                {enlaces.length}/3 enlaces
              </p>
            </div>
          ) : (
            character.socialLinks && character.socialLinks.length > 0 ? (
              character.socialLinks.map((link: { name: string; url: string }, i: number) => (
                <div key={i}>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block text-sm"
                  >
                    {link.name}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">No hay enlaces definidos. Haz clic en editar para agregar enlaces.</p>
            )
          )}
        </CardContent>
      </Card>
    </div>

      {/* Contenido principal */}
      <div className="md:col-span-8 lg:col-span-9 space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <p className="text-lg">{character.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Edad</label>
                <p className="text-lg">{character.age || 'No especificada'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Género</label>
                <p className="text-lg">{character.gender || 'No especificado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Especie</label>
                <p className="text-lg">{character.species || 'No especificada'}</p>
              </div>
            </div>
            
            {character.fandom && (
              <div>
                <label className="text-sm font-medium">Fandom</label>
                <div className="mt-1">
                  <Badge variant="secondary">{character.fandom}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Personalidad */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Personalidad</CardTitle>
            <div className="flex items-center gap-2">
              <VisibilitySelector 
                value={personalidadVisibility} 
                onChange={(value) => handleVisibilityChange('personalidad', value)} 
              />
              {editingPersonalidad ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={savePersonalidad}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingPersonalidad(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditingPersonalidad(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editingPersonalidad ? (
            <Textarea
              value={personalidad}
              onChange={(e) => setPersonalidad(e.target.value)}
              placeholder="Describe la personalidad de tu personaje..."
              className="min-h-32"
            />
          ) : (
            <div className="whitespace-pre-wrap">
              {personalidad || (
                <span className="text-muted-foreground italic">
                  No hay información de personalidad. Haz clic en editar para agregar contenido.
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historia */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historia</CardTitle>
            <div className="flex items-center gap-2">
              <VisibilitySelector 
                value={historiaVisibility} 
                onChange={(value) => handleVisibilityChange('historia', value)} 
              />
              {editingHistoria ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveHistoria}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingHistoria(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditingHistoria(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editingHistoria ? (
            <Textarea
              value={historia}
              onChange={(e) => setHistoria(e.target.value)}
              placeholder="Cuenta la historia de tu personaje..."
              className="min-h-32"
            />
          ) : (
            <div className="whitespace-pre-wrap">
              {historia || (
                <span className="text-muted-foreground italic">
                  No hay información de historia. Haz clic en editar para agregar contenido.
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extras */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información Extra</CardTitle>
            <div className="flex items-center gap-2">
              <VisibilitySelector 
                value={extrasVisibility} 
                onChange={(value) => handleVisibilityChange('extras', value)} 
              />
              {editingExtras ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveExtras}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingExtras(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditingExtras(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editingExtras ? (
            <Textarea
              value={extras}
              onChange={(e) => setExtras(e.target.value)}
              placeholder="Información adicional sobre tu personaje..."
              className="min-h-32"
            />
          ) : (
            <div className="whitespace-pre-wrap">
              {extras || (
                <span className="text-muted-foreground italic">
                  No hay información extra. Haz clic en editar para agregar contenido.
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      </div>
    </div>
  );
}
