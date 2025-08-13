/*
 * Code principal pour l'application de formations gamifiées.
 * Ce script charge les packs depuis des fichiers JSON,
 * gère l'affichage des questions et la persistance des scores via localStorage.
 */

import { asset } from '../utils/paths.js';
import { getScore, saveScore } from './scores.js';

// Liste des packs disponibles avec titre et couverture.
// Cette liste est utilisée pour afficher le catalogue principal.
const PACK_LIST = [
  {
    id: 'ia_enjeux',
    title: 'IA & enjeux',
    cover: 'images/headers/ia_enjeux.webp',
    file: 'packs/ia_enjeux.json'
  },
  {
    id: 'prompting_rh',
    title: 'Prompting RH',
    cover: 'images/headers/default.webp',
    file: 'packs/prompting_rh.json'
  }
];

// État courant de l'application
const state = {
  pack: null, // objet pack chargé
  index: 0,   // index de la question courante
  score: 0    // nombre de réponses correctes
};

// Exposer l'état globalement pour le module admin
window.state = state;

/**
 * Récupérer les paramètres de la requête.
 * @returns {URLSearchParams}
 */
function getParams() {
  return new URLSearchParams(window.location.search);
}

/**
 * Afficher la liste des packs disponibles.
 */
function showCatalog() {
  const container = document.getElementById('app');
  container.innerHTML = '';
  const title = document.createElement('h1');
  title.textContent = 'Catalogue des formations';
  container.appendChild(title);
  PACK_LIST.forEach((pack) => {
    const card = document.createElement('div');
    card.className = 'card pack-card';
    const img = document.createElement('img');
    img.className = 'pack-cover';
    // résoudre le chemin de couverture via asset()
    img.src = asset(pack.cover);
    img.alt = '';
    img.loading = 'lazy';
    card.appendChild(img);
    const h = document.createElement('h2');
    h.className = 'pack-title';
    h.textContent = pack.title;
    card.appendChild(h);
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Commencer';
    btn.addEventListener('click', () => {
      window.location.search = '?pack=' + encodeURIComponent(pack.id);
    });
    card.appendChild(btn);
    container.appendChild(card);
  });
}

/**
 * Charger un fichier JSON depuis un chemin relatif.
 * @param {string} path 
 * @returns {Promise<Object>}
 */
async function loadJson(path) {
  // Utiliser asset() pour résoudre les chemins selon l'environnement (local ou GitHub Pages)
  const url = asset(path);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Erreur de chargement du pack');
  return res.json();
}

/**
 * Afficher le pack chargé.
 */
function showPack() {
  const container = document.getElementById('app');
  container.innerHTML = '';
  const pack = state.pack;
  const header = document.createElement('div');
  header.className = 'card';
  const h1 = document.createElement('h1');
  h1.textContent = pack.title;
  header.appendChild(h1);
  container.appendChild(header);
  // zone question
  const qContainer = document.createElement('div');
  qContainer.id = 'question-area';
  container.appendChild(qContainer);
  renderQuestion();
}

/**
 * Afficher la question courante.
 */
function renderQuestion() {
  const qContainer = document.getElementById('question-area');
  qContainer.innerHTML = '';
  const pack = state.pack;
  if (state.index >= pack.questions.length) {
    // Fin du quiz
    const pct = Math.round((state.score / pack.questions.length) * 100);
    const summary = document.createElement('div');
    summary.className = 'card';
    summary.innerHTML = `<h2>Résultat</h2><p>Tu as obtenu ${state.score} bonne(s) réponse(s) sur ${pack.questions.length} (${pct}%).</p>`;
    // enregistrer score
    saveScore(pack.id, pct);
    qContainer.appendChild(summary);
    const back = document.createElement('button');
    back.className = 'btn secondary';
    back.textContent = 'Retour au catalogue';
    back.addEventListener('click', () => {
      window.location.search = '';
    });
    qContainer.appendChild(back);
    return;
  }
  const question = pack.questions[state.index];
  const card = document.createElement('div');
  card.className = 'card';
  // question content
  const row = document.createElement('div');
  row.style.display = 'flex';
  const img = document.createElement('img');
  img.className = 'question-image';
  // Résoudre correctement le chemin de l'image selon l'environnement.
  const slug = state.pack.id;
  const qImg = question.image.startsWith('images/') ? question.image : `images/${slug}/${question.image}`;
  img.src = asset(qImg);
  img.loading = 'lazy';
  img.classList.add('thumb');
  img.alt = '';
  row.appendChild(img);
  const content = document.createElement('div');
  const h = document.createElement('h3');
  h.textContent = question.title;
  content.appendChild(h);
  const ul = document.createElement('ul');
  ul.className = 'choices';
  question.choices.forEach((choice, idx) => {
    const li = document.createElement('li');
    li.className = 'choice';
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'q' + state.index;
    radio.value = String(idx);
    label.appendChild(radio);
    label.appendChild(document.createTextNode(' ' + choice.label));
    li.appendChild(label);
    ul.appendChild(li);
    // handler
    radio.addEventListener('change', () => {
      // désactiver tous les radios
      document.querySelectorAll(`input[name='q${state.index}']`).forEach(el => el.disabled = true);
      const feedback = document.createElement('div');
      feedback.className = 'feedback';
      if (choice.correct) {
        state.score += 1;
        feedback.classList.add('ok');
        feedback.textContent = '✅ Correct. ' + (choice.explain || '');
      } else {
        feedback.classList.add('err');
        feedback.textContent = '✖ Incorrect. ' + (choice.explain || '');
      }
      content.appendChild(feedback);
      // bouton suivant
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn';
      nextBtn.textContent = 'Suivant';
      nextBtn.style.marginTop = '1rem';
      nextBtn.addEventListener('click', () => {
        state.index += 1;
        renderQuestion();
      });
      content.appendChild(nextBtn);
    });
  });
  content.appendChild(ul);
  row.appendChild(content);
  card.appendChild(row);
  qContainer.appendChild(card);
}

/**
 * Initialiser l'application.
 */
async function init() {
  const params = getParams();
  const packId = params.get('pack');
  if (!packId) {
    // afficher catalogue
    showCatalog();
    return;
  }
  // charger pack
  const packInfo = PACK_LIST.find(p => p.id === packId);
  if (!packInfo) {
    alert('Pack introuvable');
    showCatalog();
    return;
  }
  try {
    const data = await loadJson(packInfo.file);
    state.pack = data;
    state.index = 0;
    state.score = 0;
    showPack();
  } catch (err) {
    console.error(err);
    alert('Erreur de chargement du pack.');
    showCatalog();
  }
}

// Lancer l'application
document.addEventListener('DOMContentLoaded', init);