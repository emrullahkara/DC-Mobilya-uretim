import { lazy, Suspense } from 'react';
import { useRoute, git } from './router';
import { useStore } from './store';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Customers from './pages/Customers';
import MaterialsPage from './pages/MaterialsPage';
import SettingsPage from './pages/SettingsPage';

const ProjectEditor = lazy(() => import('./project/ProjectEditor'));
const Library = lazy(() => import('./pages/Library'));

const NAV = [
  { k: '', ad: 'Panel', ic: '🏠' },
  { k: 'projeler', ad: 'İşler', ic: '📐' },
  { k: 'musteriler', ad: 'Müşteriler', ic: '👥' },
  { k: 'kutuphane', ad: 'Modüller', ic: '🧱' },
  { k: 'malzemeler', ad: 'Malzemeler', ic: '🪵' },
  { k: 'ayarlar', ad: 'Ayarlar', ic: '⚙️' },
];

export default function App() {
  const route = useRoute();
  const hydrated = useStore((s) => s.hydrated);
  const firma = useStore((s) => s.settings.firma.ad);
  const bolum = route[0] ?? '';
  const aktif = bolum === 'proje' ? 'projeler' : bolum;

  let sayfa;
  if (!hydrated) sayfa = <div className="loading">Yükleniyor…</div>;
  else if (bolum === 'proje' && route[1]) sayfa = <ProjectEditor id={route[1]} tab={route[2] ?? 'tasarim'} />;
  else if (bolum === 'projeler') sayfa = <Projects />;
  else if (bolum === 'musteriler') sayfa = <Customers />;
  else if (bolum === 'kutuphane') sayfa = <Library />;
  else if (bolum === 'malzemeler') sayfa = <MaterialsPage />;
  else if (bolum === 'ayarlar') sayfa = <SettingsPage />;
  else sayfa = <Home />;

  return (
    <div className="app">
      <header className="topbar no-print">
        <button className="brand" onClick={() => git('')}>
          <img src="./icon.svg" alt="" width={28} height={28} />
          <span>{firma || 'DC Mobilya'}</span>
          <small>Üretim</small>
        </button>
        <nav className="topnav">
          {NAV.map((n) => (
            <button key={n.k} className={aktif === n.k ? 'on' : ''} onClick={() => git(n.k)}>
              {n.ad}
            </button>
          ))}
        </nav>
      </header>
      <main className="main">
        <Suspense fallback={<div className="loading">Yükleniyor…</div>}>{sayfa}</Suspense>
      </main>
      <nav className="bottomnav no-print">
        {NAV.map((n) => (
          <button key={n.k} className={aktif === n.k ? 'on' : ''} onClick={() => git(n.k)}>
            <span className="ic">{n.ic}</span>
            <span>{n.ad}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
