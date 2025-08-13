/*
 * Auth module for Äerdschëff formations
 *
 * Handles Supabase Magic Link authentication, sign out, and profile ensuring.
 * To configure, set SUPABASE_URL and SUPABASE_ANON_KEY in config/supabase.env
 * or expose them via the global `ENV` object.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Lazy Supabase client initializer
let _client;
function getClient() {
  if (_client) return _client;
  const url = window.ENV?.SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL;
  const key = window.ENV?.SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('Supabase credentials are missing. Auth disabled.');
    return null;
  }
  _client = createClient(url, key, {
    auth: { autoRefreshToken: true, persistSession: true }
  });
  return _client;
}

/**
 * Sends a magic link to the provided email for authentication.
 * @param {string} email
 */
export async function login(email) {
  const client = getClient();
  if (!client) return { error: new Error('Client not configured') };
  const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  return { error };
}

/**
 * Signs the current user out.
 */
export async function logout() {
  const client = getClient();
  if (!client) return;
  await client.auth.signOut();
}

/**
 * Retrieves the currently authenticated user (if any).
 */
export async function currentUser() {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data?.user ?? null;
}

/**
 * Ensures the authenticated user has a profile row in the `profiles` table.
 * @param {string} displayName
 */
export async function ensureProfile(displayName) {
  const client = getClient();
  if (!client) return;
  const user = await currentUser();
  if (!user) return;
  // Upsert profile
  const { error } = await client.from('profiles').upsert({ id: user.id, display_name: displayName });
  if (error) console.error('Failed to upsert profile', error);
}