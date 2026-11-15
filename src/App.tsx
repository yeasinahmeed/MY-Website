import { Component, useCallback, useEffect, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Header } from './components/Header.tsx';
import { CustomCursor } from './components/CustomCursor.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ProjectDetailPage } from './pages/ProjectDetailPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { STATIC_PORTFOLIO } from './data/staticPortfolio.ts';
import type { PortfolioPayload, ProjectItem } from './types/portfolio.ts';

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected rendering error.' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application boundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9F9F7] text-[#111210] flex items-center justify-center p-6">
          <div className="max-w-md bg-white border border-[#E4E4DF] rounded-2xl p-8 space-y-4">
            <h1 className="font-display text-xl font-semibold">Portfolio view recovered</h1>
            <p className="text-sm text-[#52524C]">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-semibold text-[#111210] bg-[#DFC07C] rounded-lg cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function getRoute(pathname: string, hash: string) {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const candidate = normalizedHash.startsWith('/') ? normalizedHash : pathname;

  if (candidate === '/admin' || candidate.startsWith('/admin/')) {
    return { view: 'admin' as const };
  }
  const projectMatch = candidate.match(/^\/projects\/([^/]+)\/?$/);
  if (projectMatch?.[1]) {
    return { view: 'project' as const, slug: decodeURIComponent(projectMatch[1]) };
  }
  return { view: 'home' as const };
}

function isSubpathOrStaticHost() {
  if (typeof window === 'undefined') return false;
  if (window.location.hostname.endsWith('.github.io')) return true;
  if (window.location.hash.startsWith('#/')) return true;
  const p = window.location.pathname;
  return p !== '/' && !/^\/(projects|admin)(\/|$)/.test(p);
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [hash, setHash] = useState(() => window.location.hash);
  const [hasBackend, setHasBackend] = useState<boolean>(() => !window.location.hostname.endsWith('.github.io'));
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(() =>
    window.location.hostname.endsWith('.github.io') ? STATIC_PORTFOLIO : null,
  );
  const [loading, setLoading] = useState(() => !window.location.hostname.endsWith('.github.io'));
  const prefersReduced = useReducedMotion();

  const navigate = useCallback(
    (nextRoute: string) => {
      const useHash = !hasBackend || isSubpathOrStaticHost();
      if (useHash) {
        const targetHash = nextRoute === '/' ? '' : `#${nextRoute}`;
        if (targetHash) {
          window.location.hash = targetHash;
          setHash(targetHash);
        } else {
          window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
          setHash('');
        }
        return;
      }

      if (window.location.pathname !== nextRoute || window.location.hash) {
        window.history.pushState({}, '', nextRoute);
        setPathname(nextRoute);
        setHash('');
      }
    },
    [hasBackend],
  );

  useEffect(() => {
    const syncLocation = () => {
      setPathname(window.location.pathname);
      setHash(window.location.hash);
    };
    window.addEventListener('popstate', syncLocation);
    window.addEventListener('hashchange', syncLocation);
    return () => {
      window.removeEventListener('popstate', syncLocation);
      window.removeEventListener('hashchange', syncLocation);
    };
  }, []);

  const loadPortfolio = useCallback(() => {
    if (window.location.hostname.endsWith('.github.io')) {
      setPortfolio(STATIC_PORTFOLIO);
      setHasBackend(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/portfolio')
      .then(async (res) => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || !ct.includes('application/json')) {
          throw new Error('Static deployment mode');
        }
        return (await res.json()) as PortfolioPayload;
      })
      .then((data) => {
        setHasBackend(true);
        setPortfolio(data);
        if (data.settings) {
          document.title = data.settings.siteTitle;
          const descMeta = document.querySelector('meta[name="description"]');
          if (descMeta) descMeta.setAttribute('content', data.settings.siteDescription);
        }
      })
      .catch(() => {
        // Static hosts (such as GitHub Pages or custom static CDN) seamlessly use the public snapshot
        setHasBackend(false);
        setPortfolio(STATIC_PORTFOLIO);
        if (STATIC_PORTFOLIO.settings) {
          document.title = STATIC_PORTFOLIO.settings.siteTitle;
          const descMeta = document.querySelector('meta[name="description"]');
          if (descMeta) {
            descMeta.setAttribute('content', STATIC_PORTFOLIO.settings.siteDescription);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const route = getRoute(pathname, hash);

  useEffect(() => {
    if (route.view !== 'admin') {
      loadPortfolio();
    } else {
      setLoading(false);
    }
  }, [route.view, loadPortfolio]);

  const handleNavigateHome = (sectionId?: string) => {
    if (route.view !== 'home') {
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

  const renderView = () => {
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
  };

  return <AppErrorBoundary>{renderView()}</AppErrorBoundary>;
}
