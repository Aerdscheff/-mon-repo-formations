import { getSession } from './auth.js';

const SUPABASE_URL = window.ENV?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY;

async function rpcLeaderboard(period){
  const session = await getSession();
  const accessToken = session?.data?.session?.access_token;
  const url = `${SUPABASE_URL}/rest/v1/rpc/get_leaderboard`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ period })
  });
  if(!res.ok){
    const t = await res.text();
    throw new Error(`Leaderboard RPC failed: ${res.status} ${t}`);
  }
  return res.json();
}

export async function renderLeaderboard(container){
  container.innerHTML = '';
  const tabs = document.createElement('div');
  tabs.className = 'card';
  tabs.style.display = 'flex';
  tabs.style.gap = '8px';
  const periods = [
    { id:'7d', label:'7 jours' },
    { id:'30d', label:'30 jours' },
    { id:'all', label:'Global' },
  ];
  const list = document.createElement('div');
  list.className = 'list';
  list.style.marginTop = '12px';
  container.appendChild(tabs);
  container.appendChild(list);

  async function load(period){
    list.innerHTML = '<div class="card">Chargement…</div>';
    try{
      const data = await rpcLeaderboard(period);
      list.innerHTML = '';
      if(!data || !data.length){
        list.innerHTML = '<div class="card">Pas de données</div>';
        return;
      }
      const ul = document.createElement('ul');
      ul.style.listStyle = 'none';
      ul.style.padding = '0';
      ul.style.margin = '0';
      data.slice(0, 50).forEach((row, idx) => {
        const li = document.createElement('li');
        li.className = 'card';
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.justifyContent = 'space-between';
        li.style.gap = '12px';
        li.innerHTML = `<div><strong>#${idx+1}</strong> ${row.name || row.user_id}</div><div>${row.xp} XP</div>`;
        ul.appendChild(li);
      });
      list.appendChild(ul);
    }catch(e){
      list.innerHTML = `<div class="card">Erreur: ${e.message}</div>`;
    }
  }

  periods.forEach(p => {
    const b = document.createElement('button');
    b.className = 'btn btn-secondary';
    b.textContent = p.label;
    b.addEventListener('click', () => load(p.id));
    tabs.appendChild(b);
  });

  // default
  await load('7d');
}
