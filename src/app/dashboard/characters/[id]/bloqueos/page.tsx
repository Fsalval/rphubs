'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../../components/ui/avatar';
import { UserX } from 'lucide-react';
import { useCharacter } from '../layout';
import { db } from '../../../../../lib/firebase';
import { ref, onValue, update } from 'firebase/database';

interface BlockedCharacter {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

export default function MisBloqueos() {
  const { character } = useCharacter();
  const [blockedCharacters, setBlockedCharacters] = useState<BlockedCharacter[]>([]);

  useEffect(() => {
    if (!character) return;

    const blockedRef = ref(db, `characters/${character.id}/blockedCharacters`);
    const unsubscribe = onValue(blockedRef, async (snapshot) => {
      const blockedData = snapshot.val();
      
      if (blockedData) {
        const blockedIds = Object.keys(blockedData);
        const charactersData: BlockedCharacter[] = [];

        // Cargar datos de cada personaje bloqueado
        for (const id of blockedIds) {
          const characterRef = ref(db, `characters/${id}`);
          onValue(characterRef, (charSnapshot) => {
            const charData = charSnapshot.val();
            if (charData) {
              charactersData.push({
                id,
                name: charData.name,
                username: charData.username,
                avatarUrl: charData.avatarUrl
              });
            }
          }, { onlyOnce: true });
        }

        setBlockedCharacters(charactersData);
      } else {
        setBlockedCharacters([]);
      }
    });

    return () => unsubscribe();
  }, [character]);

  const handleUnblock = async (blockedCharacterId: string) => {
    if (!character) return;

    try {
      // Remover de mis bloqueados
      await update(ref(db, `characters/${character.id}/blockedCharacters`), {[blockedCharacterId]: null});
      
      // Remover de los bloqueadores del otro personaje
      await update(ref(db, `characters/${blockedCharacterId}/blockedBy`), {[character.id]: null});
      
      // Actualizar lista local
      setBlockedCharacters(prev => prev.filter(c => c.id !== blockedCharacterId));
    } catch (error) {
      console.error('Error unblocking character:', error);
    }
  };

  if (!character) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Mis Bloqueos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blockedCharacters.length === 0 ? (
            <p className="text-muted-foreground italic text-center py-8">
              No has bloqueado a ningún personaje.
            </p>
          ) : (
            <div className="space-y-4">
              {blockedCharacters.map((blockedChar) => (
                <div key={blockedChar.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={blockedChar.avatarUrl} alt={blockedChar.name} />
                      <AvatarFallback>{blockedChar.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{blockedChar.name}</p>
                      <p className="text-sm text-muted-foreground">@{blockedChar.username}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(blockedChar.id)}
                  >
                    Desbloquear
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
