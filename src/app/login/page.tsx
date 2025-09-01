'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log('Intentando iniciar sesión con Google...');
      const provider = new GoogleAuthProvider();
      console.log('Provider creado:', provider);
      console.log('Auth object:', auth);
      
      const result = await signInWithPopup(auth, provider);
      console.log('Resultado del login:', result);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error completo al iniciar sesión:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje de error:', error.message);
      
      let errorMessage = 'Hubo un error al iniciar sesión con Google.';
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'El popup fue bloqueado. Por favor, permite popups para este sitio.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'El popup fue cerrado. Intenta nuevamente.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Solicitud de popup cancelada.';
      }
      
      alert(errorMessage + ' Error: ' + error.code);
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