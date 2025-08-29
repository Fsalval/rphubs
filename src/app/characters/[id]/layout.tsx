'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { ref, onValue, get, set } from 'firebase/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, MessageSquare, ArrowLeft, UserCheck } from 'lucide-react';
import Link from 'next/link';

// Contexto para compartir el personaje
const PublicCharacterContext = createContext<any>(null);

export function usePublicCharacter() {
  const context = useContext(PublicCharacterContext);
  if (!context) {
    throw new Error('usePublicCharacter debe usarse dentro de PublicCharacterLayout');
  }
  return context;
}

export default function PublicCharacterLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const pathname = usePathname();
  const router = useRouter(); // ✅ Hook en nivel superior
  const characterId = Array.isArray(id) ? id[0] : id;

  const [character, setCharacter] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [currentUserCharacter, setCurrentUserCharacter] = useState<any>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none');

  // Detectar usuario
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  // Cargar personaje del usuario actual
  useEffect(() => {
    if (!user) return;

    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      const activeCharacterId = userData?.activeCharacterId;

      if (activeCharacterId) {
        const characterRef = ref(db, `characters/${activeCharacterId}`);
        onValue(characterRef, (charSnapshot) => {
          const characterData = charSnapshot.val();
          if (characterData) {
            setCurrentUserCharacter({ id: activeCharacterId, ...characterData });
          }
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Cargar personaje público
  useEffect(() => {
    if (!characterId) return;
    const characterRef = ref(db, `characters/${characterId}`);
    const unsubscribe = onValue(characterRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCharacter({ id: characterId, ...data });
      }
    });
    return () => unsubscribe();
  }, [characterId]);

  // Verificar estado de amistad y solicitudes
  useEffect(() => {
    if (!characterId || !currentUserCharacter) {
      setFriendshipStatus('none');
      return;
    }

    const checkFriendship = async () => {
      try {
        const friends1 = await get(ref(db, `characters/${characterId}/friends/${currentUserCharacter.id}`));
        const friends2 = await get(ref(db, `characters/${currentUserCharacter.id}/friends/${characterId}`));

        if (friends1.exists() && friends2.exists()) {
          setFriendshipStatus('friends');
          return;
        }

        const sent = await get(ref(db, `characters/${characterId}/friendRequests/${currentUserCharacter.id}`));
        if (sent.exists() && sent.val() === true) {
          setFriendshipStatus('pending_sent');
          return;
        }

        const received = await get(ref(db, `characters/${currentUserCharacter.id}/friendRequests/${characterId}`));
        if (received.exists() && received.val() === true) {
          setFriendshipStatus('pending_received');
          return;
        }

        setFriendshipStatus('none');
      } catch (error) {
        console.error('Error checking friendship status:', error);
        setFriendshipStatus('none');
      }
    };

    checkFriendship();
  }, [characterId, currentUserCharacter]);

  if (!character) {
    return <div className="flex items-center justify-center min-h-screen">Cargando personaje...</div>;
  }

  const age = character.birthDate
    ? Math.floor((new Date().getTime() - new Date(character.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const isMainProfile = pathname === `/characters/${characterId}`;

  // Función para manejar solicitudes de amistad
  const handleFriendRequest = async () => {
    if (!currentUserCharacter || !characterId) return;

    try {
      if (currentUserCharacter.id === characterId) {
        console.log('No puedes enviarte solicitud a ti mismo');
        return;
      }

      if (friendshipStatus === 'friends') {
        // Eliminar amigo
        await set(ref(db, `characters/${characterId}/friends/${currentUserCharacter.id}`), null);
        await set(ref(db, `characters/${currentUserCharacter.id}/friends/${characterId}`), null);
        setFriendshipStatus('none');
      } else if (friendshipStatus === 'pending_received') {
        // Aceptar solicitud
        await set(ref(db, `characters/${characterId}/friends/${currentUserCharacter.id}`), true);
        await set(ref(db, `characters/${currentUserCharacter.id}/friends/${characterId}`), true);
        await set(ref(db, `characters/${currentUserCharacter.id}/friendRequests/${characterId}`), null);
        setFriendshipStatus('friends');
      } else if (friendshipStatus === 'pending_sent') {
        // Cancelar solicitud
        await set(ref(db, `characters/${characterId}/friendRequests/${currentUserCharacter.id}`), null);
        setFriendshipStatus('none');
      } else {
        // Enviar solicitud
        await set(ref(db, `characters/${characterId}/friendRequests/${currentUserCharacter.id}`), true);
        setFriendshipStatus('pending_sent');
      }
    } catch (error) {
      console.error('Error managing friendship:', error);
    }
  };

  // Función para rechazar solicitud
  const handleRejectRequest = async () => {
    if (!currentUserCharacter || !characterId) return;

    try {
      await set(ref(db, `characters/${currentUserCharacter.id}/friendRequests/${characterId}`), null);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  // Función para abrir chat de mensajes
  const handleStartMessage = () => {
    if (!currentUserCharacter || !characterId) return;
    // Buscar el componente FloatingChat y abrirlo
    const event = new CustomEvent('openFloatingChat', { 
      detail: { targetCharacterId: characterId } 
    });
    window.dispatchEvent(event);
  };

  return (
    <PublicCharacterContext.Provider value={{ character, user, currentUserCharacter, isFriend: friendshipStatus === 'friends' }}>
      <div className="min-h-screen bg-secondary">
        {/* Header del personaje */}
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
                  {age !== null && age < 18 && (
                    <p className="text-sm text-yellow-600 font-medium">Edad: {age} años</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Botones de acción */}
                {currentUserCharacter && currentUserCharacter.id !== characterId && (
                  <div className="flex gap-2">
                    {friendshipStatus === 'friends' && (
                      <Button size="sm" variant="outline" onClick={handleFriendRequest}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Eliminar amigo
                      </Button>
                    )}

                    {friendshipStatus === 'pending_sent' && (
                      <Button size="sm" variant="outline" onClick={handleFriendRequest}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Cancelar solicitud
                      </Button>
                    )}

                    {friendshipStatus === 'pending_received' && (
                      <>
                        <Button size="sm" variant="default" onClick={handleFriendRequest}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Aceptar solicitud
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleRejectRequest}>
                          Rechazar
                        </Button>
                      </>
                    )}

                    {friendshipStatus === 'none' && (
                      <Button size="sm" variant="default" onClick={handleFriendRequest}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Enviar solicitud
                      </Button>
                    )}

                    <Button size="sm" variant="outline" onClick={handleStartMessage}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Mensaje
                    </Button>
                  </div>
                )}

                {/* Volver a mi perfil */}
                {currentUserCharacter && currentUserCharacter.id !== characterId && (
                  <Link href={`/dashboard/characters/${currentUserCharacter.id}`}>
                    <Button size="sm" variant="ghost">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver a mi perfil
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Menú de navegación */}
        <nav className="bg-background border-b sticky top-16 z-10">
          <div className="container mx-auto px-4">
            <div className="flex justify-center gap-8 py-2">
              <Link
                href={`/characters/${characterId}`}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isMainProfile ? 'border-primary' : 'border-transparent hover:border-primary'
                }`}
              >
                Muro
              </Link>
              <Link
                href={`/characters/${characterId}/ficha`}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  pathname === `/characters/${characterId}/ficha` ? 'border-primary' : 'border-transparent hover:border-primary'
                }`}
              >
                Ficha
              </Link>
              <Link
                href={`/characters/${characterId}/tramas`}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  pathname === `/characters/${characterId}/tramas` ? 'border-primary' : 'border-transparent hover:border-primary'
                }`}
              >
                Tramas
              </Link>
            </div>
          </div>
        </nav>

        <main className="container mx-auto p-6">
          {children}
        </main>

        <footer className="bg-background/80 backdrop-blur-sm border-t border-border py-4 text-center text-sm text-muted-foreground">
          <p>© 2025 rphubs. Todos los derechos reservados.</p>
        </footer>
      </div>
    </PublicCharacterContext.Provider>
  );
}