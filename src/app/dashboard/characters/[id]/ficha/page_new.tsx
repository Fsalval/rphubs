// src/app/dashboard/characters/[id]/ficha/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageUpload } from '@/components/ui/image-upload';
import { Edit, Save, X, Plus, ExternalLink, Globe, Users, UserX } from 'lucide-react';
import { useCharacter } from '../layout';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';

// Componente para selector de visibilidad
const VisibilitySelector = ({ 
  value, 
  onChange 
}: { 
  value: 'public' | 'friends', 
  onChange: (value: 'public' | 'friends') => void 
}) => (
  <div className="flex gap-1 mb-2">
    <Button
      size="sm"
      variant={value === 'public' ? 'default' : 'outline'}
      onClick={() => onChange('public')}
      className="flex items-center gap-1 text-xs h-6 px-2"
    >
      <Globe className="h-3 w-3" />
      Público
    </Button>
    <Button
      size="sm"
      variant={value === 'friends' ? 'default' : 'outline'}
      onClick={() => onChange('friends')}
      className="flex items-center gap-1 text-xs h-6 px-2"
    >
      <Users className="h-3 w-3" />
      Solo amigos
    </Button>
  </div>
);

export default function CharacterFichaPage() {
    const { character, isOwner } = useCharacter();

    // Estados para edición (solo campos editables)
    const [bio, setBio] = useState(character.biography || character.profile || '');
    const [trama, setTrama] = useState(character.trama || '');
    const [personalidad, setPersonalidad] = useState(character.personalidad || '');
    const [extras, setExtras] = useState(character.extras || '');
    const [tags, setTags] = useState<string[]>(character.tags || []);
    const [socialLinks, setSocialLinks] = useState<any[]>(character.socialLinks || []);
    const [avatarUrl, setAvatarUrl] = useState(character.avatarUrl || '');

    // Estados para configuración de visibilidad
    const [bioVisibility, setBioVisibility] = useState<'public' | 'friends'>(character.bioVisibility || 'public');
    const [tramaVisibility, setTramaVisibility] = useState<'public' | 'friends'>(character.tramaVisibility || 'friends');
    const [personalidadVisibility, setPersonalidadVisibility] = useState<'public' | 'friends'>(character.personalidadVisibility || 'friends');
    const [extrasVisibility, setExtrasVisibility] = useState<'public' | 'friends'>(character.extrasVisibility || 'friends');
    const [linksVisibility, setLinksVisibility] = useState<'public' | 'friends'>(character.linksVisibility || 'public');

    // Estados para bloqueos
    const [blockedCharacters, setBlockedCharacters] = useState<string[]>(character.blockedCharacters || []);

    const [editingBio, setEditingBio] = useState(false);
    const [editingTrama, setEditingTrama] = useState(false);
    const [editingPersonalidad, setEditingPersonalidad] = useState(false);
    const [editingExtras, setEditingExtras] = useState(false);
    const [editingTags, setEditingTags] = useState(false);
    const [editingLinks, setEditingLinks] = useState(false);
    const [editingAvatar, setEditingAvatar] = useState(false);
    const [saving, setSaving] = useState(false);

    // Estados para nuevos items
    const [newTag, setNewTag] = useState('');
    const [newLinkName, setNewLinkName] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');

    // Función para guardar configuración de visibilidad
    const handleVisibilityChange = async (field: string, visibility: 'public' | 'friends') => {
        try {
            const characterRef = ref(db, `characters/${character.id}`);
            const visibilityField = `${field}Visibility`;
            
            await update(characterRef, { [visibilityField]: visibility });
            
            // Actualizar estado local
            if (field === 'bio') setBioVisibility(visibility);
            if (field === 'trama') setTramaVisibility(visibility);
            if (field === 'personalidad') setPersonalidadVisibility(visibility);
            if (field === 'extras') setExtrasVisibility(visibility);
            if (field === 'links') setLinksVisibility(visibility);
            
            console.log(`Visibilidad de ${field} actualizada a ${visibility}`);
        } catch (error) {
            console.error('Error al cambiar visibilidad:', error);
            alert('Error al cambiar visibilidad');
        }
    };

    // Función para bloquear/desbloquear personaje
    const handleBlockCharacter = async (characterId: string, block: boolean) => {
        try {
            const characterRef = ref(db, `characters/${character.id}`);
            let updatedBlocked: string[];
            
            if (block) {
                updatedBlocked = [...blockedCharacters, characterId];
            } else {
                updatedBlocked = blockedCharacters.filter(id => id !== characterId);
            }
            
            await update(characterRef, { blockedCharacters: updatedBlocked });
            setBlockedCharacters(updatedBlocked);
            
            console.log(`Personaje ${block ? 'bloqueado' : 'desbloqueado'}`);
        } catch (error) {
            console.error('Error al bloquear/desbloquear:', error);
            alert('Error al actualizar bloqueo');
        }
    };

    // Función real de guardado con Firebase
    const handleSave = async (field: string, value: any) => {
        setSaving(true);
        try {
            const characterRef = ref(db, `characters/${character.id}`);
            
            // Mapear field a los nombres correctos en la base de datos
            let updateField = field;
            if (field === 'bio') updateField = 'biography';
            if (field === 'avatar') updateField = 'avatarUrl';
            
            await update(characterRef, { [updateField]: value });
            
            // Actualizar los estados locales
            if (field === 'bio') setBio(value);
            if (field === 'trama') setTrama(value);
            if (field === 'personalidad') setPersonalidad(value);
            if (field === 'extras') setExtras(value);
            if (field === 'tags') setTags(value);
            if (field === 'socialLinks') setSocialLinks(value);
            if (field === 'avatar') setAvatarUrl(value);
            
            // Cerrar modo edición
            setEditingBio(false);
            setEditingTrama(false);
            setEditingPersonalidad(false);
            setEditingExtras(false);
            setEditingTags(false);
            setEditingLinks(false);
            setEditingAvatar(false);

            console.log(`Campo ${updateField} guardado exitosamente`);
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('Error al guardar. Por favor intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    // Funciones para manejar etiquetas
    const addTag = () => {
        if (!newTag.trim()) return;
        
        let tagText = newTag.trim();
        if (!tagText.startsWith('#')) {
            tagText = '#' + tagText;
        }
        
        if (!tags.includes(tagText) && tags.length < 10) {
            const updatedTags = [...tags, tagText];
            setTags(updatedTags);
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        const updatedTags = tags.filter(tag => tag !== tagToRemove);
        setTags(updatedTags);
    };

    // Funciones para manejar enlaces
    const addLink = () => {
        if (newLinkName.trim() && newLinkUrl.trim()) {
            const updatedLinks = [...socialLinks, { name: newLinkName.trim(), url: newLinkUrl.trim() }];
            setSocialLinks(updatedLinks);
            setNewLinkName('');
            setNewLinkUrl('');
        }
    };

    const removeLink = (indexToRemove: number) => {
        const updatedLinks = socialLinks.filter((_, index) => index !== indexToRemove);
        setSocialLinks(updatedLinks);
    };

    return (
        <div className="space-y-8">
            <Tabs value="ficha">
            <div className="flex justify-center gap-8 border-b border-border pb-2 w-full">
            <TabsTrigger value="ficha">Ficha del Personaje</TabsTrigger>
            <a 
                href={`/dashboard/characters/${character.id}/ficha/conexiones`}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground rounded-sm transition-colors"
            >
                Conexiones
            </a>
            </div>

            <TabsContent value="ficha">
            <div className="space-y-8">
            <div className="grid gap-8 md:grid-cols-12">
                {/* Barra lateral */}
                <div className="md:col-span-4 lg:col-span-3 space-y-6">
                {/* About Me */}
                <Card>
                    <CardHeader>
                    <CardTitle>About me</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    {isOwner && (
                        <VisibilitySelector 
                            value={bioVisibility} 
                            onChange={(value) => handleVisibilityChange('bio', value)} 
                        />
                    )}
                    {editingBio ? (
                        <div className="space-y-2">
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="w-full p-2 border rounded text-sm"
                        />
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                onClick={() => handleSave('bio', bio)}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-3 w-3 mr-2" />
                                        Guardar
                                    </>
                                )}
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditingBio(false)}
                                disabled={saving}
                            >
                                <X className="h-3 w-3 mr-2" />
                                Cancelar
                            </Button>
                        </div>
                        </div>
                    ) : (
                        <>
                        <p className="text-sm text-muted-foreground">
                        {bio || 'No hay biografía definida.'}
                        </p>
                        {isOwner && (
                            <Button variant="ghost" size="sm" onClick={() => setEditingBio(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                            </Button>
                        )}
                        </>
                    )}
                    </CardContent>
                </Card>

                {/* Enlaces sociales */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Enlaces</CardTitle>
                    {isOwner && !editingLinks && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingLinks(true)}>
                        <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                    {isOwner && (
                        <VisibilitySelector 
                            value={linksVisibility} 
                            onChange={(value) => handleVisibilityChange('links', value)} 
                        />
                    )}
                    {editingLinks ? (
                        <div className="space-y-4">
                        {socialLinks.map((link, index) => (
                            <div key={index} className="space-y-2">
                            <Input
                                value={link.name}
                                onChange={(e) => {
                                const newLinks = [...socialLinks];
                                newLinks[index].name = e.target.value;
                                setSocialLinks(newLinks);
                                }}
                                placeholder="Nombre del enlace..."
                            />
                            <div className="flex items-center gap-2">
                                <Input
                                value={link.url}
                                onChange={(e) => {
                                    const newLinks = [...socialLinks];
                                    newLinks[index].url = e.target.value;
                                    setSocialLinks(newLinks);
                                }}
                                placeholder="URL del enlace..."
                                className="flex-1"
                                />
                                <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLink(index)}
                                className="flex-shrink-0"
                                >
                                <X className="h-4 w-4" />
                                </Button>
                            </div>
                            </div>
                        ))}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={addLink}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar enlace
                        </Button>
                        <div className="flex gap-2">
                            <Button 
                            size="sm" 
                            onClick={() => handleSave('socialLinks', socialLinks)}
                            disabled={saving}
                            >
                            {saving ? 'Guardando...' : 'Guardar'}
                            </Button>
                            <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingLinks(false)}
                            disabled={saving}
                            >
                            Cancelar
                            </Button>
                        </div>
                        </div>
                    ) : (
                        <>
                        {socialLinks.length > 0 ? (
                            <div className="space-y-2">
                            {socialLinks.map((link, index) => (
                                <a
                                key={index}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                <ExternalLink className="h-3 w-3" />
                                {link.name}
                                </a>
                            ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No hay enlaces definidos.</p>
                        )}
                        </>
                    )}
                    </CardContent>
                </Card>

                {/* Sistema de bloqueos - Solo para el propietario */}
                {isOwner && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Mis Bloqueos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {blockedCharacters.length > 0 ? (
                                <div className="space-y-2">
                                    {blockedCharacters.map((blockedId) => (
                                        <div key={blockedId} className="flex items-center justify-between p-2 bg-muted rounded">
                                            <span className="text-sm">Personaje bloqueado</span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleBlockCharacter(blockedId, false)}
                                            >
                                                Desbloquear
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No has bloqueado a ningún personaje.</p>
                            )}
                        </CardContent>
                    </Card>
                )}
                </div>

                {/* Contenido principal */}
                <div className="md:col-span-8 lg:col-span-9 space-y-6">
                {/* Avatar y datos básicos */}
                <Card>
                    <CardHeader>
                    <CardTitle>Información del Personaje</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div className="md:col-span-2 flex items-center justify-center">
                        {isOwner ? (
                            <div className="relative group">
                                <div
                                    className="w-32 h-32 rounded-full bg-cover bg-center border-4 border-primary/20 cursor-pointer group-hover:border-primary transition-colors"
                                    style={{ backgroundImage: `url(${character.avatarUrl})` }}
                                    onClick={() => setEditingAvatar(!editingAvatar)}
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                     onClick={() => setEditingAvatar(!editingAvatar)}>
                                    <Edit className="w-6 h-6 text-white" />
                                </div>
                                {editingAvatar && (
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 p-4 bg-background border border-border rounded-lg shadow-lg z-10 w-80">
                                        <ImageUpload
                                            value={avatarUrl}
                                            onChange={(url) => setAvatarUrl(url)}
                                            variant="avatar"
                                            folder="characters/avatars"
                                            placeholder="Subir nueva foto"
                                        />
                                        <div className="flex gap-2 mt-4">
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleSave('avatar', avatarUrl)}
                                                disabled={saving}
                                            >
                                                {saving ? 'Guardando...' : 'Guardar'}
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => setEditingAvatar(false)}
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Avatar className="w-32 h-32">
                                <AvatarImage src={character.avatarUrl} />
                                <AvatarFallback className="text-2xl">{character.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        </div>
                        <div className="md:col-span-3 space-y-3">
                        <div>
                            <h2 className="text-2xl font-bold">{character.name}</h2>
                            <p className="text-muted-foreground">@{character.username}</p>
                        </div>
                        {character.age && <p><strong>Edad:</strong> {character.age} años</p>}
                        {character.nationality && <p><strong>Nacionalidad:</strong> {character.nationality}</p>}
                        {character.sexuality && <p><strong>Orientación:</strong> {character.sexuality}</p>}
                        {character.zodiac && <p><strong>Signo:</strong> {character.zodiac}</p>}
                        {character.mbti && <p><strong>MBTI:</strong> {character.mbti}</p>}
                        </div>
                    </div>
                    </CardContent>
                </Card>

                {/* Historia */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Historia</CardTitle>
                    {isOwner && !editingTrama && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingTrama(true)}>
                        <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    </CardHeader>
                    <CardContent>
                    {isOwner && (
                        <VisibilitySelector 
                            value={tramaVisibility} 
                            onChange={(value) => handleVisibilityChange('trama', value)} 
                        />
                    )}
                    {editingTrama ? (
                        <div className="space-y-2">
                        <textarea
                            value={trama}
                            onChange={(e) => setTrama(e.target.value)}
                            rows={8}
                            className="w-full p-2 border rounded text-sm"
                        />
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                onClick={() => handleSave('trama', trama)}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditingTrama(false)}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>
                        </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {trama || 'No hay historia definida.'}
                        </p>
                    )}
                    </CardContent>
                </Card>

                {/* Personalidad */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Personalidad</CardTitle>
                    {isOwner && !editingPersonalidad && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingPersonalidad(true)}>
                        <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    </CardHeader>
                    <CardContent>
                    {isOwner && (
                        <VisibilitySelector 
                            value={personalidadVisibility} 
                            onChange={(value) => handleVisibilityChange('personalidad', value)} 
                        />
                    )}
                    {editingPersonalidad ? (
                        <div className="space-y-2">
                        <textarea
                            value={personalidad}
                            onChange={(e) => setPersonalidad(e.target.value)}
                            rows={6}
                            className="w-full p-2 border rounded text-sm"
                        />
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                onClick={() => handleSave('personalidad', personalidad)}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditingPersonalidad(false)}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>
                        </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {personalidad || 'No hay personalidad definida.'}
                        </p>
                    )}
                    </CardContent>
                </Card>

                {/* Extras */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Extras</CardTitle>
                    {isOwner && !editingExtras && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingExtras(true)}>
                        <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    </CardHeader>
                    <CardContent>
                    {isOwner && (
                        <VisibilitySelector 
                            value={extrasVisibility} 
                            onChange={(value) => handleVisibilityChange('extras', value)} 
                        />
                    )}
                    {editingExtras ? (
                        <div className="space-y-2">
                        <textarea
                            value={extras}
                            onChange={(e) => setExtras(e.target.value)}
                            rows={6}
                            className="w-full p-2 border rounded text-sm"
                        />
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                onClick={() => handleSave('extras', extras)}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditingExtras(false)}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>
                        </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {extras || 'No hay extras definidos.'}
                        </p>
                    )}
                    </CardContent>
                </Card>

                {/* Etiquetas */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Etiquetas</CardTitle>
                    {isOwner && !editingTags && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingTags(true)}>
                        <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    </CardHeader>
                    <CardContent>
                    {editingTags ? (
                        <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                            <div key={index} className="flex items-center gap-1">
                                <Badge variant="secondary">{tag}</Badge>
                                <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTag(tag)}
                                className="h-6 w-6 p-0"
                                >
                                <X className="h-3 w-3" />
                                </Button>
                            </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Nueva etiqueta..."
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                            />
                            <Button size="sm" onClick={addTag}>
                            Agregar
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                            size="sm" 
                            onClick={() => handleSave('tags', tags)}
                            disabled={saving}
                            >
                            {saving ? 'Guardando...' : 'Guardar'}
                            </Button>
                            <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingTags(false)}
                            disabled={saving}
                            >
                            Cancelar
                            </Button>
                        </div>
                        </div>
                    ) : (
                        <>
                        {tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                                <Badge key={index} variant="secondary">{tag}</Badge>
                            ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No hay etiquetas definidas.</p>
                        )}
                        </>
                    )}
                    </CardContent>
                </Card>
                </div>
            </div>
            </div>
            </TabsContent>
            </Tabs>
        </div>
    );
}
