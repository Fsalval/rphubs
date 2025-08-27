// src/app/characters/[id]/layout.tsx
'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

// Contexto para compartir el personaje
const PublicCharacterContext = createContext<any>(null);

export function usePublicCharacter() {
  return useContext(PublicCharacterContext);
}

export default function PublicCharacterLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const pathname = usePathname();
  const characterId = Array.isArray(id) ? id[0] : id;

  const [character, setCharacter] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [currentUserCharacter, setCurrentUserCharacter] = useState<any>(null);
  const [isFriend, setIsFriend] = useState(false);

  // Detectar usuario
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  // Cargar personaje del usuario actual
  useEffect(() => {
    if (!user) return;
    const charactersRef = ref(db, 'characters');
    const unsubscribe = onValue(charactersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userCharacter = Object.entries(data).find(([key, char]: any) => char.userId === user.uid);
        if (userCharacter) {
          const [characterId, characterData] = userCharacter;
          setCurrentUserCharacter({ id: characterId, ...(characterData as any) });
        }
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

  // Verificar si son amigos
  useEffect(() => {
    if (!characterId || !currentUserCharacter) return;
    const friendsRef = ref(db, `characters/${characterId}/friends/${currentUserCharacter.id}`);
    const unsubscribe = onValue(friendsRef, (snapshot) => {
      setIsFriend(snapshot.exists() && snapshot.val() === true);
    });
    return () => unsubscribe();
  }, [characterId, currentUserCharacter]);

  if (!character) {
    return <div className="flex items-center justify-center min-h-screen">Cargando personaje...</div>;
  }

  const age = character.birthDate
    ? Math.floor((new Date().getTime() - new Date(character.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const isMainProfile = pathname === `/characters/${characterId}`;

  return (
    <PublicCharacterContext.Provider value={{ character, user, currentUserCharacter, isFriend }}>
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
                  isMainProfile 
                    ? 'border-primary' 
                    : 'border-transparent hover:border-primary'
                }`}
              >
                Muro
              </Link>
              {isFriend && (
                <>
                  <Link 
                    href={`/characters/${characterId}/ficha`}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      pathname === `/characters/${characterId}/ficha`
                        ? 'border-primary' 
                        : 'border-transparent hover:border-primary'
                    }`}
                  >
                    Ficha
                  </Link>
                  <Link 
                    href={`/characters/${characterId}/tramas`}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      pathname === `/characters/${characterId}/tramas`
                        ? 'border-primary' 
                        : 'border-transparent hover:border-primary'
                    }`}
                  >
                    Tramas
                  </Link>
                </>
              )}
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
