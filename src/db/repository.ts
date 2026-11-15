import { asc, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from './index.ts';
import {
  adminUsers,
  certifications,
  contactMessages,
  experiences,
  projects,
  services,
  siteSettings,
  skills,
  testimonials,
} from './schema.ts';

export async function getPublicPortfolioData() {
  try {
    const [
      settingsRows,
      serviceRows,
      skillRows,
      experienceRows,
      projectRows,
      certificationRows,
      testimonialRows,
    ] = await Promise.all([
      db.select().from(siteSettings).limit(1),
      db.select().from(services).orderBy(asc(services.sortOrder), asc(services.id)),
      db.select().from(skills).orderBy(asc(skills.sortOrder), asc(skills.id)),
      db.select().from(experiences).orderBy(asc(experiences.sortOrder), asc(experiences.id)),
      db
        .select()
        .from(projects)
        .where(eq(projects.published, true))
        .orderBy(asc(projects.sortOrder), desc(projects.id)),
      db
        .select()
        .from(certifications)
        .orderBy(asc(certifications.sortOrder), asc(certifications.id)),
      db
        .select()
        .from(testimonials)
        .orderBy(asc(testimonials.sortOrder), asc(testimonials.id)),
    ]);

    const s = settingsRows[0];

    return {
      settings: s
        ? {
            siteTitle: s.siteTitle,
            siteDescription: s.siteDescription,
            brandName: s.brandName,
            heroKicker: s.heroKicker,
            heroHeadline: s.heroHeadline,
            heroSubheadline: s.heroSubheadline,
            heroCtaPrimary: s.heroCtaPrimary,
            heroCtaSecondary: s.heroCtaSecondary,
            aboutHeading: s.aboutHeading,
            aboutBio: s.aboutBio,
            aboutSecondaryBio: s.aboutSecondaryBio,
            aboutImageUrl: s.aboutImageUrl,
            location: s.location,
            languages: s.languages,
            email: s.email,
            linkedinUrl: s.linkedinUrl,
            socialLinks: s.socialLinks,
            metrics: s.metrics,
            videoSectionTitle: s.videoSectionTitle,
            videoSectionSubtitle: s.videoSectionSubtitle,
            videoPosterUrl: s.videoPosterUrl,
            videoUrl: s.videoUrl,
          }
        : null,
      services: serviceRows.map((item) => ({
        title: item.title,
        summary: item.summary,
        deliverables: item.deliverables,
      })),
      skills: skillRows.map((item) => ({
        name: item.name,
        category: item.category,
        proficiencyLabel: item.proficiencyLabel,
      })),
      experiences: experienceRows.map((item) => ({
        role: item.role,
        company: item.company,
        period: item.period,
        location: item.location,
        summary: item.summary,
        highlights: item.highlights,
      })),
      projects: projectRows.map((item) => ({
        slug: item.slug,
        title: item.title,
        category: item.category,
        clientOrContext: item.clientOrContext,
        timeframe: item.timeframe,
        coverImage: item.coverImage,
        gallery: item.gallery,
        description: item.description,
        goal: item.goal,
        approach: item.approach,
        results: item.results,
        metrics: item.metrics,
        externalLink: item.externalLink,
      })),
      certifications: certificationRows.map((item) => ({
        title: item.title,
        issuer: item.issuer,
        year: item.year,
        credentialUrl: item.credentialUrl,
      })),
      testimonials: testimonialRows.map((item) => ({
        authorName: item.authorName,
        authorRole: item.authorRole,
        organization: item.organization,
        quote: item.quote,
        outcome: item.outcome,
        avatarUrl: item.avatarUrl,
      })),
    };
  } catch (error) {
    console.error('Database query failed in getPublicPortfolioData:', error);
    throw new Error('Unable to load portfolio content.', { cause: error });
  }
}

export async function getPublicProjectBySlug(slug: string) {
  try {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);

    const p = rows[0];
    if (!p || !p.published) return null;

    return {
      slug: p.slug,
      title: p.title,
      category: p.category,
      clientOrContext: p.clientOrContext,
      timeframe: p.timeframe,
      coverImage: p.coverImage,
      gallery: p.gallery,
      description: p.description,
      goal: p.goal,
      approach: p.approach,
      results: p.results,
      metrics: p.metrics,
      externalLink: p.externalLink,
    };
  } catch (error) {
    console.error('Database query failed in getPublicProjectBySlug:', error);
    throw new Error('Unable to load project details.', { cause: error });
  }
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    await db.insert(contactMessages).values({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
    });
  } catch (error) {
    console.error('Database insert failed in createContactMessage:', error);
    throw new Error('Unable to save contact message.', { cause: error });
  }
}

export async function findAdminByUsername(username: string) {
  try {
    const rows = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in findAdminByUsername:', error);
    throw new Error('Authentication lookup failed.', { cause: error });
  }
}

export async function updateAdminPasswordHash(id: number, passwordHash: string) {
  try {
    await db
      .update(adminUsers)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(adminUsers.id, id));
  } catch (error) {
    console.error('Database update failed in updateAdminPasswordHash:', error);
    throw new Error('Unable to update password.', { cause: error });
  }
}

export async function getAdminOverviewData() {
  try {
    const [
      settingsRows,
      serviceRows,
      skillRows,
      experienceRows,
      projectRows,
      certificationRows,
      testimonialRows,
      messageRows,
    ] = await Promise.all([
      db.select().from(siteSettings).limit(1),
      db.select().from(services).orderBy(asc(services.sortOrder), asc(services.id)),
      db.select().from(skills).orderBy(asc(skills.sortOrder), asc(skills.id)),
      db.select().from(experiences).orderBy(asc(experiences.sortOrder), asc(experiences.id)),
      db.select().from(projects).orderBy(asc(projects.sortOrder), desc(projects.id)),
      db
        .select()
        .from(certifications)
        .orderBy(asc(certifications.sortOrder), asc(certifications.id)),
      db
        .select()
        .from(testimonials)
        .orderBy(asc(testimonials.sortOrder), asc(testimonials.id)),
      db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)),
    ]);

    return {
      settings: settingsRows[0] || null,
      services: serviceRows,
      skills: skillRows,
      experiences: experienceRows,
      projects: projectRows,
      certifications: certificationRows,
      testimonials: testimonialRows,
      messages: messageRows,
    };
  } catch (error) {
    console.error('Database query failed in getAdminOverviewData:', error);
    throw new Error('Unable to load admin workspace.', { cause: error });
  }
}

export async function updateSiteSettings(data: typeof siteSettings.$inferInsert) {
  try {
    const existing = await db.select({ id: siteSettings.id }).from(siteSettings).limit(1);
    if (existing[0]) {
      const [updated] = await db
        .update(siteSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(siteSettings.id, existing[0].id))
        .returning();
      return updated;
    }
    const [inserted] = await db.insert(siteSettings).values(data).returning();
    return inserted;
  } catch (error) {
    console.error('Database update failed in updateSiteSettings:', error);
    throw new Error('Unable to update site settings.', { cause: error });
  }
}

export async function listContactMessages(query: string, filter: string) {
  try {
    const trimmed = query.trim();
    const rows = trimmed
      ? await db
          .select()
          .from(contactMessages)
          .where(
            or(
              ilike(contactMessages.name, `%${trimmed}%`),
              ilike(contactMessages.email, `%${trimmed}%`),
              ilike(contactMessages.subject, `%${trimmed}%`),
              ilike(contactMessages.message, `%${trimmed}%`),
            ),
          )
          .orderBy(desc(contactMessages.createdAt))
      : await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));

    if (filter === 'unread') return rows.filter((r) => !r.isRead);
    if (filter === 'read') return rows.filter((r) => r.isRead);
    return rows;
  } catch (error) {
    console.error('Database query failed in listContactMessages:', error);
    throw new Error('Unable to load messages.', { cause: error });
  }
}

export async function markMessageReadStatus(id: number, isRead: boolean) {
  try {
    const [updated] = await db
      .update(contactMessages)
      .set({ isRead })
      .where(eq(contactMessages.id, id))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('Database update failed in markMessageReadStatus:', error);
    throw new Error('Unable to update message status.', { cause: error });
  }
}

export async function deleteContactMessage(id: number) {
  try {
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
  } catch (error) {
    console.error('Database delete failed in deleteContactMessage:', error);
    throw new Error('Unable to delete message.', { cause: error });
  }
}

// Generic CRUD helpers for CMS collections
export async function createService(data: typeof services.$inferInsert) {
  try {
    const [row] = await db.insert(services).values(data).returning();
    return row;
  } catch (error) {
    console.error('Database error in createService:', error);
    throw new Error('Unable to create service.', { cause: error });
  }
}

export async function updateService(id: number, data: Partial<typeof services.$inferInsert>) {
  try {
    const [row] = await db.update(services).set(data).where(eq(services.id, id)).returning();
    return row || null;
  } catch (error) {
    console.error('Database error in updateService:', error);
    throw new Error('Unable to update service.', { cause: error });
  }
}

export async function deleteService(id: number) {
  try {
    await db.delete(services).where(eq(services.id, id));
  } catch (error) {
    console.error('Database error in deleteService:', error);
    throw new Error('Unable to delete service.', { cause: error });
  }
}

export async function createSkill(data: typeof skills.$inferInsert) {
  try {
    const [row] = await db.insert(skills).values(data).returning();
    return row;
  } catch (error) {
    console.error('Database error in createSkill:', error);
    throw new Error('Unable to create skill.', { cause: error });
  }
}

export async function updateSkill(id: number, data: Partial<typeof skills.$inferInsert>) {
  try {
    const [row] = await db.update(skills).set(data).where(eq(skills.id, id)).returning();
    return row || null;
  } catch (error) {
    console.error('Database error in updateSkill:', error);
    throw new Error('Unable to update skill.', { cause: error });
  }
}

export async function deleteSkill(id: number) {
  try {
    await db.delete(skills).where(eq(skills.id, id));
  } catch (error) {
    console.error('Database error in deleteSkill:', error);
    throw new Error('Unable to delete skill.', { cause: error });
  }
}

export async function createExperience(data: typeof experiences.$inferInsert) {
  try {
    const [row] = await db.insert(experiences).values(data).returning();
    return row;
  } catch (error) {
    console.error('Database error in createExperience:', error);
    throw new Error('Unable to create experience.', { cause: error });
  }
}

export async function updateExperience(
  id: number,
  data: Partial<typeof experiences.$inferInsert>,
) {
  try {
    const [row] = await db
      .update(experiences)
      .set(data)
      .where(eq(experiences.id, id))
      .returning();
    return row || null;
  } catch (error) {
    console.error('Database error in updateExperience:', error);
    throw new Error('Unable to update experience.', { cause: error });
  }
}

export async function deleteExperience(id: number) {
  try {
    await db.delete(experiences).where(eq(experiences.id, id));
  } catch (error) {
    console.error('Database error in deleteExperience:', error);
    throw new Error('Unable to delete experience.', { cause: error });
  }
}

export async function createProject(data: typeof projects.$inferInsert) {
  try {
    const [row] = await db.insert(projects).values(data).returning();
    return row;
  } catch (error) {
    console.error('Database error in createProject:', error);
    throw new Error('Unable to create project. Ensure slug is unique.', { cause: error });
  }
}

export async function updateProject(id: number, data: Partial<typeof projects.$inferInsert>) {
  try {
    const [row] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return row || null;
  } catch (error) {
    console.error('Database error in updateProject:', error);
    throw new Error('Unable to update project.', { cause: error });
  }
}

export async function reorderProjects(orderedIds: number[]) {
  try {
    await Promise.all(
      orderedIds.map((id, idx) =>
        db.update(projects).set({ sortOrder: idx, updatedAt: new Date() }).where(eq(projects.id, id)),
      ),
    );
  } catch (error) {
    console.error('Database error in reorderProjects:', error);
    throw new Error('Unable to reorder projects.', { cause: error });
  }
}

export async function deleteProject(id: number) {
  try {
    await db.delete(projects).where(eq(projects.id, id));
  } catch (error) {
    console.error('Database error in deleteProject:', error);
    throw new Error('Unable to delete project.', { cause: error });
  }
}

export async function createCertification(data: typeof certifications.$inferInsert) {
  try {
    const [row] = await db.insert(certifications).values(data).returning();
    return row;
  } catch (error) {
    console.error('Database error in createCertification:', error);
    throw new Error('Unable to create certification.', { cause: error });
  }
}

export async function updateCertification(
  id: number,
  data: Partial<typeof certifications.$inferInsert>,
) {
  try {
    const [row] = await db
      .update(certifications)
      .set(data)
      .where(eq(certifications.id, id))
      .returning();
    return row || null;
  } catch (error) {
    console.error('Database error in updateCertification:', error);
    throw new Error('Unable to update certification.', { cause: error });
  }
}

export async function deleteCertification(id: number) {
  try {
    await db.delete(certifications).where(eq(certifications.id, id));
  } catch (error) {
    console.error('Database error in deleteCertification:', error);
    throw new Error('Unable to delete certification.', { cause: error });
  }
}

export async function createTestimonial(data: typeof testimonials.$inferInsert) {
  try {
    const [row] = await db.insert(testimonials).values(data).returning();
    return row;
  } catch (error) {
    console.error('Database error in createTestimonial:', error);
    throw new Error('Unable to create testimonial.', { cause: error });
  }
}

export async function updateTestimonial(
  id: number,
  data: Partial<typeof testimonials.$inferInsert>,
) {
  try {
    const [row] = await db
      .update(testimonials)
      .set(data)
      .where(eq(testimonials.id, id))
      .returning();
    return row || null;
  } catch (error) {
    console.error('Database error in updateTestimonial:', error);
    throw new Error('Unable to update testimonial.', { cause: error });
  }
}

export async function deleteTestimonial(id: number) {
  try {
    await db.delete(testimonials).where(eq(testimonials.id, id));
  } catch (error) {
    console.error('Database error in deleteTestimonial:', error);
    throw new Error('Unable to delete testimonial.', { cause: error });
  }
}
