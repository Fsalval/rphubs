'use client';

import { useState, useEffect } from 'react';  // Añade useEffect
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { 
  signInWithRedirect, 
  GoogleAuthProvider, 
  getRedirectResult  // Para capturar el resultado
} from 'firebase/auth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Captura el resultado del redirect
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          router.push('/dashboard');
        }
      } catch (error: any) {
        console.error('Error en redirect:', error);
        setError(
          error.code === 'auth/popup-closed-by-user'
            ? 'Se canceló el inicio de sesión'
            : 'Error al iniciar sesión.'
        );
      }
    };

    handleRedirect();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Cambiado: signInWithRedirect
      await signInWithRedirect(auth, provider);
      
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      setError(
        error.code === 'auth/popup-closed-by-user'
          ? 'Se cerró la ventana de inicio de sesión'
          : 'Error al iniciar sesión. Por favor, intenta de nuevo.'
      );
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
        
        {error && (
          <p className="mb-4 text-center text-sm text-red-500">
            {error}
          </p>
        )}
        
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