'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { Button } from '../components/ui/button';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    let didRedirectPush = false;

    // Verificar si viene de redirect de Google
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!isMounted) return;

        if (result?.user && !didRedirectPush) {
          didRedirectPush = true;
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error en redirect:', error);
      } finally {
        if (isMounted) setUserChecked(true);
      }
    };

    checkRedirect();

    // Escuchar cambios de auth (Firebase puede hidratar sesión después)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMounted) return;
      if (user && !didRedirectPush) {
        didRedirectPush = true;
        router.push('/dashboard');
      }
      // Si Firebase ya tiene sesión, liberar la UI aunque el redirect no tenga usuario.
      setUserChecked(true);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  // Si ya está logueado, no mostrar nada (se redirige)
  if (!userChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

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
          {loading ? 'Redirigiendo...' : 'Iniciar sesión con Google'}
        </Button>
      </div>
    </div>
  );
}