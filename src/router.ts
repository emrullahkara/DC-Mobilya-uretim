// Basit hash yönlendirici: #/projeler, #/proje/<id>/<sekme> ...
import { useSyncExternalStore } from 'react';

function oku(): string[] {
  const h = window.location.hash.replace(/^#\/?/, '');
  return h ? h.split('/').map(decodeURIComponent) : [];
}

let cache = oku();
const dinleyiciler = new Set<() => void>();
window.addEventListener('hashchange', () => {
  cache = oku();
  dinleyiciler.forEach((f) => f());
});

export function useRoute(): string[] {
  return useSyncExternalStore(
    (f) => {
      dinleyiciler.add(f);
      return () => dinleyiciler.delete(f);
    },
    () => cache,
  );
}

export function git(...parts: string[]) {
  window.location.hash = '/' + parts.map(encodeURIComponent).join('/');
  window.scrollTo(0, 0);
}
