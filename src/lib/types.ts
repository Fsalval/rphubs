// src/lib/types.ts

export interface Character {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  biography?: string;        // ← mejor que `bio`
  profile?: string;          // biografía completa
  nationality?: string;
  birthDate?: string;
  gender?: string;
  mbti?: string;
  createdAt: string;
  tags?: string[];
  personalidad?: string;     // ← ahora sí, reconocida
  trama?: string;            // trama principal
  friends?: Record<string, true>;
  userId: string;
  pin: string;               // si lo usas en auth
  usernameLowerCase?: string; // útil para búsquedas
  // 🔹 Campos adicionales que usas en el frontend
  socialLinks?: {
    name: string;
    url: string;
    username?: string;
  }[];
}

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

export interface Story {
  id: string;
  name: string;
  content: string;
  time: string;
  visibility: "public" | "friends" | "private";
  status: "in-progress" | "pending" | "completed";
  participants: number;
  author: {
    name: string;
    username: string;
    avatarUrl: string;
  };
  collaborators: string[];
  responses?: Record<string, StoryResponse>;
}

export interface StoryResponse {
  author: {
    name: string;
    username: string;
    avatarUrl: string;
  };
  content: string;
  time: string;
}

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

export interface Message {
  senderId: string;
  content: string;
  timestamp: number;
  read: boolean;
}
