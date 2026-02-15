/**
 * Client Supabase per l'applicazione GymTracker
 * Utilizza @supabase/ssr per la gestione ottimale delle sessioni
 */

import { createBrowserClient } from '@supabase/ssr';

let supabaseInstance = null;

/**
 * Crea e restituisce un'istanza singleton del client Supabase
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function creaClientSupabase() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Errore: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devono essere definiti nel file .env.local'
    );
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);

  return supabaseInstance;
}

/**
 * Hook per verificare se l'utente è autenticato
 * @returns {Promise<{isAuthenticated: boolean, user: Object|null}>}
 */
export async function verificaAutenticazione() {
  const supabase = creaClientSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  return {
    isAuthenticated: !!user && !error,
    user: user || null,
  };
}

/**
 * Esegue il logout dell'utente
 * @returns {Promise<{error: Error|null}>}
 */
export async function eseguiLogout() {
  const supabase = creaClientSupabase();
  return await supabase.auth.signOut();
}
