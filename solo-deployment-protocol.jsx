import { useState } from "react";
import StackGuide from "./modern-solo-stack";
import StackComparison from "./stack-comparison";

// ─── DATA ───────────────────────────────────────────────────────────────────

const DIAGNOSIS = {
  verdict: "Over-engineered for your team size",
  summary: "Your current stack was designed for a 10+ person engineering org. As a solo/duo dev, you're carrying ~14 hrs/week of infrastructure overhead that brings zero business value. Every hour debugging Fabric SSH drops, Nginx configs, and Docker layer cache misses is an hour not shipping features.",
  crimes: [
    { icon: "🔧", title: "Fabric SSH deploys", cost: "~20 min/deploy + debugging time when it breaks mid-run" },
    { icon: "🐳", title: "Self-managed Docker on Droplet", cost: "You're a sysadmin. You didn't sign up for this." },
    { icon: "🗄️", title: "Self-hosted MySQL", cost: "Backups, replication, upgrades — all on you" },
    { icon: "🌐", title: "Manual Nginx + Certbot", cost: "SSL renewals, config drift, reverse proxy debugging" },
    { icon: "📦", title: "No monorepo caching", cost: "Full rebuilds every deploy even when nothing changed" },
    { icon: "👁️", title: "No preview environments", cost: "Testing in prod or complex local setup" },
  ]
};

const CURRENT_FLOW = [
  {
    step: "01", label: "Code → Push", time: "0 min", type: "good",
    detail: "git push origin main — this part is fine",
  },
  {
    step: "02", label: "CI Runs Tests", time: "3–6 min", type: "ok",
    detail: "GitHub Actions runs your test suite. No caching = full pip/npm install every time.",
    fix: "Add actions/cache for pip + node_modules → saves 2–4 min/run",
  },
  {
    step: "03", label: "Build Docker Images", time: "4–12 min", type: "bad",
    detail: "Docker builds Django + Next.js images. No BuildKit = no parallel builds. Cache busts on any requirements.txt change.",
    fix: "DOCKER_BUILDKIT=1 + multi-stage Dockerfile → 60% faster",
  },
  {
    step: "04", label: "Push to Registry", time: "2–5 min", type: "bad",
    detail: "Pushing full image layers to DOCR or Docker Hub. Often pushes unchanged layers.",
    fix: "Use DO Container Registry with proper layer caching",
  },
  {
    step: "05", label: "Fabric SSH Deploy", time: "3–8 min", type: "critical",
    detail: "SSH into Droplet, pull image, docker-compose down, docker-compose up. If anything fails mid-step: broken prod, manual recovery.",
    fix: "This entire step should not exist. Replace with Railway/Render.",
  },
  {
    step: "06", label: "Run Migrations", time: "1–3 min", type: "bad",
    detail: "manage.py migrate runs inside the container after it starts. No zero-downtime guarantee. Schema and code can be out of sync during restart.",
    fix: "Pre-deploy migration hooks (Railway/Render support this natively)",
  },
  {
    step: "07", label: "Health Check / Verify", time: "2–5 min", type: "bad",
    detail: "Manual curl or just hoping it worked. No automatic rollback.",
    fix: "Vercel/Railway auto-rollback on failed health check",
  },
];

const MODERN_FLOW = [
  { step: "01", label: "Code → Push", time: "0 min", detail: "Same as before" },
  { step: "02", label: "Turborepo detects changes", time: "5 sec", detail: "Only changed packages are built. Unchanged = pulled from remote cache instantly." },
  { step: "03", label: "CI (parallel)", time: "60–90 sec", detail: "Test + lint + type-check run in parallel. Cached deps = no reinstall." },
  { step: "04", label: "Vercel deploys frontend", time: "30–45 sec", detail: "Automatic. Zero config. Edge network in 100+ regions." },
  { step: "05", label: "Railway deploys API", time: "60–90 sec", detail: "Nixpacks auto-detects Python. Pre-deploy migration hook runs first." },
  { step: "06", label: "Live + verified", time: "0 min", detail: "Automatic health checks. Auto-rollback if unhealthy. Done." },
];

const STACK_COMPARE = [
  {
    category: "Backend",
    current: { name: "Django + Fabric + Docker", pain: "Heavy ORM, manual deploy, sysadmin overhead" },
    modern: { name: "FastAPI + Railway", win: "Auto-deploy, async, 3x faster API, zero infra" },
  },
  {
    category: "Frontend",
    current: { name: "React/Next.js on Droplet", pain: "Manual Nginx, no CDN, no preview URLs" },
    modern: { name: "Next.js 14 on Vercel", win: "45-sec deploys, preview per PR, global edge CDN free" },
  },
  {
    category: "Database",
    current: { name: "MySQL self-hosted", pain: "Backups on you, no autoscale, manual upgrades" },
    modern: { name: "PlanetScale (serverless MySQL)", win: "Same MySQL dialect, autoscales, branching, $0 to start" },
  },
  {
    category: "Deploy",
    current: { name: "Fabric SSH scripts", pain: "Breaks mid-deploy, no rollback, imperative = fragile" },
    modern: { name: "git push → done", win: "Declarative, atomic, auto-rollback, zero SSH" },
  },
  {
    category: "Infra Cost",
    current: { name: "$48–120/mo DO Droplets", pain: "Paying for idle compute 24/7" },
    modern: { name: "$0–20/mo to start", win: "Vercel hobby free, Railway $5/mo, PlanetScale free tier" },
  },
  {
    category: "Scaling",
    current: { name: "Manual Droplet resize", pain: "Downtime, SSH in, resize, restart. Pray." },
    modern: { name: "Automatic", win: "Railway + PlanetScale autoscale with zero action from you" },
  },
];

const MIGRATION_PLAN = [
  {
    week: "Week 1", title: "Zero-Risk Quick Wins", hours: "3–4 hrs", risk: "none",
    tasks: [
      "Add DOCKER_BUILDKIT=1 to your CI env vars",
      "Add actions/cache to GitHub Actions (pip + node_modules)",
      "Switch MySQL to DO Managed Database (~30 min, same connection string)",
      "Add health check endpoint to Django + wire to DO monitoring",
    ],
    saving: "~3 hrs/week immediately",
  },
  {
    week: "Week 2–3", title: "Kill the Droplet Pain", hours: "6–8 hrs", risk: "low",
    tasks: [
      "Deploy Next.js frontend to Vercel (connect GitHub repo, ~10 min)",
      "Update Django CORS settings for new Vercel URL",
      "Point your domain to Vercel — SSL automatic",
      "Remove Nginx from docker-compose (no longer needed for frontend)",
    ],
    saving: "~4 hrs/week, no more Nginx/SSL ever",
  },
  {
    week: "Week 4–5", title: "Replace Fabric with Railway", hours: "4–6 hrs", risk: "medium",
    tasks: [
      "Create Railway project, connect GitHub repo",
      "Move env vars to Railway dashboard",
      "Add railway.toml with pre-deploy: python manage.py migrate",
      "Test deploy pipeline on staging branch",
      "Cut over production, decommission Droplet",
    ],
    saving: "~6 hrs/week, no more SSH deploys ever",
  },
  {
    week: "Week 6–8", title: "Optional: FastAPI Migration", hours: "8–16 hrs", risk: "medium",
    tasks: [
      "Only needed if Django performance is a bottleneck",
      "Keep Django for admin/ORM if you use django-admin heavily",
      "FastAPI for new endpoints alongside Django (strangler fig pattern)",
      "Migrate endpoints incrementally — no big bang rewrite",
    ],
    saving: "Performance + DX improvement, not required for deploy speed",
  },
];

const SAVINGS = {
  perDeploy: { current: 18, modern: 2, unit: "min" },
  weekly: { current: 14, modern: 2, unit: "hrs" },
  monthly: { current: 60, modern: 8, unit: "hrs" },
  yearly: { current: 728, modern: 96, unit: "hrs" },
  infra: { current: 84, modern: 15, unit: "$/mo" },
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const MAIN_TABS = ["Diagnosis", "Deploy Flow", "Stack Swap", "Migration Plan", "Your Numbers", "Stack Comparison"];
const SUB_TABS = ["Diagnosis", "Deploy Flow", "Stack Swap", "Migration Plan", "Your Numbers"];

const tag = (color, text) => (
  <span style={{
    fontSize: 10, letterSpacing: "0.08em", fontWeight: 700,
    padding: "2px 8px", borderRadius: 20,
    background: color + "18", color, border: `1px solid ${color}33`,
  }}>{text}</span>
);

export default function SoloProtocol() {
  const [mainTab, setMainTab] = useState(0);
  const [subTab, setSubTab] = useState(0);
  const [rate, setRate] = useState(65);
  const [deploys, setDeploys] = useState(8);
  const [expanded, setExpanded] = useState(null);

  const weeklyTimeSaved = (14 - 2); // hrs
  const yearlyHrs = weeklyTimeSaved * 52;
  const yearlyMoney = yearlyHrs * rate;
  const infraSaving = (84 - 15) * 12;
  const totalYearly = yearlyMoney + infraSaving;

  const stepColor = (type) => ({
    good: "#22c55e", ok: "#f59e0b", bad: "#f97316", critical: "#ef4444"
  }[type] || "#6366f1");

  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      background: "#07080d",
      minHeight: "100vh",
      color: "#cbd5e1",
    }}>

      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(180deg, #0d0f1c 0%, #07080d 100%)",
        borderBottom: "1px solid #0f172a",
        padding: "28px 36px 0",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#f97316", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              ● SOLO / 2-DEV TEAM · PERSONALIZED ANALYSIS
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(20px, 3.5vw, 30px)", fontWeight: 700, margin: "0 0 4px",
            color: "#f1f5f9", letterSpacing: "-0.03em", lineHeight: 1.2,
          }}>
            You're running a startup<br />
            <span style={{ color: "#f97316" }}>on enterprise infrastructure.</span>
          </h1>
          <p style={{ fontSize: 12, color: "#475569", margin: "8px 0 16px", maxWidth: 540 }}>
            Django + Fabric + Docker + DO Droplet is a 3-engineer stack. Here's your escape plan.
          </p>

          <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
            {MAIN_TABS.map((t, i) => (
              <button key={t} onClick={() => { setMainTab(i); setExpanded(null); }} style={{
                background: "none", border: "none",
                borderBottom: mainTab === i ? "2px solid #f97316" : "2px solid transparent",
                color: mainTab === i ? "#fb923c" : "#475569",
                padding: "8px 16px", cursor: "pointer",
                fontSize: 12, fontFamily: "inherit",
                letterSpacing: "0.04em", marginBottom: -1,
                transition: "color 0.15s",
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 36px" }}>

        {mainTab === 5 && <StackComparison />}

        {mainTab === 0 && subTab === 0 && (
          <>
            <div style={{
              background: "#0d0f1a",
              border: "1px solid #ef444433",
              borderLeft: "3px solid #ef4444",
              borderRadius: 8, padding: "18px 22px", marginBottom: 24,
            }}>
              <div style={{ fontSize: 10, color: "#ef4444", letterSpacing: "0.15em", marginBottom: 8 }}>VERDICT</div>
              <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.7 }}>{DIAGNOSIS.summary}</div>
            </div>

            <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.12em", marginBottom: 14 }}>
              THE 6 THINGS EATING YOUR TIME
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
              {DIAGNOSIS.crimes.map((c, i) => (
                <div key={i} style={{
                  background: "#0d0f1a", border: "1px solid #1e293b",
                  borderRadius: 8, padding: "14px 16px",
                }}>
                  <div style={{ fontSize: 16, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{c.cost}</div>
                </div>
              ))}
            </div>

            <div style={{
              background: "#0d1a0d", border: "1px solid #22c55e22",
              borderLeft: "3px solid #22c55e", borderRadius: 8, padding: "16px 22px",
            }}>
              <div style={{ fontSize: 12, color: "#22c55e", marginBottom: 6, fontWeight: 700 }}>
                THE GOOD NEWS
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
                Your stack is fixable in <strong style={{ color: "#e2e8f0" }}>4 weeks of weekend work</strong>, not a rewrite. 
                You can migrate incrementally — frontend first (lowest risk), then deploy tooling, then database. 
                At no point do you need to rewrite your Django app unless you want to.
              </div>
            </div>
          </>
        )}

        {mainTab === 0 && subTab === 1 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#f97316", letterSpacing: "0.12em", paddingBottom: 10, borderBottom: "1px solid #f9731622" }}>
                YOUR CURRENT DEPLOY (~18 MIN)
              </div>
              <div style={{ fontSize: 11, color: "#22c55e", letterSpacing: "0.12em", paddingBottom: 10, borderBottom: "1px solid #22c55e22" }}>
                MODERN DEPLOY (~2 MIN)
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Current */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {CURRENT_FLOW.map((s, i) => (
                  <div key={i}
                    onClick={() => setExpanded(expanded === `c${i}` ? null : `c${i}`)}
                    style={{
                      background: expanded === `c${i}` ? "#0d0f1a" : "#09090f",
                      border: `1px solid ${expanded === `c${i}` ? stepColor(s.type) + "44" : "#1e293b"}`,
                      borderLeft: `2px solid ${stepColor(s.type)}`,
                      borderRadius: 6, padding: "10px 14px", cursor: "pointer",
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: stepColor(s.type), minWidth: 20 }}>{s.step}</span>
                        <span style={{ fontSize: 12, color: "#e2e8f0" }}>{s.label}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "#64748b" }}>{s.time}</span>
                    </div>
                    {expanded === `c${i}` && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1e293b" }}>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, lineHeight: 1.6 }}>{s.detail}</div>
                        {s.fix && (
                          <div style={{ fontSize: 11, color: "#22c55e", lineHeight: 1.6 }}>
                            <span style={{ opacity: 0.6 }}>Fix: </span>{s.fix}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Modern */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MODERN_FLOW.map((s, i) => (
                  <div key={i}
                    onClick={() => setExpanded(expanded === `m${i}` ? null : `m${i}`)}
                    style={{
                      background: expanded === `m${i}` ? "#0d1a0d" : "#09090f",
                      border: `1px solid ${expanded === `m${i}` ? "#22c55e44" : "#1e293b"}`,
                      borderLeft: "2px solid #22c55e",
                      borderRadius: 6, padding: "10px 14px", cursor: "pointer",
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: "#22c55e", minWidth: 20 }}>{s.step}</span>
                        <span style={{ fontSize: 12, color: "#e2e8f0" }}>{s.label}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "#22c55e" }}>{s.time}</span>
                    </div>
                    {expanded === `m${i}` && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1e293b" }}>
                        <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>{s.detail}</div>
                      </div>
                    )}
                  </div>
                ))}

                <div style={{
                  marginTop: 8, padding: "14px", background: "#0d1a0d",
                  border: "1px solid #22c55e33", borderRadius: 6, textAlign: "center",
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#22c55e" }}>~2 min</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>vs your current ~18 min · 9× faster</div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 12 }}>
              ↑ Click any step to expand details
            </div>
          </>
        )}

        {mainTab === 0 && subTab === 2 && (
          <>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.12em", marginBottom: 16 }}>
              COMPONENT-BY-COMPONENT REPLACEMENT · SAME MySQL DIALECT THROUGHOUT
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {STACK_COMPARE.map((row, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "120px 1fr 1fr",
                  background: "#09090f", border: "1px solid #1e293b",
                  borderRadius: 8, overflow: "hidden",
                }}>
                  <div style={{
                    padding: "16px 14px", background: "#0d0f1a",
                    borderRight: "1px solid #1e293b",
                    display: "flex", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.08em" }}>{row.category}</span>
                  </div>
                  <div style={{ padding: "14px 16px", borderRight: "1px solid #1e293b" }}>
                    <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, marginBottom: 4 }}>{row.current.name}</div>
                    <div style={{ fontSize: 11, color: "#f97316", lineHeight: 1.5 }}>↳ {row.current.pain}</div>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, marginBottom: 4 }}>{row.modern.name}</div>
                    <div style={{ fontSize: 11, color: "#22c55e", lineHeight: 1.5 }}>✓ {row.modern.win}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 20, padding: "16px 20px",
              background: "#0d0f1a", border: "1px solid #6366f133",
              borderRadius: 8, fontSize: 12, color: "#94a3b8", lineHeight: 1.7,
            }}>
              <span style={{ color: "#a5b4fc", fontWeight: 700 }}>Important for solo devs: </span>
              PlanetScale uses the MySQL wire protocol — your Django ORM queries work unchanged. 
              Vercel + Railway both deploy from your existing GitHub repo. 
              <strong style={{ color: "#e2e8f0" }}> You do not need to rewrite anything to get 9× faster deploys.</strong>
            </div>
          </>
        )}

        {mainTab === 0 && subTab === 3 && (
          <>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.12em", marginBottom: 16 }}>
              4-PHASE PLAN · INCREMENTAL · NO BIG-BANG REWRITE · LOWEST RISK FIRST
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {MIGRATION_PLAN.map((phase, i) => (
                <div key={i}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{
                    background: "#09090f", border: "1px solid #1e293b",
                    borderRadius: 8, overflow: "hidden", cursor: "pointer",
                  }}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "auto 1fr auto auto",
                    alignItems: "center", gap: 16,
                    padding: "14px 20px",
                    background: expanded === i ? "#0d0f1a" : "transparent",
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                      color: ["#22c55e","#f59e0b","#f97316","#6366f1"][i],
                      minWidth: 60,
                    }}>{phase.week}</span>
                    <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{phase.title}</span>
                    <span style={{
                      fontSize: 10, color: "#22c55e", background: "#22c55e11",
                      padding: "3px 10px", borderRadius: 20,
                    }}>{phase.saving}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {tag({ none: "#22c55e", low: "#f59e0b", medium: "#f97316" }[phase.risk], phase.risk + " risk")}
                      <span style={{ color: "#475569", fontSize: 14 }}>{expanded === i ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {expanded === i && (
                    <div style={{ padding: "0 20px 16px" }}>
                      <div style={{ fontSize: 10, color: "#475569", marginBottom: 10 }}>
                        EST. TIME: {phase.hours}
                      </div>
                      {phase.tasks.map((task, ti) => (
                        <div key={ti} style={{
                          display: "flex", gap: 10, padding: "7px 0",
                          borderBottom: ti < phase.tasks.length - 1 ? "1px solid #1e293b" : "none",
                        }}>
                          <span style={{ color: ["#22c55e","#f59e0b","#f97316","#6366f1"][i], fontSize: 11, marginTop: 1 }}>→</span>
                          <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{task}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 16, padding: "12px 18px",
              background: "#0d0f1a", border: "1px solid #1e293b",
              borderRadius: 8, fontSize: 11, color: "#64748b", lineHeight: 1.7,
            }}>
              ⚡ Stop after Week 3 if you want. Weeks 1–3 alone give you 90% of the benefit. 
              Week 4 (FastAPI) is optional and only worth it if you need async or Python performance at scale.
            </div>
          </>
        )}

        {mainTab === 0 && subTab === 4 && (
          <>
            {/* Controls */}
            <div style={{
              background: "#0d0f1a", border: "1px solid #1e293b",
              borderRadius: 8, padding: "20px 24px", marginBottom: 24,
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
            }}>
              <div>
                <label style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.12em", display: "block", marginBottom: 10 }}>
                  YOUR HOURLY RATE (USD)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <input type="range" min={25} max={200} step={5} value={rate}
                    onChange={e => setRate(+e.target.value)}
                    style={{ flex: 1, accentColor: "#f97316" }} />
                  <span style={{ fontSize: 24, fontWeight: 700, color: "#fb923c", minWidth: 55 }}>${rate}</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.12em", display: "block", marginBottom: 10 }}>
                  DEPLOYS PER WEEK
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <input type="range" min={1} max={30} step={1} value={deploys}
                    onChange={e => setDeploys(+e.target.value)}
                    style={{ flex: 1, accentColor: "#f97316" }} />
                  <span style={{ fontSize: 24, fontWeight: 700, color: "#fb923c", minWidth: 30 }}>{deploys}</span>
                </div>
              </div>
            </div>

            {/* Big numbers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "SAVED / DEPLOY", value: "16 min", sub: "2 min vs 18 min" },
                { label: "SAVED / WEEK", value: `${weeklyTimeSaved}h`, sub: "infra overhead gone" },
                { label: "SAVED / YEAR", value: `${yearlyHrs}h`, sub: `${(yearlyHrs / 40).toFixed(0)} working weeks` },
                { label: "TOTAL VALUE / YEAR", value: `$${(totalYearly).toLocaleString()}`, sub: "time + infra cost" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "#0d0f1a", border: "1px solid #1e293b",
                  borderRadius: 8, padding: "18px 16px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.12em", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#fb923c", marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Breakdown bars */}
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.12em", marginBottom: 14 }}>
              WHERE YOUR TIME GOES NOW (vs AFTER)
            </div>
            {[
              { task: "Per-deploy overhead", current: 18, modern: 2, unit: "min", mult: deploys, period: "/wk" },
              { task: "Infra debugging (Nginx/Docker/Fabric)", current: 4, modern: 0.5, unit: "hrs", mult: 1, period: "/wk" },
              { task: "DB maintenance (backups, migrations)", current: 2, modern: 0.25, unit: "hrs", mult: 1, period: "/wk" },
              { task: "SSL/domain/config issues", current: 1.5, modern: 0, unit: "hrs", mult: 1, period: "/wk" },
              { task: "Infra cost (servers)", current: 84, modern: 15, unit: "$", mult: 1, period: "/mo" },
            ].map((row, i) => {
              const max = row.current * row.mult;
              const modernVal = row.modern * row.mult;
              const pct = modernVal / max;
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{row.task}</span>
                    <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
                      <span style={{ color: "#f97316" }}>{row.current * row.mult}{row.unit}{row.period}</span>
                      <span style={{ color: "#22c55e" }}>→ {modernVal}{row.unit}{row.period}</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ display: "flex", height: "100%" }}>
                      <div style={{ width: `${pct * 100}%`, background: "#22c55e", transition: "width 0.4s" }} />
                      <div style={{ flex: 1, background: "#f97316" }} />
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{
              marginTop: 20, padding: "16px 20px",
              background: "#0d1a0d", border: "1px solid #22c55e22",
              borderLeft: "3px solid #22c55e", borderRadius: 8,
            }}>
              <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.7 }}>
                <strong style={{ color: "#22c55e" }}>Bottom line for a solo dev at ${rate}/hr:</strong><br />
                The migration takes ~15 hrs of work (spread over a month). 
                You recover that in <strong>Week 1</strong> from faster deploys alone. 
                By month 3 you've saved <strong style={{ color: "#fb923c" }}>${(totalYearly / 4).toLocaleString()}</strong> in time + infra. 
                There is no scenario where staying on Fabric + self-hosted MySQL + Droplet makes financial sense for a team your size.
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
