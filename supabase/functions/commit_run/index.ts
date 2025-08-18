// Deno edge function to commit a run and update user progress (idempotent summary; ignore per-question XP)
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// XP thresholds and multipliers must match config/rolemap.json (server authority)
const LEVELS = [0,100,250,450,700,1000,1350,1750,2200,2700,3250,3850,4500,5200,5950,6750,7600,8500,9450,10400,11450,12600,13850,15200,16650,18200,19850,21600,23500,25500,27600];
const MULT: Record<string, number> = { debutant:1, initie:1.25, maitre:2, godlike:3 };
const BASE = 20, STREAK = 10, CAP = 2000;

function levelFor(xp:number){
  let level = 1;
  for (let i=0;i<LEVELS.length;i++){
    if (xp >= LEVELS[i]) level = i+1; else break;
  }
  return level;
}
function tierFor(level:number){
  return level<=5?"debutant":level<=15?"initie":level<=30?"maitre":"godlike";
}

function isPerQuestion(payload: any): boolean {
  const co = payload?.client_outcome || {};
  // Heuristique: appels par question envoient xpEarned=0 et correct=1
  if (co && typeof co === 'object') {
    if (co.xpEarned === 0 && co.correct === 1) return true;
  }
  // Fallback: activity_id ressemble à un id de question (qNN ou contient 'q')
  const aid = payload?.activity_id || '';
  if (/^q\d{1,3}$/i.test(aid)) return true;
  return false;
}

function computeXpServer(type: string, difficulty: string, correct: number, wrong: number, streakMax: number){
  const mult = MULT[difficulty?.toLowerCase?.() || difficulty] ?? 1;
  let xpEarned = (correct||0) * BASE * mult;
  if ((streakMax||0) > 1) xpEarned += STREAK * ((streakMax||0) - 1);
  xpEarned -= (wrong||0) * 5;
  if (xpEarned < 0) xpEarned = 0;
  if (xpEarned > CAP) xpEarned = CAP;
  return Math.round(xpEarned);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type' } });
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const payload = await req.json();
    // Expected payload from client:
    // { pack_id, activity_id, type, difficulty, client_outcome: { correct, wrong, streakMax, xpEarned?, question_index?, ts? } }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const client = createClient(SUPABASE_URL, SERVICE_KEY, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });

    // Resolve user from Authorization header
    const auth = req.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ')? auth.slice(7): auth;
    const { data: userData, error: userErr } = await client.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success:false, error: 'Unauthorized' }), { status: 401 });
    }
    const user_id = userData.user.id;

    const pack_id = payload.pack_id || payload.pack || 'unknown_pack';
    const activity_id = payload.activity_id || 'summary';
    const type = (payload.type || 'quiz').toString();
    const difficulty = (payload.difficulty || 'debutant').toString().toLowerCase();
    const co = payload.client_outcome || {};

    // Per-question events: ignore XP credit (but report success)
    if (isPerQuestion(payload)) {
      // Optionnel: écrire une trace dans une table events si elle existe (non bloquant)
      try {
        await client.from('run_traces').insert({
          user_id, pack: pack_id, activity_id, type, difficulty,
          correct: co.correct ?? null, wrong: co.wrong ?? null, streak_max: co.streakMax ?? null,
          meta: co
        });
      } catch(_e) { /* table peut ne pas exister, ignorer */ }
      return new Response(JSON.stringify({ success:true, credited:false }), { status: 200 });
    }

    // Summary event: compute XP on server and credit once (soft idempotence)
    const correct = Number(co.correct ?? 0);
    const wrong = Number(co.wrong ?? 0);
    const streakMax = Number(co.streakMax ?? 0);
    const xpEarned = computeXpServer(type, difficulty, correct, wrong, streakMax);

    // Soft idempotence: if a similar run exists in last 2 minutes, skip credit
    let recentExists = false;
    try {
      const since = new Date(Date.now() - 2*60*1000).toISOString();
      const { data: recent, error: recentErr } = await client
        .from('runs')
        .select('id')
        .eq('user_id', user_id)
        .eq('pack', pack_id)
        .eq('difficulty', difficulty)
        .gte('created_at', since)
        .limit(1);
      if (!recentErr && recent && recent.length) recentExists = true;
    } catch(_e) {}

    if (!recentExists) {
      // Update progress
      try {
        const { data: existing } = await client.from('progress').select('*').eq('user_id', user_id).maybeSingle();
        const xp_total = (existing?.xp_total ?? 0) + xpEarned;
        const level = levelFor(xp_total);
        const tier = tierFor(level);
        await client.from('progress').upsert({ user_id, xp_total, level, tier }, { onConflict: 'user_id' });
      } catch(e){ /* log but continue */ }

      // Insert run summary
      const { error: runError } = await client.from('runs').insert({
        user_id, pack: pack_id, difficulty, correct, wrong, streak_max: streakMax, xp_earned: xpEarned, activity_id
      });
      if (runError) {
        return new Response(JSON.stringify({ success:false, error: runError.message }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ success:true, credited: !recentExists, xp_awarded: xpEarned }), { status: 200 });
  } catch(e){
    return new Response(JSON.stringify({ success:false, error: (e as Error).message }), { status: 400 });
  }
});
