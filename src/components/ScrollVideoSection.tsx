import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SectionHeading } from './SectionHeading.tsx';

interface ScrollVideoSectionProps {
  title: string;
  subtitle: string;
  posterUrl: string;
  videoUrl: string;
}

const STEPS = [
  {
    index: '01',
    title: 'Signal Capture',
    detail: 'GA4 events, UTM governance, and channel engagement logs unified weekly.',
  },
  {
    index: '02',
    title: 'AI Synthesis',
    detail: 'Structured brand-voice prompts translate performance clusters into test hooks.',
  },
  {
    index: '03',
    title: 'Attribution Loop',
    detail: 'Winning creatives feed back into acquisition cohorts and team training.',
  },
];

export function ScrollVideoSection({
  title,
  subtitle,
  posterUrl,
  videoUrl,
}: ScrollVideoSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [usePosterFallback, setUsePosterFallback] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !videoUrl) {
      setUsePosterFallback(true);
      return;
    }

    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    gsap.registerPlugin(ScrollTrigger);

    let triggerInstance: ScrollTrigger | null = null;

    const setupScrub = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      video.pause();

      triggerInstance = ScrollTrigger.create({
        trigger: section,
        start: 'top 75%',
        end: 'bottom 25%',
        scrub: 0.35,
        onUpdate: (self) => {
          const p = Math.min(Math.max(self.progress, 0), 1);
          setProgressPct(Math.round(p * 100));
          if (p < 0.34) setActiveStep(0);
          else if (p < 0.68) setActiveStep(1);
          else setActiveStep(2);

          if (video.readyState >= 1 && video.duration) {
            const targetTime = p * Math.max(video.duration - 0.04, 0.1);
            if (Math.abs(video.currentTime - targetTime) > 0.02) {
              video.currentTime = targetTime;
            }
          }
        },
      });
    };

    if (video.readyState >= 1) {
      setupScrub();
    } else {
      video.addEventListener('loadedmetadata', setupScrub, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', setupScrub);
      triggerInstance?.kill();
    };
  }, [videoUrl]);

  return (
    <section
      ref={sectionRef}
      aria-label="Workflow Reel"
      className="bg-[#111210] text-[#F9F9F7] py-20 lg:py-28 border-y border-[#232421]"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start mb-12">
          <div className="lg:col-span-7">
            <SectionHeading
              kicker="Operating Loop · Scroll Sequence"
              text={title}
              dark
              className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#F9F9F7]"
            />
          </div>
          <div className="lg:col-span-5 lg:pt-8">
            <p className="text-[15px] leading-relaxed text-[#C2C2BA]">{subtitle}</p>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-[#2B2D28] bg-[#181917] aspect-video">
          {!usePosterFallback && videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              muted
              playsInline
              preload="auto"
              onError={() => setUsePosterFallback(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={posterUrl}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          )}

          {/* Measured bottom scrim for clean contrast */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between gap-4 text-xs font-mono tabular-nums text-[#E4E4DF]">
            <span>{STEPS[activeStep]?.index}. {STEPS[activeStep]?.title}</span>
            <span>{progressPct}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 pt-8 border-t border-[#262824]">
          {STEPS.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <div key={step.index} className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isActive ? 'text-[#DFC07C]' : 'text-[#8A8A82]'
                    }`}
                  >
                    {step.index}
                  </span>
                  <h3
                    className={`font-display text-lg font-semibold transition-colors ${
                      isActive ? 'text-[#F9F9F7]' : 'text-[#A8A8A0]'
                    }`}
                  >
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-[#A8A8A0]">{step.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
