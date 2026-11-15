import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  EyeOff,
  LogOut,
  Mail,
  MailOpen,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type {
  CertificationItem,
  ContactMessageItem,
  ExperienceItem,
  ProjectItem,
  ServiceItem,
  SiteSettings,
  SkillItem,
  TestimonialItem,
} from '../types/portfolio.ts';

interface AdminOverviewResponse {
  settings: SiteSettings | null;
  services: Array<ServiceItem & { id: number; sortOrder: number }>;
  skills: Array<SkillItem & { id: number; sortOrder: number }>;
  experiences: Array<ExperienceItem & { id: number; sortOrder: number }>;
  projects: Array<ProjectItem & { id: number; published: boolean; sortOrder: number }>;
  certifications: Array<CertificationItem & { id: number; sortOrder: number }>;
  testimonials: Array<TestimonialItem & { id: number; sortOrder: number }>;
  messages: ContactMessageItem[];
}

type AdminTab = 'messages' | 'projects' | 'settings' | 'sections' | 'security';
type SectionSubTab = 'services' | 'skills' | 'experiences' | 'certifications' | 'testimonials';

const EMPTY_PROJECT: ProjectItem & { id?: number; published: boolean; sortOrder: number } = {
  slug: '',
  title: '',
  category: 'Social Strategy',
  clientOrContext: '',
  timeframe: '',
  coverImage: '/media/project-social.jpg',
  gallery: ['/media/project-social.jpg'],
  description: '',
  goal: '',
  approach: '',
  results: '',
  metrics: [{ label: 'Primary Outcome', value: '+0%' }],
  externalLink: '',
  published: true,
  sortOrder: 0,
};

export function AdminPage({ onExit }: { onExit: () => void }) {
  const [csrfToken, setCsrfToken] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  const [tab, setTab] = useState<AdminTab>('messages');
  const [subTab, setSubTab] = useState<SectionSubTab>('services');
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Messages filter
  const [msgQuery, setMsgQuery] = useState('');
  const [msgFilter, setMsgFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Project editor
  const [editingProject, setEditingProject] = useState<
    (ProjectItem & { id?: number; published: boolean; sortOrder: number }) | null
  >(null);

  // Settings draft
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings | null>(null);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Section item editors
  const [serviceDraft, setServiceDraft] = useState<ServiceItem>({
    title: '',
    summary: '',
    deliverables: [''],
    sortOrder: 0,
  });
  const [skillDraft, setSkillDraft] = useState<SkillItem>({
    name: '',
    category: 'Social Strategy',
    proficiencyLabel: 'Lead',
    sortOrder: 0,
  });
  const [expDraft, setExpDraft] = useState<ExperienceItem>({
    role: '',
    company: '',
    period: '',
    location: 'Bangladesh',
    summary: '',
    highlights: [''],
    sortOrder: 0,
  });
  const [certDraft, setCertDraft] = useState<CertificationItem>({
    title: '',
    issuer: '',
    year: '',
    credentialUrl: '',
    sortOrder: 0,
  });
  const [testiDraft, setTestiDraft] = useState<TestimonialItem>({
    authorName: '',
    authorRole: '',
    organization: '',
    quote: '',
    outcome: '',
    avatarUrl: '',
    sortOrder: 0,
  });

  // Inject noindex meta tag while /admin is active
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow, noarchive';
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = 'Admin Workspace';
    return () => {
      document.head.removeChild(meta);
      document.title = prevTitle;
    };
  }, []);

  const notify = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4500);
  };

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);
      if (csrfToken) headers.set('x-csrf-token', csrfToken);
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin',
      });
      return res;
    },
    [csrfToken],
  );

  const loadOverview = useCallback(async () => {
    const res = await apiFetch('/api/admin/overview');
    if (res.status === 401) {
      setAuthenticated(false);
      return;
    }
    if (!res.ok) throw new Error('Unable to load admin workspace.');
    const json = (await res.json()) as AdminOverviewResponse;
    setData(json);
    if (json.settings) setSettingsDraft(json.settings);
  }, [apiFetch]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/auth/csrf', { credentials: 'same-origin' }).then((r) => r.json()),
      fetch('/api/auth/session', { credentials: 'same-origin' }).then((r) => r.json()),
    ])
      .then(([csrfJson, sessJson]) => {
        if (!active) return;
        setCsrfToken((csrfJson as { csrfToken?: string }).csrfToken || '');
        const isAuth = Boolean((sessJson as { authenticated?: boolean }).authenticated);
        setAuthenticated(isAuth);
        setAuthChecked(true);
      })
      .catch(() => {
        if (active) setAuthChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authenticated && csrfToken) {
      loadOverview().catch((err: unknown) => {
        notify('err', err instanceof Error ? err.message : 'Failed to load data.');
      });
    }
  }, [authenticated, csrfToken, loadOverview]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginBusy(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      const json = (await res.json()) as { authenticated?: boolean; error?: string };
      if (!res.ok) {
        setLoginError(json.error || 'Authentication failed.');
        return;
      }
      setPasswordInput('');
      setAuthenticated(true);
    } catch {
      setLoginError('Unable to reach server.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    setData(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) {
        notify('err', json.error || 'Password update failed.');
      } else {
        notify('ok', json.message || 'Password updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsDraft) return;
    setBusy(true);
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsDraft),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        notify('err', json.error || 'Failed to save settings.');
      } else {
        notify('ok', 'Site settings and SEO metadata saved.');
        await loadOverview();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setBusy(true);
    try {
      const isUpdate = Boolean(editingProject.id);
      const url = isUpdate
        ? `/api/admin/projects/${editingProject.id}`
        : '/api/admin/projects';
      const res = await apiFetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        body: JSON.stringify(editingProject),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        notify('err', json.error || 'Failed to save project.');
        return;
      }
      notify('ok', isUpdate ? 'Project updated.' : 'Project created.');
      setEditingProject(null);
      await loadOverview();
    } finally {
      setBusy(false);
    }
  };

  const handleToggleProjectPublish = async (id: number, published: boolean) => {
    const res = await apiFetch(`/api/admin/projects/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ published: !published }),
    });
    if (res.ok) {
      notify('ok', !published ? 'Project published.' : 'Project moved to draft.');
      await loadOverview();
    }
  };

  const handleMoveProject = async (index: number, direction: -1 | 1) => {
    if (!data) return;
    const list = [...data.projects];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const [moved] = list.splice(index, 1);
    if (!moved) return;
    list.splice(target, 0, moved);
    const res = await apiFetch('/api/admin/projects/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ orderedIds: list.map((p) => p.id) }),
    });
    if (res.ok) await loadOverview();
  };

  const handleDeleteProject = async (id: number) => {
    const res = await apiFetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      notify('ok', 'Project deleted.');
      await loadOverview();
    }
  };

  const handleToggleMessageRead = async (id: number, isRead: boolean) => {
    const res = await apiFetch(`/api/admin/messages/${id}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ isRead: !isRead }),
    });
    if (res.ok) await loadOverview();
  };

  const handleDeleteMessage = async (id: number) => {
    const res = await apiFetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
    if (res.ok) {
      notify('ok', 'Message deleted.');
      await loadOverview();
    }
  };

  // Generic section save/delete helpers
  const saveSectionItem = async (
    endpoint: string,
    payload: unknown,
    onDone: () => void,
  ) => {
    setBusy(true);
    try {
      const itemWithId = payload as { id?: number };
      const isEdit = Boolean(itemWithId.id);
      const res = await apiFetch(isEdit ? `${endpoint}/${itemWithId.id}` : endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        notify('err', json.error || 'Unable to save item.');
        return;
      }
      notify('ok', 'Saved.');
      onDone();
      await loadOverview();
    } finally {
      setBusy(false);
    }
  };

  const deleteSectionItem = async (endpoint: string, id: number) => {
    const res = await apiFetch(`${endpoint}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      notify('ok', 'Deleted.');
      await loadOverview();
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-6">
        <p className="font-mono text-xs text-[#6E6E67]">Checking session...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-[#E4E4DF] rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <p className="font-mono text-xs text-[#6E6E67]">Portfolio Administration</p>
            <h1 className="font-display text-2xl font-semibold text-[#111210]">
              Sign in to workspace
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-user"
                className="block text-xs font-medium text-[#3A3A35] mb-1.5"
              >
                Username
              </label>
              <input
                id="admin-user"
                type="text"
                autoComplete="username"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F7] border border-[#D8D8D0] rounded-lg focus:outline-none focus:border-[#C59B43] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="admin-pass"
                className="block text-xs font-medium text-[#3A3A35] mb-1.5"
              >
                Password
              </label>
              <input
                id="admin-pass"
                type="password"
                autoComplete="current-password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F7] border border-[#D8D8D0] rounded-lg focus:outline-none focus:border-[#C59B43] focus:bg-white"
              />
            </div>

            {loginError && (
              <p className="text-xs text-[#B92B14] bg-[#FDF4F2] border border-[#F0C8C0] rounded-lg px-3 py-2">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginBusy}
              className="w-full py-2.5 px-4 text-sm font-semibold text-[#111210] bg-[#DFC07C] hover:bg-[#C59B43] disabled:opacity-60 rounded-lg cursor-pointer transition-colors"
            >
              {loginBusy ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#ECECE7] text-center">
            <button
              type="button"
              onClick={onExit}
              className="text-xs text-[#6E6E67] hover:text-[#111210] cursor-pointer"
            >
              Return to public site
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredMessages = (data?.messages || []).filter((m) => {
    if (msgFilter === 'unread' && m.isRead) return false;
    if (msgFilter === 'read' && !m.isRead) return false;
    if (!msgQuery.trim()) return true;
    const q = msgQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  const unreadCount = (data?.messages || []).filter((m) => !m.isRead).length;

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#111210]">
      <header className="sticky top-0 z-30 bg-[#F9F9F7]/95 backdrop-blur-sm border-b border-[#E4E4DF]">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <span className="font-display text-lg font-bold whitespace-nowrap">
              Studio Admin
            </span>
            <nav className="hidden md:flex items-center gap-2">
              {(
                [
                  ['messages', `Inbox (${unreadCount})`],
                  ['projects', 'Projects'],
                  ['settings', 'Site & SEO'],
                  ['sections', 'Content'],
                  ['security', 'Password'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                    tab === key
                      ? 'bg-[#111210] text-white'
                      : 'text-[#52524C] hover:text-[#111210] hover:bg-[#ECECE7]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              className="px-3 py-1.5 text-xs font-medium border border-[#D8D8D0] rounded-lg hover:border-[#111210] cursor-pointer whitespace-nowrap"
            >
              View Site
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#52524C] hover:text-[#9E7A2B] cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
        {/* Mobile tab strip */}
        <div className="md:hidden border-t border-[#E4E4DF] px-6 py-2 flex items-center gap-2 overflow-x-auto">
          {(
            [
              ['messages', `Inbox (${unreadCount})`],
              ['projects', 'Projects'],
              ['settings', 'Site & SEO'],
              ['sections', 'Content'],
              ['security', 'Password'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                tab === key ? 'bg-[#111210] text-white' : 'text-[#52524C]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
        {toast && (
          <div
            role="status"
            className={`px-4 py-3 rounded-lg text-sm border ${
              toast.type === 'ok'
                ? 'bg-[#F3F8F4] border-[#C6DFCB] text-[#1D542B]'
                : 'bg-[#FDF4F2] border-[#F0C8C0] text-[#9E2311]'
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* TAB 1: MESSAGES INBOX */}
        {tab === 'messages' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-semibold">Contact Inquiries</h1>
                <p className="text-sm text-[#52524C]">
                  {data?.messages.length || 0} total submissions · {unreadCount} unread
                </p>
              </div>
              <a
                href={`/api/admin/messages/export.csv?q=${encodeURIComponent(msgQuery)}&filter=${msgFilter}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-[#D8D8D0] hover:border-[#111210] rounded-lg self-start"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8A8A82] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={msgQuery}
                  onChange={(e) => setMsgQuery(e.target.value)}
                  placeholder="Search by name, email, subject, or message..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#D8D8D0] rounded-lg focus:outline-none focus:border-[#C59B43]"
                />
              </div>

              <div className="inline-flex items-center gap-1 p-1 bg-[#ECECE7] rounded-lg self-start">
                {(['all', 'unread', 'read'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setMsgFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize cursor-pointer ${
                      msgFilter === f ? 'bg-white text-[#111210]' : 'text-[#52524C]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredMessages.length === 0 ? (
              <div className="bg-white border border-[#E4E4DF] rounded-2xl p-10 text-center text-sm text-[#6E6E67]">
                No messages match your filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((msg) => (
                  <article
                    key={msg.id}
                    className={`bg-white border rounded-2xl p-6 space-y-3 ${
                      msg.isRead ? 'border-[#E4E4DF]' : 'border-[#C59B43]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#6E6E67]">
                          <span className={msg.isRead ? 'text-[#6E6E67]' : 'text-[#9E7A2B] font-medium'}>
                            {msg.isRead ? 'Read' : 'Unread'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        <h2 className="font-display text-lg font-semibold">{msg.subject}</h2>
                        <p className="text-sm text-[#45453F]">
                          {msg.name} <span aria-hidden="true">·</span>{' '}
                          <a href={`mailto:${msg.email}`} className="underline">
                            {msg.email}
                          </a>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleMessageRead(msg.id, msg.isRead)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#D8D8D0] rounded-lg hover:border-[#111210] cursor-pointer"
                        >
                          {msg.isRead ? (
                            <>
                              <Mail className="w-3.5 h-3.5" />
                              Mark Unread
                            </>
                          ) : (
                            <>
                              <MailOpen className="w-3.5 h-3.5" />
                              Mark Read
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label="Delete message"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-2 text-[#6E6E67] hover:text-[#B92B14] border border-[#D8D8D0] rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-[#2A2B28] whitespace-pre-wrap pt-3 border-t border-[#F0F0EB]">
                      {msg.message}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: PROJECTS */}
        {tab === 'projects' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-semibold">Projects &amp; Case Studies</h1>
                <p className="text-sm text-[#52524C]">
                  Add, edit, reorder, publish/unpublish, or replace placeholder projects.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingProject({
                    ...EMPTY_PROJECT,
                    sortOrder: data?.projects.length || 0,
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#111210] bg-[#DFC07C] hover:bg-[#C59B43] rounded-lg cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            </div>

            {editingProject && (
              <form
                onSubmit={handleSaveProject}
                className="bg-white border border-[#111210] rounded-2xl p-6 sm:p-8 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold">
                    {editingProject.id ? 'Edit Project' : 'New Project'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="text-xs text-[#6E6E67] hover:text-[#111210] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Title</label>
                    <input
                      required
                      value={editingProject.title}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, title: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Slug (URL path)</label>
                    <input
                      required
                      value={editingProject.slug}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                        })
                      }
                      placeholder="my-case-study"
                      className="w-full px-3 py-2 text-sm font-mono border border-[#D8D8D0] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Category</label>
                    <input
                      required
                      value={editingProject.category}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, category: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Client / Context</label>
                    <input
                      required
                      value={editingProject.clientOrContext}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, clientOrContext: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Timeframe</label>
                    <input
                      required
                      value={editingProject.timeframe}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, timeframe: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Cover Image URL</label>
                    <input
                      required
                      value={editingProject.coverImage}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, coverImage: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm font-mono border border-[#D8D8D0] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Gallery Image URLs (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={editingProject.gallery.join('\n')}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        gallery: e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D8D8D0] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Short Description</label>
                  <textarea
                    rows={2}
                    required
                    value={editingProject.description}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, description: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Goal</label>
                    <textarea
                      rows={3}
                      required
                      value={editingProject.goal}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, goal: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Approach</label>
                    <textarea
                      rows={3}
                      required
                      value={editingProject.approach}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, approach: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Results</label>
                    <textarea
                      rows={3}
                      required
                      value={editingProject.results}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, results: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">Metrics</label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProject({
                          ...editingProject,
                          metrics: [...editingProject.metrics, { label: '', value: '' }],
                        })
                      }
                      className="text-xs font-medium text-[#9E7A2B] hover:text-[#111210] cursor-pointer"
                    >
                      + Add Metric
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editingProject.metrics.map((m, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          value={m.label}
                          placeholder="Metric label"
                          onChange={(e) => {
                            const next = [...editingProject.metrics];
                            next[i] = { ...m, label: e.target.value };
                            setEditingProject({ ...editingProject, metrics: next });
                          }}
                          className="col-span-6 px-3 py-1.5 text-sm border border-[#D8D8D0] rounded-lg"
                        />
                        <input
                          value={m.value}
                          placeholder="+140%"
                          onChange={(e) => {
                            const next = [...editingProject.metrics];
                            next[i] = { ...m, value: e.target.value };
                            setEditingProject({ ...editingProject, metrics: next });
                          }}
                          className="col-span-5 px-3 py-1.5 text-sm font-mono border border-[#D8D8D0] rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProject({
                              ...editingProject,
                              metrics: editingProject.metrics.filter((_, idx) => idx !== i),
                            })
                          }
                          className="col-span-1 text-xs text-[#6E6E67] hover:text-[#B92B14] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-medium mb-1">External Link</label>
                    <input
                      value={editingProject.externalLink}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, externalLink: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm pt-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProject.published}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, published: e.target.checked })
                      }
                    />
                    Published on public site
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-2.5 text-sm font-semibold text-[#111210] bg-[#DFC07C] hover:bg-[#C59B43] rounded-lg cursor-pointer transition-colors"
                  >
                    {busy ? 'Saving...' : 'Save Project'}
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-[#E4E4DF] bg-white border border-[#E4E4DF] rounded-2xl">
              {(data?.projects || []).map((proj, idx) => (
                <div
                  key={proj.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#6E6E67]">
                      <span className={proj.published ? 'text-[#1D542B]' : 'text-[#9E2311]'}>
                        {proj.published ? 'Published' : 'Draft'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{proj.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>/{proj.slug}</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold">{proj.title}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      aria-label="Move up"
                      onClick={() => handleMoveProject(idx, -1)}
                      disabled={idx === 0}
                      className="p-2 border border-[#D8D8D0] rounded-lg disabled:opacity-35 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      onClick={() => handleMoveProject(idx, 1)}
                      disabled={idx === (data?.projects.length || 1) - 1}
                      className="p-2 border border-[#D8D8D0] rounded-lg disabled:opacity-35 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleProjectPublish(proj.id, proj.published)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#D8D8D0] rounded-lg cursor-pointer"
                    >
                      {proj.published ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Publish
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProject(proj)}
                      className="px-3 py-1.5 text-xs font-medium border border-[#D8D8D0] rounded-lg hover:border-[#111210] cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      aria-label="Delete project"
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-2 text-[#6E6E67] hover:text-[#B92B14] border border-[#D8D8D0] rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: SITE & SEO SETTINGS */}
        {tab === 'settings' && settingsDraft && (
          <form onSubmit={handleSaveSettings} className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-semibold">
                  Site Copy, Images &amp; SEO
                </h1>
                <p className="text-sm text-[#52524C]">
                  Every public headline, bio, metric, contact detail, and meta tag is edited here.
                </p>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 text-sm font-semibold text-[#111210] bg-[#DFC07C] hover:bg-[#C59B43] rounded-lg cursor-pointer transition-colors"
              >
                {busy ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="bg-white border border-[#E4E4DF] rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">SEO &amp; Identity</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">SEO Title</label>
                  <input
                    value={settingsDraft.siteTitle}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, siteTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Brand Name</label>
                  <input
                    value={settingsDraft.brandName}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, brandName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">SEO Meta Description</label>
                <textarea
                  rows={2}
                  value={settingsDraft.siteDescription}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, siteDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                />
              </div>
            </div>

            <div className="bg-white border border-[#E4E4DF] rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">Hero Section</h2>
              <div>
                <label className="block text-xs font-medium mb-1">Hero Kicker</label>
                <input
                  value={settingsDraft.heroKicker}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, heroKicker: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Hero Headline</label>
                <input
                  value={settingsDraft.heroHeadline}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, heroHeadline: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Hero Subheadline</label>
                <textarea
                  rows={2}
                  value={settingsDraft.heroSubheadline}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, heroSubheadline: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Primary CTA Label</label>
                  <input
                    value={settingsDraft.heroCtaPrimary}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, heroCtaPrimary: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Secondary CTA Label</label>
                  <input
                    value={settingsDraft.heroCtaSecondary}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, heroCtaSecondary: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E4E4DF] rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">About &amp; Contact Details</h2>
              <div>
                <label className="block text-xs font-medium mb-1">About Heading</label>
                <input
                  value={settingsDraft.aboutHeading}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, aboutHeading: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Primary Bio</label>
                <textarea
                  rows={3}
                  value={settingsDraft.aboutBio}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, aboutBio: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Secondary Bio</label>
                <textarea
                  rows={2}
                  value={settingsDraft.aboutSecondaryBio}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, aboutSecondaryBio: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">About Portrait Image URL</label>
                  <input
                    value={settingsDraft.aboutImageUrl}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, aboutImageUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D8D8D0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={settingsDraft.email}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, email: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Location</label>
                  <input
                    value={settingsDraft.location}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, location: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Languages</label>
                  <input
                    value={settingsDraft.languages}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, languages: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={settingsDraft.linkedinUrl}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, linkedinUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E4E4DF] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Hero KPI Metrics</h2>
                <button
                  type="button"
                  onClick={() =>
                    setSettingsDraft({
                      ...settingsDraft,
                      metrics: [
                        ...settingsDraft.metrics,
                        { label: 'New Metric', value: 10, suffix: '+', context: 'Context' },
                      ],
                    })
                  }
                  className="text-xs font-medium text-[#9E7A2B] hover:text-[#111210] cursor-pointer"
                >
                  + Add Metric
                </button>
              </div>
              <div className="space-y-3">
                {settingsDraft.metrics.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <input
                      value={m.label}
                      placeholder="Label"
                      onChange={(e) => {
                        const next = [...settingsDraft.metrics];
                        next[idx] = { ...m, label: e.target.value };
                        setSettingsDraft({ ...settingsDraft, metrics: next });
                      }}
                      className="sm:col-span-4 px-3 py-1.5 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                    <input
                      type="number"
                      value={m.value}
                      onChange={(e) => {
                        const next = [...settingsDraft.metrics];
                        next[idx] = { ...m, value: Number(e.target.value) || 0 };
                        setSettingsDraft({ ...settingsDraft, metrics: next });
                      }}
                      className="sm:col-span-2 px-3 py-1.5 text-sm font-mono border border-[#D8D8D0] rounded-lg"
                    />
                    <input
                      value={m.suffix}
                      placeholder="Suffix"
                      onChange={(e) => {
                        const next = [...settingsDraft.metrics];
                        next[idx] = { ...m, suffix: e.target.value };
                        setSettingsDraft({ ...settingsDraft, metrics: next });
                      }}
                      className="sm:col-span-2 px-3 py-1.5 text-sm font-mono border border-[#D8D8D0] rounded-lg"
                    />
                    <input
                      value={m.context}
                      placeholder="Context"
                      onChange={(e) => {
                        const next = [...settingsDraft.metrics];
                        next[idx] = { ...m, context: e.target.value };
                        setSettingsDraft({ ...settingsDraft, metrics: next });
                      }}
                      className="sm:col-span-3 px-3 py-1.5 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSettingsDraft({
                          ...settingsDraft,
                          metrics: settingsDraft.metrics.filter((_, i) => i !== idx),
                        })
                      }
                      className="sm:col-span-1 text-xs text-[#6E6E67] hover:text-[#B92B14] cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E4E4DF] rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">Scroll-Scrubbed Video Section</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Section Title</label>
                  <input
                    value={settingsDraft.videoSectionTitle}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, videoSectionTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">MP4 Video URL</label>
                  <input
                    value={settingsDraft.videoUrl}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, videoUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D8D8D0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Poster Fallback Image URL</label>
                  <input
                    value={settingsDraft.videoPosterUrl}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, videoPosterUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D8D8D0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Subtitle</label>
                  <input
                    value={settingsDraft.videoSectionSubtitle}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, videoSectionSubtitle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 4: SERVICES, SKILLS, EXPERIENCE, CERTIFICATIONS, TESTIMONIALS */}
        {tab === 'sections' && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ['services', 'Services'],
                  ['skills', 'Skills'],
                  ['experiences', 'Experience'],
                  ['certifications', 'Certifications'],
                  ['testimonials', 'Testimonials'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSubTab(k)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                    subTab === k
                      ? 'bg-white border-[#111210] text-[#111210]'
                      : 'bg-transparent border-[#E4E4DF] text-[#52524C]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {subTab === 'services' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveSectionItem('/api/admin/services', serviceDraft, () =>
                      setServiceDraft({ title: '', summary: '', deliverables: [''], sortOrder: 0 }),
                    );
                  }}
                  className="lg:col-span-5 bg-white border border-[#E4E4DF] rounded-2xl p-6 space-y-4 self-start"
                >
                  <h2 className="font-display text-lg font-semibold">
                    {serviceDraft.id ? 'Edit Service' : 'Add Service'}
                  </h2>
                  <input
                    required
                    placeholder="Title (e.g. 01. Social Media Strategy)"
                    value={serviceDraft.title}
                    onChange={(e) => setServiceDraft({ ...serviceDraft, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <textarea
                    required
                    rows={3}
                    placeholder="Summary"
                    value={serviceDraft.summary}
                    onChange={(e) => setServiceDraft({ ...serviceDraft, summary: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <textarea
                    rows={3}
                    placeholder="Deliverables (one per line)"
                    value={serviceDraft.deliverables.join('\n')}
                    onChange={(e) =>
                      setServiceDraft({
                        ...serviceDraft,
                        deliverables: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="px-4 py-2 text-xs font-semibold text-[#111210] bg-[#DFC07C] hover:bg-[#C59B43] rounded-lg cursor-pointer transition-colors"
                    >
                      Save
                    </button>
                    {serviceDraft.id && (
                      <button
                        type="button"
                        onClick={() =>
                          setServiceDraft({ title: '', summary: '', deliverables: [''], sortOrder: 0 })
                        }
                        className="px-3 py-2 text-xs border border-[#D8D8D0] rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                <div className="lg:col-span-7 space-y-3">
                  {(data?.services || []).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E4E4DF] rounded-xl p-5 flex items-start justify-between gap-4"
                    >
                      <div>
                        <h3 className="font-display font-semibold">{item.title}</h3>
                        <p className="text-xs text-[#52524C] mt-1">{item.summary}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setServiceDraft(item)}
                          className="px-2.5 py-1 text-xs border border-[#D8D8D0] rounded cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSectionItem('/api/admin/services', item.id)}
                          className="p-1.5 text-[#6E6E67] hover:text-[#B92B14] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {subTab === 'skills' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveSectionItem('/api/admin/skills', skillDraft, () =>
                      setSkillDraft({
                        name: '',
                        category: 'Social Strategy',
                        proficiencyLabel: 'Lead',
                        sortOrder: 0,
                      }),
                    );
                  }}
                  className="lg:col-span-5 bg-white border border-[#E4E4DF] rounded-2xl p-6 space-y-4 self-start"
                >
                  <h2 className="font-display text-lg font-semibold">
                    {skillDraft.id ? 'Edit Skill' : 'Add Skill'}
                  </h2>
                  <input
                    required
                    placeholder="Skill name"
                    value={skillDraft.name}
                    onChange={(e) => setSkillDraft({ ...skillDraft, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <input
                    required
                    placeholder="Category"
                    value={skillDraft.category}
                    onChange={(e) => setSkillDraft({ ...skillDraft, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <input
                    required
                    placeholder="Level (e.g. Lead, Advanced, Trainer)"
                    value={skillDraft.proficiencyLabel}
                    onChange={(e) =>
                      setSkillDraft({ ...skillDraft, proficiencyLabel: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 text-xs font-semibold text-[#111210] bg-[#DFC07C] hover:bg-[#C59B43] rounded-lg cursor-pointer transition-colors"
                  >
                    Save
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-2">
                  {(data?.skills || []).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E4E4DF] rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div className="text-sm">
                        <span className="font-medium">{item.name}</span>{' '}
                        <span className="text-xs text-[#6E6E67]">
                          · {item.category} · {item.proficiencyLabel}
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSkillDraft(item)}
                          className="px-2.5 py-1 text-xs border border-[#D8D8D0] rounded cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSectionItem('/api/admin/skills', item.id)}
                          className="p-1.5 text-[#6E6E67] hover:text-[#B92B14] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {subTab === 'experiences' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveSectionItem('/api/admin/experiences', expDraft, () =>
                      setExpDraft({
                        role: '',
                        company: '',
                        period: '',
                        location: 'Bangladesh',
                        summary: '',
                        highlights: [''],
                        sortOrder: 0,
                      }),
                    );
                  }}
                  className="lg:col-span-5 bg-white border border-[#E4E4DF] rounded-2xl p-6 space-y-3 self-start"
                >
                  <h2 className="font-display text-lg font-semibold">
                    {expDraft.id ? 'Edit Experience' : 'Add Experience'}
                  </h2>
                  <input
                    required
                    placeholder="Role"
                    value={expDraft.role}
                    onChange={(e) => setExpDraft({ ...expDraft, role: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <input
                    required
                    placeholder="Company"
                    value={expDraft.company}
                    onChange={(e) => setExpDraft({ ...expDraft, company: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      placeholder="Period"
                      value={expDraft.period}
                      onChange={(e) => setExpDraft({ ...expDraft, period: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                    <input
                      required
                      placeholder="Location"
                      value={expDraft.location}
                      onChange={(e) => setExpDraft({ ...expDraft, location: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                  </div>
                  <textarea
                    required
                    rows={2}
                    placeholder="Summary"
                    value={expDraft.summary}
                    onChange={(e) => setExpDraft({ ...expDraft, summary: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <textarea
                    rows={3}
                    placeholder="Highlights (one per line)"
                    value={expDraft.highlights.join('\n')}
                    onChange={(e) =>
                      setExpDraft({
                        ...expDraft,
                        highlights: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 text-xs font-semibold text-[#111210] bg-[#DFC07C] hover:bg-[#C59B43] rounded-lg cursor-pointer transition-colors"
                  >
                    Save
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-3">
                  {(data?.experiences || []).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E4E4DF] rounded-xl p-5 flex items-start justify-between gap-4"
                    >
                      <div>
                        <h3 className="font-display font-semibold">{item.role}</h3>
                        <p className="text-xs text-[#6E6E67]">
                          {item.company} · {item.period}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpDraft(item)}
                          className="px-2.5 py-1 text-xs border border-[#D8D8D0] rounded cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSectionItem('/api/admin/experiences', item.id)}
                          className="p-1.5 text-[#6E6E67] hover:text-[#B92B14] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {subTab === 'certifications' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveSectionItem('/api/admin/certifications', certDraft, () =>
                      setCertDraft({ title: '', issuer: '', year: '', credentialUrl: '', sortOrder: 0 }),
                    );
                  }}
                  className="lg:col-span-5 bg-white border border-[#E4E4DF] rounded-2xl p-6 space-y-3 self-start"
                >
                  <h2 className="font-display text-lg font-semibold">
                    {certDraft.id ? 'Edit Certification' : 'Add Certification'}
                  </h2>
                  <input
                    required
                    placeholder="Certification title"
                    value={certDraft.title}
                    onChange={(e) => setCertDraft({ ...certDraft, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <input
                    required
                    placeholder="Issuer"
                    value={certDraft.issuer}
                    onChange={(e) => setCertDraft({ ...certDraft, issuer: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <input
                    required
                    placeholder="Year"
                    value={certDraft.year}
                    onChange={(e) => setCertDraft({ ...certDraft, year: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <input
                    placeholder="Credential URL (optional)"
                    value={certDraft.credentialUrl}
                    onChange={(e) => setCertDraft({ ...certDraft, credentialUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 text-xs font-semibold text-[#111210] bg-[#DFC07C] hover:bg-[#C59B43] rounded-lg cursor-pointer transition-colors"
                  >
                    Save
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-3">
                  {(data?.certifications || []).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E4E4DF] rounded-xl p-5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <h3 className="font-display font-semibold">{item.title}</h3>
                        <p className="text-xs text-[#6E6E67]">
                          {item.issuer} · {item.year}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCertDraft(item)}
                          className="px-2.5 py-1 text-xs border border-[#D8D8D0] rounded cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSectionItem('/api/admin/certifications', item.id)}
                          className="p-1.5 text-[#6E6E67] hover:text-[#B92B14] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {subTab === 'testimonials' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveSectionItem('/api/admin/testimonials', testiDraft, () =>
                      setTestiDraft({
                        authorName: '',
                        authorRole: '',
                        organization: '',
                        quote: '',
                        outcome: '',
                        avatarUrl: '',
                        sortOrder: 0,
                      }),
                    );
                  }}
                  className="lg:col-span-5 bg-white border border-[#E4E4DF] rounded-2xl p-6 space-y-3 self-start"
                >
                  <h2 className="font-display text-lg font-semibold">
                    {testiDraft.id ? 'Edit Testimonial' : 'Add Testimonial'}
                  </h2>
                  <input
                    required
                    placeholder="Author name"
                    value={testiDraft.authorName}
                    onChange={(e) => setTestiDraft({ ...testiDraft, authorName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      placeholder="Role"
                      value={testiDraft.authorRole}
                      onChange={(e) => setTestiDraft({ ...testiDraft, authorRole: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                    <input
                      required
                      placeholder="Organization"
                      value={testiDraft.organization}
                      onChange={(e) =>
                        setTestiDraft({ ...testiDraft, organization: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                    />
                  </div>
                  <textarea
                    required
                    rows={3}
                    placeholder="Quote"
                    value={testiDraft.quote}
                    onChange={(e) => setTestiDraft({ ...testiDraft, quote: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <input
                    required
                    placeholder="Measured outcome"
                    value={testiDraft.outcome}
                    onChange={(e) => setTestiDraft({ ...testiDraft, outcome: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 text-xs font-semibold text-[#111210] bg-[#DFC07C] hover:bg-[#C59B43] rounded-lg cursor-pointer transition-colors"
                  >
                    Save
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-3">
                  {(data?.testimonials || []).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E4E4DF] rounded-xl p-5 flex items-start justify-between gap-4"
                    >
                      <div>
                        <h3 className="font-display font-semibold">{item.authorName}</h3>
                        <p className="text-xs text-[#6E6E67]">
                          {item.authorRole} · {item.organization}
                        </p>
                        <p className="text-xs text-[#45453F] mt-2 line-clamp-2">{item.quote}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setTestiDraft(item)}
                          className="px-2.5 py-1 text-xs border border-[#D8D8D0] rounded cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSectionItem('/api/admin/testimonials', item.id)}
                          className="p-1.5 text-[#6E6E67] hover:text-[#B92B14] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 5: CHANGE PASSWORD */}
        {tab === 'security' && (
          <section className="max-w-lg bg-white border border-[#E4E4DF] rounded-2xl p-6 sm:p-8 space-y-5">
            <div>
              <h1 className="font-display text-2xl font-semibold">Change Password</h1>
              <p className="text-sm text-[#52524C] mt-1">
                Update your administrator password. Passwords are stored exclusively as bcrypt hashes.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">New Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D0] rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 text-sm font-semibold text-[#111210] bg-[#DFC07C] hover:bg-[#C59B43] rounded-lg cursor-pointer transition-colors"
              >
                {busy ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
