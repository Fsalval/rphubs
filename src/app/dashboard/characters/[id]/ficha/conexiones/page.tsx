'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../../../components/ui/avatar';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';
import { ScrollArea } from '../../../../../../components/ui/scroll-area';
import { Input } from '../../../../../../components/ui/input';
import { Textarea } from '../../../../../../components/ui/textarea';
import { Label } from '../../../../../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../../components/ui/tabs';
import { Plus, ExternalLink, X, User, Users, Link as LinkIcon } from 'lucide-react';
import { useCharacter } from '../../layout';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { db } from '../../../../../../lib/firebase';
import { Character } from '../../../../../../lib/types';

interface Connection {
  id: string;
  name: string;
  relation: string;
  description: string;
  type?: 'manual' | 'linked';
  linkedCharacterId?: string;
  age?: number;
  nationality?: string;
}

export default function ConexionesPage() {
    const { character, isOwner, allCharacters } = useCharacter();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [loading, setLoading] = useState(true);

    // Estados para nuevo formulario
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<'manual' | 'linked'>('manual');
    const [newName, setNewName] = useState('');
    const [newAge, setNewAge] = useState('');
    const [newNationality, setNewNationality] = useState('');
    const [newRelation, setNewRelation] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [linkedCharId, setLinkedCharId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);

    // Cargar conexiones desde Firebase
    useEffect(() => {
        if (!character?.id) return;

        const connectionsRef = ref(db, `characters/${character.id}/connections`);
        const unsubscribe = onValue(connectionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const connectionsArray = Object.entries(data)
            .map(([key, value]: [string, any]) => ({ id: key, ...value }))
            .sort((a, b) => a.name.localeCompare(b.name));
            setConnections(connectionsArray);
            setSelectedConnection(connectionsArray[0] || null);
        } else {
            setConnections([]);
            setSelectedConnection(null);
        }
        setLoading(false);
        });

        return () => unsubscribe();
    }, [character?.id]);

    // Filtrar personajes para vincular
    const filteredCharacters = searchQuery
        ? allCharacters.filter((c: any) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    // Crear nueva conexión
    const handleCreate = async () => {
        if (!newName.trim() || !newRelation.trim()) return;
        if (formType === 'manual' && newDescription.length > 1000) {
        alert('La descripción no puede superar los 1000 caracteres.');
        return;
        }

        setSaving(true);
        try {
        const connectionsRef = ref(db, `characters/${character.id}/connections`);
        const newConnectionRef = push(connectionsRef);

        const connectionData = {
            id: newConnectionRef.key,
            name: newName.trim(),
            relation: newRelation.trim(),
            description: newDescription.trim(),
        };

        if (formType === 'manual') {
            Object.assign(connectionData, {
            type: 'manual',
            age: newAge ? parseInt(newAge, 10) : null,
            nationality: newNationality.trim(),
            linkedCharacterId: null,
            });
        } else {
            Object.assign(connectionData, {
            type: 'linked',
            linkedCharacterId: linkedCharId,
            });
        }

        await update(newConnectionRef, connectionData);

        const newConnection = { ...connectionData, id: newConnectionRef.key };
        setConnections((prev) => [newConnection, ...prev]);
        setSelectedConnection(newConnection);

        // Reset form
        setShowForm(false);
        setNewName('');
        setNewAge('');
        setNewNationality('');
        setNewRelation('');
        setNewDescription('');
        setLinkedCharId('');
        setSearchQuery('');
        } catch (error) {
        console.error('Error al crear conexión:', error);
        alert('Error al guardar. Intenta de nuevo.');
        } finally {
        setSaving(false);
        }
    };

    // Eliminar conexión
    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta conexión?')) return;

        try {
        const connectionRef = ref(db, `characters/${character.id}/connections/${id}`);
        await remove(connectionRef);
        setConnections((prev) => prev.filter((c) => c.id !== id));
        if (selectedConnection?.id === id) {
            setSelectedConnection(connections.find((c) => c.id !== id) || null);
        }
        } catch (error) {
        console.error('Error al eliminar conexión:', error);
        alert('No se pudo eliminar.');
        }
    };

    // Agrupar por tipo
    const manualConnections = connections.filter(c => c.type === 'manual');
    const linkedConnections = connections.filter(c => c.type === 'linked');

    if (loading) return <div>Cargando conexiones...</div>;

    return (
        <div className="flex gap-6 h-screen overflow-hidden">
        {/* Menú lateral */}
        <div className="w-80 flex-shrink-0 flex flex-col">
            <Card className="h-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Conexiones</CardTitle>
                {isOwner && (
                    <Button size="sm" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4" />
                    </Button>
                )}
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <ScrollArea className="h-[calc(100vh-120px)]">
                <Tabs defaultValue="manual">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="manual">Personas</TabsTrigger>
                    <TabsTrigger value="linked">Personajes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual">
                    {manualConnections.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay personas creadas.</p>
                    ) : (
                        manualConnections.map((conn) => (
                        <div
                            key={conn.id}
                            onClick={() => setSelectedConnection(conn)}
                            className={`p-2 rounded cursor-pointer transition-all text-sm flex items-center gap-2 ${
                            selectedConnection?.id === conn.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            }`}
                        >
                            <Avatar className="h-6 w-6">
                            <AvatarFallback>{conn.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{conn.name}</span>
                        </div>
                        ))
                    )}
                    </TabsContent>

                    <TabsContent value="linked">
                    {linkedConnections.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay personajes vinculados.</p>
                    ) : (
                        linkedConnections.map((conn) => {
                        const linkedChar = allCharacters.find((c: Character) => c.id === conn.linkedCharacterId);
                        return (
                            <div
                            key={conn.id}
                            onClick={() => setSelectedConnection(conn)}
                            className={`p-2 rounded cursor-pointer transition-all text-sm flex items-center gap-2 ${
                                selectedConnection?.id === conn.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            }`}
                            >
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={linkedChar?.avatarUrl} />
                                <AvatarFallback>{linkedChar?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{conn.name}</span>
                            <LinkIcon className="h-3 w-3 text-green-500 ml-auto" />
                            </div>
                        );
                        })
                    )}
                    </TabsContent>
                </Tabs>
                </ScrollArea>
            </CardContent>
            </Card>
        </div>

        {/* Área principal */}
        <div className="flex-1 overflow-y-auto pr-4">
            {showForm ? (
            <Card>
                <CardHeader>
                <CardTitle>Crear nueva conexión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                <Tabs value={formType} onValueChange={(v) => setFormType(v as 'manual' | 'linked')}>
                    <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Persona (ficticia)</TabsTrigger>
                    <TabsTrigger value="linked">Vincular personaje</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Nombre</Label>
                        <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                    </div>
                    <div>
                        <Label>Vínculo</Label>
                        <Input value={newRelation} onChange={(e) => setNewRelation(e.target.value)} placeholder="ej: Madre, amigo cercano..." />
                    </div>
                    </div>

                    {formType === 'manual' ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Edad</Label>
                            <Input
                            type="number"
                            value={newAge}
                            onChange={(e) => setNewAge(e.target.value)}
                            placeholder="Opcional"
                            />
                        </div>
                        <div>
                            <Label>Nacionalidad</Label>
                            <Input
                            value={newNationality}
                            onChange={(e) => setNewNationality(e.target.value)}
                            placeholder="Opcional"
                            />
                        </div>
                        </div>
                        <div>
                        <Label>Descripción (máx. 1000 caracteres)</Label>
                        <Textarea
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            rows={6}
                            maxLength={1000}
                        />
                        <p className="text-sm text-muted-foreground text-right">{newDescription.length}/1000</p>
                        </div>
                    </>
                    ) : (
                    <div>
                        <Label>Seleccionar personaje</Label>
                        <Input
                        placeholder="Buscar por nombre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-2"
                        />
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                        {filteredCharacters.map((char: any) => (
                            <div
                            key={char.id}
                            onClick={() => {
                                setLinkedCharId(char.id);
                                setNewName(char.name);
                            }}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${
                                linkedCharId === char.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            }`}
                            >
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={char.avatarUrl} />
                                <AvatarFallback>{char.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{char.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">@{char.username}</span>
                            </div>
                        ))}
                        {filteredCharacters.length === 0 && searchQuery && (
                            <p className="text-sm text-muted-foreground p-2">No se encontraron personajes.</p>
                        )}
                        </div>
                    </div>
                    )}

                    <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                    <Button onClick={handleCreate} disabled={saving}>
                        {saving ? 'Guardando...' : 'Crear conexión'}
                    </Button>
                    </div>
                </div>
                </CardContent>
            </Card>
            ) : selectedConnection ? (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">{selectedConnection.name}</CardTitle>
                {isOwner && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedConnection.id)}>
                    <X className="h-4 w-4" />
                    </Button>
                )}
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{selectedConnection.relation}</span>
                    {selectedConnection.type === 'linked' && (
                    <>
                        <span>•</span>
                        <LinkIcon className="h-4 w-4 text-green-500" />
                        <span>Vinculado a personaje</span>
                    </>
                    )}
                </div>

                {selectedConnection.type === 'manual' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedConnection.age && (
                        <div>
                        <span className="text-muted-foreground">Edad:</span> {selectedConnection.age} años
                        </div>
                    )}
                    {selectedConnection.nationality && (
                        <div>
                        <span className="text-muted-foreground">Nacionalidad:</span> {selectedConnection.nationality}
                        </div>
                    )}
                    </div>
                ) : (
                    <div>
                    <Badge variant="outline" className="flex items-center gap-1">
                        <LinkIcon className="h-3 w-3 text-green-500" />
                        Personaje vinculado
                    </Badge>
                    <p className="mt-2">
                        Esta conexión apunta al personaje{' '}
                        <a
                        href={`/dashboard/characters/${selectedConnection.linkedCharacterId}/ficha`}
                        target="_blank"
                        className="text-primary hover:underline font-medium"
                        >
                        {selectedConnection.name}
                        </a>.
                    </p>
                    </div>
                )}

                <div>
                    <h3 className="font-medium mb-2">Descripción</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedConnection.description || 'Sin descripción.'}
                    </p>
                </div>
                </CardContent>
            </Card>
            ) : (
            <p className="text-muted-foreground">No hay conexiones. Crea una nueva o selecciona una existente.</p>
            )}
        </div>
        </div>
    );
}