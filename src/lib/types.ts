// src/lib/types.ts

export interface Character {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  nationality?: string; 
  birthDate?: string;
  gender?: string;
  createdAt: string;
  friends?: Record<string, true>;
  userId: string;
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
