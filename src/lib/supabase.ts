import { createClient } from '@supabase/supabase-js';

// Nota: este archivo asume que definirás las variables de entorno:
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY
// (No se incluyen valores reales aquí.)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
);

