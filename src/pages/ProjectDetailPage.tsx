import { Suspense, lazy, useEffect, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import type { ProjectItem } from '../types/portfolio.ts';
import { MagneticButton } from '../components/MagneticButton.tsx';
import { ResultRing } from '../components/SkillProgressBar.tsx';

const ProjectMockup3D = lazy(() => import('../components/ProjectMockup3D.tsx'));

interface ProjectDetailPageProps {
  slug: string;
  initialProject?: ProjectItem;
  onBack: () => void;
}

export function ProjectDetailPage({ slug, initialProject, onBack }: ProjectDetailPageProps) {
  const [project, setProject] = useState<ProjectItem | null>(initialProject || null);
  const [loading, setLoading] = useState(!initialProject);
  const [error, setError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [mockupMode, setMockupMode] = useState<'laptop' | 'phone' | 'flat'>('laptop');
  const [activeImage, setActiveImage] = useState<string>(initialProject?.coverImage || '');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    let active = true;
    if (!initialProject) setLoading(true);
    fetch(`/api/projects/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Case study not found.');
        return (await res.json()) as ProjectItem;
      })
      .then((data) => {
        if (active) {
          setProject(data);
          setActiveImage(data.coverImage);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active && !initialProject) {
          setError(err instanceof Error ? err.message : 'Unable to load case study.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, initialProject]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxSrc(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (loading) {
    return (
      <main className="max-w-[1000px] mx-auto px-6 py-20">
        <div className="h-6 w-32 bg-[#ECECE7] rounded mb-8" />
        <div className="h-12 w-3/4 bg-[#ECECE7] rounded mb-6" />
        <div className="aspect-[16/9] bg-[#ECECE7] rounded-2xl" />
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="max-w-[1000px] mx-auto px-6 py-24 space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#52524C] hover:text-[#111210] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </button>
        <div className="bg-white border border-[#E4E4DF] rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-[#111210] mb-2">
            Case study unavailable
          </h1>
          <p className="text-sm text-[#52524C]">
            {error || 'This case study may have been unpublished or moved.'}
          </p>
        </div>
      </main>
    );
  }

  const galleryImages = project.gallery.length > 0 ? project.gallery : [project.coverImage];
  const displaySrc = activeImage || project.coverImage;

  return (
    <main className="py-12 lg:py-20 bg-[#F9F9F7]">
      <div className="max-w-[1040px] mx-auto px-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#52524C] hover:text-[#111210] transition-colors mb-10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          All Projects
        </button>

        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-[#6E6E67] mb-4">
          <span>{project.category}</span>
          <span aria-hidden="true">·</span>
          <span>{project.clientOrContext}</span>
          <span aria-hidden="true">·</span>
          <span>{project.timeframe}</span>
        </div>

        <h1
          className="vf-shift font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#111210] mb-6"
          style={{ textWrap: 'balance' }}
        >
          {project.title}
        </h1>

        <p className="text-base sm:text-lg leading-relaxed text-[#45453F] max-w-3xl mb-10">
          {project.description}
        </p>

        {/* Key Results Metrics Row with Animated SVG Progress Rings */}
        {project.metrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-y border-[#E4E4DF] mb-12">
            {project.metrics.map((metric) => (
              <div key={metric.label} className="flex items-center gap-4">
                <ResultRing value={metric.value} />
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-semibold text-[#111210] tabular-nums">
                    {metric.value}
                  </p>
                  <p className="text-xs font-mono text-[#6E6E67] mt-0.5">{metric.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interactive 3D Device Mockup Showcase */}
        <div className="space-y-4 mb-14">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs text-[#6E6E67]">
              Interactive Preview · Move pointer to tilt
            </span>
            <div className="inline-flex items-center gap-1 p-1 bg-[#ECECE7] rounded-lg">
              {(['laptop', 'phone', 'flat'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMockupMode(m)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize cursor-pointer ${
                    mockupMode === m ? 'bg-white text-[#111210]' : 'text-[#52524C]'
                  }`}
                >
                  {m === 'flat' ? 'Editorial Image' : `3D ${m}`}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[#E4E4DF] bg-[#ECECE7] aspect-[16/10]">
            {mockupMode === 'flat' ? (
              !failedImages[displaySrc] ? (
                <img
                  src={displaySrc}
                  alt={project.title}
                  referrerPolicy="no-referrer"
                  onError={() => setFailedImages((prev) => ({ ...prev, [displaySrc]: true }))}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 text-center">
                  <span className="font-display text-xl text-[#52524C]">{project.title}</span>
                </div>
              )
            ) : (
              <Suspense
                fallback={
                  <img
                    src={displaySrc}
                    alt={project.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                }
              >
                <ProjectMockup3D
                  imageUrl={displaySrc}
                  title={project.title}
                  mode={mockupMode}
                />
              </Suspense>
            )}
          </div>
        </div>

        {/* Goal, Approach, Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-14 border-b border-[#E4E4DF]">
          <section className="space-y-3">
            <p className="font-mono text-xs text-[#9E7A2B]">01. Goal</p>
            <h2 className="vf-shift font-display text-xl text-[#111210]">The Objective</h2>
            <p className="text-[15px] leading-relaxed text-[#45453F]">{project.goal}</p>
          </section>

          <section className="space-y-3">
            <p className="font-mono text-xs text-[#9E7A2B]">02. Approach</p>
            <h2 className="vf-shift font-display text-xl text-[#111210]">
              Execution &amp; Systems
            </h2>
            <p className="text-[15px] leading-relaxed text-[#45453F]">{project.approach}</p>
          </section>

          <section className="space-y-3">
            <p className="font-mono text-xs text-[#9E7A2B]">03. Results</p>
            <h2 className="vf-shift font-display text-xl text-[#111210]">
              Measured Outcome
            </h2>
            <p className="text-[15px] leading-relaxed text-[#45453F]">{project.results}</p>
          </section>
        </div>

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <section className="py-12 border-b border-[#E4E4DF]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-semibold text-[#111210]">
                Visual Artifacts
              </h2>
              <span className="font-mono text-xs text-[#6E6E67]">
                Select to map onto 3D device or inspect
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {galleryImages.map((src, idx) => (
                <div
                  key={`${src}-${idx}`}
                  className="group relative rounded-xl overflow-hidden border border-[#E4E4DF] bg-[#ECECE7] aspect-[4/3]"
                >
                  <button
                    type="button"
                    data-cursor="View"
                    onClick={() => {
                      setActiveImage(src);
                      setLightboxSrc(src);
                    }}
                    className="w-full h-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B43]"
                  >
                    {!failedImages[src] ? (
                      <img
                        src={src}
                        alt={`${project.title} artifact ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        onError={() => setFailedImages((prev) => ({ ...prev, [src]: true }))}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-6">
                        <span className="text-sm text-[#52524C]">{project.title}</span>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="pt-12 flex flex-wrap items-center justify-between gap-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#52524C] hover:text-[#111210] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Work
          </button>

          {project.externalLink && (
            <MagneticButton
              href={project.externalLink}
              target="_blank"
              rel="noreferrer noopener"
              variant="primary"
              showArrow
              cursorLabel="Open"
              className="px-5 py-2.5 text-sm font-semibold rounded-lg"
            >
              View Live Reference
            </MagneticButton>
          )}
        </div>
      </div>

      {lightboxSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setLightboxSrc(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 sm:p-8"
        >
          <button
            type="button"
            aria-label="Close image preview"
            onClick={() => setLightboxSrc(null)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxSrc}
            alt={project.title}
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </main>
  );
}
