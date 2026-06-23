'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase';
// CAMBIO CLAVE: Importamos signInWithPopup en lugar de signInWithRedirect
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { Button } from '../components/ui/button';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMounted) return;

      console.log('🔍 onAuthStateChanged - user:', user?.email || 'null');

      if (user) {
        console.log('✅ Usuario detectado, redirigiendo a dashboard');
        router.push('/dashboard');
      } else {
        console.log('❌ Sin usuario autenticado');
        setIsInitialized(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log('🔐 Iniciando login con Google...');
      const provider = new GoogleAuthProvider();
      // CAMBIO CLAVE: Usamos signInWithPopup para evitar bloqueos de cookies de terceros
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('❌ Error al iniciar sesión:', error);
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verificando autenticación...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Bienvenido a rphubs</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Inicia sesión con Google para continuar
        </p>
        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Cargando...' : 'Iniciar sesión con Google'}
        </Button>
      </div>
    </div>
  );
}