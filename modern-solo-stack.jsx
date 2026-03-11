import { useState } from "react";

const TABS = ["Railway vs Render", "Supabase vs Django", "Git → Live", "Database Protocol", "SSL & Certs", "Monitoring & Logs"];

const RAILWAY_VS_RENDER = {
  reason: "For a solo dev who wants git push → live with zero config, Railway wins on speed, DX, and flexibility. Render is more stable/predictable for long-running services.",
  compare: [
    { feature: "Deploy speed", railway: "~60–90 sec", render: "~2–4 min", winner: "railway" },
    { feature: "Free tier", railway: "$5 credit/mo then pay-as-you-go", render: "Free static + $7/mo for services", winner: "render" },
    { feature: "Monorepo support", railway: "Native — deploy multiple services from one repo", render: "Manual service config per app", winner: "railway" },
    { feature: "Database hosting", railway: "Postgres, MySQL, Redis built-in", render: "Postgres built-in, others manual", winner: "railway" },
    { feature: "Preview environments", railway: "PR environments with railway up", render: "Auto preview deploys on PRs", winner: "render" },
    { feature: "Logs", railway: "Real-time streaming, searchable", render: "Real-time, 7-day retention free", winner: "tie" },
    { feature: "Custom domains + SSL", railway: "Automatic, instant", render: "Automatic, instant", winner: "tie" },
    { feature: "CLI experience", railway: "Excellent — railway up, railway logs", render: "Decent — render CLI exists", winner: "railway" },
    { feature: "Sleep on inactivity", railway: "No sleep — stays live", render: "Spins down after 15 min idle", winner: "railway" },
    { feature: "Env var management", railway: "Shared vars across services, CLI sync", render: "Per-service, dashboard only", winner: "railway" },
    { feature: "Build caching", railway: "Nixpacks auto-detects + caches", render: "Good native caching", winner: "tie" },
    { feature: "Pricing model", railway: "$0.000463/vCPU-min — pay for usage", render: "Fixed monthly per service", winner: "depends" },
  ],
  railwaySetup: [
    "npm install -g @railway/cli",
    "railway login",
    "cd your-project && railway init",
    "railway up  ← deploys immediately",
    "railway domain  ← get your URL",
    "Link GitHub repo → every push auto-deploys",
  ],
  renderSetup: [
    "Create account at render.com",
    "New → Web Service → Connect GitHub repo",
    "Set build command: pip install -r requirements.txt",
    "Set start command: uvicorn main:app --host 0.0.0.0 --port $PORT",
    "Auto-deploy on push: enabled by default",
    "Custom domain: Settings → Custom Domains → done",
  ],
};

const SUPABASE_VS_DJANGO = {
  summary: "Supabase isn't a replacement for Django — it replaces the infrastructure Django manages. You can use both, or replace Django entirely depending on your use case.",
  supabaseWins: [
    { title: "Auth out of the box", django: "django-allauth + sessions + JWT + 2FA setup = days of work", supabase: "supabase.auth.signUp() — email, OAuth (Google/GitHub/etc), magic links, 2FA — all built in. Zero code.", impact: "high" },
    { title: "Realtime subscriptions", django: "Django Channels + Redis + WebSocket config — complex setup", supabase: "supabase.channel('table').on('INSERT', callback) — live DB updates to browser, zero infra", impact: "high" },
    { title: "Auto-generated REST + GraphQL API", django: "DRF serializers + viewsets + URLs + tests = hours per endpoint", supabase: "Your Postgres schema = instant REST API at /rest/v1/tablename. No code needed.", impact: "high" },
    { title: "Row Level Security (RLS)", django: "Custom queryset filtering per view — easy to get wrong, bypassed in edge cases", supabase: "Postgres RLS policies enforce access at DB level. Unbypassable by design.", impact: "high" },
    { title: "File storage", django: "django-storages + S3/DO Spaces config + signed URLs = setup overhead", supabase: "supabase.storage.upload() — CDN-backed storage with access control built in", impact: "medium" },
    { title: "Edge Functions (Deno)", django: "New endpoint = new view + serializer + URL + possible migration", supabase: "Deploy a TypeScript function in 30 sec. Runs globally at the edge. No server.", impact: "high" },
    { title: "Database branching", django: "N/A — manage migrations manually per environment", supabase: "Create a DB branch per PR, test schema changes safely before merging", impact: "medium" },
    { title: "Built-in dashboard & DB GUI", django: "Django admin (basic) or separate Adminer/pgAdmin setup", supabase: "Full Postgres GUI, query editor, schema visualizer, RLS builder — included", impact: "medium" },
  ],
  djangoWins: [
    "Heavy admin interfaces — Django admin is still best-in-class for content management",
    "Complex business logic needing the Python ecosystem (ML, data processing, pandas, etc.)",
    "Monolithic apps where everything is tightly coupled",
    "Teams already expert in Django — don't migrate just for the sake of it",
    "Complex custom auth flows that don't fit OAuth/email patterns",
  ],
  edgeFunctionUseCases: [
    { name: "Webhooks", detail: "Stripe payments, GitHub events, any third-party webhook" },
    { name: "Custom auth logic", detail: "Validate JWT, check permissions, enrich session on login" },
    { name: "Data transforms", detail: "Aggregate/reshape data before returning to client" },
    { name: "Emails / SMS", detail: "Trigger Resend/SendGrid on DB events without a server" },
    { name: "Scheduled jobs", detail: "Cron-triggered functions — daily reports, cleanup" },
    { name: "AI integrations", detail: "Call OpenAI/Anthropic from the edge without exposing keys" },
  ],
};

const GIT_TO_LIVE = {
  workflows: [
    {
      name: "Railway", deployTime: "60–90 sec", color: "#7c3aed",
      steps: [
        { action: "railway login", detail: "One-time auth setup" },
        { action: "railway link", detail: "Link local repo to Railway project" },
        { action: "git push origin main", detail: "Triggers auto-deploy via GitHub integration" },
        { action: "railway logs --tail", detail: "Watch deploy logs in real time in terminal" },
        { action: "railway open", detail: "Opens live URL in browser" },
      ],
      devEnvSetup: [
        "Create two environments in Railway: production + staging",
        "staging branch → deploys to staging environment automatically",
        "main branch → deploys to production automatically",
        "Each environment has its own URL, env vars, and database",
      ],
    },
    {
      name: "Render", deployTime: "2–4 min", color: "#059669",
      steps: [
        { action: "Connect GitHub repo in dashboard", detail: "One-time setup, then automatic" },
        { action: "git push origin main", detail: "Auto-triggers deploy on every push" },
        { action: "render deploys list", detail: "Check deploy status from CLI" },
        { action: "Preview URL per PR", detail: "Auto-generated, shareable with stakeholders" },
      ],
      devEnvSetup: [
        "render.yaml in repo root defines all services as code",
        "PR opened → Render spins up full-stack preview automatically",
        "Merge to main → production deploy triggered",
        "Env vars in dashboard or render.yaml (use envVarGroups for sharing)",
      ],
    },
  ],
  vscodeSetup: [
    { tool: "Railway VSCode Extension", detail: "Search 'Railway' in the VSCode extensions panel. View deploy status, stream logs, and open your live URL — all without leaving the editor." },
    {
      tool: "GitHub Actions CI before deploy",
      detail: "Run tests automatically before every deploy. If tests fail, the deploy is blocked. Create .github/workflows/deploy.yml:",
      code: `name: Deploy
on:
  push:
    branches: [main, staging]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      - run: pip install -r requirements.txt
      - run: pytest --tb=short`,
    },
    {
      tool: "Branch strategy (no install needed)",
      detail: "A simple convention that gives you safe staging + instant production deploys:",
      bullets: [
        "main → production (auto-deploys to your live site)",
        "staging → staging environment (separate URL + DB for safe testing)",
        "feature/* → open PR → preview environment created automatically",
        "Always push to staging first, merge to main to ship",
      ],
    },
  ],
};

const DATABASE_PROTOCOL = [
  {
    phase: "Schema Changes",
    current: "Edit models.py → makemigrations → migrate → hope it works in prod",
    modern: [
      "Use Alembic (Python) or Prisma (Node) — migrations are version-controlled files checked into git",
      "Never run migrations manually in prod — wire as a pre-deploy hook in railway.toml",
      "railway.toml: startCommand = 'alembic upgrade head && uvicorn main:app ...'",
      "Always test migrations on staging DB before merging to main",
      "Supabase CLI: supabase db diff → auto-generates a migration file from schema changes",
    ],
  },
  {
    phase: "Local ↔ Production Sync",
    current: "Manual mysqldump, scp to server, import — error-prone and slow",
    modern: [
      "Supabase CLI: supabase db pull syncs remote schema down to your local environment",
      "supabase db push sends local schema changes up to remote",
      "Railway: railway connect postgres opens a direct psql session to your prod DB",
      "Never edit production schema directly — always go through migration files",
      "Use DB branches (Supabase) for risky schema changes before applying to prod",
    ],
  },
  {
    phase: "Backups",
    current: "Cron job + mysqldump + manual verification = easy to forget or break",
    modern: [
      "Supabase: automatic daily backups + point-in-time recovery included on Pro plan",
      "Railway Postgres: daily backups included, one-click restore from the dashboard",
      "Add pg_dump to a GitHub Actions workflow on a weekly schedule as a safety net",
      "Test your restores quarterly — an untested backup is not a backup",
    ],
  },
  {
    phase: "Connection Management",
    current: "Direct DB connections from the app — can exhaust the pool under load",
    modern: [
      "Supabase includes Supavisor connection pooler — handles thousands of connections",
      "Railway: always use the internal private network URL for app → DB (not the public URL)",
      "Set pool_size to max 10 in SQLAlchemy/Django for hobby-scale apps",
      "Never commit DATABASE_URL to git — use railway variables or a .env file that's gitignored",
    ],
  },
  {
    phase: "Seeding & Test Data",
    current: "Manual inserts or custom one-off management commands",
    modern: [
      "Supabase: supabase/seed.sql runs automatically on supabase start locally",
      "Create a seed command: python manage.py seed_db for easy local dev resets",
      "Use factories (factory_boy for Python) for test data — never use production data in tests",
      "Seed staging DB from an anonymized production snapshot once a month",
    ],
  },
];

const SSL_CERTS = [
  { platform: "Railway", how: "Add custom domain in dashboard → Railway provisions a Let's Encrypt cert automatically → renews forever. Zero configuration.", time: "2 minutes", cost: "Free" },
  { platform: "Render", how: "Dashboard → Custom Domains → Add domain → cert provisioned in under 60 seconds. Fully automatic renewal.", time: "1 minute", cost: "Free" },
  { platform: "Supabase", how: "Your project URL is always HTTPS by default. Custom domains available on Pro plan with same automatic provisioning.", time: "Automatic", cost: "Free on default URL" },
  { platform: "Cloudflare (recommended)", how: "Point your domain nameservers to Cloudflare → enable Proxied mode → Universal SSL is instant. Also adds DDoS protection and a global CDN for free.", time: "5 min one-time", cost: "Free" },
];

const DNS_STEPS = [
  "Buy your domain → point nameservers to Cloudflare (free account at cloudflare.com)",
  "In Cloudflare: add a CNAME record pointing to your Railway or Render URL",
  "Enable 'Proxied' (orange cloud icon) — SSL + CDN activates instantly",
  "In Railway/Render dashboard: add your custom domain → they verify via Cloudflare",
  "Done. SSL auto-renews forever. Never touch it again.",
];

const MONITORING = {
  quickSetup: [
    { step: 1, action: "Add Sentry to your backend", time: "10 min", priority: "critical" },
    { step: 2, action: "Set up Better Uptime on your domain", time: "5 min", priority: "critical" },
    { step: 3, action: "Connect Axiom to Railway for persistent logs", time: "3 min", priority: "high" },
    { step: 4, action: "Supabase dashboard — already there, nothing to install", time: "0 min", priority: "high" },
    { step: 5, action: "Add Sentry to your frontend (Next.js/React)", time: "15 min", priority: "medium" },
  ],
  tools: [
    {
      tool: "Railway Built-in Logs", category: "Logs", cost: "Free (included)",
      setup: "railway logs --tail  or  Dashboard → Deployments → Logs",
      features: [
        "Real-time streaming logs in your terminal or dashboard",
        "Per-deployment log history with timestamps",
        "Filter logs by service in a monorepo",
      ],
      note: "Logs not persisted beyond 7 days on free tier — pair with Axiom for long-term history",
    },
    {
      tool: "Sentry", category: "Error Tracking", cost: "Free up to 5k errors/month",
      setup: "pip install sentry-sdk  →  3 lines added to settings.py or main.py",
      features: [
        "Captures every unhandled exception with full stack trace and local variables",
        "Groups similar errors together so you're not flooded with duplicates",
        "Email or Slack alert the moment a new error type appears in production",
        "Performance tracing shows which API endpoints are slow",
        "Works for Django/FastAPI backend and React/Next.js frontend",
      ],
      code: `import sentry_sdk
sentry_sdk.init(
    dsn="your-dsn-here",
    traces_sample_rate=0.1,
    environment="production",
)`,
    },
    {
      tool: "Supabase Dashboard", category: "Database Monitoring", cost: "Free (included)",
      setup: "Nothing — open your Supabase project dashboard",
      features: [
        "Query performance insights — see your slowest queries instantly",
        "Connection pool usage and active connection count",
        "Database size and row counts per table",
        "API request logs with response times",
      ],
    },
    {
      tool: "Better Uptime", category: "Uptime Monitoring", cost: "Free tier available",
      setup: "Add your URL at betterstack.com → get email + SMS alerts on downtime",
      features: [
        "Checks your site every 30–60 seconds from multiple global locations",
        "Instant alert if your site goes down — you know before your users do",
        "Public or private status page you can share with users or clients",
        "Response time history and full incident timeline",
      ],
    },
    {
      tool: "Axiom", category: "Log Aggregation", cost: "Free up to 500 GB/month",
      setup: "Railway dashboard → Integrations → Axiom → one-click connect",
      features: [
        "Persistent log storage well beyond Railway's 7-day limit",
        "Full-text search across all your logs instantly",
        "Custom dashboards and threshold-based alerts",
        "One-click setup directly from Railway's integration panel",
      ],
    },
  ],
};

const Badge = ({ color, text }) => (
  <span style={{
    display: "inline-block", fontSize: 11, fontWeight: 600,
    padding: "2px 10px", borderRadius: 20,
    background: color + "18", color, border: `1px solid ${color}40`,
    whiteSpace: "nowrap",
  }}>{text}</span>
);

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
    textTransform: "uppercase", color: "#6b7280",
    marginBottom: 12, marginTop: 2,
  }}>{children}</div>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "#fff", border: "1px solid #e5e7eb",
    borderRadius: 10, padding: 20, ...style,
  }}>{children}</div>
);

const CodeBlock = ({ code }) => (
  <pre style={{
    background: "#1e1b4b", borderRadius: 8, padding: "14px 16px",
    fontSize: 12, color: "#a5b4fc",
    overflowX: "auto", fontFamily: "'Fira Code', 'Courier New', monospace",
    lineHeight: 1.7, margin: "12px 0 0", whiteSpace: "pre",
  }}>{code}</pre>
);

const priorityColor = { critical: "#dc2626", high: "#d97706", medium: "#7c3aed" };

export default function StackGuide() {
  const [tab, setTab] = useState(0);
  const [exp, setExp] = useState(null);

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      background: "#f3f4f6", minHeight: "100vh", color: "#111827",
    }}>

      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "24px 32px 0" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <Badge color="#7c3aed" text="Railway / Render" />
            <Badge color="#059669" text="Supabase" />
            <Badge color="#d97706" text="Auto SSL" />
            <Badge color="#0284c7" text="Monitoring" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Modern Solo Dev Stack
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>
            Railway · Supabase · Auto SSL · git push → live · Sentry · Zero manual ops
          </p>
          <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => { setTab(i); setExp(null); }} style={{
                background: "none", border: "none",
                borderBottom: tab === i ? "2px solid #7c3aed" : "2px solid transparent",
                color: tab === i ? "#7c3aed" : "#6b7280",
                padding: "10px 16px", cursor: "pointer",
                fontSize: 13, fontWeight: tab === i ? 600 : 400,
                fontFamily: "inherit", marginBottom: -1,
                whiteSpace: "nowrap", transition: "color 0.15s",
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 32px" }}>

        {/* TAB 0: Railway vs Render */}
        {tab === 0 && (
          <>
            <Card style={{ marginBottom: 20, borderLeft: "4px solid #7c3aed" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recommendation</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 }}>Railway for backend API · Railway or Render for frontend</div>
              <div style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.7 }}>{RAILWAY_VS_RENDER.reason}</div>
            </Card>

            <Card style={{ padding: 0, marginBottom: 24, overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 56px",
                padding: "10px 20px", background: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
                fontSize: 11, fontWeight: 700, color: "#6b7280",
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                <span>Feature</span><span>Railway</span><span>Render</span><span>Best</span>
              </div>
              {RAILWAY_VS_RENDER.compare.map((row, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 56px",
                  padding: "11px 20px",
                  background: i % 2 ? "#f9fafb" : "#fff",
                  borderBottom: i < RAILWAY_VS_RENDER.compare.length - 1 ? "1px solid #f3f4f6" : "none",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{row.feature}</span>
                  <span style={{ fontSize: 12, color: row.winner === "railway" ? "#059669" : "#6b7280" }}>{row.railway}</span>
                  <span style={{ fontSize: 12, color: row.winner === "render" ? "#059669" : "#6b7280" }}>{row.render}</span>
                  <span style={{ fontSize: 14 }}>{row.winner === "tie" ? "🤝" : row.winner === "depends" ? "⚖️" : row.winner === "railway" ? "🟣" : "🟢"}</span>
                </div>
              ))}
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Railway Quick Start", data: RAILWAY_VS_RENDER.railwaySetup, color: "#7c3aed" },
                { label: "Render Quick Start", data: RAILWAY_VS_RENDER.renderSetup, color: "#059669" },
              ].map(({ label, data, color }) => (
                <Card key={label}>
                  <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>{label}</div>
                  {data.map((line, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < data.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <span style={{ color, fontSize: 12, marginTop: 1, flexShrink: 0, fontFamily: "monospace" }}>$</span>
                      <span style={{ fontSize: 13, color: "#1e40af", fontFamily: "'Fira Code', monospace" }}>{line}</span>
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          </>
        )}

        {/* TAB 1: Supabase vs Django */}
        {tab === 1 && (
          <>
            <Card style={{ marginBottom: 20, borderLeft: "4px solid #059669" }}>
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
                <strong style={{ color: "#059669" }}>Key insight: </strong>{SUPABASE_VS_DJANGO.summary}
              </div>
            </Card>

            <SectionLabel>Where Supabase beats Django for solo devs — click to expand</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {SUPABASE_VS_DJANGO.supabaseWins.map((item, i) => (
                <div key={i} onClick={() => setExp(exp === i ? null : i)} style={{
                  background: "#fff", border: `1px solid ${exp === i ? "#059669" : "#e5e7eb"}`,
                  borderRadius: 10, cursor: "pointer",
                  boxShadow: exp === i ? "0 0 0 3px #05996918" : "none",
                  transition: "all 0.15s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.title}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Badge color={{ high: "#059669", medium: "#d97706", low: "#6b7280" }[item.impact]} text={item.impact + " impact"} />
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>{exp === i ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {exp === i && (
                    <div style={{ padding: "0 18px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Django</div>
                        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{item.django}</div>
                      </div>
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Supabase</div>
                        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{item.supabase}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Card style={{ marginBottom: 20, borderLeft: "4px solid #7c3aed" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Edge Functions — replace most backend endpoints</div>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 14 }}>
                Supabase Edge Functions are Deno (TypeScript) functions that run globally at the edge. Think serverless with instant deploys, global distribution, and no cold starts.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {SUPABASE_VS_DJANGO.edgeFunctionUseCases.map((uc, i) => (
                  <div key={i} style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", marginBottom: 3 }}>{uc.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{uc.detail}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#1e1b4b", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#a5b4fc", fontFamily: "'Fira Code', monospace" }}>
                $ supabase functions deploy my-function  ← live globally in seconds
              </div>
            </Card>

            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>When to keep Django — don't migrate just for the sake of it</div>
              {SUPABASE_VS_DJANGO.djangoWins.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < SUPABASE_VS_DJANGO.djangoWins.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <span style={{ color: "#ea580c", fontSize: 13, flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{w}</span>
                </div>
              ))}
            </Card>
          </>
        )}

        {/* TAB 2: Git to Live */}
        {tab === 2 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {GIT_TO_LIVE.workflows.map((wf, i) => (
                <Card key={i} style={{ borderTop: `3px solid ${wf.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{wf.name}</div>
                    <Badge color={wf.color} text={wf.deployTime} />
                  </div>
                  <SectionLabel>Deploy commands</SectionLabel>
                  {wf.steps.map((s, si) => (
                    <div key={si} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: si < wf.steps.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <span style={{ fontSize: 12, color: wf.color, marginTop: 1, flexShrink: 0, fontFamily: "monospace" }}>$</span>
                      <div>
                        <div style={{ fontSize: 12, color: "#1e40af", fontFamily: "'Fira Code', monospace" }}>{s.action}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.detail}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 16 }}>
                    <SectionLabel>Staging vs Production</SectionLabel>
                    {wf.devEnvSetup.map((line, li) => (
                      <div key={li} style={{ display: "flex", gap: 8, padding: "5px 0" }}>
                        <span style={{ color: "#059669", fontSize: 12, marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{line}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            <SectionLabel>VSCode + Git workflow tools</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {GIT_TO_LIVE.vscodeSetup.map((tool, i) => (
                <Card key={i}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{tool.tool}</div>
                  <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.7 }}>{tool.detail}</div>
                  {tool.bullets && (
                    <div style={{ marginTop: 10 }}>
                      {tool.bullets.map((b, bi) => (
                        <div key={bi} style={{ display: "flex", gap: 8, padding: "4px 0" }}>
                          <span style={{ color: "#7c3aed", fontSize: 12 }}>→</span>
                          <span style={{ fontSize: 13, color: "#374151", fontFamily: "'Fira Code', monospace" }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {tool.code && <CodeBlock code={tool.code} />}
                </Card>
              ))}
            </div>
          </>
        )}

        {/* TAB 3: Database Protocol */}
        {tab === 3 && (
          <>
            <Card style={{ marginBottom: 20, borderLeft: "4px solid #0284c7" }}>
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
                <strong style={{ color: "#0284c7" }}>Recommended DB: </strong>
                Supabase Postgres (with Supavisor pooling) or Railway Postgres. Both give you a dashboard, automatic backups, and CLI access. No more manual mysqldump.
              </div>
            </Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DATABASE_PROTOCOL.map((proto, i) => (
                <div key={i} onClick={() => setExp(exp === `db${i}` ? null : `db${i}`)} style={{
                  background: "#fff", border: `1px solid ${exp === `db${i}` ? "#0284c7" : "#e5e7eb"}`,
                  borderRadius: 10, cursor: "pointer",
                  boxShadow: exp === `db${i}` ? "0 0 0 3px #0284c718" : "none",
                  transition: "all 0.15s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{proto.phase}</span>
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>{exp === `db${i}` ? "▲" : "▼"}</span>
                  </div>
                  {exp === `db${i}` && (
                    <div style={{ padding: "0 18px 16px" }}>
                      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#9a3412" }}>
                        <strong>Current approach:</strong> {proto.current}
                      </div>
                      {proto.modern.map((line, li) => (
                        <div key={li} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: li < proto.modern.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          <span style={{ color: "#0284c7", fontSize: 12, marginTop: 2, flexShrink: 0 }}>→</span>
                          <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{line}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB 4: SSL & Certs */}
        {tab === 4 && (
          <>
            <Card style={{ marginBottom: 20, background: "#f0fdf4", border: "1px solid #bbf7d0", borderLeft: "4px solid #16a34a" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#15803d" }}>✓ You should never need to touch an SSL certificate again after today.</div>
            </Card>

            <SectionLabel>How each platform handles SSL automatically</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              {SSL_CERTS.map((p, i) => (
                <Card key={i} style={{ borderTop: "3px solid #16a34a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{p.platform}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Badge color="#16a34a" text={p.time} />
                      <Badge color="#d97706" text={p.cost} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.7, marginBottom: 8 }}>{p.how}</div>
                  <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 500 }}>Manual work required: none.</div>
                </Card>
              ))}
            </div>

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
                One-time DNS setup — then never touch SSL again
              </div>
              {DNS_STEPS.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "9px 0", borderBottom: i < DNS_STEPS.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: "#fff", background: "#d97706",
                    borderRadius: "50%", width: 22, height: 22,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{step}</span>
                </div>
              ))}
            </Card>

            <div style={{ padding: "14px 18px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, fontSize: 13, color: "#9a3412" }}>
              🗑️ <strong>Gone forever:</strong> Certbot, Let's Encrypt manual renewal, Nginx ssl_certificate configs, and SSH-ing into a server to fix a broken cert at 2am.
            </div>
          </>
        )}

        {/* TAB 5: Monitoring & Logs */}
        {tab === 5 && (
          <>
            <Card style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                Setup in this order — total time: ~33 minutes
              </div>
              {MONITORING.quickSetup.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "9px 0", borderBottom: i < MONITORING.quickSetup.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: "#fff",
                    background: priorityColor[item.priority], borderRadius: "50%",
                    width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{item.step}</span>
                  <span style={{ fontSize: 13, color: "#374151", flex: 1 }}>{item.action}</span>
                  <span style={{ fontSize: 12, color: "#9ca3af", marginRight: 4 }}>{item.time}</span>
                  <Badge color={priorityColor[item.priority]} text={item.priority} />
                </div>
              ))}
            </Card>

            <SectionLabel>Full monitoring stack — click any tool to expand</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MONITORING.tools.map((tool, i) => (
                <div key={i} onClick={() => setExp(exp === `m${i}` ? null : `m${i}`)} style={{
                  background: "#fff", border: `1px solid ${exp === `m${i}` ? "#7c3aed" : "#e5e7eb"}`,
                  borderRadius: 10, cursor: "pointer",
                  boxShadow: exp === `m${i}` ? "0 0 0 3px #7c3aed18" : "none",
                  transition: "all 0.15s",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", alignItems: "center", gap: 10, padding: "13px 18px" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{tool.tool}</span>
                    <Badge color="#7c3aed" text={tool.category} />
                    <Badge color="#059669" text={tool.cost} />
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>{exp === `m${i}` ? "▲" : "▼"}</span>
                  </div>
                  {exp === `m${i}` && (
                    <div style={{ padding: "0 18px 16px" }}>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>SETUP: </span>
                        <span style={{ fontSize: 12, color: "#1e40af", fontFamily: "'Fira Code', monospace" }}>{tool.setup}</span>
                      </div>
                      {tool.features.map((f, fi) => (
                        <div key={fi} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: fi < tool.features.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          <span style={{ color: "#059669", fontSize: 12, marginTop: 1 }}>✓</span>
                          <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{f}</span>
                        </div>
                      ))}
                      {tool.code && <CodeBlock code={tool.code} />}
                      {tool.note && (
                        <div style={{ marginTop: 12, fontSize: 12, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "8px 12px" }}>
                          ⚠ {tool.note}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}