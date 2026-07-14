'use client';

import React, { createContext, useContext } from 'react';
import type { Character } from '../lib/types';

// Tipos para notificaciones y mensajes
export interface NotificationType {
  id: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  time: number;
}

export interface MessagePreviewType {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  content: string;
  time: number;
}

type CharacterContextValue = {
  character: Character | null;
  isOwner: boolean;
  allCharacters: Character[];
  newMessagesCount: number;
  updateCharacterData: (updates: Partial<Character>) => void;
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

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter debe usarse dentro de CharacterProvider');
  }
  return context;
};