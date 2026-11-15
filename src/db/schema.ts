import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

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

export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  siteTitle: text('site_title').notNull(),
  siteDescription: text('site_description').notNull(),
  brandName: text('brand_name').notNull(),
  heroKicker: text('hero_kicker').notNull(),
  heroHeadline: text('hero_headline').notNull(),
  heroSubheadline: text('hero_subheadline').notNull(),
  heroCtaPrimary: text('hero_cta_primary').notNull(),
  heroCtaSecondary: text('hero_cta_secondary').notNull(),
  aboutHeading: text('about_heading').notNull(),
  aboutBio: text('about_bio').notNull(),
  aboutSecondaryBio: text('about_secondary_bio').notNull(),
  aboutImageUrl: text('about_image_url').notNull(),
  location: text('location').notNull(),
  languages: text('languages').notNull(),
  email: text('email').notNull(),
  linkedinUrl: text('linkedin_url').notNull(),
  socialLinks: jsonb('social_links').$type<SocialLinkItem[]>().notNull(),
  metrics: jsonb('metrics').$type<MetricItem[]>().notNull(),
  videoSectionTitle: text('video_section_title').notNull(),
  videoSectionSubtitle: text('video_section_subtitle').notNull(),
  videoPosterUrl: text('video_poster_url').notNull(),
  videoUrl: text('video_url').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  deliverables: jsonb('deliverables').$type<string[]>().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const skills = pgTable('skills', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  proficiencyLabel: text('proficiency_label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const experiences = pgTable('experiences', {
  id: serial('id').primaryKey(),
  role: text('role').notNull(),
  company: text('company').notNull(),
  period: text('period').notNull(),
  location: text('location').notNull(),
  summary: text('summary').notNull(),
  highlights: jsonb('highlights').$type<string[]>().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  clientOrContext: text('client_or_context').notNull(),
  timeframe: text('timeframe').notNull(),
  coverImage: text('cover_image').notNull(),
  gallery: jsonb('gallery').$type<string[]>().notNull(),
  description: text('description').notNull(),
  goal: text('goal').notNull(),
  approach: text('approach').notNull(),
  results: text('results').notNull(),
  metrics: jsonb('metrics').$type<ProjectMetricItem[]>().notNull(),
  externalLink: text('external_link').notNull().default(''),
  published: boolean('published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const certifications = pgTable('certifications', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  issuer: text('issuer').notNull(),
  year: text('year').notNull(),
  credentialUrl: text('credential_url').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  authorName: text('author_name').notNull(),
  authorRole: text('author_role').notNull(),
  organization: text('organization').notNull(),
  quote: text('quote').notNull(),
  outcome: text('outcome').notNull(),
  avatarUrl: text('avatar_url').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firebaseUid: text('firebase_uid').unique(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
