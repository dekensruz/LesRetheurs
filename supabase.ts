import { createClient } from '@supabase/supabase-js';

/**
 * Récupère une variable d'environnement de manière robuste.
 * Vérifie d'abord process.env (injecté par certains environnements)
 * puis import.meta.env (standard Vite).
 */
const getEnv = (name: string): string => {
  // Tentative via process.env (souvent disponible via injection dans cet environnement)
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name] as string;
  }
  
  // Tentative via import.meta.env (standard Vite)
  // @ts-ignore - import.meta.env peut ne pas être reconnu par TS selon la config mais existe à l'exécution
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    // @ts-ignore
    return import.meta.env[name] as string;
  }

  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Validation avant initialisation pour éviter le crash "supabaseUrl is required"
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "ERREUR CRITIQUE : Identifiants Supabase manquants.\n" +
    "Veuillez configurer les variables d'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.\n" +
    "En local : créez un fichier .env\n" +
    "Sur Vercel : ajoutez-les dans Settings > Environment Variables."
  );
}

// Initialisation du client avec des valeurs par défaut sécurisées si manquantes
// (On utilise des chaînes vides pour éviter l'erreur immédiate, mais l'app affichera des erreurs de requête)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url-missing.supabase.co', 
  supabaseAnonKey || 'placeholder-key-missing'
);