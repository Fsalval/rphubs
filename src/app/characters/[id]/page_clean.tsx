// src/app/characters/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  MessageSquare, 
  UserPlus, 
  UserCheck, 
  BookOpen, 
  FileText,
  Calendar,
  MessageCircle,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, get, push } from 'firebase/database';

interface OtherCharacter {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  age?: number;
  gender?: string;
  nationality?: string;
  biography?: string;
  personality?: string;
  backstory?: string;
  extras?: string;
  likes?: string;
  dislikes?: string;
  hobbies?: string;
  height?: string;
  weight?: string;
  eyeColor?: string;
  hairColor?: string;
  birthDate?: string;
  zodiac?: string;
  mbti?: string;
  tags?: string[];
  socialLinks?: Array<{
    name: string;
    url: string;
    username?: string;
  }>;
}

interface PublicTrama {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
  };
  responseCount: number;
  lastActivity: string;
  tags: string[];
}

export default function PublicCharacterPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [character, setCharacter] = useState<OtherCharacter | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentCharacter, setCurrentCharacter] = useState<any>(null);
  const [publicTramas, setPublicTramas] = useState<PublicTrama[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('tramas');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedCharacter = localStorage.getItem('character');
    
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    if (storedCharacter) {
      setCurrentCharacter(JSON.parse(storedCharacter));
    }
    
    if (characterId) {
      fetchCharacter();
      fetchPublicTramas();
    }
  }, [characterId]);

  const fetchCharacter = async () => {
    try {
      const characterRef = ref(db, `characters/${characterId}`);
      const snapshot = await get(characterRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCharacter({
          id: characterId,
          ...data
        });
        
        // Check friendship status if user is logged in
        if (currentCharacter?.id) {
          checkFriendshipStatus();
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching character:', error);
      setLoading(false);
    }
  };

  const fetchPublicTramas = async () => {
    try {
      const tramasRef = ref(db, 'tramas');
      const snapshot = await get(tramasRef);
      
      if (snapshot.exists()) {
        const tramasData = snapshot.val();
        const publicTramas = Object.entries(tramasData)
          .filter(([_, trama]: [string, any]) => 
            trama.participants?.some((p: any) => p.characterId === characterId) &&
            trama.visibility === 'public'
          )
          .map(([id, trama]: [string, any]) => ({
            id,
            ...trama,
            responseCount: Object.keys(trama.responses || {}).length,
            lastActivity: trama.lastActivity || trama.createdAt || new Date().toISOString()
          }))
          .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
          .slice(0, 5);
        
        setPublicTramas(publicTramas);
      }
    } catch (error) {
      console.error('Error fetching public tramas:', error);
    }
  };

  const checkFriendshipStatus = async () => {
    if (!currentCharacter?.id || !characterId) return;
    
    try {
      // Check if they are friends
      const friendsRef = ref(db, `characters/${currentCharacter.id}/friends`);
      const friendsSnapshot = await get(friendsRef);
      
      if (friendsSnapshot.exists()) {
        const friends = friendsSnapshot.val();
        setIsFriend(Object.values(friends).some((friend: any) => friend.characterId === characterId));
      }
      
      // Check if there's a pending request
      const requestsRef = ref(db, `characters/${characterId}/friendRequests`);
      const requestsSnapshot = await get(requestsRef);
      
      if (requestsSnapshot.exists()) {
        const requests = requestsSnapshot.val();
        setPendingRequest(Object.values(requests).some((request: any) => 
          request.fromCharacterId === currentCharacter.id && request.status === 'pending'
        ));
      }
    } catch (error) {
      console.error('Error checking friendship status:', error);
    }
  };

  const sendFriendRequest = async () => {
    if (!currentCharacter || !character) return;
    
    try {
      const requestsRef = ref(db, `characters/${character.id}/friendRequests`);
      await push(requestsRef, {
        fromCharacterId: currentCharacter.id,
        fromCharacterName: currentCharacter.name,
        fromCharacterAvatar: currentCharacter.avatarUrl,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
      
      setPendingRequest(true);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const goToMessages = () => {
    if (currentCharacter && character) {
      router.push(`/dashboard/characters/${currentCharacter.id}/messages?with=${character.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Personaje no encontrado</h1>
          <Button onClick={() => router.push('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header with back button */}
        <div className="mb-6">
          <Button 
            onClick={() => router.push('/')} 
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al hub
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Character Profile Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={character.avatarUrl} alt={character.name} />
                    <AvatarFallback className="text-2xl">{character.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl">{character.name}</CardTitle>
                <p className="text-muted-foreground">@{character.username}</p>
                
                {/* Action buttons for logged-in users */}
                {currentCharacter && currentCharacter.id !== character.id && (
                  <div className="flex gap-2 mt-4">
                    {isFriend ? (
                      <Button onClick={goToMessages} className="flex-1">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Mensaje
                      </Button>
                    ) : pendingRequest ? (
                      <Button disabled className="flex-1">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Solicitud enviada
                      </Button>
                    ) : (
                      <Button onClick={sendFriendRequest} variant="outline" className="flex-1">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Agregar amigo
                      </Button>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Character Info */}
                <div>
                  <h3 className="font-semibold mb-2">Información básica</h3>
                  <div className="space-y-1 text-sm">
                    {character.age && <p><strong>Edad:</strong> {character.age}</p>}
                    {character.gender && <p><strong>Género:</strong> {character.gender}</p>}
                    {character.nationality && <p><strong>Nacionalidad:</strong> {character.nationality}</p>}
                  </div>
                </div>

                {/* Biography */}
                {character.biography && (
                  <div>
                    <h3 className="font-semibold mb-2">Biografía</h3>
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {character.biography}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {character.tags && character.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Intereses</h3>
                    <div className="flex flex-wrap gap-1">
                      {character.tags.slice(0, 6).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {character.tags.length > 6 && (
                        <Badge variant="secondary" className="text-xs">
                          +{character.tags.length - 6} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {character.socialLinks && character.socialLinks.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Enlaces</h3>
                    <div className="space-y-1">
                      {character.socialLinks.slice(0, 3).map((link: any, index: number) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {link.name || link.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tramas">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Tramas públicas
                </TabsTrigger>
                <TabsTrigger value="ficha">
                  <FileText className="w-4 h-4 mr-2" />
                  Ficha del personaje
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tramas">
                <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Tramas activas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {publicTramas.length > 0 ? (
                      <div className="space-y-4">
                        {publicTramas.map((trama) => (
                          <Card key={trama.id} className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-lg">{trama.name}</CardTitle>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Por {trama.author?.name || 'Autor desconocido'}
                                  </p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              {trama.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {trama.description}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" />
                                    {trama.responseCount} respuesta{trama.responseCount !== 1 ? 's' : ''}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(trama.lastActivity).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              
                              {trama.tags && trama.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {trama.tags.slice(0, 3).map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Este personaje no tiene tramas públicas activas.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                </div>
              </TabsContent>

              <TabsContent value="ficha">
                <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Ficha del personaje
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Información detallada del personaje */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Información personal</h3>
                        <div className="space-y-1 text-sm">
                          <p><strong>Nombre completo:</strong> {character.name}</p>
                          {character.age && <p><strong>Edad:</strong> {character.age} años</p>}
                          {character.birthDate && <p><strong>Fecha de nacimiento:</strong> {character.birthDate}</p>}
                          {character.gender && <p><strong>Género:</strong> {character.gender}</p>}
                          {character.nationality && <p><strong>Nacionalidad:</strong> {character.nationality}</p>}
                          {character.zodiac && <p><strong>Signo zodiacal:</strong> {character.zodiac}</p>}
                          {character.mbti && <p><strong>Tipo MBTI:</strong> {character.mbti}</p>}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">Descripción física</h3>
                        <div className="space-y-1 text-sm">
                          {character.height && <p><strong>Altura:</strong> {character.height}</p>}
                          {character.weight && <p><strong>Peso:</strong> {character.weight}</p>}
                          {character.eyeColor && <p><strong>Color de ojos:</strong> {character.eyeColor}</p>}
                          {character.hairColor && <p><strong>Color de cabello:</strong> {character.hairColor}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Biografía extendida */}
                    {character.biography && (
                      <div>
                        <h3 className="font-semibold mb-2">Biografía</h3>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-line">
                            {character.biography}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Personalidad */}
                    {character.personality && (
                      <div>
                        <h3 className="font-semibold mb-2">Personalidad</h3>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-line">
                            {character.personality}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Gustos y aficiones */}
                    {(character.likes || character.dislikes || character.hobbies) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {character.likes && (
                          <div>
                            <h4 className="font-medium mb-2 text-green-700">Le gusta</h4>
                            <p className="text-sm text-muted-foreground">{character.likes}</p>
                          </div>
                        )}
                        {character.dislikes && (
                          <div>
                            <h4 className="font-medium mb-2 text-red-700">No le gusta</h4>
                            <p className="text-sm text-muted-foreground">{character.dislikes}</p>
                          </div>
                        )}
                        {character.hobbies && (
                          <div>
                            <h4 className="font-medium mb-2 text-blue-700">Aficiones</h4>
                            <p className="text-sm text-muted-foreground">{character.hobbies}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Historia y trasfondo */}
                    {character.backstory && (
                      <div>
                        <h3 className="font-semibold mb-2">Historia</h3>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-line">
                            {character.backstory}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Extras */}
                    {character.extras && (
                      <div>
                        <h3 className="font-semibold mb-2">Información adicional</h3>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-line">
                            {character.extras}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
