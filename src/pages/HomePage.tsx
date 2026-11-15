import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check } from 'lucide-react';
import type { PortfolioPayload, ProjectItem } from '../types/portfolio.ts';
import { ScrollVideoSection } from '../components/ScrollVideoSection.tsx';
import { MagneticButton } from '../components/MagneticButton.tsx';
import { KineticHeadline } from '../components/KineticHeadline.tsx';
import { SectionHeading } from '../components/SectionHeading.tsx';
import { ScrollRevealParagraph } from '../components/ScrollRevealParagraph.tsx';
import { OutlinedFillText } from '../components/OutlinedFillText.tsx';
import { VelocityMarquee } from '../components/VelocityMarquee.tsx';
import { OdometerCounter } from '../components/OdometerCounter.tsx';
import { SkillProgressBar } from '../components/SkillProgressBar.tsx';
import { TiltProjectCard } from '../components/TiltProjectCard.tsx';
import { ContactSection } from '../components/ContactSection.tsx';

const HeroScene3D = lazy(() => import('../components/HeroScene3D.tsx'));

interface HomePageProps {
  data: PortfolioPayload;
  onSelectProject: (project: ProjectItem) => void;
  onNavigateAdmin: () => void;
}

export function HomePage({ data, onSelectProject, onNavigateAdmin }: HomePageProps) {
  const { settings, services, skills, experiences, projects, certifications, testimonials } = data;
  const heroRef = useRef<HTMLElement | null>(null);
  const [heroScrollProgress, setHeroScrollProgress] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      const total = Math.max(window.innerHeight * 2.2, 900);
      const passed = Math.min(Math.max(window.scrollY / total, 0), 1);
      setHeroScrollProgress(passed);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(projects.map((p) => p.category)));
    return ['All', ...unique];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'All') return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [projects, activeCategory]);

  const skillGroups = useMemo(() => {
    const groups = new Map<string, typeof skills>();
    for (const skill of skills) {
      const list = groups.get(skill.category) || [];
      list.push(skill);
      groups.set(skill.category, list);
    }
    return Array.from(groups.entries());
  }, [skills]);

  const marqueeItems = useMemo(() => {
    const svc = services.map((s) => s.title.replace(/^\d+\.\s*/, ''));
    const sk = skills.map((s) => s.name);
    return [...svc, ...sk];
  }, [services, skills]);

  if (!settings) return null;

  const revealMotion = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.12 },
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
      };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  return (
    <main>
      {/* 1. HERO SECTION */}
      <section ref={heroRef} className="pt-10 pb-16 lg:pt-16 lg:pb-20 bg-[#F9F9F7]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div className="space-y-6">
                <p className="font-mono text-xs tracking-wide text-[#52524C]">
                  {settings.heroKicker}
                </p>
                <KineticHeadline
                  text={settings.heroHeadline}
                  className="font-display text-4xl sm:text-5xl lg:text-[3.45rem] font-semibold leading-[1.08] tracking-tight text-[#111210]"
                />
                <p className="text-base sm:text-lg leading-relaxed text-[#45453F] max-w-xl">
                  {settings.heroSubheadline}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-8">
                <MagneticButton
                  type="button"
                  variant="primary"
                  showArrow
                  cursorLabel="Explore"
                  onClick={() => scrollTo('projects')}
                  className="px-6 py-3.5 text-sm font-semibold rounded-lg cursor-pointer"
                >
                  {settings.heroCtaPrimary}
                </MagneticButton>
                <MagneticButton
                  type="button"
                  variant="secondary"
                  cursorLabel="Contact"
                  onClick={() => scrollTo('contact')}
                  className="px-6 py-3.5 text-sm font-semibold rounded-lg cursor-pointer"
                >
                  {settings.heroCtaSecondary}
                </MagneticButton>
              </div>
            </div>

            <div className="lg:col-span-6">
              <Suspense
                fallback={
                  <div className="w-full h-[390px] sm:h-[450px] lg:h-full min-h-[430px] rounded-2xl border border-[#E4E4DF] bg-[#F2F2EE] flex items-center justify-center">
                    <span className="font-mono text-xs text-[#6E6E67]">Loading 3D Studio...</span>
                  </div>
                }
              >
                <HeroScene3D scrollProgress={heroScrollProgress} />
              </Suspense>
            </div>
          </div>

          {/* Staggered Odometer KPI Strip */}
          {settings.metrics.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-14 pt-10 border-t border-[#E4E4DF]">
              {settings.metrics.map((metric, idx) => (
                <motion.div
                  key={metric.label}
                  initial={prefersReduced ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: 0.45,
                    delay: idx * 0.09,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="space-y-1.5"
                >
                  <p className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#111210]">
                    <OdometerCounter
                      value={metric.value}
                      suffix={metric.suffix}
                      delayMs={idx * 90}
                    />
                  </p>
                  <p className="text-sm font-medium text-[#111210]">{metric.label}</p>
                  <p className="text-xs text-[#6E6E67]">{metric.context}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* VELOCITY-BASED MARQUEE */}
      <VelocityMarquee items={marqueeItems} />

      {/* 2. ABOUT SECTION */}
      <section id="about" className="py-20 lg:py-28 bg-white">
        <motion.div {...revealMotion} className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-[#E4E4DF] bg-[#F2F2EE] aspect-[3/4]">
                {!failedImages[settings.aboutImageUrl] ? (
                  <img
                    src={settings.aboutImageUrl}
                    alt={`${settings.brandName} working at studio desk`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [settings.aboutImageUrl]: true }))
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-8 text-center">
                    <span className="font-display text-2xl text-[#52524C]">
                      {settings.brandName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <SectionHeading
                kicker="About"
                text={settings.aboutHeading}
                className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#111210]"
              />
              <ScrollRevealParagraph
                text={settings.aboutBio}
                className="text-[15px] sm:text-base leading-relaxed text-[#111210]"
              />
              {settings.aboutSecondaryBio && (
                <ScrollRevealParagraph
                  text={settings.aboutSecondaryBio}
                  className="text-[15px] sm:text-base leading-relaxed text-[#3A3A35]"
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#E4E4DF]">
                <div>
                  <p className="font-mono text-xs text-[#6E6E67] mb-1">Based in</p>
                  <p className="text-sm font-medium text-[#111210]">{settings.location}</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-[#6E6E67] mb-1">Languages</p>
                  <p className="text-sm font-medium text-[#111210]">{settings.languages}</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-[#6E6E67] mb-1">Connect</p>
                  <a
                    href={settings.linkedinUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-cursor="Open"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#9E7A2B] hover:text-[#111210] transition-colors"
                  >
                    LinkedIn
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* LARGE OUTLINED STATEMENT FILL ON VIEWPORT ENTRY */}
      <section className="py-14 lg:py-20 border-t border-[#E4E4DF] bg-[#F9F9F7]">
        <div className="max-w-[1200px] mx-auto px-6">
          <OutlinedFillText
            text="Creative judgment. Clean telemetry. Applied AI."
            className="text-3xl sm:text-5xl lg:text-6xl"
          />
        </div>
      </section>

      {/* 3. SERVICES SECTION */}
      <section id="services" className="py-20 lg:py-28 border-t border-[#E4E4DF] bg-[#F9F9F7]">
        <motion.div {...revealMotion} className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <SectionHeading
              kicker="Services"
              text="Core practices built for compounding results."
              className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#111210]"
            />
            <p className="text-sm text-[#52524C] max-w-sm">
              Available for senior social leadership, measurement audits, and hands-on team AI
              workshops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <article
                key={service.title}
                className="bg-white border border-[#E4E4DF] rounded-2xl p-7 sm:p-8 flex flex-col justify-between space-y-6 hover:border-[#C59B43] transition-colors"
              >
                <div className="space-y-3">
                  <h3 className="vf-shift font-display text-xl text-[#111210]">
                    {service.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-[#45453F]">{service.summary}</p>
                </div>

                <ul className="space-y-2.5 pt-5 border-t border-[#ECECE7]">
                  {service.deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#2A2B28]">
                      <Check className="w-4 h-4 text-[#C59B43] mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 4. SCROLL-SCRUBBED 3D VIDEO SECTION */}
      <ScrollVideoSection
        title={settings.videoSectionTitle}
        subtitle={settings.videoSectionSubtitle}
        posterUrl={settings.videoPosterUrl}
        videoUrl={settings.videoUrl}
      />

      {/* 5. PROJECTS / CASE STUDIES SECTION */}
      <section id="projects" className="py-20 lg:py-28 bg-[#F9F9F7]">
        <motion.div {...revealMotion} className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <SectionHeading
              kicker="Selected Work"
              text="Case studies & operational systems."
              className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#111210]"
            />

            <div
              role="tablist"
              aria-label="Filter projects by discipline"
              className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#ECECE7] rounded-lg self-start"
            >
              {categories.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-[#111210]'
                        : 'text-[#52524C] hover:text-[#111210]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="bg-white border border-[#E4E4DF] rounded-2xl p-12 text-center">
              <p className="text-sm text-[#52524C]">No published case studies in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {filteredProjects.map((project, idx) => {
                const isLead = idx === 0 && filteredProjects.length >= 2;
                return (
                  <TiltProjectCard
                    key={project.slug}
                    className={`${
                      isLead ? 'md:col-span-12 lg:col-span-7' : 'md:col-span-6 lg:col-span-5'
                    } group bg-white border border-[#E4E4DF] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#C59B43]`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectProject(project)}
                      className="text-left w-full flex-1 flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C59B43]"
                    >
                      <div className="aspect-[4/3] w-full bg-[#ECECE7] overflow-hidden border-b border-[#E4E4DF]">
                        {!failedImages[project.coverImage] ? (
                          <img
                            src={project.coverImage}
                            alt={project.title}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedImages((prev) => ({
                                ...prev,
                                [project.coverImage]: true,
                              }))
                            }
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-6">
                            <span className="font-display text-lg text-[#52524C]">
                              {project.title}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#6E6E67]">
                            <span>{project.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{project.timeframe}</span>
                          </div>
                          <h3 className="vf-shift font-display text-xl sm:text-2xl text-[#111210] group-hover:text-[#9E7A2B]">
                            {project.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-[#45453F]">
                            {project.description}
                          </p>
                        </div>

                        <div className="pt-5 border-t border-[#ECECE7] flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-6">
                            {project.metrics.slice(0, 2).map((m) => (
                              <div key={m.label}>
                                <p className="font-display text-lg font-semibold text-[#111210] tabular-nums">
                                  {m.value}
                                </p>
                                <p className="text-[11px] font-mono text-[#6E6E67]">{m.label}</p>
                              </div>
                            ))}
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#111210] group-hover:text-[#9E7A2B]">
                            Read Case Study
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </button>
                  </TiltProjectCard>
                );
              })}
            </div>
          )}
        </motion.div>
      </section>

      {/* 6. SKILLS & CERTIFICATIONS SECTION */}
      <section id="skills" className="py-20 lg:py-28 border-t border-[#E4E4DF] bg-white">
        <motion.div {...revealMotion} className="max-w-[1200px] mx-auto px-6 space-y-20">
          <div>
            <div className="mb-10">
              <SectionHeading
                kicker="Capabilities"
                text="Tools, frameworks, and analytical stack."
                className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#111210]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-6 border-t border-[#E4E4DF]">
              {skillGroups.map(([category, items]) => (
                <div key={category} className="space-y-4">
                  <h3 className="vf-shift font-display text-base text-[#111210]">{category}</h3>
                  <ul className="space-y-3">
                    {items.map((skill) => (
                      <li key={`${category}-${skill.name}`} className="py-1 text-sm">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[#2A2B28]">{skill.name}</span>
                          <span className="font-mono text-[11px] text-[#6E6E67] shrink-0">
                            {skill.proficiencyLabel}
                          </span>
                        </div>
                        <SkillProgressBar label={skill.proficiencyLabel} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div id="certifications" className="pt-12 border-t border-[#E4E4DF]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4">
                <SectionHeading
                  kicker="Certifications"
                  text="Verified training & credentials."
                  className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#111210]"
                />
              </div>

              <div className="lg:col-span-8 divide-y divide-[#E4E4DF] border-t border-b border-[#E4E4DF]">
                {certifications.map((cert) => (
                  <div
                    key={cert.title}
                    className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <h3 className="vf-shift font-display text-lg text-[#111210]">
                        {cert.title}
                      </h3>
                      <p className="text-sm text-[#52524C] mt-0.5">{cert.issuer}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-mono text-xs text-[#6E6E67] tabular-nums">
                        {cert.year}
                      </span>
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          data-cursor="Open"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#9E7A2B] hover:underline"
                        >
                          Verify
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 7. EXPERIENCE TIMELINE */}
      <section id="experience" className="py-20 lg:py-28 border-t border-[#E4E4DF] bg-[#F9F9F7]">
        <motion.div {...revealMotion} className="max-w-[1200px] mx-auto px-6">
          <div className="mb-12">
            <SectionHeading
              kicker="Experience"
              text="Leadership across strategy, analytics, and training."
              className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#111210]"
            />
          </div>

          <div className="divide-y divide-[#E4E4DF] border-t border-b border-[#E4E4DF]">
            {experiences.map((exp, idx) => (
              <article
                key={`${exp.company}-${exp.role}`}
                className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10"
              >
                <div className="lg:col-span-4 space-y-1.5">
                  <p className="font-mono text-xs text-[#9E7A2B] tabular-nums">
                    {String(idx + 1).padStart(2, '0')} · {exp.period}
                  </p>
                  <h3 className="vf-shift font-display text-xl text-[#111210]">{exp.role}</h3>
                  <p className="text-sm font-medium text-[#45453F]">
                    {exp.company} <span aria-hidden="true">·</span> {exp.location}
                  </p>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <p className="text-[15px] leading-relaxed text-[#2A2B28]">{exp.summary}</p>
                  {exp.highlights.length > 0 && (
                    <ul className="space-y-2">
                      {exp.highlights.map((h) => (
                        <li
                          key={h}
                          className="text-sm leading-relaxed text-[#52524C] flex items-start gap-2.5"
                        >
                          <span aria-hidden="true" className="text-[#C59B43] shrink-0">
                            —
                          </span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 8. TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="py-20 lg:py-24 border-t border-[#E4E4DF] bg-white">
          <motion.div {...revealMotion} className="max-w-[1200px] mx-auto px-6">
            <div className="mb-10">
              <SectionHeading
                kicker="Endorsements"
                text="Perspectives from partners and cohorts."
                className="font-display text-3xl font-semibold tracking-tight text-[#111210]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((t) => (
                <blockquote
                  key={`${t.authorName}-${t.organization}`}
                  className="bg-[#F9F9F7] border border-[#E4E4DF] rounded-2xl p-7 sm:p-8 flex flex-col justify-between space-y-6"
                >
                  <p className="text-[15px] sm:text-base leading-relaxed text-[#111210]">
                    “{t.quote}”
                  </p>

                  <footer className="pt-5 border-t border-[#E4E4DF] space-y-2">
                    <div>
                      <p className="font-display text-base font-semibold text-[#111210]">
                        {t.authorName}
                      </p>
                      <p className="text-xs text-[#52524C]">
                        {t.authorRole} <span aria-hidden="true">·</span> {t.organization}
                      </p>
                    </div>
                    <p className="font-mono text-xs text-[#9E7A2B]">{t.outcome}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* 9. CONTACT SECTION */}
      <ContactSection settings={settings} />

      {/* 10. FOOTER WITH BOTTOM ADMIN LOGIN BUTTON */}
      <footer className="border-t border-[#E4E4DF] bg-[#F9F9F7] py-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#6E6E67]">
          <p>
            © {new Date().getFullYear()} {settings.brandName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <span>{settings.location}</span>
            <a href={`mailto:${settings.email}`} className="hover:text-[#111210] transition-colors">
              {settings.email}
            </a>
            <a
              href={settings.linkedinUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-[#111210] transition-colors"
            >
              LinkedIn
            </a>
            <button
              type="button"
              onClick={onNavigateAdmin}
              className="px-3 py-1.5 text-xs font-medium text-[#111210] border border-[#D8D8D0] hover:border-[#C59B43] rounded-md transition-colors cursor-pointer"
            >
              Admin Login
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
