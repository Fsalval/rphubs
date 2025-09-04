'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth} from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);  // Añadir estado para errores
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);  // Limpiar errores previos
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        router.push('/dashboard');
      } else {
        throw new Error('No se pudo obtener la información del usuario');
      }
      
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      setError(
        error.code === 'auth/popup-closed-by-user' 
          ? 'Se cerró la ventana de inicio de sesión'
          : 'Error al iniciar sesión. Por favor, intenta de nuevo.'
      );
    } finally {
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