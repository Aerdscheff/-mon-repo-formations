// Deno edge function to commit a run and update user progress
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// XP thresholds and multipliers must match config/rolemap.json
const LEVELS = [0,100,250,450,700,1000,1350,1750,2200,2700,3250,3850,4500,5200,5950,6750,7600,8500,9450,10400,11450,12600,13850,15200,16650,18200,19850,21600,23500,25500,27600];
const MULT = { debutant:1, initie:1.25, multiplicateur:1.5, maitre:2, godlike:3 };
const BASE = 20, STREAK = 10, CAP = 2000;

function levelFor(xp:number){
  let level = 1;
  for (let i=0;i<LEVELS.length;i++){
    if (xp >= LEVELS[i]) level = i+1;
    else break;
  }
  return level;
}
function tierFor(level:number){
  return level<=5?"debutant":level<=15?"initie":level<=30?"maitre":"godlike";
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const body = await req.json();
  const { user_id, pack, difficulty, correct, wrong, streak_max } = body;
  // Compute XP
  const mult = MULT[difficulty as keyof typeof MULT] ?? 1;
  let xpEarned = correct * BASE * mult;
  if (streak_max > 1) xpEarned += STREAK * (streak_max - 1);
  xpEarned -= wrong * 5;
  if (xpEarned < 0) xpEarned = 0;
  if (xpEarned > CAP) xpEarned = CAP;
  // Init Supabase client with service role (env)
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const client = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  // Fetch existing progress
  const { data: existing } = await client.from('progress').select('*').eq('user_id', user_id).maybeSingle();
  let xp_total = (existing?.xp_total ?? 0) + xpEarned;
  const level = levelFor(xp_total);
  const tier = tierFor(level);
  // Upsert progress
  const { error: progressError } = await client.from('progress').upsert({ user_id, xp_total, level, tier }, { onConflict: 'user_id' });
  if (progressError) {
    console.error(progressError);
    return new Response(JSON.stringify({ error: progressError.message }), { status: 500 });
  }
  // Insert run
  const { error: runError } = await client.from('runs').insert({ user_id, pack, difficulty, correct, wrong, streak_max, xp_earned: xpEarned });
  if (runError) {
    console.error(runError);
    return new Response(JSON.stringify({ error: runError.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ success: true, xpEarned, level, tier }), { status: 200 });
});
