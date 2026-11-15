import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { MagneticButton } from './MagneticButton.tsx';

interface HeaderProps {
  brandName: string;
  onNavigateHome: (sectionId?: string) => void;
}

const NAV_LINKS = [
  { label: 'About', id: 'about' },
  { label: 'Services', id: 'services' },
  { label: 'Work', id: 'projects' },
  { label: 'Experience', id: 'experience' },
];

export function Header({ brandName, onNavigateHome }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (id?: string) => {
    setMobileOpen(false);
    onNavigateHome(id);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F9F9F7]/95 backdrop-blur-sm border-b border-[#E4E4DF]">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Title with variable font hover */}
        <button
          type="button"
          onClick={() => handleLinkClick()}
          className="vf-shift font-display text-lg tracking-tight text-[#111210] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B43] rounded"
        >
          {brandName}
        </button>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleLinkClick(item.id)}
              className="vf-nav text-sm text-[#52524C] hover:text-[#111210] whitespace-nowrap shrink-0 cursor-pointer hover:underline underline-offset-4 decoration-[#C59B43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B43] rounded"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 Primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <MagneticButton
            type="button"
            variant="primary"
            showArrow
            cursorLabel="Open"
            onClick={() => handleLinkClick('contact')}
            className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
          >
            Get in Touch
          </MagneticButton>
          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2.5 text-[#111210] hover:bg-[#ECECE7] rounded-lg cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#E4E4DF] bg-[#F9F9F7] px-6 py-4 space-y-3">
          {NAV_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleLinkClick(item.id)}
              className="block w-full text-left py-2 text-sm font-medium text-[#111210]"
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleLinkClick('contact')}
            className="w-full py-2.5 px-4 text-sm font-semibold text-[#111210] bg-[#DFC07C] rounded-lg"
          >
            Get in Touch
          </button>
        </div>
      )}
    </header>
  );
}
