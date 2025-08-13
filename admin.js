/*
 * Module admin pour modifier un pack en client-side.
 * Active l'overlay d'édition lorsque la session contient la clé 'admin'.
 */

function isAdmin() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === '1') {
    sessionStorage.setItem('admin', '1');
  }
  return sessionStorage.getItem('admin') === '1';
}

/**
 * Ajouter le bouton admin dans l'interface s'il est actif.
 */
function initAdminUI() {
  if (!isAdmin()) return;
  const header = document.querySelector('header');
  if (!header) return;
  const btn = document.createElement('button');
  btn.className = 'btn secondary';
  btn.textContent = 'Éditer pack';
  btn.addEventListener('click', openAdminOverlay);
  header.appendChild(btn);
}

// exposer certaines fonctions au scope global pour lier aux attributs HTML
window.openAdminOverlay = openAdminOverlay;
window.closeAdminOverlay = closeAdminOverlay;
window.downloadModifiedPack = downloadModifiedPack;

/**
 * Ouvrir l'overlay d'édition pour le pack courant.
 */
function openAdminOverlay() {
  const statePack = window.state ? window.state.pack : null;
  if (!statePack) {
    alert('Aucun pack chargé.');
    return;
  }
  const overlay = document.getElementById('admin-overlay');
  const textarea = overlay.querySelector('textarea');
  textarea.value = JSON.stringify(statePack, null, 2);
  overlay.classList.add('active');
}

/**
 * Fermer l'overlay admin.
 */
function closeAdminOverlay() {
  const overlay = document.getElementById('admin-overlay');
  overlay.classList.remove('active');
}

/**
 * Télécharger le JSON modifié.
 */
function downloadModifiedPack() {
  const overlay = document.getElementById('admin-overlay');
  const textarea = overlay.querySelector('textarea');
  let data;
  try {
    data = JSON.parse(textarea.value);
  } catch (err) {
    alert('JSON invalide: ' + err.message);
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pack_${data.id || 'modified'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// initialisation tardive après chargement du DOM
document.addEventListener('DOMContentLoaded', initAdminUI);
