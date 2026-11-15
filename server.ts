import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import { z } from 'zod';
import {
  createCertification,
  createContactMessage,
  createExperience,
  createProject,
  createService,
  createSkill,
  createTestimonial,
  deleteCertification,
  deleteContactMessage,
  deleteExperience,
  deleteProject,
  deleteService,
  deleteSkill,
  deleteTestimonial,
  findAdminByUsername,
  getAdminOverviewData,
  getPublicPortfolioData,
  getPublicProjectBySlug,
  listContactMessages,
  markMessageReadStatus,
  reorderProjects,
  updateAdminPasswordHash,
  updateCertification,
  updateExperience,
  updateProject,
  updateService,
  updateSiteSettings,
  updateSkill,
  updateTestimonial,
} from './src/db/repository.ts';
import { ensureSeeded } from './src/db/seed.ts';
import {
  type AdminRequest,
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createRateLimiter,
  generateCsrfToken,
  getCookieOptions,
  requireAdminAuth,
  requireCsrf,
  securityHeadersMiddleware,
  signSessionToken,
  verifySessionToken,
} from './src/server/security.ts';
import {
  adminLoginSchema,
  certificationInputSchema,
  changePasswordSchema,
  contactSubmissionSchema,
  experienceInputSchema,
  projectInputSchema,
  serviceInputSchema,
  siteSettingsUpdateSchema,
  skillInputSchema,
  testimonialInputSchema,
} from './src/shared/validation.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let seedPromise: Promise<void> | null = null;
function lazyEnsureSeeded() {
  if (!seedPromise) {
    seedPromise = ensureSeeded().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

async function createServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(securityHeadersMiddleware);

  const contactLimiter = createRateLimiter('contact', 5, 15 * 60 * 1000);
  const loginLimiter = createRateLimiter('login', 8, 15 * 60 * 1000);

  // Public portfolio endpoints
  app.get('/api/portfolio', async (_req, res) => {
    try {
      await lazyEnsureSeeded();
      const data = await getPublicPortfolioData();
      res.json(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load portfolio.';
      res.status(500).json({ error: msg });
    }
  });

  app.get('/api/projects/:slug', async (req, res) => {
    try {
      await lazyEnsureSeeded();
      const project = await getPublicProjectBySlug(req.params.slug);
      if (!project) {
        return res.status(404).json({ error: 'Case study not found.' });
      }
      res.json(project);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load project.';
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/contact', contactLimiter, async (req, res) => {
    const parsed = contactSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Please check the form fields.',
      });
    }

    // Honeypot triggered — silently acknowledge without persisting
    if (parsed.data.website && parsed.data.website.trim().length > 0) {
      return res.status(200).json({ ok: true, message: 'Message sent.' });
    }

    try {
      await lazyEnsureSeeded();
      await createContactMessage({
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      });
      res.status(201).json({
        ok: true,
        message: 'Thank you. Your inquiry has been recorded and Yeasin will reply shortly.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to send message right now.';
      res.status(500).json({ error: msg });
    }
  });

  // Auth & CSRF routes
  app.get('/api/auth/csrf', (req, res) => {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, getCookieOptions(req, false));
    res.json({ csrfToken: token });
  });

  app.get('/api/auth/session', (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    const session = verifySessionToken(token);
    if (!session) {
      return res.json({ authenticated: false });
    }
    res.json({ authenticated: true, username: session.username });
  });

  app.post('/api/auth/login', loginLimiter, requireCsrf, async (req, res) => {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
      await lazyEnsureSeeded();
      const user = await findAdminByUsername(parsed.data.username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
      const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const token = signSessionToken({
        uid: user.id,
        username: user.username,
        exp: Date.now() + 1000 * 60 * 60 * 12,
      });
      res.cookie(SESSION_COOKIE_NAME, token, getCookieOptions(req, true));
      res.json({ authenticated: true, username: user.username });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed.';
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/auth/logout', requireCsrf, (req, res) => {
    res.clearCookie(SESSION_COOKIE_NAME, getCookieOptions(req, true));
    res.json({ ok: true });
  });

  app.post(
    '/api/auth/change-password',
    requireAdminAuth,
    requireCsrf,
    async (req: AdminRequest, res) => {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid password input.',
        });
      }

      try {
        const username = req.admin?.username;
        if (!username) return res.status(401).json({ error: 'Unauthorized.' });
        const user = await findAdminByUsername(username);
        if (!user) return res.status(401).json({ error: 'Account not found.' });

        const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
        if (!matches) {
          return res.status(400).json({ error: 'Current password is incorrect.' });
        }

        const nextHash = await bcrypt.hash(parsed.data.newPassword, 12);
        await updateAdminPasswordHash(user.id, nextHash);
        res.json({ ok: true, message: 'Password updated successfully.' });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Password update failed.';
        res.status(500).json({ error: msg });
      }
    },
  );

  // Admin CMS endpoints
  app.use('/api/admin', requireAdminAuth, requireCsrf);

  app.get('/api/admin/overview', async (_req, res) => {
    try {
      await lazyEnsureSeeded();
      const data = await getAdminOverviewData();
      res.json(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load admin data.';
      res.status(500).json({ error: msg });
    }
  });

  app.put('/api/admin/settings', async (req, res) => {
    const parsed = siteSettingsUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid settings data.',
      });
    }
    try {
      const updated = await updateSiteSettings(parsed.data);
      res.json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save settings.';
      res.status(500).json({ error: msg });
    }
  });

  // Projects CRUD + reorder + publish toggle
  app.post('/api/admin/projects', async (req, res) => {
    const parsed = projectInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid project data.',
      });
    }
    try {
      const created = await createProject(parsed.data);
      res.status(201).json(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to create project.';
      res.status(400).json({ error: msg });
    }
  });

  app.put('/api/admin/projects/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid project ID.' });
    const parsed = projectInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid project data.',
      });
    }
    try {
      const updated = await updateProject(id, parsed.data);
      if (!updated) return res.status(404).json({ error: 'Project not found.' });
      res.json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to update project.';
      res.status(400).json({ error: msg });
    }
  });

  app.patch('/api/admin/projects/reorder', async (req, res) => {
    const parsed = z.object({ orderedIds: z.array(z.number().int()) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid order payload.' });
    try {
      await reorderProjects(parsed.data.orderedIds);
      res.json({ ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to reorder projects.';
      res.status(500).json({ error: msg });
    }
  });

  app.patch('/api/admin/projects/:id/publish', async (req, res) => {
    const id = Number(req.params.id);
    const parsed = z.object({ published: z.boolean() }).safeParse(req.body);
    if (!Number.isInteger(id) || !parsed.success) {
      return res.status(400).json({ error: 'Invalid publish toggle request.' });
    }
    try {
      const updated = await updateProject(id, { published: parsed.data.published });
      if (!updated) return res.status(404).json({ error: 'Project not found.' });
      res.json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to update project visibility.';
      res.status(500).json({ error: msg });
    }
  });

  app.delete('/api/admin/projects/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid project ID.' });
    try {
      await deleteProject(id);
      res.json({ ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to delete project.';
      res.status(500).json({ error: msg });
    }
  });

  // Services CRUD
  app.post('/api/admin/services', async (req, res) => {
    const parsed = serviceInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
    try {
      res.status(201).json(await createService(parsed.data));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error creating service.' });
    }
  });

  app.put('/api/admin/services/:id', async (req, res) => {
    const id = Number(req.params.id);
    const parsed = serviceInputSchema.safeParse(req.body);
    if (!Number.isInteger(id) || !parsed.success) {
      return res.status(400).json({ error: 'Invalid service payload.' });
    }
    try {
      const row = await updateService(id, parsed.data);
      if (!row) return res.status(404).json({ error: 'Service not found.' });
      res.json(row);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error updating service.' });
    }
  });

  app.delete('/api/admin/services/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid service ID.' });
    try {
      await deleteService(id);
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error deleting service.' });
    }
  });

  // Skills CRUD
  app.post('/api/admin/skills', async (req, res) => {
    const parsed = skillInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
    try {
      res.status(201).json(await createSkill(parsed.data));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error creating skill.' });
    }
  });

  app.put('/api/admin/skills/:id', async (req, res) => {
    const id = Number(req.params.id);
    const parsed = skillInputSchema.safeParse(req.body);
    if (!Number.isInteger(id) || !parsed.success) {
      return res.status(400).json({ error: 'Invalid skill payload.' });
    }
    try {
      const row = await updateSkill(id, parsed.data);
      if (!row) return res.status(404).json({ error: 'Skill not found.' });
      res.json(row);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error updating skill.' });
    }
  });

  app.delete('/api/admin/skills/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid skill ID.' });
    try {
      await deleteSkill(id);
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error deleting skill.' });
    }
  });

  // Experiences CRUD
  app.post('/api/admin/experiences', async (req, res) => {
    const parsed = experienceInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
    try {
      res.status(201).json(await createExperience(parsed.data));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error creating experience.' });
    }
  });

  app.put('/api/admin/experiences/:id', async (req, res) => {
    const id = Number(req.params.id);
    const parsed = experienceInputSchema.safeParse(req.body);
    if (!Number.isInteger(id) || !parsed.success) {
      return res.status(400).json({ error: 'Invalid experience payload.' });
    }
    try {
      const row = await updateExperience(id, parsed.data);
      if (!row) return res.status(404).json({ error: 'Experience not found.' });
      res.json(row);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error updating experience.' });
    }
  });

  app.delete('/api/admin/experiences/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid experience ID.' });
    try {
      await deleteExperience(id);
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error deleting experience.' });
    }
  });

  // Certifications CRUD
  app.post('/api/admin/certifications', async (req, res) => {
    const parsed = certificationInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
    try {
      res.status(201).json(await createCertification(parsed.data));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error creating certification.' });
    }
  });

  app.put('/api/admin/certifications/:id', async (req, res) => {
    const id = Number(req.params.id);
    const parsed = certificationInputSchema.safeParse(req.body);
    if (!Number.isInteger(id) || !parsed.success) {
      return res.status(400).json({ error: 'Invalid certification payload.' });
    }
    try {
      const row = await updateCertification(id, parsed.data);
      if (!row) return res.status(404).json({ error: 'Certification not found.' });
      res.json(row);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error updating certification.' });
    }
  });

  app.delete('/api/admin/certifications/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid certification ID.' });
    try {
      await deleteCertification(id);
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error deleting certification.' });
    }
  });

  // Testimonials CRUD
  app.post('/api/admin/testimonials', async (req, res) => {
    const parsed = testimonialInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
    try {
      res.status(201).json(await createTestimonial(parsed.data));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error creating testimonial.' });
    }
  });

  app.put('/api/admin/testimonials/:id', async (req, res) => {
    const id = Number(req.params.id);
    const parsed = testimonialInputSchema.safeParse(req.body);
    if (!Number.isInteger(id) || !parsed.success) {
      return res.status(400).json({ error: 'Invalid testimonial payload.' });
    }
    try {
      const row = await updateTestimonial(id, parsed.data);
      if (!row) return res.status(404).json({ error: 'Testimonial not found.' });
      res.json(row);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error updating testimonial.' });
    }
  });

  app.delete('/api/admin/testimonials/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid testimonial ID.' });
    try {
      await deleteTestimonial(id);
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error deleting testimonial.' });
    }
  });

  // Messages inbox
  app.get('/api/admin/messages', async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const filter = typeof req.query.filter === 'string' ? req.query.filter : 'all';
      res.json(await listContactMessages(q, filter));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load messages.' });
    }
  });

  app.get('/api/admin/messages/export.csv', async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const filter = typeof req.query.filter === 'string' ? req.query.filter : 'all';
      const rows = await listContactMessages(q, filter);
      const header = ['ID', 'Name', 'Email', 'Subject', 'Message', 'Status', 'Created At'];
      const lines = [
        header.map(escapeCsvCell).join(','),
        ...rows.map((r) =>
          [
            String(r.id),
            r.name,
            r.email,
            r.subject,
            r.message,
            r.isRead ? 'Read' : 'Unread',
            new Date(r.createdAt).toISOString(),
          ]
            .map(escapeCsvCell)
            .join(','),
        ),
      ];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="yeasin-inquiries.csv"');
      res.send(lines.join('\n'));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'CSV export failed.' });
    }
  });

  app.patch('/api/admin/messages/:id/read', async (req, res) => {
    const id = Number(req.params.id);
    const parsed = z.object({ isRead: z.boolean() }).safeParse(req.body);
    if (!Number.isInteger(id) || !parsed.success) {
      return res.status(400).json({ error: 'Invalid message status request.' });
    }
    try {
      const updated = await markMessageReadStatus(id, parsed.data.isRead);
      if (!updated) return res.status(404).json({ error: 'Message not found.' });
      res.json(updated);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to update message.' });
    }
  });

  app.delete('/api/admin/messages/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid message ID.' });
    try {
      await deleteContactMessage(id);
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to delete message.' });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use('/projects/assets', express.static(path.join(distDir, 'assets')));
    app.use('/admin/assets', express.static(path.join(distDir, 'assets')));
    app.use('/projects/media', express.static(path.join(distDir, 'media')));
    app.use('/admin/media', express.static(path.join(distDir, 'media')));
    app.use(express.static(distDir, { index: false }));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/admin')) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
