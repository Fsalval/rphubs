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
  trama?: string; // ← mantener por compatibilidad
  friends?: Record<string, true>;
  userId: string;
  pin: string;
  usernameLowerCase?: string;

  // --- Nuevos campos agregados ---
  age?: number; // calculado, pero usado en UI
  species?: string;
  fandom?: string;

  // Campos de ficha
  historia?: string;
  extras?: string;
  enlaces?: string[];

  // Visibilidad
  personalidadVisibility?: 'public' | 'friends' | 'private';
  historiaVisibility?: 'public' | 'friends' | 'private';
  tramaVisibility?: 'public' | 'friends' | 'private'; // ← mantener por migración
  extrasVisibility?: 'public' | 'friends' | 'private';
  enlacesVisibility?: 'public' | 'friends' | 'private';

  // 🔹 Campos adicionales (frontend)
  socialLinks?: SocialLink[];
}
