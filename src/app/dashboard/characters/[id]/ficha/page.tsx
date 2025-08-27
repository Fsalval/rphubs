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
import { Edit, Save, X, Plus, ExternalLink } from 'lucide-react';
import { useCharacter } from '../layout';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';

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
            setEditingBanner(false);
            
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
        // Asegurar que empiece con #
        if (!tagText.startsWith('#')) {
            tagText = '#' + tagText;
        }
        
        // Validar que no exista ya y que no supere el límite
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
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {bio || 'No hay biografía definida.'}
                        </p>
                        {isOwner && (
                            <Button variant="outline" size="sm" onClick={() => setEditingBio(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                            </Button>
                        )}
                        </>
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
                            onClick={() => setEditingTags(false)}
                            disabled={saving}
                            >
                            <X className="h-3 w-3 mr-2" />
                            Cancelar
                            </Button>
                        </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                        {tags.length > 0 ? (
                            tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary">
                                {tag}
                            </Badge>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No hay etiquetas.</p>
                        )}
                        </div>
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
                            onClick={() => setEditingLinks(false)}
                            disabled={saving}
                            >
                            <X className="h-3 w-3 mr-2" />
                            Cancelar
                            </Button>
                        </div>
                        </div>
                    ) : (
                        <>
                        {socialLinks.length > 0 ? (
                            socialLinks.map((link: any, i: number) => (
                            <div key={i}>
                                <p className="text-sm text-muted-foreground">{link.name}</p>
                                <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline block text-sm"
                                >
                                {link.username || link.url}
                                </a>
                            </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No hay enlaces definidos.</p>
                        )}
                        </>
                    )}
                    </CardContent>
                </Card>
                </div>

                {/* Contenido principal */}
                <div className="md:col-span-8 lg:col-span-9 space-y-6">
                {/* Ficha principal - Solo lectura */}
                <Card>
                    <CardHeader>
                    <CardTitle>Ficha del Personaje</CardTitle>
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
                            <div
                                className="w-32 h-32 rounded-full bg-cover bg-center border-4 border-primary/20"
                                style={{ backgroundImage: `url(${character.avatarUrl})` }}
                            />
                        )}
                        </div>
                        <div className="md:col-span-3">
                        <p><strong>Nombre:</strong> {character.name}</p>
                        <p><strong>Edad:</strong> {character.age || 'No definida'}</p>
                        <p><strong>Nacionalidad:</strong> {character.nationality || 'No definida'}</p>
                        <p><strong>Género:</strong> {character.gender || 'No definido'}</p>
                        {character.birthDate && <p><strong>Fecha de nacimiento:</strong> {character.birthDate}</p>}
                        {character.zodiac && <p><strong>Signo:</strong> {character.zodiac}</p>}
                        {character.mbti && <p><strong>MBTI:</strong> {character.mbti}</p>}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Nota:</strong> El nombre y fecha de nacimiento se editan desde la configuración del personaje (máximo 2 cambios por mes).
                            </p>
                        </div>
                        </div>
                    </div>
                    </CardContent>
                </Card>


                {/* Trama */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Trama</CardTitle>
                    {isOwner && !editingTrama && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingTrama(true)}>
                        <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    </CardHeader>
                    <CardContent>
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
                                onClick={() => setEditingTrama(false)}
                                disabled={saving}
                            >
                                <X className="h-3 w-3 mr-2" />
                                Cancelar
                            </Button>
                        </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {trama || 'No hay trama definida.'}
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
                                onClick={() => setEditingPersonalidad(false)}
                                disabled={saving}
                            >
                                <X className="h-3 w-3 mr-2" />
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
                                onClick={() => setEditingExtras(false)}
                                disabled={saving}
                            >
                                <X className="h-3 w-3 mr-2" />
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
                </div>
            </div>
            </div>
            </TabsContent>

            {/* Pestaña: Conexiones */}
            <TabsContent value="conexiones">
            <div className="space-y-6">
            <div className="grid gap-8 md:grid-cols-12">
                {/* Barra lateral */}
                <div className="md:col-span-4 lg:col-span-3 space-y-6">
                {/* About Me */}
                <Card>
                    <CardHeader>
                    <CardTitle>About me</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
                        {bio || 'No hay biografía definida.'}
                    </p>
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
                            onClick={() => setEditingTags(false)}
                            disabled={saving}
                            >
                            <X className="h-3 w-3 mr-2" />
                            Cancelar
                            </Button>
                        </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                        {tags.length > 0 ? (
                            tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No hay etiquetas.</p>
                        )}
                        </div>
                    )}
                    </CardContent>
                </Card>

                {/* Enlaces */}
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
                            onClick={() => setEditingLinks(false)}
                            disabled={saving}
                            >
                            <X className="h-3 w-3 mr-2" />
                            Cancelar
                            </Button>
                        </div>
                        </div>
                    ) : (
                        <>
                        {socialLinks.length > 0 ? (
                            socialLinks.map((link: any, i: number) => (
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