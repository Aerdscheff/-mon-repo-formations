// Résout correctement les chemins sur GitHub Pages (sous-chemin) et en local.
export function asset(path) {
  const clean = String(path).replace(/^\/+/, '');
  // prod: https://<user>.github.io/<repo>/...
  if (location.hostname.endsWith('github.io')) {
    // pathname = /-mon-repo-formations/... -> repo = '-mon-repo-formations'
    const parts = location.pathname.split('/').filter(Boolean);
    const repo = parts.length ? parts[0] : '';
    return `/${repo}/${clean}`;
  }
  // dev local: chemins relatifs
  return `./${clean}`;
}
