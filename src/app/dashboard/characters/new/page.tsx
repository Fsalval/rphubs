// src/app/dashboard/characters/new/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth, db } from '@/lib/firebase';
import { ref, push, get, set, update } from 'firebase/database'; // Añadido 'update'
import DOMPurify from 'dompurify';


function CreateCharacterContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get('id');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    gender: '',
    nationality: '',
    birthDate: '',
    pin: '',
    avatarUrl: '',
  });

  useEffect(() => {
    const loadCharacter = async () => {
      if (!characterId) return;

      const user = auth.currentUser;
      if (!user) return;

      try {
        const snapshot = await get(ref(db, `characters/${characterId}`));
        const data = snapshot.val();

        if (data && data.userId === user.uid) {
          setFormData({
            name: data.name || '',
            username: data.username || '',
            gender: data.gender || '',
            nationality: data.nationality || '',
            birthDate: data.birthDate || '',
            pin: data.pin || '',
            avatarUrl: data.avatarUrl || '',
          });
          setIsEditing(true);
        } else {
          setError('No tienes permiso para editar este personaje');
        }
      } catch (err) {
        setError('Error al cargar el personaje');
      }
    };

    loadCharacter();
  }, [characterId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No autenticado');

      // Validar campos obligatorios
      if (!formData.name || !formData.username || !formData.birthDate || !formData.pin) {
        setError('Todos los campos obligatorios deben completarse.');
        setLoading(false);
        return;
      }

      // Validar edad mínima
      const birth = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      const dayDiff = today.getDate() - birth.getDate();
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (adjustedAge < 15) {
        setError('El personaje debe tener al menos 15 años.');
        setLoading(false);
        return;
      }

      // Validar PIN
      if (!/^\d{4,6}$/.test(formData.pin)) {
        setError('El PIN debe ser un número de 4 a 6 dígitos.');
        setLoading(false);
        return;
      }

      if (isEditing && characterId) {
        // ✅ Actualizar personaje existente
        const snapshot = await get(ref(db, `characters/${characterId}`));
        const data = snapshot.val();

        if (data.userId !== user.uid) {
          setError('No puedes editar este personaje');
          setLoading(false);
          return;
        }

        // Validar que el username no lo use otro personaje
        if (data.username !== formData.username) {
          const allSnapshot = await get(ref(db, 'characters'));
          const allData = allSnapshot.val() || {};
          const usernames = Object.values(allData).map((c: any) => c.username);
          if (usernames.includes(formData.username)) {
            setError('Este nombre de usuario ya está en uso.');
            setLoading(false);
            return;
          }
        }

        await update(ref(db, `characters/${characterId}`), {
          ...formData,
          id: characterId,
          userId: user.uid,
          avatarUrl: formData.avatarUrl || 'https://placehold.co/400x400.png',
        });

        router.push(`/dashboard/characters/${characterId}`);
      } else {
        // ✅ Crear nuevo personaje
        const snapshot = await get(ref(db, 'characters'));
        const data = snapshot.val() || {};
        const userCharacters = Object.values(data).filter((char: any) => char.userId === user.uid);
        
        if (userCharacters.length >= 3) {
          setError('Solo puedes tener 3 personajes como máximo.');
          setLoading(false);
          return;
        }

        const existingUsernames = Object.values(data).map((char: any) => char.username);
        if (existingUsernames.includes(formData.username)) {
          setError('Este nombre de usuario ya está en uso.');
          setLoading(false);
          return;
        }

        const newCharRef = push(ref(db, 'characters'));
        const newCharId = newCharRef.key;

        await set(newCharRef, {
          id: newCharId,
          ...formData,
          userId: user.uid,
          avatarUrl: formData.avatarUrl || 'https://placehold.co/400x400.png',
          createdAt: new Date().toISOString(),
          tags: [],
        });

        await update(ref(db, `users/${user.uid}`), {
          activeCharacterId: newCharId,
        });

        router.push(`/dashboard/characters/${newCharId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Crear Nuevo Personaje</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nombre del personaje *</Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Alistair Finch"
              required
            />
          </div>
          <div>
            <Label>Username (@) *</Label>
            <Input
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Ej: a.finch"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Género</Label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
            >
              <option value="">Selecciona un género</option>
              <option value="hombre">Hombre</option>
              <option value="mujer">Mujer</option>
              <option value="no-binario">No binario</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <Label>Nacionalidad</Label>
            <Input
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              placeholder="Ej: Española, Mexicana, Argentina..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Fecha de nacimiento *</Label>
            <p className="text-sm text-gray-600 mb-2">Mínimo 15 años de edad</p>
            <Input
              name="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={handleChange}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 15)).toISOString().split('T')[0]}
              required
            />
          </div>
          <div>
            <Label>PIN de seguridad *</Label>
            <p className="text-sm text-gray-600 mb-2">4-6 dígitos para proteger tu personaje</p>
            <Input
              name="pin"
              type="password"
              value={formData.pin}
              onChange={handleChange}
              placeholder="4-6 dígitos"
              required
              minLength={4}
              maxLength={6}
              pattern="\d{4,6}"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <Button type="submit" disabled={loading}>
            {loading 
              ? (isEditing ? 'Guardando...' : 'Creando...') 
              : (isEditing ? 'Guardar Cambios' : 'Crear Personaje')
            }
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function CreateCharacterPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CreateCharacterContent />
    </Suspense>
  );
}