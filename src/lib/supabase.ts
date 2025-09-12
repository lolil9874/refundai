import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const openrouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;

// N'initialise le client que si les variables d'env sont présentes.
// Pas d'exception au chargement du module pour éviter de crasher l'appli.
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Helper pour s'assurer que Supabase est configuré au moment de l'usage.
export function ensureSupabaseConfigured(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase non configuré. Veuillez définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

// Helper pour vérifier si OpenRouter est configuré
export function ensureOpenRouterConfigured(): string {
  if (!openrouterApiKey) {
    throw new Error("OpenRouter non configuré. Veuillez définir VITE_OPENROUTER_API_KEY.");
  }
  return openrouterApiKey;
}