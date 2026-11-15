import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Header } from './components/Header.tsx';
import { CustomCursor } from './components/CustomCursor.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ProjectDetailPage } from './pages/ProjectDetailPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import type { PortfolioPayload, ProjectItem } from './types/portfolio.ts';

function getRouteFromPath(pathname: string) {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return { view: 'admin' as const };
  }
  const projectMatch = pathname.match(/^\/projects\/([^/]+)\/?$/);
  if (projectMatch?.[1]) {
    return { view: 'project' as const, slug: decodeURIComponent(projectMatch[1]) };
  }
  return { view: 'home' as const };
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  const navigate = useCallback((nextPath: string) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
      setPathname(nextPath);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const loadPortfolio = useCallback(() => {
    setLoading(true);
    fetch('/api/portfolio')
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load portfolio content.');
        return (await res.json()) as PortfolioPayload;
      })
      .then((data) => {
        setPortfolio(data);
        setError(null);
        if (data.settings) {
          document.title = data.settings.siteTitle;
          const descMeta = document.querySelector('meta[name="description"]');
          if (descMeta) descMeta.setAttribute('content', data.settings.siteDescription);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to load portfolio.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const route = getRouteFromPath(pathname);
    if (route.view !== 'admin') {
      loadPortfolio();
    } else {
      setLoading(false);
    }
  }, [pathname, loadPortfolio]);

  const route = getRouteFromPath(pathname);

  const handleNavigateHome = (sectionId?: string) => {
    if (pathname !== '/') {
      navigate('/');
      if (sectionId) {
        window.setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }, 160);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectProject = (project: ProjectItem) => {
    navigate(`/projects/${encodeURIComponent(project.slug)}`);
  };

  const pageTransition = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
      };

  if (route.view === 'admin') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="admin" {...pageTransition}>
          <AdminPage onExit={() => navigate('/')} />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (loading && !portfolio) {
    return (
      <div className="min-h-screen bg-[#F9F9F7]">
        <div className="h-16 border-b border-[#E4E4DF]" />
        <div className="max-w-[1200px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 space-y-6">
            <div className="h-4 w-48 bg-[#ECECE7] rounded" />
            <div className="h-14 w-full bg-[#ECECE7] rounded" />
            <div className="h-14 w-3/4 bg-[#ECECE7] rounded" />
          </div>
          <div className="lg:col-span-6 h-[420px] bg-[#ECECE7] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !portfolio) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-6">
        <div className="max-w-md bg-white border border-[#E4E4DF] rounded-2xl p-8 space-y-4">
          <h1 className="font-display text-xl font-semibold text-[#111210]">
            Unable to load portfolio
          </h1>
          <p className="text-sm text-[#52524C]">{error}</p>
          <button
            type="button"
            onClick={loadPortfolio}
            className="px-4 py-2 text-xs font-semibold text-[#111210] bg-[#DFC07C] rounded-lg cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#111210]">
      <CustomCursor disabled={false} />
      <Header
        brandName={portfolio?.settings?.brandName || 'Yeasin Ahmed'}
        onNavigateHome={handleNavigateHome}
      />
      <AnimatePresence mode="wait">
        {route.view === 'project' ? (
          <motion.div key={`project-${route.slug}`} {...pageTransition}>
            <ProjectDetailPage
              slug={route.slug}
              initialProject={portfolio?.projects.find((p) => p.slug === route.slug)}
              onBack={() => handleNavigateHome('projects')}
            />
          </motion.div>
        ) : (
          portfolio && (
            <motion.div key="home" {...pageTransition}>
              <HomePage
                data={portfolio}
                onSelectProject={handleSelectProject}
                onNavigateAdmin={() => navigate('/admin')}
              />
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
