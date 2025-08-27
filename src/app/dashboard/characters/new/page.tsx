// src/app/dashboard/characters/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { auth, db } from '@/lib/firebase';
import { ref, push, get, set, update } from 'firebase/database'; // Añadido 'update'
import DOMPurify from 'dompurify';

export default function CreateCharacterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    gender: '',
    birthDate: '',
    pin: '',
    avatarUrl: '',
    bannerUrl: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' || name === 'bio') {
      setFormData({ ...formData, [name]: DOMPurify.sanitize(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
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

      // Validar edad mínima (15 años)
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

      // Validar PIN (4-6 dígitos)
      if (!/^\d{4,6}$/.test(formData.pin)) {
        setError('El PIN debe ser un número de 4 a 6 dígitos.');
        setLoading(false);
        return;
      }

      // Validar límite de 4 personajes
      const snapshot = await get(ref(db, 'characters'));
      const data = snapshot.val() || {};
      const userCharacters = Object.values(data).filter((char) => char.userId === user.uid);
      
      if (userCharacters.length >= 4) {
        setError('Solo puedes tener 4 personajes como máximo.');
        setLoading(false);
        return;
      }

      // Validar username único
      const existingUsernames = Object.values(data).map((char) => char.username);
      if (existingUsernames.includes(formData.username)) {
        setError('Este nombre de usuario ya está en uso.');
        setLoading(false);
        return;
      }

      // Crear personaje
      const newCharRef = push(ref(db, 'characters'));
      const newCharId = newCharRef.key;

      await set(newCharRef, {
        id: newCharId,
        ...formData,
        userId: user.uid,
        avatarUrl: formData.avatarUrl || 'https://placehold.co/400x400.png',
        bannerUrl: formData.bannerUrl || '',
        createdAt: new Date().toISOString(),
        tags: [],
      });

      // ✅ Guardar como personaje activo
      await update(ref(db, `users/${user.uid}`), {
        activeCharacterId: newCharId,
      });

      // Redirigir
      router.push(`/dashboard/characters/${newCharId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Crear Nuevo Personaje</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nombre del personaje</Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Alistair Finch"
              required
            />
          </div>
          <div>
            <Label>Username (@)</Label>
            <Input
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Ej: a.finch"
              required
            />
          </div>
        </div>

        <div>
          <Label>Biografía</Label>
          <Textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Detective con pasado oscuro, cínico, pero con sentido de justicia..."
            rows={4}
          />
        </div>

        <div>
          <Label>Banner del perfil</Label>
          <ImageUpload
            value={formData.bannerUrl}
            onChange={(url) => setFormData({ ...formData, bannerUrl: url })}
            variant="banner"
            folder="characters/banners"
            placeholder="Subir banner del perfil"
            maxWidth={1200}
            maxHeight={400}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Fecha de nacimiento</Label>
            <Input
              name="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>PIN de seguridad</Label>
            <Input
              name="pin"
              type="password"
              value={formData.pin}
              onChange={handleChange}
              placeholder="4-6 dígitos"
              required
              minLength={4}
              maxLength={6}
            />
          </div>
          <div>
            <Label>Foto de perfil</Label>
            <ImageUpload
              value={formData.avatarUrl}
              onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
              variant="avatar"
              folder="characters/avatars"
              placeholder="Subir foto de perfil"
            />
          </div>
        </div>

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

        <div className="flex gap-4 pt-6">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear Personaje'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}