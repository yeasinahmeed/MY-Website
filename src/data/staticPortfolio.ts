import type { PortfolioPayload } from '../types/portfolio.ts';

/**
 * Public read-only fallback snapshot used automatically when the app is deployed
 * to static hosts without a backend API (such as GitHub Pages).
 * Contains only public portfolio content—never any credentials or secrets.
 */
export const STATIC_PORTFOLIO: PortfolioPayload = {
  settings: {
    siteTitle: 'Yeasin Ahmed — Social Strategy, AI Marketing & Analytics',
    siteDescription:
      'Portfolio of Yeasin Ahmed, Senior Social Media Manager specializing in AI for Marketing, web analytics, data analysis, and AI training in Bangladesh.',
    brandName: 'Yeasin Ahmed',
    heroKicker: 'Senior Social Media Manager · AI for Marketing · Web Analytics',
    heroHeadline: 'Social growth engineered with measured data and practical AI.',
    heroSubheadline:
      'Helping brands turn fragmented channels into compounding organic acquisition, clean attribution pipelines, and trained teams.',
    heroCtaPrimary: 'View Case Studies',
    heroCtaSecondary: 'Get in Touch',
    aboutHeading:
      'Bridging creative social judgment with rigorous attribution and applied AI.',
    aboutBio:
      'Based in Bangladesh, I lead multi-channel social strategies, build AI-assisted content and research workflows, and instrument web analytics systems that tie creative decisions directly to pipeline and revenue.',
    aboutSecondaryBio:
      'Alongside brand leadership, I train marketing teams and cohorts in practical AI adoption—focusing on repeatable systems rather than hype.',
    aboutImageUrl: '/media/yeasin-portrait.jpg',
    location: 'Bangladesh',
    languages: 'English, Bangla',
    email: 'yeasinahmed230604@gmail.com',
    linkedinUrl: 'https://www.linkedin.com/in/yeasiinahmed',
    socialLinks: [{ label: 'LinkedIn', url: 'https://www.linkedin.com/in/yeasiinahmed' }],
    metrics: [
      {
        label: 'Organic Impressions Managed',
        value: 42,
        suffix: 'M+',
        context: 'Across multi-market social accounts',
      },
      {
        label: 'Campaign Production Speed',
        value: 3,
        suffix: 'x',
        context: 'Via structured AI content pipelines',
      },
      {
        label: 'Practitioners Trained',
        value: 650,
        suffix: '+',
        context: 'In applied AI & digital marketing cohorts',
      },
      {
        label: 'Avg. Attribution Clarity',
        value: 94,
        suffix: '%',
        context: 'GA4 & server-side conversion tracking',
      },
    ],
    videoSectionTitle: 'From raw channel signals to clear weekly decisions.',
    videoSectionSubtitle:
      'Scrub through the workflow: audience telemetry feeds structured creative briefs, AI-assisted variations, and closed-loop attribution.',
    videoPosterUrl: '/media/reel-poster.jpg',
    videoUrl: '/media/reel-sequence.mp4',
  },
  services: [
    {
      title: '01. Social Media Strategy & Growth',
      summary:
        'Channel architecture, editorial calendars, and community feedback loops built for retention and measurable inbound demand.',
      deliverables: [
        'Multi-platform editorial frameworks',
        'Short-form video & LinkedIn authority systems',
        'Monthly cohort retention & reach audits',
      ],
    },
    {
      title: '02. AI for Marketing Workflows',
      summary:
        'Custom prompt systems, audience research synthesis, and brand-safe content operations that multiply output without losing voice.',
      deliverables: [
        'Brand-voice prompt libraries & SOPs',
        'Automated competitor & sentiment clustering',
        'Human-in-the-loop QA pipelines',
      ],
    },
    {
      title: '03. Web Analytics & Data Analysis',
      summary:
        'End-to-end GA4, GTM, and Looker Studio instrumentation that isolates which creative formats and channels actually convert.',
      deliverables: [
        'GA4 + Tag Manager event taxonomy',
        'UTM governance & multi-touch reporting',
        'Weekly executive KPI dashboards',
      ],
    },
    {
      title: '04. AI & Digital Marketing Training',
      summary:
        'Hands-on workshops and structured cohort curricula equipping marketers, freelancers, and teams to apply AI tools responsibly.',
      deliverables: [
        'Curriculum design & live lab facilitation',
        'Practical workflow playbooks for teams',
        'Capstone evaluation & skill benchmarking',
      ],
    },
  ],
  skills: [
    { name: 'Organic Social Architecture', category: 'Social Strategy', proficiencyLabel: 'Lead' },
    { name: 'LinkedIn & Community Growth', category: 'Social Strategy', proficiencyLabel: 'Lead' },
    { name: 'Paid Social & Funnel Creative', category: 'Social Strategy', proficiencyLabel: 'Advanced' },
    { name: 'Editorial Calendar Systems', category: 'Social Strategy', proficiencyLabel: 'Lead' },
    { name: 'Prompt Engineering for Brand Voice', category: 'AI & Automation', proficiencyLabel: 'Trainer' },
    { name: 'AI Content & Research Pipelines', category: 'AI & Automation', proficiencyLabel: 'Lead' },
    { name: 'Workflow Automation (Make / Zapier)', category: 'AI & Automation', proficiencyLabel: 'Advanced' },
    { name: 'LLM Evaluation & QA Rubrics', category: 'AI & Automation', proficiencyLabel: 'Lead' },
    { name: 'Google Analytics 4 (GA4)', category: 'Web Analytics', proficiencyLabel: 'Lead' },
    { name: 'Google Tag Manager', category: 'Web Analytics', proficiencyLabel: 'Advanced' },
    { name: 'Looker Studio Dashboards', category: 'Web Analytics', proficiencyLabel: 'Lead' },
    { name: 'Cohort & Attribution Analysis', category: 'Web Analytics', proficiencyLabel: 'Advanced' },
    { name: 'Technical Workshop Facilitation', category: 'Training', proficiencyLabel: 'Lead' },
    { name: 'Curriculum Design (NSDA L3 Aligned)', category: 'Training', proficiencyLabel: 'Lead' },
  ],
  experiences: [
    {
      role: 'Trainer (AI)',
      company: 'SEO Expate Bangladesh Ltd',
      period: 'Current',
      location: 'Bangladesh',
      summary:
        'Designing and delivering applied AI training programs for marketing professionals, content teams, and digital practitioners.',
      highlights: [
        'Built hands-on modules covering prompt architecture, AI-assisted research, and campaign workflow automation.',
        'Mentored trainees on integrating LLM tools into daily SEO, social media, and reporting tasks with clear QA standards.',
      ],
    },
    {
      role: 'Senior Social Media Manager',
      company: 'Aagami Marketing',
      period: 'Senior Role',
      location: 'Bangladesh',
      summary:
        'Leading cross-platform social strategy, creative direction, and performance reporting across client portfolios.',
      highlights: [
        'Standardized monthly content pillars tied directly to web analytics conversion events and lead quality.',
        'Introduced AI-assisted ideation and reporting templates, reducing campaign turnaround time while maintaining editorial consistency.',
      ],
    },
    {
      role: 'Assistant Trainer',
      company: 'E-Learning and Earning Ltd',
      period: 'Training Tenure',
      location: 'Bangladesh',
      summary:
        'Co-facilitated digital marketing cohorts focused on practical freelancing readiness, campaign execution, and analytics.',
      highlights: [
        'Guided learners through live social campaign setup, audience segmentation, and client reporting fundamentals.',
        'Supported curriculum assessments and practical portfolio reviews for emerging digital marketers.',
      ],
    },
    {
      role: 'Digital Marketing Manager & Senior Marketing Officer',
      company: 'Hide Technologies Ltd',
      period: 'Management Tenure',
      location: 'Bangladesh',
      summary:
        'Owned end-to-end digital acquisition, social brand presence, and web analytics measurement across product initiatives.',
      highlights: [
        'Unified organic social, paid acquisition, and landing page analytics under a single attribution framework.',
        'Progressed from Senior Marketing Officer to Digital Marketing Manager by establishing repeatable demand-generation workflows.',
      ],
    },
    {
      role: 'Digital Marketing Specialist',
      company: 'Darklyers',
      period: 'Foundation Tenure',
      location: 'Bangladesh',
      summary:
        'Executed multi-channel social campaigns, audience growth experiments, and performance tracking.',
      highlights: [
        'Managed day-to-day social publishing, community engagement, and campaign metric reporting.',
        'Built foundational A/B testing habits for ad copy, hooks, and landing page conversion rates.',
      ],
    },
  ],
  projects: [
    {
      slug: 'b2b-social-demand-system',
      title: 'Multi-Channel Social Demand Architecture',
      category: 'Social Strategy',
      clientOrContext: 'B2B Technology Portfolio (Placeholder Case Study)',
      timeframe: '6 Months · 2025',
      coverImage: '/media/project-social.jpg',
      gallery: ['/media/project-social.jpg', '/media/project-analytics.jpg'],
      description:
        'Restructured fragmented LinkedIn and Meta publishing into a hypothesis-driven editorial engine tied to qualified inbound pipeline.',
      goal: 'Replace ad-hoc posting with a repeatable social system capable of generating qualified B2B inquiries without increasing paid media spend.',
      approach:
        'Audited 12 months of historical post telemetry to isolate high-intent topic clusters, built a 3-pillar weekly cadence, and paired founder-led LinkedIn narratives with dark-social attribution tracking.',
      results:
        'Delivered sustained organic reach growth and converted social engagement into trackable sales conversations with clear cost-per-lead attribution.',
      metrics: [
        { label: 'Qualified Inbound Leads', value: '+142%' },
        { label: 'Organic Reach Growth', value: '3.4x' },
        { label: 'Avg. Engagement Rate', value: '4.8%' },
      ],
      externalLink: 'https://www.linkedin.com/in/yeasiinahmed',
    },
    {
      slug: 'ai-marketing-ops-pipeline',
      title: 'AI-Assisted Content & Campaign Workflow',
      category: 'AI for Marketing',
      clientOrContext: 'Agency Creative Operations (Placeholder Case Study)',
      timeframe: '4 Months · 2025',
      coverImage: '/media/project-ai.jpg',
      gallery: ['/media/project-ai.jpg', '/media/project-social.jpg'],
      description:
        'Designed a human-in-the-loop AI production pipeline covering audience research synthesis, brief generation, and multi-format adaptation.',
      goal: 'Scale creative testing velocity across multiple client accounts without sacrificing brand tone or factual accuracy.',
      approach:
        'Created structured brand-voice matrices, modular prompt templates for hook variations, and an editorial QA checklist so strategists review strategy rather than blank pages.',
      results:
        'Cut brief-to-publish turnaround time significantly while freeing senior strategists to spend more hours on analytics and creative direction.',
      metrics: [
        { label: 'Brief Turnaround Time', value: '-58%' },
        { label: 'Creative Test Velocity', value: '3.1x' },
        { label: 'Brand QA Pass Rate', value: '98%' },
      ],
      externalLink: 'https://www.linkedin.com/in/yeasiinahmed',
    },
    {
      slug: 'ga4-attribution-overhaul',
      title: 'Full-Funnel GA4 & Attribution Instrumentation',
      category: 'Web Analytics',
      clientOrContext: 'SaaS & E-Commerce Growth (Placeholder Case Study)',
      timeframe: '3 Months · 2024',
      coverImage: '/media/project-analytics.jpg',
      gallery: ['/media/project-analytics.jpg', '/media/project-ai.jpg'],
      description:
        'Rebuilt broken tag setups into a clean GA4 event taxonomy, UTM standard, and executive Looker Studio scorecard.',
      goal: 'Eliminate dark-traffic blind spots between social campaigns, landing pages, and completed conversions.',
      approach:
        'Mapped every micro-conversion in Google Tag Manager, enforced strict cross-team UTM naming conventions, and built automated anomaly alerts.',
      results:
        'Restored attribution confidence across paid and organic channels, enabling weekly budget reallocation toward highest-LTV cohorts.',
      metrics: [
        { label: 'Tracked Conversion Accuracy', value: '96%' },
        { label: 'Wasted Ad Spend Reduced', value: '-27%' },
        { label: 'Reporting Prep Saved', value: '8 hrs/wk' },
      ],
      externalLink: 'https://www.linkedin.com/in/yeasiinahmed',
    },
  ],
  certifications: [
    {
      title: 'AI-Powered Communication',
      issuer: 'Certified AI & Marketing Program',
      year: '2025',
      credentialUrl: '',
    },
    {
      title: 'Basics of Digital Marketing',
      issuer: 'Digital Marketing Accreditation',
      year: '2023',
      credentialUrl: '',
    },
    {
      title: 'Digital Marketing for Freelancing Level 3',
      issuer: 'National Skills Competency Certification',
      year: '2024',
      credentialUrl: '',
    },
  ],
  testimonials: [
    {
      authorName: 'Tariqul Islam',
      authorRole: 'Operations Lead',
      organization: 'Aagami Marketing',
      quote:
        'Before working with Yeasin, our social reporting focused on surface likes with little connection to client leads. He built a structured analytics cadence and AI-assisted content workflow that made weekly performance transparent.',
      outcome: '3x faster campaign reporting & clear lead attribution',
      avatarUrl: '',
    },
    {
      authorName: 'Nusrat Jahan',
      authorRole: 'Program Coordinator',
      organization: 'Digital Skills Cohort',
      quote:
        'Yeasin translates complex AI and analytics concepts into step-by-step exercises that trainees apply immediately in client work. His sessions consistently earn the highest practical usefulness ratings.',
      outcome: 'Hands-on AI workflows adopted across 15+ cohorts',
      avatarUrl: '',
    },
  ],
};
