'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, Plus, Trash2, Eye, Users, Lock } from 'lucide-react';
import { useCharacter } from '../layout';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';

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
      case 'public': return <Eye className="h-4 w-4" />;
      case 'friends': return <Users className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
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
    <Select value={value} onValueChange={(value) => onChange(value as 'public' | 'friends' | 'private')}>
      <SelectTrigger className={`w-32 ${className}`}>
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-xs">{getLabel()}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="public">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Público</span>
          </div>
        </SelectItem>
        <SelectItem value="friends">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Amigos</span>
          </div>
        </SelectItem>
        <SelectItem value="private">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Privado</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default function FichaPage() {
  const { character, updateCharacterData } = useCharacter();
  
  // Estados para edición
  const [editingPersonalidad, setEditingPersonalidad] = useState(false);
  const [editingHistoria, setEditingHistoria] = useState(false);
  const [editingExtras, setEditingExtras] = useState(false);
  const [editingEnlaces, setEditingEnlaces] = useState(false);
  
  // Estados para contenido
  const [personalidad, setPersonalidad] = useState('');
  const [historia, setHistoria] = useState('');
  const [extras, setExtras] = useState('');
  const [enlaces, setEnlaces] = useState<string[]>([]);
  const [nuevoEnlace, setNuevoEnlace] = useState('');
  
  // Estados para visibilidad
  const [personalidadVisibility, setPersonalidadVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [historiaVisibility, setHistoriaVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [extrasVisibility, setExtrasVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [enlacesVisibility, setEnlacesVisibility] = useState<'public' | 'friends' | 'private'>('public');

  // Cargar datos del personaje
  useEffect(() => {
    if (character) {
      setPersonalidad(character.personalidad || '');
      setHistoria(character.historia || character.trama || ''); // Migrar de trama a historia
      setExtras(character.extras || '');
      setEnlaces(character.enlaces || []);
      
      // Cargar configuraciones de visibilidad
      setPersonalidadVisibility(character.personalidadVisibility || 'public');
      setHistoriaVisibility(character.historiaVisibility || character.tramaVisibility || 'public');
      setExtrasVisibility(character.extrasVisibility || 'public');
      setEnlacesVisibility(character.enlacesVisibility || 'public');
    }
  }, [character]);

  // Función para manejar cambios de visibilidad
  const handleVisibilityChange = async (field: string, visibility: 'public' | 'friends' | 'private') => {
    try {
      const updates: any = {};
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
        case 'enlaces':
          setEnlacesVisibility(visibility);
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
  const saveEnlaces = async () => {
    try {
      const updates = { enlaces };
      await update(ref(db, `characters/${character.id}`), updates);
      updateCharacterData(updates);
      setEditingEnlaces(false);
    } catch (error) {
      console.error('Error saving enlaces:', error);
    }
  };

  // Función para agregar enlace
  const addEnlace = () => {
    if (nuevoEnlace.trim()) {
      setEnlaces([...enlaces, nuevoEnlace.trim()]);
      setNuevoEnlace('');
    }
  };

  // Función para eliminar enlace
  const removeEnlace = (index: number) => {
    setEnlaces(enlaces.filter((_, i) => i !== index));
  };

  if (!character) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="grid gap-8 md:grid-cols-12">
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

      {/* Enlaces */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Enlaces</CardTitle>
            <div className="flex items-center gap-2">
              <VisibilitySelector 
                value={enlacesVisibility} 
                onChange={(value) => handleVisibilityChange('enlaces', value)} 
              />
              {editingEnlaces ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEnlaces}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingEnlaces(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditingEnlaces(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingEnlaces ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={nuevoEnlace}
                  onChange={(e) => setNuevoEnlace(e.target.value)}
                  placeholder="https://ejemplo.com"
                  onKeyDown={(e) => e.key === 'Enter' && addEnlace()}
                />
                <Button size="sm" onClick={addEnlace}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {enlaces.map((enlace, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1">{enlace}</span>
                    <Button size="sm" variant="outline" onClick={() => removeEnlace(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {enlaces.length > 0 ? (
                enlaces.map((enlace, index) => (
                  <div key={index} className="p-2 border rounded">
                    <a 
                      href={enlace} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {enlace}
                    </a>
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground italic">
                  No hay enlaces. Haz clic en editar para agregar enlaces.
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Sidebar derecha */}
      <div className="md:col-span-4 lg:col-span-3 space-y-6">
        {/* About Me */}
        <Card>
          <CardHeader>
            <CardTitle>About me</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
              {character.profile || 'No hay perfil definido.'}
            </p>
            
            {/* Etiquetas */}
            {character.tags?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Etiquetas</p>
                <div className="flex flex-wrap gap-2">
                  {character.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enlaces sociales */}
        <Card>
          <CardHeader>
            <CardTitle>Enlaces</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {character.socialLinks?.length > 0 ? (
              character.socialLinks.map((link: any, i: number) => (
                <div key={i}>
                  <p className="text-sm text-muted-foreground">{link.name}</p>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block text-sm">
                    {link.username || link.url}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay enlaces definidos.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
