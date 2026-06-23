// src/app/dashboard/characters/[id]/layout.tsx
'use client';
import { useEffect, useState, createContext, useContext } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { auth, db } from '../../../../lib/firebase';
import { ref, onValue, get, set, remove } from 'firebase/database';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import Link from 'next/link';
import { Search, Settings, Bell, Mail, Palette, Home } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '../../../../components/ui/dropdown-menu';
import { useTheme, type Theme } from '../../../../lib/theme-context';
import { Character } from '../../../../lib/types';
import { User } from 'firebase/auth';
import FloatingChat from './components/FloatingChat';

// Contexto para compartir el personaje
const CharacterContext = createContext<any>(null);

export default function CharacterLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const pathname = usePathname();
  const characterId = Array.isArray(id) ? id[0] : id;
  const { theme, setTheme, availableThemes } = useTheme();

  const [character, setCharacter] = useState<Character | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCharacters, setAllCharacters] = useState<any[]>([]);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messagesPreview, setMessagesPreview] = useState<any[]>([]);

  // Detectar usuario
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  // Cargar personaje
  useEffect(() => {
    if (!characterId || !user) return;
    const characterRef = ref(db, `characters/${characterId}`);
    const unsubscribe = onValue(characterRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCharacter(data);
        setIsOwner(data.userId === user.uid);
      }
    });
    return () => unsubscribe();
  }, [characterId, user]);

  // Cargar todos los personajes (para búsqueda)
  useEffect(() => {
    const fetchAllCharacters = async () => {
      const snapshot = await get(ref(db, 'characters'));
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, char]: [string, any]) => ({ id, ...char }))
          .filter((char) => char.id !== characterId);
        setAllCharacters(list);
      }
    };

    if (characterId) {
      fetchAllCharacters();
    }
  }, [characterId]);

  // Contar mensajes no leídos y mostrar vista previa
  useEffect(() => {
    if (!characterId) return;
    const chatsRef = ref(db, `characters/${characterId}/chats`);
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let count = 0;
        const previews: any[] = [];
        Object.values(data).forEach((chat: any) => {
          if (chat.lastMessage && chat.lastMessage.senderId !== characterId && !chat.lastMessage.read) {
            count++;
            previews.push({
              id: chat.chatId,
              name: chat.other.name,
              username: chat.other.username,
              avatarUrl: chat.other.avatarUrl,
              content: chat.lastMessage.content.substring(0, 50) + '...',
              time: chat.lastMessage.time,
            });
          }
        });
        setNewMessagesCount(count);
        setMessagesPreview(previews);
      }
    });
    return () => unsubscribe();
  }, [characterId]);

  // Contar mensajes no leídos
  useEffect(() => {
    if (!characterId) return;
    const messagesRef = ref(db, `messages/${characterId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      let unreadCount = 0;
      
      if (data) {
        Object.values(data).forEach((conversation: any) => {
          if (conversation.messages) {
            Object.values(conversation.messages).forEach((message: any) => {
              if (message.to === characterId && !message.read) {
                unreadCount++;
              }
            });
          }
        });
      }
      
      setNewMessagesCount(unreadCount);
    });
    return () => unsubscribe();
  }, [characterId]);

  // Contar solicitudes de amistad
  useEffect(() => {
    if (!characterId) return;
    const requestsRef = ref(db, `friendRequests/${characterId}`);
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const requests = Object.entries(data)
          .filter(([key, req]: [string, any]) => req.status === 'pending')
          .map(([key, req]: [string, any]) => ({
            id: key,
            senderName: req.senderName,
            senderUsername: req.senderUsername,
            senderAvatar: req.senderAvatar,
            time: req.sentAt,
          }));
        setFriendRequestsCount(requests.length);
        setNotifications(requests);
      } else {
        setNotifications([]);
        setFriendRequestsCount(0);
      }
    });
    return () => unsubscribe();
  }, [characterId]);

  // Función para aceptar solicitud de amistad
  const acceptFriendRequest = async (senderId: string) => {
    if (!characterId) return;
    
    try {
      // Agregar como amigo en ambos personajes
      await set(ref(db, `characters/${characterId}/friends/${senderId}`), true);
      await set(ref(db, `characters/${senderId}/friends/${characterId}`), true);
      
      // Eliminar la solicitud
      await remove(ref(db, `friendRequests/${characterId}/${senderId}`));
      
      console.log('Solicitud de amistad aceptada');
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
    }
  };

  // Función para rechazar solicitud de amistad
  const rejectFriendRequest = async (senderId: string) => {
    if (!characterId) return;
    
    try {
      // Solo eliminar la solicitud
      await remove(ref(db, `friendRequests/${characterId}/${senderId}`));
      
      console.log('Solicitud de amistad rechazada');
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
    }
  };

  if (!character) {
    return <div className="flex items-center justify-center min-h-screen">Cargando personaje...</div>;
  }

  // Determinar si mostrar notificaciones (solo en vista principal)
  const showNotifications = pathname === `/dashboard/characters/${characterId}`;

  return (
    <CharacterContext.Provider value={{ character, isOwner, allCharacters, newMessagesCount }}>
      <div className="min-h-screen bg-secondary">
        {/* Header */}
        <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-20 border-b">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-shrink-0">
                <Avatar>
                  <AvatarImage src={character.avatarUrl} alt={character.name} />
                  <AvatarFallback>{character.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold">{character.name}</h1>
                  <p className="text-sm text-muted-foreground">@{character.username}</p>
                </div>
              </div>

              <div className="flex-1 min-w-0 px-4 relative">
                <div className="relative max-w-md mx-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar personajes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearch(true)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Notificaciones (campana) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="h-5 w-5" />
                      {friendRequestsCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                          {friendRequestsCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel> solicitudes de amistad</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <DropdownMenuItem>No tienes solicitudes nuevas</DropdownMenuItem>
                    ) : (
                      notifications.map((req) => (
                        <div key={req.id} className="p-3 border-b last:border-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={req.senderAvatar} />
                              <AvatarFallback>{req.senderName?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{req.senderName}</p>
                              <p className="text-xs text-muted-foreground">@{req.senderUsername}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => acceptFriendRequest(req.id)}
                              className="flex-1"
                            >
                              Aceptar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectFriendRequest(req.id)}
                              className="flex-1"
                            >
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mensajes nuevos */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Mail className="h-5 w-5" />
                      {newMessagesCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full text-xs flex items-center justify-center text-white">
                          {newMessagesCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Mensajes nuevos</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {messagesPreview.length === 0 ? (
                      <DropdownMenuItem>No tienes mensajes nuevos</DropdownMenuItem>
                    ) : (
                      messagesPreview.map((msg) => (
                        <DropdownMenuItem key={msg.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.avatarUrl} />
                            <AvatarFallback>{msg.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{msg.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Configuración */}
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                    <Settings className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Temas
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableThemes.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className="flex items-center gap-3"
                      >
                        <div 
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: t.colors.accent }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span>{t.name}</span>
                            {t.isPremium && (
                              <Badge variant="secondary" className="text-xs">Premium</Badge>
                            )}
                            {theme === t.id && (
                              <Badge variant="default" className="text-xs">Activo</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link href="/dashboard/characters" className="w-full flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Salir del personaje
                      </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Resultados de búsqueda */}
            {showSearch && searchQuery && (
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-full max-w-md bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="p-2 text-sm text-muted-foreground">
                  Buscando: <strong>{searchQuery}</strong>
                </div>
                {allCharacters
                  .filter((char) =>
                    char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    char.username.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .slice(0, 5)
                  .map((char) => (
                    <Link
                      key={char.id}
                      href={`/characters/${char.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-muted transition border-b border-border last:border-0"
                      onClick={() => {
                        setSearchQuery('');
                        setShowSearch(false);
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={char.avatarUrl} />
                        <AvatarFallback>{char.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium">{char.name}</p>
                        <p className="text-muted-foreground">@{char.username}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </header>

        {/* Menú de navegación */}
        <nav className="bg-background border-b sticky top-16 z-10">
          <div className="container mx-auto px-4">
            <div className="flex justify-center gap-8 py-2">
              <Link
                href={`/dashboard/characters/${characterId}`}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  pathname === `/dashboard/characters/${characterId}`
                    ? 'border-primary text-primary'
                    : 'border-transparent hover:border-primary'
                }`}
              >
                Perfil
              </Link>
              <Link
                href={`/dashboard/characters/${characterId}/ficha`}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  pathname === `/dashboard/characters/${characterId}/ficha`
                    ? 'border-primary text-primary'
                    : 'border-transparent hover:border-primary'
                }`}
              >
                Ficha
              </Link>
              <Link
                href={`/dashboard/characters/${characterId}/tramas`}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  pathname === `/dashboard/characters/${characterId}/tramas`
                    ? 'border-primary text-primary'
                    : 'border-transparent hover:border-primary'
                }`}
              >
                Tramas
              </Link>
              <Link
                href={`/dashboard/characters/${characterId}/taller`}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  pathname === `/dashboard/characters/${characterId}/taller`
                    ? 'border-primary text-primary'
                    : 'border-transparent hover:border-primary'
                }`}
              >
                Taller
              </Link>
              <Link
                href={`/dashboard/characters/${characterId}/amigos`}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  pathname === `/dashboard/characters/${characterId}/amigos`
                    ? 'border-primary text-primary'
                    : 'border-transparent hover:border-primary'
                }`}
              >
                Amigos
              </Link>
              <Link
                href={`/dashboard/characters/${characterId}/messages`}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
                  pathname === `/dashboard/characters/${characterId}/messages`
                    ? 'border-primary text-primary'
                    : 'border-transparent hover:border-primary'
                }`}
              >
                Mensajes
                {newMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {newMessagesCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </nav>

        {/* Contenido */}
        <main className="container mx-auto p-6">
          {children}
        </main>

        <footer className="bg-background/80 backdrop-blur-sm border-t border-border py-4">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© 2025 rphubs. Todos los derechos reservados.</p>
          </div>
        </footer>
        
        {/* Chat flotante disponible en todas las vistas */}
        <FloatingChat />
      </div>
    </CharacterContext.Provider>
  );
}

// Hook para usar el personaje en cualquier vista
export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter debe usarse dentro de CharacterLayout');
  }
  return context;
};