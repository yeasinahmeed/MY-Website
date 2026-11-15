import { useState } from 'react';
import { ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { contactSubmissionSchema } from '../shared/validation.ts';
import type { SiteSettings } from '../types/portfolio.ts';
import { MagneticButton } from './MagneticButton.tsx';
import { SectionHeading } from './SectionHeading.tsx';

interface ContactSectionProps {
  settings: SiteSettings;
}

export function ContactSection({ settings }: ContactSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setFieldErrors({});

    const parsed = contactSubmissionSchema.safeParse({
      name,
      email,
      subject,
      message,
      website,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || 'form');
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        setStatus({
          type: 'error',
          text: `This static preview does not have a live mail server. Please email directly at ${settings.email}.`,
        });
        return;
      }
      const json = (await res.json()) as { ok?: boolean; message?: string; error?: string };

      if (!res.ok) {
        setStatus({
          type: 'error',
          text: json.error || 'Unable to send your message right now. Please try again.',
        });
        return;
      }

      setStatus({
        type: 'success',
        text: json.message || 'Your message has been sent.',
      });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setWebsite('');
    } catch {
      setStatus({
        type: 'error',
        text: `Unable to reach the server right now. Please email directly at ${settings.email}.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-28 border-t border-[#E4E4DF] bg-[#F9F9F7]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 space-y-6">
            <SectionHeading
              kicker="Get in Touch"
              text="Let us discuss strategy, analytics, or team AI training."
              className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#111210]"
            />
            <p className="text-[15px] leading-relaxed text-[#52524C]">
              Share a brief overview of your channel goals, measurement gaps, or workshop schedule.
              I respond personally within one to two business days.
            </p>

            <div className="pt-6 border-t border-[#E4E4DF] space-y-4">
              <div>
                <p className="font-mono text-xs text-[#6E6E67] mb-1">Direct Email</p>
                <a
                  href={`mailto:${settings.email}`}
                  className="text-sm font-medium text-[#111210] hover:text-[#9E7A2B] transition-colors inline-flex items-center gap-1.5"
                >
                  {settings.email}
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>

              <div>
                <p className="font-mono text-xs text-[#6E6E67] mb-1">Location &amp; Languages</p>
                <p className="text-sm text-[#111210]">
                  {settings.location} <span aria-hidden="true">·</span> {settings.languages}
                </p>
              </div>

              <div>
                <p className="font-mono text-xs text-[#6E6E67] mb-1">Profiles</p>
                <div className="flex flex-wrap items-center gap-5">
                  {settings.socialLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm font-medium text-[#111210] hover:text-[#9E7A2B] transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="bg-white border border-[#E4E4DF] rounded-2xl p-6 sm:p-8 space-y-5"
            >
              {/* Honeypot field hidden from human visitors */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-medium text-[#3A3A35] mb-1.5"
                  >
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F7] border border-[#D8D8D0] rounded-lg text-[#111210] placeholder:text-[#8A8A82] focus:outline-none focus:border-[#C59B43] focus:bg-white transition-colors"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs text-[#B92B14]">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-medium text-[#3A3A35] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F7] border border-[#D8D8D0] rounded-lg text-[#111210] placeholder:text-[#8A8A82] focus:outline-none focus:border-[#C59B43] focus:bg-white transition-colors"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs text-[#B92B14]">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-xs font-medium text-[#3A3A35] mb-1.5"
                >
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Social strategy, GA4 audit, or AI workshop"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F7] border border-[#D8D8D0] rounded-lg text-[#111210] placeholder:text-[#8A8A82] focus:outline-none focus:border-[#C59B43] focus:bg-white transition-colors"
                />
                {fieldErrors.subject && (
                  <p className="mt-1.5 text-xs text-[#B92B14]">{fieldErrors.subject}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-medium text-[#3A3A35] mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell me about your goals, current channels, and timeline..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F7] border border-[#D8D8D0] rounded-lg text-[#111210] placeholder:text-[#8A8A82] focus:outline-none focus:border-[#C59B43] focus:bg-white transition-colors resize-y"
                />
                {fieldErrors.message && (
                  <p className="mt-1.5 text-xs text-[#B92B14]">{fieldErrors.message}</p>
                )}
              </div>

              {status && (
                <div
                  role="status"
                  className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm border ${
                    status.type === 'success'
                      ? 'bg-[#F3F8F4] border-[#C6DFCB] text-[#1D542B]'
                      : 'bg-[#FDF4F2] border-[#F0C8C0] text-[#9E2311]'
                  }`}
                >
                  {status.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <span>{status.text}</span>
                </div>
              )}

              <div className="pt-1 flex items-center justify-between gap-4">
                <p className="text-xs text-[#6E6E67]">
                  Stored privately. No third-party tracking.
                </p>
                <MagneticButton
                  type="submit"
                  disabled={submitting}
                  variant="primary"
                  showArrow
                  cursorLabel="Send"
                  className="px-6 py-3 text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </MagneticButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
