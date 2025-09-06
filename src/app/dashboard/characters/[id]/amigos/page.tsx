// src/app/dashboard/characters/[id]/amigos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, Users, MessageSquare, User } from 'lucide-react';
import { ref, onValue, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useCharacter } from '../layout';
import Link from 'next/link';

interface Amigo {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  lastActivity?: string;
  friendSince?: string;
}

interface SolicitudAmistad {
  id: string;
  fromCharacterId: string;
  fromCharacterName: string;
  fromCharacterAvatar?: string;
  timestamp: number;
}

export default function AmigosPage() {
  const { character } = useCharacter();
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<SolicitudAmistad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
            friendsList.push({
              id: friendId,
              name: friendData.name,
              username: friendData.username,
              avatar: friendData.avatarUrl,
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

  // Filtrar amigos por búsqueda
  const amigosFiltrados = amigos.filter(amigo => {
    return (
      amigo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      amigo.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar amigos por nombre o username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {amigosFiltrados.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {amigos.length === 0 ? 'No tienes amigos aún' : 'No se encontraron amigos'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {amigos.length === 0 
                      ? 'Comienza a conectar con otros personajes.'
                      : 'Intenta ajustar tu búsqueda.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {amigosFiltrados.map((amigo) => (
                    <div key={amigo.id} className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition">
                      <Avatar className="w-20 h-20 mb-3">
                        <AvatarImage src={amigo.avatar} />
                        <AvatarFallback className="text-xl font-bold">
                          {amigo.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-center">{amigo.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">@{amigo.username}</p>
                      <p className="text-xs text-gray-400 mb-3">
                        Amigos desde {new Date(amigo.friendSince).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 w-full">
                        <Link href={`/dashboard/characters/${amigo.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            <User className="w-4 h-4 mr-1" />
                            Ver Perfil
                          </Button>
                        </Link>
                        <Link href={`/dashboard/characters/${character.id}/messages?chat=${amigo.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Mensaje
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solicitudes">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de amistad</CardTitle>
            </CardHeader>
            <CardContent>
              {solicitudesPendientes.length === 0 ? (
                <div className="p-8 text-center">
                  <UserPlus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay solicitudes pendientes</h3>
                  <p className="text-gray-500">
                    Las solicitudes de amistad que recibas aparecerán aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {solicitudesPendientes.map((solicitud) => (
                    <div key={solicitud.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={solicitud.fromCharacterAvatar} />
                          <AvatarFallback className="text-lg font-bold">
                            {solicitud.fromCharacterName?.charAt(0)}
                          </AvatarFallback>
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
                          Aceptar
                        </Button>
                        <Button variant="outline" size="sm">
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
