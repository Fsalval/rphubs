'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Button } from '../../../../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../../components/ui/avatar';
import { Badge } from '../../../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { Search, UserPlus, Users, Clock, Check, X } from 'lucide-react';
import { ref, onValue, set, remove, get } from 'firebase/database';
import { db } from '../../../../../lib/firebase';
import { useCharacter } from '../layout';

interface Amigo {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  gender?: string;
  age?: number;
  mbti?: string;
  nationality?: string;
  lastActivity?: string;
  isOnline?: boolean;
  friendSince?: string;
}

interface SolicitudAmistad {
  id: string;
  fromCharacterId: string;
  toCharacterId: string;
  fromCharacterName: string;
  toCharacterName: string;
  fromCharacterAvatar?: string;
  toCharacterAvatar?: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export default function AmigosPage() {
  const { character } = useCharacter();
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<SolicitudAmistad[]>([]);
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<SolicitudAmistad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('todos');
  const [filtroEdad, setFiltroEdad] = useState('todos');
  const [filtroMBTI, setFiltroMBTI] = useState('todos');
  const [ordenar, setOrdenar] = useState('nombre');

  useEffect(() => {
    if (!character?.id) return;
    
    const friendsRef = ref(db, `characters/${character.id}/friends`);
    const unsubscribe = onValue(friendsRef, async (snapshot) => {
      const friendsData = snapshot.val();
      if (friendsData) {
        const friendsList = [];
        for (const friendId of Object.keys(friendsData)) {
          const friendSnapshot = await get(ref(db, `characters/${friendId}`));
          if (friendSnapshot.exists()) {
            const friendData = friendSnapshot.val();
            const age = friendData.birthDate 
              ? Math.floor((new Date().getTime() - new Date(friendData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : undefined;
            
            friendsList.push({
              id: friendId,
              name: friendData.name,
              username: friendData.username,
              avatar: friendData.avatarUrl,
              gender: friendData.gender,
              age,
              mbti: friendData.mbti,
              nationality: friendData.nationality,
              friendSince: friendsData[friendId].since || new Date().toISOString()
            });
          }
        }
        setAmigos(friendsList);
      } else {
        setAmigos([]);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [character?.id]);

  // Cargar solicitudes pendientes (recibidas)
  useEffect(() => {
    if (!character?.id) return;

    const requestsRef = ref(db, `friendRequests/${character.id}`);
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const requestsData = snapshot.val();
      if (requestsData) {
        const pendientes = Object.entries(requestsData)
          .filter(([, request]: any) => request.status === 'pending')
          .map(([senderId, request]: any) => ({
            id: senderId,
            ...request
          }));
        setSolicitudesPendientes(pendientes);
      } else {
        setSolicitudesPendientes([]);
      }
    });

    return () => unsubscribe();
  }, [character?.id]);

  // Filtrar amigos
  const amigosFiltrados = amigos.filter(amigo => {
    const matchesSearch = amigo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         amigo.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = filtroGenero === 'todos' || amigo.gender === filtroGenero;
    const matchesAge = filtroEdad === 'todos' || 
      (filtroEdad === 'menor18' && amigo.age && amigo.age < 18) ||
      (filtroEdad === '18-25' && amigo.age && amigo.age >= 18 && amigo.age <= 25) ||
      (filtroEdad === '26-35' && amigo.age && amigo.age >= 26 && amigo.age <= 35) ||
      (filtroEdad === 'mayor35' && amigo.age && amigo.age > 35);
    const matchesMBTI = filtroMBTI === 'todos' || amigo.mbti === filtroMBTI;
    
    return matchesSearch && matchesGender && matchesAge && matchesMBTI;
  });

  // Ordenar amigos
  const amigosOrdenados = [...amigosFiltrados].sort((a, b) => {
    switch (ordenar) {
      case 'nombre':
        return (a.name || '').localeCompare(b.name || '');
      case 'edad':
        return (a.age || 0) - (b.age || 0);
      case 'reciente':
        return new Date(b.friendSince || 0).getTime() - new Date(a.friendSince || 0).getTime();
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando amigos...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Amigos</h1>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span className="font-medium">{amigos.length} amigos</span>
        </div>
      </div>

      <div className="w-full">
        <Tabs defaultValue="amigos">
          <TabsList>
            <TabsTrigger value="amigos" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Mis Amigos ({amigos.length})
            </TabsTrigger>
            <TabsTrigger value="solicitudes" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Solicitudes ({solicitudesPendientes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="amigos">
            <div className="space-y-4">
              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Filtros y Búsqueda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nombre o username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Select value={filtroGenero} onValueChange={setFiltroGenero}>
                      <SelectTrigger>
                        <SelectValue placeholder="Género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="no-binario">No binario</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filtroEdad} onValueChange={setFiltroEdad}>
                      <SelectTrigger>
                        <SelectValue placeholder="Edad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas</SelectItem>
                        <SelectItem value="menor18">Menor 18</SelectItem>
                        <SelectItem value="18-25">18-25</SelectItem>
                        <SelectItem value="26-35">26-35</SelectItem>
                        <SelectItem value="mayor35">Mayor 35</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filtroMBTI} onValueChange={setFiltroMBTI}>
                      <SelectTrigger>
                        <SelectValue placeholder="MBTI" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {[...new Set(amigos.map(a => a.mbti).filter(Boolean))].map(mbti => (
                          <SelectItem key={mbti} value={mbti!}>{mbti}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={ordenar} onValueChange={setOrdenar}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nombre">Nombre</SelectItem>
                        <SelectItem value="edad">Edad</SelectItem>
                        <SelectItem value="reciente">Más reciente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {amigosOrdenados.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {amigos.length === 0 ? 'No tienes amigos aún' : 'No se encontraron amigos'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {amigos.length === 0 
                        ? 'Comienza a conectar con otros personajes para expandir tu red de amigos.'
                        : 'Intenta ajustar los filtros para encontrar a tus amigos.'
                      }
                    </p>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Buscar amigos
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {amigosOrdenados.map((amigo) => (
                    <Card key={amigo.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={amigo.avatar} />
                            <AvatarFallback>{amigo.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{amigo.name}</h3>
                            <p className="text-sm text-gray-500">@{amigo.username}</p>
                            
                            <div className="flex flex-wrap gap-1 mt-2">
                              {amigo.age && (
                                <Badge variant="secondary" className="text-xs">
                                  {amigo.age} años
                                </Badge>
                              )}
                              {amigo.gender && (
                                <Badge variant="secondary" className="text-xs">
                                  {amigo.gender}
                                </Badge>
                              )}
                              {amigo.mbti && (
                                <Badge variant="secondary" className="text-xs">
                                  {amigo.mbti}
                                </Badge>
                              )}
                            </div>

                            <div className="flex gap-2 mt-3">
                              <Button size="sm" variant="outline">
                                Ver Perfil
                              </Button>
                              <Button size="sm" variant="outline">
                                Mensaje
                              </Button>
                            </div>

                            <p className="text-xs text-gray-400 mt-2">
                              Amigos desde {new Date(amigo.friendSince || '').toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="solicitudes">
            <div className="space-y-4">
              {solicitudesPendientes.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <UserPlus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay solicitudes pendientes</h3>
                    <p className="text-gray-500">
                      Las solicitudes de amistad que recibas aparecerán aquí.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {solicitudesPendientes.map((solicitud) => (
                    <Card key={solicitud.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={solicitud.fromCharacterAvatar} />
                              <AvatarFallback>{solicitud.fromCharacterName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{solicitud.fromCharacterName}</h3>
                              <p className="text-sm text-gray-500">
                                Enviada hace {Math.floor((Date.now() - solicitud.timestamp) / (1000 * 60 * 60 * 24))} días
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm">
                              <Check className="w-4 h-4 mr-1" />
                              Aceptar
                            </Button>
                            <Button variant="outline" size="sm">
                              <X className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
