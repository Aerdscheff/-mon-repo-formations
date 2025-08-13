/*
 * Leaderboard utilities
 *
 * Provides functions to query leaderboards from Supabase. It expects
 * stored procedures (RPC) or materialized views to be defined in
 * `/supabase/sql/rpc.sql` and available under the `rpc` namespace.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

let clientCache;
function supabaseClient() {
  if (clientCache) return clientCache;
  const url = window.ENV?.SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL;
  const key = window.ENV?.SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  clientCache = createClient(url, key, { auth: { persistSession: true } });
  return clientCache;
}

/**
 * Fetch leaderboard entries.
 * @param {'all'|'30'|'7'} timeframe - timeframe identifier
 * @returns {Promise<Array<{handle: string, xp_total: number}>>}
 */
export async function fetchLeaderboard(timeframe = 'all') {
  const client = supabaseClient();
  if (!client) return [];
  // Select appropriate RPC or view
  const rpcName = timeframe === 'all' ? 'leaderboard_all' : timeframe === '30' ? 'leaderboard_30' : 'leaderboard_7';
  const { data, error } = await client.rpc(rpcName);
  if (error) {
    console.error('Error fetching leaderboard', error);
    return [];
  }
  return data ?? [];
}