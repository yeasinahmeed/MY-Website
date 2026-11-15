export interface SocialLinkItem {
  label: string;
  url: string;
}

export interface MetricItem {
  label: string;
  value: number;
  suffix: string;
  context: string;
}

export interface ProjectMetricItem {
  label: string;
  value: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  brandName: string;
  heroKicker: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  aboutHeading: string;
  aboutBio: string;
  aboutSecondaryBio: string;
  aboutImageUrl: string;
  location: string;
  languages: string;
  email: string;
  linkedinUrl: string;
  socialLinks: SocialLinkItem[];
  metrics: MetricItem[];
  videoSectionTitle: string;
  videoSectionSubtitle: string;
  videoPosterUrl: string;
  videoUrl: string;
}

export interface ServiceItem {
  id?: number;
  title: string;
  summary: string;
  deliverables: string[];
  sortOrder?: number;
}

export interface SkillItem {
  id?: number;
  name: string;
  category: string;
  proficiencyLabel: string;
  sortOrder?: number;
}

export interface ExperienceItem {
  id?: number;
  role: string;
  company: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
  sortOrder?: number;
}

export interface ProjectItem {
  id?: number;
  slug: string;
  title: string;
  category: string;
  clientOrContext: string;
  timeframe: string;
  coverImage: string;
  gallery: string[];
  description: string;
  goal: string;
  approach: string;
  results: string;
  metrics: ProjectMetricItem[];
  externalLink: string;
  published?: boolean;
  sortOrder?: number;
}

export interface CertificationItem {
  id?: number;
  title: string;
  issuer: string;
  year: string;
  credentialUrl: string;
  sortOrder?: number;
}

export interface TestimonialItem {
  id?: number;
  authorName: string;
  authorRole: string;
  organization: string;
  quote: string;
  outcome: string;
  avatarUrl: string;
  sortOrder?: number;
}

export interface PortfolioPayload {
  settings: SiteSettings | null;
  services: ServiceItem[];
  skills: SkillItem[];
  experiences: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  testimonials: TestimonialItem[];
}

export interface ContactMessageItem {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
