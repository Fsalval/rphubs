'use client';

import React, { createContext, useContext } from 'react';
import type { Character } from '../lib/types';

type CharacterContextValue = {
  character: Character | null;
  isOwner: boolean;
  allCharacters: Array<Record<string, unknown>>;
  newMessagesCount: number;
  updateCharacterData: (updates: Record<string, unknown>) => void;
};

const CharacterContext = createContext<CharacterContextValue | null>(null);

export function CharacterProvider({
  value,
  children,
}: {
  value: CharacterContextValue;
  children: React.ReactNode;
}) {
  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}

// Hook para usar el personaje en cualquier vista
export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter debe usarse dentro de CharacterProvider');
  }
  return context;
};

