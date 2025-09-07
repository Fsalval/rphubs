/**
 * Enlace social de un personaje (redes, sitios, etc.)
 */
export interface SocialLink {
  name: string;
  url: string;
  username?: string;
}

/**
 * Información básica del autor
 */
export interface Author {
  id?: string;
  name: string;
  username: string;
  avatarUrl: string;
}

/**
 * Respuesta dentro de una historia o trama
 */
export interface StoryResponse {
  author: Author;
  content: string;
  time: string;
}

/**
 * Configuración de quién puede responder
 */
export type ResponseConfig = 'anyone' | 'friends' | 'collaborators';

/**
 * Historia o trama colaborativa
 */
export interface Story {
  id: string;
  name: string;
  content: string;
  time: string;
  visibility: 'public' | 'friends' | 'private';
  status: 'in-progress' | 'pending' | 'completed';
  participants: number;
  author: Author;
  collaborators: string[];
  responses?: Record<string, StoryResponse>;
  responseConfig?: ResponseConfig;
  tags?: string[];
  imageUrl?: string;
}

/**
 * Personaje principal
 */
export interface Character {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  biography?: string;
  profile?: string;
  nationality?: string;
  birthDate?: string;
  gender?: string;
  mbti?: string;
  createdAt: string;
  tags?: string[];
  personalidad?: string;
  trama?: string;

  friends?: Record<string, true>;
  userId: string;
  pin: string;
  usernameLowerCase?: string;

  // --- Nuevos campos agregados ---
  age?: number;
  species?: string;
  fandom?: string;

  // Campos de ficha
  historia?: string;
  extras?: string;
  enlaces?: string[];

  // Visibilidad
  personalidadVisibility?: 'public' | 'friends' | 'private';
  historiaVisibility?: 'public' | 'friends' | 'private';
  tramaVisibility?: 'public' | 'friends' | 'private';
  extrasVisibility?: 'public' | 'friends' | 'private';
  enlacesVisibility?: 'public' | 'friends' | 'private';

  // 🔹 Campos adicionales
  socialLinks?: SocialLink[];
}

/**
 * Publicación de un personaje
 */
export interface Post {
  id: string;
  content: string;
  time: string | number; // Acepta ambos formatos
  likes: number;
  hearts?: number;
  laughs?: number;
  heartbreaks?: number;
  visibility: 'public' | 'friends' | 'private';
  charName: string;
  charHandle: string;
  avatarUrl: string;
  characterId?: string;
  type?: string;
}

/**
 * Chat entre personajes
 */
export interface Chat {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantUsernames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage?: string;
  lastMessageTime: number;
  unreadCount?: Record<string, number>; // Hacerlo opcional para evitar errores
}

/**
 * Mensaje individual
 */
export interface Message {
  senderId: string;
  content: string;
  timestamp: number;
  read: boolean;
}