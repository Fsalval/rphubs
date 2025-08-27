// src/app/characters/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, MessageSquare, Calendar, MapPin } from 'lucide-react';
import { ref, onValue, get, push } from 'firebase/database';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface Character {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bannerUrl?: string;
  biography?: string;
  age?: number;
  gender?: string;
  nationality?: string;
  tags?: string[];
  socialLinks?: any[];
  visibility: 'public' | 'private';
  lastActive?: string;
}

export default function PublicCharacterPage() {
  const { id } = useParams();
  const characterId = Array.isArray(id) ? id[0] : id;
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) return;

    const characterRef = ref(db, `characters/${characterId}`);
    onValue(characterRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.visibility === 'private') {
          setError('Este personaje es privado');
        } else {
          setCharacter({ id: characterId, ...data });
        }
      } else {
        setError('Personaje no encontrado');
      }
      setLoading(false);
    });
  }, [characterId]);

  const handleSendFriendRequest = async () => {
    // TODO: Necesitaríamos saber el ID del personaje actual del usuario
    // Por ahora solo console.log
    console.log('Enviar solicitud de amistad a', character?.id);
    // En una implementación real, necesitaríamos el contexto del usuario actual
  };

  const handleStartChat = async () => {
    // TODO: Necesitaríamos saber el ID del personaje actual del usuario
    // Por ahora solo console.log 
    console.log('Iniciar chat con', character?.id);
    // En una implementación real, redirigir a /dashboard/characters/[currentCharId]/messages?with=[targetCharId]
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Personaje no disponible</h1>
          <p className="text-muted-foreground mb-4">{error || 'No se pudo cargar el personaje'}</p>
          <Link href="/dashboard">
            <Button>Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Banner */}
      {character.bannerUrl && (
        <div className="h-64 w-full relative">
          <img
            src={character.bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-12">
          {/* Sidebar */}
          <div className="md:col-span-4 space-y-6">
            {/* Información principal */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={character.avatarUrl} />
                    <AvatarFallback className="text-2xl font-bold">
                      {character.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold">{character.name}</h1>
                    <p className="text-muted-foreground">@{character.username}</p>
                    {character.lastActive && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-4 w-4" />
                        Última actividad: {new Date(character.lastActive).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleSendFriendRequest} className="flex-1">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar amigo
                  </Button>
                  <Button onClick={handleStartChat} variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Mensaje
                  </Button>
                </div>

                {/* Información básica */}
                <div className="space-y-2 text-sm">
                  {character.age && (
                    <p><strong>Edad:</strong> {character.age} años</p>
                  )}
                  {character.gender && (
                    <p><strong>Género:</strong> {character.gender}</p>
                  )}
                  {character.nationality && (
                    <p className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {character.nationality}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>Acerca de</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {character.biography || 'No hay biografía disponible.'}
                </p>
              </CardContent>
            </Card>

            {/* Etiquetas */}
            {character.tags && character.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Etiquetas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {character.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enlaces sociales */}
            {character.socialLinks && character.socialLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Enlaces</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {character.socialLinks.map((link, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium">{link.name}</p>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline text-sm"
                      >
                        {link.username || link.url}
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contenido principal */}
          <div className="md:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Muro público</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>El muro público estará disponible próximamente</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}