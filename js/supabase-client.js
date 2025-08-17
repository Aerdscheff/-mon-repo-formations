/*
 * Supabase client helper
 *
 * This module exposes a function to call the commit_run edge function
 * to persist runs to the backend.
 */
import { getSession } from './auth.js';

const SUPABASE_URL = window.ENV?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY;

export async function commitRun({ pack, activityId, type, difficulty, correct, wrong, streakMax, xpEarned }) {
  // Retrieve the current session to get the JWT
  const session = await getSession();
  const accessToken = session?.data?.session?.access_token;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/commit_run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      pack_id: pack,
      activity_id: activityId,
      type: type || 'quiz',
      difficulty,
      client_outcome: {
        correct,
        wrong,
        streakMax,
        xpEarned,
      },
    }),
  });

  return response.json();
}
