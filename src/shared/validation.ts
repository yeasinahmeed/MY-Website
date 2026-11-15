import { z } from 'zod';

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(160),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters.').max(180),
  message: z.string().trim().min(12, 'Please write at least 12 characters.').max(4000),
  website: z.string().max(200).optional().default(''), // honeypot
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required.').max(120),
  password: z.string().min(1, 'Password is required.').max(200),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters.')
      .max(128),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match.',
    path: ['confirmPassword'],
  });

export const siteSettingsUpdateSchema = z.object({
  siteTitle: z.string().trim().min(3).max(160),
  siteDescription: z.string().trim().min(10).max(320),
  brandName: z.string().trim().min(2).max(80),
  heroKicker: z.string().trim().min(2).max(160),
  heroHeadline: z.string().trim().min(5).max(240),
  heroSubheadline: z.string().trim().min(10).max(500),
  heroCtaPrimary: z.string().trim().min(2).max(60),
  heroCtaSecondary: z.string().trim().min(2).max(60),
  aboutHeading: z.string().trim().min(3).max(160),
  aboutBio: z.string().trim().min(10).max(2000),
  aboutSecondaryBio: z.string().trim().max(2000),
  aboutImageUrl: z.string().trim().min(1).max(500),
  location: z.string().trim().min(2).max(120),
  languages: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  linkedinUrl: z.string().trim().url().max(300),
  socialLinks: z.array(
    z.object({
      label: z.string().trim().min(1).max(60),
      url: z.string().trim().url().max(300),
    }),
  ),
  metrics: z.array(
    z.object({
      label: z.string().trim().min(1).max(80),
      value: z.number().min(0),
      suffix: z.string().max(16),
      context: z.string().trim().min(1).max(160),
    }),
  ),
  videoSectionTitle: z.string().trim().min(2).max(180),
  videoSectionSubtitle: z.string().trim().min(2).max(400),
  videoPosterUrl: z.string().trim().min(1).max(500),
  videoUrl: z.string().trim().max(500),
});

export const serviceInputSchema = z.object({
  title: z.string().trim().min(2).max(140),
  summary: z.string().trim().min(5).max(600),
  deliverables: z.array(z.string().trim().min(1).max(160)),
  sortOrder: z.number().int().min(0).default(0),
});

export const skillInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(100),
  proficiencyLabel: z.string().trim().min(1).max(60),
  sortOrder: z.number().int().min(0).default(0),
});

export const experienceInputSchema = z.object({
  role: z.string().trim().min(2).max(160),
  company: z.string().trim().min(2).max(160),
  period: z.string().trim().min(2).max(100),
  location: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(5).max(800),
  highlights: z.array(z.string().trim().min(1).max(300)),
  sortOrder: z.number().int().min(0).default(0),
});

export const projectInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain lowercase letters, numbers, and hyphens.'),
  title: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(100),
  clientOrContext: z.string().trim().min(2).max(160),
  timeframe: z.string().trim().min(2).max(80),
  coverImage: z.string().trim().min(1).max(500),
  gallery: z.array(z.string().trim().min(1).max(500)),
  description: z.string().trim().min(5).max(600),
  goal: z.string().trim().min(5).max(2000),
  approach: z.string().trim().min(5).max(2000),
  results: z.string().trim().min(5).max(2000),
  metrics: z.array(
    z.object({
      label: z.string().trim().min(1).max(80),
      value: z.string().trim().min(1).max(60),
    }),
  ),
  externalLink: z.string().trim().max(400).optional().default(''),
  published: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const certificationInputSchema = z.object({
  title: z.string().trim().min(2).max(200),
  issuer: z.string().trim().min(2).max(160),
  year: z.string().trim().min(2).max(40),
  credentialUrl: z.string().trim().max(400).optional().default(''),
  sortOrder: z.number().int().min(0).default(0),
});

export const testimonialInputSchema = z.object({
  authorName: z.string().trim().min(2).max(120),
  authorRole: z.string().trim().min(2).max(160),
  organization: z.string().trim().min(2).max(160),
  quote: z.string().trim().min(10).max(1200),
  outcome: z.string().trim().min(3).max(240),
  avatarUrl: z.string().trim().max(500).optional().default(''),
  sortOrder: z.number().int().min(0).default(0),
});
