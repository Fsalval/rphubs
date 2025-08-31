// src/lib/types.ts

/**
 * Enlace social de un personaje (redes, sitios, etc.)
 */
export interface SocialLink {
  name: string;
  url: string;
  username?: string;
}

/**
 * Información básica del autor de una historia o respuesta
 */
export interface Author {
  name: string;
  username: string;
  avatarUrl: string;
}

/**
 * Personaje público con perfil y redes
 */
export interface Character {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  biography?: string;           // Breve biografía
  profile?: string;             // Biografía completa
  nationality?: string;
  birthDate?: string;
  gender?: string;
  mbti?: string;
  createdAt: string;
  tags?: string[];
  personalidad?: string;        // Tipo de personalidad
  trama?: string;               // Trama principal
  friends?: Record<string, true>; // Mapa de amigos por ID
  userId: string;
  pin: string;                  // Para autenticación
  usernameLowerCase?: string;   // Útil para búsquedas insensibles a mayúsculas

  // 🔹 Campos adicionales usados en el frontend
  socialLinks?: SocialLink[];
}

/**
 * Publicación de un personaje
 */
export interface Post {
  id: string;
  content: string;
  time: string;
  likes: number;
  hearts?: number;
  laughs?: number;
  heartbreaks?: number;
  visibility: "public" | "friends" | "private";
  charName: string;
  charHandle: string;
  avatarUrl: string;
  characterId?: string;
  type?: string;
}

/**
 * Configuración de quién puede responder a una historia
 */
export type ResponseConfig = 'anyone' | 'friends' | 'collaborators';

/**
 * Historia colaborativa
 */
export interface Story {
  id: string;
  name: string;
  content: string;
  time: string;
  visibility: "public" | "friends" | "private";
  status: "in-progress" | "pending" | "completed";
  participants: number;
  author: Author;
  collaborators: string[];
  responses?: Record<string, StoryResponse>;
  responseConfig?: ResponseConfig;
}

/**
 * Respuesta individual a una historia
 */
export interface StoryResponse {
  author: Author;
  content: string;
  time: string;
}

/**
 * Chat entre usuarios
 */
export interface Chat {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantUsernames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage?: string;
  lastMessageTime: number;
  unreadCount: Record<string, number>;
}

/**
 * Mensaje individual en un chat
 */
export interface Message {
  senderId: string;
  content: string;
  timestamp: number;
  read: boolean;
}
