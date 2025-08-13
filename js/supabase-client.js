/*
 * Supabase client helper
 *
 * This module exposes a stub for the commitRun function used to persist
 * quiz runs to the backend. In a real implementation this would call
 * an Edge Function defined in `/supabase/functions/commit_run/index.ts`.
 */

export async function commitRun({ pack, difficulty, correct, wrong, streakMax, xpEarned }) {
  // TODO: call Supabase Edge Function to persist the run
  console.log('commitRun stub:', { pack, difficulty, correct, wrong, streakMax, xpEarned });
  return { error: null };
}