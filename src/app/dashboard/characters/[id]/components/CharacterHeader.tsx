// src/app/dashboard/characters/[id]/components/CharacterHeader.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Character } from '@/lib/types'; // ✅ Importa el tipo

export function CharacterHeader({ character }: { character: Character }) {
  const age = character.birthDate
    ? Math.floor((new Date().getTime() - new Date(character.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
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
  );
}
