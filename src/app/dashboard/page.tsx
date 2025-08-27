'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, User, Settings, Trash2, Heart, ChevronDown, ChevronUp, Store, Gift } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

interface Character {
  id: string;
  name: string;
  age: number;
  description: string;
  imageUrl: string;
  visibility: 'public' | 'private';
  userId: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [manifestoExpanded, setManifestoExpanded] = useState(false);
  const router = useRouter();

  const manifesto = `🌟 Bienvenido a RPHubs - Tu espacio para el roleplay 🌟

En RPHubs creemos que el roleplay es un arte que trasciende fronteras. Aquí cada historia importa, cada personaje tiene valor y cada jugador encuentra su lugar.

✨ Nuestra filosofía:
• Respeto absoluto entre todos los usuarios
• Creatividad sin límites en tus historias
• Inclusión de todas las formas de roleplay
• Comunidad colaborativa y de apoyo mutuo

🎭 Lo que nos hace únicos:
• Personajes completamente personalizables
• Sistema de tramas colaborativas
• Feeds privados y públicos para diferentes tipos de contenido
• Herramientas para organizar tus historias

🔒 Tu privacidad es sagrada:
• Control total sobre la visibilidad de tus personajes
• Opciones de privacidad granulares
• Ambiente seguro para expresar tu creatividad

🌈 Diversidad e inclusión:
• Todos los géneros, orientaciones e identidades son bienvenidos
• Cero tolerancia al acoso o discriminación
• Moderación activa para mantener un ambiente positivo

Únete a nuestra comunidad y descubre el potencial infinito de tu imaginación. En RPHubs, tu historia comienza aquí.

¡Que comience la aventura! 🚀`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadCharacters(currentUser.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadCharacters = (userId: string) => {
    const charactersRef = ref(db, 'characters');
    
    onValue(charactersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userCharacters = Object.entries(data)
          .map(([id, character]: [string, any]) => ({
            id,
            ...character
          }))
          .filter((character: Character) => character.userId === userId);
        
        setCharacters(userCharacters);
      }
    });

    return () => off(charactersRef);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleAccountClosure = () => {
    // TODO: Implementar lógica de cierre de cuenta
    console.log('Solicitar cierre de cuenta');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">Bienvenido, {user?.email}</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleLogout} variant="outline">
              Cerrar Sesión
            </Button>
            <Button 
              onClick={handleAccountClosure} 
              variant="outline"
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Cerrar Cuenta
            </Button>
          </div>
        </div>

        {/* Manifiesto destacado */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardHeader 
              className="cursor-pointer hover:bg-purple-50/50 transition-colors"
              onClick={() => setManifestoExpanded(!manifestoExpanded)}
            >
              <CardTitle className="flex items-center justify-between text-purple-700">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Manifiesto RPHubs ✨
                </div>
                {manifestoExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {manifestoExpanded && (
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-line text-sm leading-relaxed text-purple-800">
                    {manifesto}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Tienda y Donativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Store className="h-5 w-5" />
                Tienda RPHubs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Descubre recursos exclusivos para mejorar tu experiencia de roleplay.
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Explorar Tienda
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Gift className="h-5 w-5" />
                Apoya RPHubs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Ayúdanos a mantener y mejorar la plataforma con tu donativo.
              </p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Hacer Donativo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Personajes Section */}
        <div className="mb-8">
          <div 
            className="cursor-pointer"
            onClick={() => router.push('/dashboard/characters')}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Mis Personajes
                  </CardTitle>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {characters.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {characters.length === 0 
                    ? "No tienes personajes creados. Haz clic para crear tu primer personaje."
                    : characters.length === 1 
                      ? "Tienes 1 personaje creado. Haz clic para ver y gestionar tus personajes."
                      : `Tienes ${characters.length} personajes creados. Haz clic para ver y gestionar tus personajes.`
                  }
                </p>
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <span>Ir a Personajes</span>
                  <User className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
