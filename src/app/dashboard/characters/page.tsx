// src/app/dashboard/characters/page.tsx
'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { auth, db } from '../../../lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, remove, update } from 'firebase/database'; // Añadido 'update'
import Link from 'next/link';
import { Settings, Pencil, Download, Trash2, ArrowLeft } from 'lucide-react';
import { Character } from '../../../lib/types';
import { User } from 'firebase/auth';

export default function CharactersPage() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showEnterPinModal, setShowEnterPinModal] = useState(false);
  const [enterCharacterId, setEnterCharacterId] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [actionOnPin, setActionOnPin] = useState<'enter' | 'edit' | null>(null);

  const [user, setUser] = useState<User | null>(null); 
  const router = useRouter();
  const maxCharacters = 3; // Límite correcto de 3 personajes
  const hasMaxCharacters = characters.length >= maxCharacters;

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Si no hay usuario, redirigir
          window.location.href = '/app'; // Redirigir a la página de inicio o login
        }
      });

      return () => unsubscribe();
    }, []);

      useEffect(() => {
    if (!user) return;

    console.log('🔍 Debug - Usuario:', user.uid, user.email);
    console.log('🔍 Debug - Firebase URL:', process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);

    const charactersRef = ref(db, 'characters');
    const unsubscribe = onValue(charactersRef, (snapshot) => {
      const data = snapshot.val();
      console.log('🔍 Debug - Datos desde Firebase:', data);
      
      if (data) {
        const allCharacters = Object.entries(data)
          .map(([id, char]: [string, any]) => ({ id, ...char }));
        console.log('🔍 Debug - Todos los personajes:', allCharacters.length);
        
        const userCharacters = allCharacters.filter((char) => char.userId === user.uid);
        console.log('🔍 Debug - Personajes del usuario:', userCharacters.length);
        console.log('🔍 Debug - Lista filtrada:', userCharacters);
        
        setCharacters(userCharacters);
      } else {
        console.log('🔍 Debug - No hay datos en Firebase');
        setCharacters([]);
      }
    });

    return () => unsubscribe();
  }, [user]); // <-- Se ejecuta cuando user cambia

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setPinInput('');
    setShowPinModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId || !user) return;
    const character = characters.find(c => c.id === deleteId);
    
    if (character?.pin && character.pin !== pinInput) {
      alert('PIN incorrecto');
      return;
    }

    await remove(ref(db, `characters/${deleteId}`));
    setShowPinModal(false);
    setDeleteId(null);
    setPinInput('');
  };

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Función para manejar "Entrar como Personaje"
  const handleEnterCharacter = async (characterId: string) => {
    if (!user) return;

    const character = characters.find(c => c.id === characterId);
    
    // Si el personaje tiene PIN, pedirlo
    if (character?.pin) {
      setEnterCharacterId(characterId);
      setPinInput('');
      setShowEnterPinModal(true);
      return;
    }

    // Si no tiene PIN, entrar directamente
    await enterCharacter(characterId);
  };

  const enterCharacter = async (characterId: string) => {
    if (!user) return;

    try {
      // Guardar el characterId como activo
      await update(ref(db, `users/${user.uid}`), {
        activeCharacterId: characterId,
      });
    } catch (error) {
      console.error('Error al guardar activeCharacterId:', error);
    }

    // Redirigir
    window.location.href = `/dashboard/characters/${characterId}`;
  };

  const confirmEnterCharacter = async () => {
    if (!enterCharacterId || !user) return;
    
    const character = characters.find(c => c.id === enterCharacterId);
    
    if (character?.pin && character.pin !== pinInput) {
      alert('PIN incorrecto');
      return;
    }

    setShowEnterPinModal(false);
    setEnterCharacterId(null);
    setPinInput('');

    // ✅ Ahora `router` está definido
    if (actionOnPin === 'edit') {
      router.push(`/dashboard/characters/new?id=${enterCharacterId}`);
    } else if (actionOnPin === 'enter') {
      await enterCharacter(enterCharacterId);
    }

    setActionOnPin(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Tus Personajes</h1>
        </div>
        
        {!hasMaxCharacters ? (
          <Button asChild>
            <Link href="/dashboard/characters/new">Crear Personaje</Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link href="/dashboard/user/settings">Comprar slot adicional</Link>
          </Button>
        )}
      </div>

      {characters.length === 0 ? (
        <p className="text-muted-foreground">Aún no tienes personajes. Crea uno para comenzar.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((char) => (
            <Card key={char.id} className="relative">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={char.avatarUrl} alt={char.name} />
                  <AvatarFallback>{char.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{char.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">@{char.username}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    asChild={false} 
                    className="flex-1" 
                    onClick={() => {
                      setEnterCharacterId(char.id);
                      setActionOnPin('enter');
                      setPinInput('');
                      setShowEnterPinModal(true);
                    }}
                  >
                    Entrar como Personaje
                  </Button>
                  
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMenu(char.id)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    {openMenus[char.id] && (
                      <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-50">
                        <div className="py-1">
                          <div
                            className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted cursor-pointer"
                            onClick={() => {
                              setEnterCharacterId(char.id);
                              setActionOnPin('edit');
                              setPinInput('');
                              setShowEnterPinModal(true);
                              setOpenMenus({});
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </div>
                          <div
                            className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted cursor-pointer"
                            onClick={() => setOpenMenus({})}
                          >
                            <Download className="mr-2 h-4 w-4" /> Descargar contenido
                          </div>
                          <div
                            className="flex items-center px-4 py-2 text-sm text-destructive hover:bg-muted cursor-pointer"
                            onClick={() => {
                              handleDeleteClick(char.id);
                              setOpenMenus({});
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showPinModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setShowPinModal(false);
            setDeleteId(null);
            setPinInput('');
          }}
        >
          <div 
            className="bg-background p-6 rounded-lg shadow-lg w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {deleteId && characters.find(c => c.id === deleteId)?.pin
                ? 'Ingresa el PIN del personaje para confirmar.'
                : '¿Estás seguro de que deseas eliminar este personaje?'}
            </p>

            {deleteId && characters.find(c => c.id === deleteId)?.pin && (
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN del personaje"
                className="w-full p-2 border rounded mb-4"
                autoFocus
              />
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setShowPinModal(false);
                setDeleteId(null);
                setPinInput('');
              }}>
                Cancelar
              </Button>
              <Button variant="secondary" onClick={confirmDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para PIN de entrada */}
      {showEnterPinModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowEnterPinModal(false);
            setEnterCharacterId(null);
            setPinInput('');
          }}
        >
          <div 
            className="bg-background p-6 rounded-lg shadow-lg w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Acceso al Personaje</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Este personaje requiere PIN. Ingresa el PIN para continuar.
            </p>

            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN del personaje"
              className="w-full p-2 border rounded mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmEnterCharacter();
                }
              }}
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setShowEnterPinModal(false);
                setEnterCharacterId(null);
                setPinInput('');
              }}>
                Cancelar
              </Button>
              <Button onClick={confirmEnterCharacter}>
                Ingresar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}