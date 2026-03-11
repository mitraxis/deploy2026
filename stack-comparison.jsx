import { useState } from "react";

// ── DATA ──────────────────────────────────────────────────────────────────

const CURRENT = {
  label: "Current Stack",
  color: "#dc2626",
  accent: "#fef2f2",
  border: "#fecaca",
  components: [
    {
      name: "Frontend",
      tech: "React / Next.js",
      host: "DigitalOcean Droplet",
      pain: [
        "Manual Nginx config as reverse proxy",
        "No automatic preview URLs per PR",
        "SSL via Certbot — manual renewal risk",
        "Deploy = SSH + Fabric script (~18 min)",
        "No global CDN — single server region",
      ],
    },
    {
      name: "Backend",
      tech: "Django",
      host: "DigitalOcean Droplet",
      pain: [
        "Every endpoint = view + serializer + URL + test",
        "Auth setup takes days (django-allauth + JWT)",
        "Fabric SSH deploys break mid-run with no rollback",
        "You manage OS updates, Docker, firewall rules",
        "Scale up = SSH in, resize Droplet, restart, pray",
      ],
    },
    {
      name: "Database",
      tech: "MySQL (self-hosted)",
      host: "Same Droplet",
      pain: [
        "Backups = your cron job, your problem",
        "Migrations run manually — prod/code can desync",
        "No connection pooler — exhausts under load",
        "Single point of failure — DB and app on same server",
        "No GUI — Adminer or raw terminal",
      ],
    },
    {
      name: "File / Image Storage",
      tech: "DigitalOcean Spaces",
      host: "DO Object Storage",
      pain: [
        "No automatic image resizing or optimization",
        "Manual signed URL generation in Django",
        "No built-in CDN transform pipeline",
        "Extra django-storages config and debugging",
        "Cost adds up — storing originals + manual thumbs",
      ],
    },
    {
      name: "Deploy Pipeline",
      tech: "Fabric + GitHub Actions",
      host: "Self-managed",
      pain: [
        "Fabric SSH scripts fail silently mid-deploy",
        "No automatic rollback on failure",
        "Full Docker rebuild every push — no layer cache",
        "~18 min per deploy end-to-end",
        "No staging environment without extra Droplet cost",
      ],
    },
    {
      name: "SSL / Domains",
      tech: "Certbot / Let's Encrypt",
      host: "On Droplet",
      pain: [
        "Manual certbot renew runs via cron",
        "Renewal failures take site down silently",
        "New domain = SSH in, run commands, test",
        "No DDoS protection",
        "No global CDN edge",
      ],
    },
    {
      name: "Monitoring",
      tech: "DO Monitoring + logs",
      host: "Basic alerts only",
      pain: [
        "No error tracking with stack traces",
        "Logs scattered across Docker containers",
        "No uptime alerting unless you set it up separately",
        "No performance tracing",
        "No DB query insights",
      ],
    },
  ],
  metrics: {
    deployTime: "~18 min",
    setupTime: "13–26 hrs",
    infraCost: "$84–120/mo",
    sslWork: "Manual",
    scaling: "Manual resize",
    rollback: "Manual",
    previewEnvs: "No",
  },
};

const MODERN = {
  label: "Modern Stack",
  color: "#16a34a",
  accent: "#f0fdf4",
  border: "#bbf7d0",
  components: [
    {
      name: "Frontend",
      tech: "React / Next.js",
      host: "Railway",
      wins: [
        "git push → live in 60–90 seconds automatically",
        "Automatic preview URL per PR — share before merging",
        "SSL auto-provisioned, auto-renewed, zero config",
        "Nixpacks detects Next.js — no Dockerfile needed",
        "Staging + production environments, each with own URL",
      ],
    },
    {
      name: "Backend",
      tech: "FastAPI + Supabase Edge Functions",
      host: "Railway + Supabase Edge",
      wins: [
        "FastAPI on Railway: git push deploys in ~90 sec",
        "Edge Functions replace 80% of custom endpoints",
        "Supabase auto-generates REST API from your schema",
        "Auth (email, OAuth, magic link, 2FA) = 3 lines of code",
        "Auto-rollback if health check fails after deploy",
      ],
    },
    {
      name: "Database",
      tech: "Supabase Postgres",
      host: "Supabase (managed)",
      wins: [
        "Daily automatic backups + point-in-time recovery",
        "Migrations run as pre-deploy hook — never manual",
        "Supavisor connection pooler handles 10k+ connections",
        "Full GUI: query editor, schema visualizer, RLS builder",
        "DB branching: test schema changes per PR safely",
      ],
    },
    {
      name: "File / Image Storage",
      tech: "Cloudflare Images or DO Spaces",
      host: "Cloudflare / DO CDN",
      wins: [
        "Cloudflare Images: auto-resize, WebP conversion, global CDN",
        "One upload → unlimited variants (thumbnail, medium, full)",
        "DO Spaces: S3-compatible, same API you know, CDN included",
        "No manual signed URL logic — Supabase Storage handles it",
        "Images served from 300+ global edge locations",
      ],
    },
    {
      name: "Deploy Pipeline",
      tech: "Railway GitHub Integration",
      host: "Railway",
      wins: [
        "Connect GitHub repo once → every push auto-deploys",
        "Parallel deploys: frontend + backend deploy simultaneously",
        "Automatic rollback on health check failure",
        "~90 sec total deploy time end-to-end",
        "Free preview environments per PR — no extra cost",
      ],
    },
    {
      name: "SSL / Domains",
      tech: "Railway Auto SSL + Cloudflare",
      host: "Automatic",
      wins: [
        "Add domain in Railway dashboard → SSL in 2 minutes",
        "Cloudflare proxy adds DDoS protection + global CDN free",
        "Auto-renewal forever — you never think about it again",
        "New domain = 4 clicks, no SSH, no commands",
        "Universal SSL across all projects automatically",
      ],
    },
    {
      name: "Monitoring",
      tech: "Sentry + Axiom + Better Uptime",
      host: "SaaS (free tiers)",
      wins: [
        "Sentry: every exception with full stack trace + Slack alert",
        "Axiom: persistent log search, connected to Railway in 3 clicks",
        "Better Uptime: know before users do, SMS + email alerts",
        "Supabase dashboard: DB query insights, connection stats",
        "Railway metrics: CPU/memory/network per service",
      ],
    },
  ],
  metrics: {
    deployTime: "~90 sec",
    setupTime: "3–4 hrs",
    infraCost: "$15–30/mo",
    sslWork: "Automatic",
    scaling: "Automatic",
    rollback: "Automatic",
    previewEnvs: "Yes (free)",
  },
};

const MIGRATION_STEPS = [
  {
    week: "Week 1",
    title: "Zero-risk quick wins",
    time: "3–4 hrs",
    risk: "none",
    color: "#16a34a",
    tasks: [
      { task: "Create Railway account + connect GitHub repo", time: "15 min" },
      { task: "Deploy Next.js frontend to Railway — test the URL", time: "20 min" },
      { task: "Switch MySQL to Railway Postgres or Supabase", time: "45 min" },
      { task: "Set up Cloudflare on your domain — free SSL + CDN", time: "20 min" },
      { task: "Point custom domain to Railway — SSL auto-provisioned", time: "10 min" },
    ],
    saving: "Deploy time drops from 18 min → 90 sec immediately",
  },
  {
    week: "Week 2",
    title: "Kill Fabric + self-managed infra",
    time: "4–6 hrs",
    risk: "low",
    color: "#d97706",
    tasks: [
      { task: "Deploy Django backend to Railway — add railway.toml with migration hook", time: "45 min" },
      { task: "Move all env vars to Railway dashboard (SECRET_KEY, DATABASE_URL, etc.)", time: "20 min" },
      { task: "Delete Fabric scripts + test full deploy from git push", time: "30 min" },
      { task: "Set up Sentry in Django (3 lines) + Better Uptime on your domain", time: "20 min" },
      { task: "Connect Axiom to Railway for persistent logs", time: "5 min" },
    ],
    saving: "Fabric gone. No more SSH. Monitoring active. Decommission Droplet.",
  },
  {
    week: "Week 3",
    title: "Supabase auth + storage",
    time: "4–8 hrs",
    risk: "medium",
    color: "#7c3aed",
    tasks: [
      { task: "Migrate Django auth to Supabase Auth (email + OAuth)", time: "2–3 hrs" },
      { task: "Replace django-storages with Cloudflare Images or Supabase Storage", time: "1–2 hrs" },
      { task: "Set up Supabase RLS policies for your existing tables", time: "1 hr" },
      { task: "Test staging branch → staging environment works end-to-end", time: "30 min" },
    ],
    saving: "Auth, storage, and DB management fully automated.",
  },
  {
    week: "Week 4+",
    title: "Optional: Edge Functions + FastAPI",
    time: "8–16 hrs",
    risk: "medium",
    color: "#0284c7",
    tasks: [
      { task: "Replace heavy Django endpoints with Supabase Edge Functions", time: "Incremental" },
      { task: "Migrate to FastAPI for remaining backend logic (strangler fig pattern)", time: "Incremental" },
      { task: "Add Supabase Realtime to any live-update features", time: "1–2 hrs per feature" },
      { task: "Set up DB branching for schema changes per PR", time: "30 min" },
    ],
    saving: "90% of infra management eliminated. Ship 3–5× faster.",
  },
];

const COST_BREAKDOWN = {
  current: [
    { item: "DO Droplet (app + DB)", cost: 48, type: "compute" },
    { item: "DO Droplet (staging)", cost: 24, type: "compute" },
    { item: "DO Spaces storage", cost: 5, type: "storage" },
    { item: "DO Managed DB (if used)", cost: 15, type: "db" },
    { item: "Your time: deploy overhead", cost: 70, type: "time", note: "@$65/hr, ~1hr/wk" },
    { item: "Your time: infra management", cost: 104, type: "time", note: "@$65/hr, ~1.6hr/wk" },
  ],
  modern: [
    { item: "Railway (frontend + backend)", cost: 10, type: "compute" },
    { item: "Supabase Pro", cost: 25, type: "db" },
    { item: "Cloudflare Images", cost: 5, type: "storage", note: "first 100k images free" },
    { item: "Sentry free tier", cost: 0, type: "monitoring" },
    { item: "Axiom free tier", cost: 0, type: "monitoring" },
    { item: "Better Uptime free tier", cost: 0, type: "monitoring" },
    { item: "Your time: deploy overhead", cost: 8, type: "time", note: "@$65/hr, ~2min/deploy" },
    { item: "Your time: infra management", cost: 13, type: "time", note: "@$65/hr, ~12min/wk" },
  ],
};

// ── HELPERS ────────────────────────────────────────────────────────────────

const Tag = ({ children, color = "#6b7280" }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
    background: color + "15", color, border: `1px solid ${color}35`,
    letterSpacing: "0.04em", whiteSpace: "nowrap",
  }}>{children}</span>
);

const MetricBox = ({ label, current, modern }) => {
  const better = current !== modern;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ padding: "12px 14px", borderRight: "1px solid #f3f4f6" }}>
          <div style={{ fontSize: 10, color: "#dc2626", marginBottom: 3, fontWeight: 600 }}>Current</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>{current}</div>
        </div>
        <div style={{ padding: "12px 14px", background: better ? "#f0fdf4" : "#fff" }}>
          <div style={{ fontSize: 10, color: "#16a34a", marginBottom: 3, fontWeight: 600 }}>Modern</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: better ? "#16a34a" : "#374151" }}>{modern}</div>
        </div>
      </div>
    </div>
  );
};

const TABS = ["Side by Side", "Detailed Breakdown", "Migration Plan", "Cost Analysis"];

export default function StackComparison() {
  const [tab, setTab] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [activeComponent, setActiveComponent] = useState(0);

  const currentTotal = COST_BREAKDOWN.current.reduce((s, i) => s + i.cost, 0);
  const modernTotal = COST_BREAKDOWN.modern.reduce((s, i) => s + i.cost, 0);
  const monthlySaving = currentTotal - modernTotal;
  const yearlySaving = monthlySaving * 12;

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#f8fafc",
      minHeight: "100vh",
      color: "#111827",
    }}>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "32px 32px 0",
        color: "#fff",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <Tag color="#f87171">Django · Fabric · DO Droplet · MySQL</Tag>
            <span style={{ color: "#475569", fontSize: 16, alignSelf: "center" }}>→</span>
            <Tag color="#4ade80">Railway · Supabase · Edge Functions · Cloudflare</Tag>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            Your Stack, Before & After
          </h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 28px" }}>
            A full component-by-component breakdown of what changes, what you save, and how to get there.
          </p>

          {/* Key metrics strip */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1, background: "#334155",
            borderRadius: "10px 10px 0 0", overflow: "hidden",
          }}>
            {[
              { label: "Deploy time", from: "~18 min", to: "~90 sec", delta: "12× faster" },
              { label: "Monthly cost", from: "$266/mo", to: "$61/mo", delta: "Save $205/mo" },
              { label: "Setup time", from: "13–26 hrs", to: "3–4 hrs", delta: "7× less work" },
              { label: "SSL management", from: "Manual", to: "Automatic", delta: "Forever" },
            ].map((m, i) => (
              <div key={i} style={{ background: "#0f172a", padding: "16px 20px" }}>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{m.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, color: "#ef4444", textDecoration: "line-through" }}>{m.from}</span>
                  <span style={{ color: "#475569", fontSize: 11 }}>→</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#4ade80" }}>{m.to}</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{m.delta}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", marginTop: 24, gap: 0 }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => { setTab(i); setExpanded(null); }} style={{
                background: "none", border: "none",
                borderBottom: tab === i ? "2px solid #4ade80" : "2px solid transparent",
                color: tab === i ? "#4ade80" : "#64748b",
                padding: "10px 20px", cursor: "pointer",
                fontSize: 13, fontWeight: tab === i ? 600 : 400,
                fontFamily: "inherit", marginBottom: -1, whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px" }}>

        {/* ── TAB 0: SIDE BY SIDE ── */}
        {tab === 0 && (
          <>
            {/* Component selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {CURRENT.components.map((c, i) => (
                <button key={i} onClick={() => setActiveComponent(i)} style={{
                  background: activeComponent === i ? "#0f172a" : "#fff",
                  border: `1px solid ${activeComponent === i ? "#0f172a" : "#e5e7eb"}`,
                  color: activeComponent === i ? "#fff" : "#374151",
                  borderRadius: 8, padding: "7px 14px", cursor: "pointer",
                  fontSize: 12, fontWeight: activeComponent === i ? 600 : 400,
                  fontFamily: "inherit", transition: "all 0.15s",
                }}>{c.name}</button>
              ))}
            </div>

            {/* Side by side panel */}
            {(() => {
              const cur = CURRENT.components[activeComponent];
              const mod = MODERN.components[activeComponent];
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
                  {/* Current */}
                  <div style={{ background: "#fff", border: "1px solid #fecaca", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ background: "#fef2f2", padding: "16px 20px", borderBottom: "1px solid #fecaca" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Current · {cur.name}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{cur.tech}</div>
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", background: "#fff", padding: "4px 10px", borderRadius: 20, border: "1px solid #fee2e2" }}>{cur.host}</div>
                      </div>
                    </div>
                    <div style={{ padding: "16px 20px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Pain points</div>
                      {cur.pain.map((p, pi) => (
                        <div key={pi} style={{
                          display: "flex", gap: 10, padding: "8px 0",
                          borderBottom: pi < cur.pain.length - 1 ? "1px solid #fef2f2" : "none",
                        }}>
                          <span style={{ color: "#dc2626", fontSize: 14, flexShrink: 0, marginTop: 1 }}>✕</span>
                          <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modern */}
                  <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ background: "#f0fdf4", padding: "16px 20px", borderBottom: "1px solid #bbf7d0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Modern · {mod.name}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{mod.tech}</div>
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", background: "#fff", padding: "4px 10px", borderRadius: 20, border: "1px solid #bbf7d0" }}>{mod.host}</div>
                      </div>
                    </div>
                    <div style={{ padding: "16px 20px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>What you get</div>
                      {mod.wins.map((w, wi) => (
                        <div key={wi} style={{
                          display: "flex", gap: 10, padding: "8px 0",
                          borderBottom: wi < mod.wins.length - 1 ? "1px solid #f0fdf4" : "none",
                        }}>
                          <span style={{ color: "#16a34a", fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                          <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Metrics grid */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Key metrics comparison</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {Object.entries(CURRENT.metrics).map(([key, val]) => (
                <MetricBox
                  key={key}
                  label={key.replace(/([A-Z])/g, " $1").trim()}
                  current={val}
                  modern={MODERN.metrics[key]}
                />
              ))}
            </div>
          </>
        )}

        {/* ── TAB 1: DETAILED BREAKDOWN ── */}
        {tab === 1 && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {CURRENT.components.map((cur, i) => {
                const mod = MODERN.components[i];
                const isOpen = expanded === i;
                return (
                  <div key={i} style={{
                    background: "#fff", border: `1px solid ${isOpen ? "#e5e7eb" : "#e5e7eb"}`,
                    borderRadius: 12, overflow: "hidden",
                    boxShadow: isOpen ? "0 4px 20px rgba(0,0,0,0.08)" : "none",
                    transition: "box-shadow 0.2s",
                  }}>
                    {/* Row header */}
                    <div
                      onClick={() => setExpanded(isOpen ? null : i)}
                      style={{
                        display: "grid", gridTemplateColumns: "200px 1fr 1fr auto",
                        alignItems: "center", gap: 16, padding: "16px 20px",
                        cursor: "pointer", background: isOpen ? "#f9fafb" : "#fff",
                        transition: "background 0.15s",
                      }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{cur.name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Current</div>
                        <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>{cur.tech}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>on {cur.host}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Modern</div>
                        <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>{mod.tech}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>on {mod.host}</div>
                      </div>
                      <div style={{ fontSize: 18, color: "#9ca3af", padding: "0 4px" }}>{isOpen ? "▲" : "▼"}</div>
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #f3f4f6" }}>
                        <div style={{ padding: "20px", borderRight: "1px solid #f3f4f6" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Current pain points</div>
                          {cur.pain.map((p, pi) => (
                            <div key={pi} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: pi < cur.pain.length - 1 ? "1px solid #fef2f2" : "none" }}>
                              <span style={{ color: "#dc2626", fontSize: 13, flexShrink: 0 }}>✕</span>
                              <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{p}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: "20px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Modern improvements</div>
                          {mod.wins.map((w, wi) => (
                            <div key={wi} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: wi < mod.wins.length - 1 ? "1px solid #f0fdf4" : "none" }}>
                              <span style={{ color: "#16a34a", fontSize: 13, flexShrink: 0 }}>✓</span>
                              <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{w}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── TAB 2: MIGRATION PLAN ── */}
        {tab === 2 && (
          <>
            <div style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
              padding: "16px 20px", marginBottom: 24,
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>4-week incremental migration — no big-bang rewrite</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Stop at Week 2 if you want — that alone cuts deploy time 12× and eliminates Droplet maintenance</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Tag color="#16a34a">Lowest risk first</Tag>
                <Tag color="#0284c7">Incremental</Tag>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {MIGRATION_STEPS.map((phase, i) => {
                const isOpen = expanded === `p${i}`;
                return (
                  <div key={i} style={{
                    background: "#fff", border: "1px solid #e5e7eb",
                    borderRadius: 12, overflow: "hidden",
                    boxShadow: isOpen ? "0 4px 20px rgba(0,0,0,0.07)" : "none",
                  }}>
                    <div onClick={() => setExpanded(isOpen ? null : `p${i}`)} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "16px 20px", cursor: "pointer",
                      background: isOpen ? "#f9fafb" : "#fff",
                      borderLeft: `4px solid ${phase.color}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: phase.color, color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, flexShrink: 0,
                        }}>{i + 1}</div>
                        <div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{phase.week} · {phase.time}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{phase.title}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ fontSize: 12, color: phase.color, background: phase.color + "15", padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>
                          {phase.saving}
                        </div>
                        <span style={{ color: "#9ca3af", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ padding: "20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>Tasks</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>Est. Time</div>
                        </div>
                        {phase.tasks.map((t, ti) => (
                          <div key={ti} style={{
                            display: "grid", gridTemplateColumns: "1fr auto",
                            gap: 20, padding: "9px 0",
                            borderBottom: ti < phase.tasks.length - 1 ? "1px solid #f3f4f6" : "none",
                            alignItems: "center",
                          }}>
                            <div style={{ display: "flex", gap: 10 }}>
                              <span style={{ color: phase.color, fontSize: 12, marginTop: 2, flexShrink: 0 }}>→</span>
                              <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{t.task}</span>
                            </div>
                            <div style={{
                              fontSize: 11, color: "#6b7280", background: "#f3f4f6",
                              padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap",
                            }}>{t.time}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: 20, padding: "14px 20px",
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 10, fontSize: 13, color: "#15803d", lineHeight: 1.7,
            }}>
              <strong>Stop at Week 2 if you want.</strong> You get 90% of the benefit: 12× faster deploys, zero Droplet maintenance, automatic SSL, and a monitoring stack. Weeks 3–4 are quality-of-life improvements, not requirements.
            </div>
          </>
        )}

        {/* ── TAB 3: COST ANALYSIS ── */}
        {tab === 3 && (
          <>
            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Current monthly cost", value: `$${currentTotal}/mo`, color: "#dc2626", sub: "infra + time overhead" },
                { label: "Modern monthly cost", value: `$${modernTotal}/mo`, color: "#16a34a", sub: "infra + time overhead" },
                { label: "Monthly saving", value: `$${monthlySaving}/mo`, color: "#7c3aed", sub: `$${yearlySaving.toLocaleString()}/year` },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 12, padding: "20px",
                  borderTop: `3px solid ${s.color}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: s.color, letterSpacing: "-0.03em" }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Breakdown tables side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Current stack", data: COST_BREAKDOWN.current, color: "#dc2626", total: currentTotal },
                { label: "Modern stack", data: COST_BREAKDOWN.modern, color: "#16a34a", total: modernTotal },
              ].map(({ label, data, color, total }) => (
                <div key={label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{
                    padding: "12px 18px", background: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 12, fontWeight: 700, color,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{label}</div>
                  {data.map((item, i) => (
                    <div key={i} style={{
                      display: "grid", gridTemplateColumns: "1fr auto",
                      padding: "10px 18px",
                      background: i % 2 ? "#fafafa" : "#fff",
                      borderBottom: i < data.length - 1 ? "1px solid #f3f4f6" : "none",
                      alignItems: "center", gap: 12,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, color: "#374151" }}>{item.item}</div>
                        {item.note && <div style={{ fontSize: 11, color: "#9ca3af" }}>{item.note}</div>}
                      </div>
                      <div style={{
                        fontSize: 14, fontWeight: 700,
                        color: item.cost === 0 ? "#16a34a" : item.type === "time" ? "#d97706" : "#374151",
                      }}>
                        {item.cost === 0 ? "Free" : `$${item.cost}`}
                      </div>
                    </div>
                  ))}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr auto",
                    padding: "12px 18px", background: "#f9fafb",
                    borderTop: "2px solid #e5e7eb",
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Total / month</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color }}>${total}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bar visualization */}
            <div style={{ marginTop: 24, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 20 }}>Visual breakdown</div>
              {[
                { label: "Infrastructure (servers, DB, storage)", current: 92, modern: 40 },
                { label: "Your time (deploy + infra management)", current: 174, modern: 21 },
              ].map((row, i) => {
                const max = Math.max(row.current, row.modern) * 1.1;
                return (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: "#374151", fontWeight: 500, marginBottom: 10 }}>{row.label}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "#9ca3af", width: 50, textAlign: "right" }}>Now</span>
                      <div style={{ flex: 1, height: 28, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{
                          width: `${(row.current / max) * 100}%`, height: "100%",
                          background: "linear-gradient(90deg, #fca5a5, #ef4444)",
                          display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10,
                          borderRadius: 6, transition: "width 0.4s",
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>${row.current}/mo</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#9ca3af", width: 50, textAlign: "right" }}>After</span>
                      <div style={{ flex: 1, height: 28, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{
                          width: `${(row.modern / max) * 100}%`, height: "100%",
                          background: "linear-gradient(90deg, #86efac, #16a34a)",
                          display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10,
                          borderRadius: 6, transition: "width 0.4s",
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>${row.modern}/mo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{
                marginTop: 16, padding: "12px 16px",
                background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8,
                fontSize: 13, color: "#15803d",
              }}>
                <strong>The biggest saving isn't the servers — it's your time.</strong> At $65/hr, the deploy and infra overhead costs you $174/mo today. The modern stack brings that to $21/mo — a $153/mo saving from time alone.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
