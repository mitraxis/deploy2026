import { useState } from "react";

const COMPLEXITY = {
  verdict: "Medium complexity — 1 to 2 weekends of focused work",
  score: 3,
  reasons: [
    { factor: "Django CMS (not plain Django)", impact: "medium", detail: "Django CMS has extra media file handling, plugin tables, and site framework dependencies that need careful migration" },
    { factor: "MySQL → PostgreSQL conversion", impact: "high", detail: "Django CMS officially recommends Postgres, but you're likely on MySQL on DO — this requires a data conversion step" },
    { factor: "Vue 2.5 frontend", impact: "low", detail: "Static frontend — easiest part. Just a Node.js build deployed to Railway" },
    { factor: "Media files on Droplet", impact: "medium", detail: "Uploaded images/files need moving to DO Spaces or Cloudflare R2 — they can't live on Railway (ephemeral filesystem)" },
    { factor: "Existing Git repo", impact: "low", detail: "You already have source control — Railway connects directly, no setup needed" },
    { factor: "Live site with real data", impact: "medium", detail: "Need a cutover plan so the site stays live during migration — zero downtime is achievable" },
  ],
};

const PHASES = [
  {
    id: "01",
    title: "Audit & Prepare Locally",
    time: "2–3 hrs",
    risk: "none",
    color: "#6366f1",
    danger: null,
    steps: [
      { title: "Check your current database engine", code: "ssh root@your-droplet-ip\npython manage.py shell\n>>> print(settings.DATABASES['default']['ENGINE'])", note: "If already on Postgres, skip Phase 3 entirely." },
      { title: "List all installed packages", code: "pip freeze > requirements-audit.txt\ncat requirements-audit.txt", note: "Check django-cms version (3.x vs 4.x)." },
      { title: "Check media folder size", code: "du -sh /path/to/media/\nls -la /path/to/media/", note: "Media files must go to DO Spaces or R2." },
      { title: "Test local dev environment", code: "git clone your-repo-url\ncd your-project\npython -m venv venv\npip install -r requirements.txt\npython manage.py runserver", note: "Never migrate without a working local copy." },
    ],
  },
  {
    id: "02",
    title: "Set Up Railway Project",
    time: "30 min",
    risk: "none",
    color: "#8b5cf6",
    danger: null,
    steps: [
      { title: "Create Railway project + Postgres", code: "railway login\nrailway init\n# Dashboard: New Project → Database → PostgreSQL", note: "Railway Postgres is fully managed." },
      { title: "Set up DO Spaces for media", code: "# DO Dashboard → Spaces → Create Space\n# Name: your-project-media, Region: same as Droplet\n# Enable CDN, create API keys", note: "Media cannot live on Railway (ephemeral FS)." },
      { title: "Connect GitHub repo", code: "# Dashboard: + Add Service → GitHub Repo\n# Select your repo + branch\n# Turn OFF auto-deploy until ready", note: "Configure all env vars before enabling deploy." },
    ],
  },
  {
    id: "03",
    title: "Database: MySQL → PostgreSQL",
    time: "2–4 hrs",
    risk: "medium",
    color: "#f59e0b",
    danger: "Skip if already on PostgreSQL.",
    steps: [
      { title: "Dump MySQL from Droplet", code: "ssh root@your-droplet-ip\nmysqldump -u user -p db_name --single-transaction > dump.sql\nscp root@droplet:~/dump.sql ./", note: "--single-transaction ensures consistency." },
      { title: "Convert with pgloader", code: "brew install pgloader\npgloader mysql://user:pass@localhost/db \\\n  postgresql://user:pass@localhost/pgdb", note: "Handles Django CMS plugin tables." },
      { title: "Verify converted database", code: "psql pgdb\n\\dt cms_*\nSELECT tablename FROM pg_tables;", note: "Check cms_page, cms_placeholder row counts." },
    ],
  },
  {
    id: "04",
    title: "Update Django Settings",
    time: "1–2 hrs",
    risk: "low",
    color: "#0ea5e9",
    danger: null,
    steps: [
      { title: "Update requirements.txt", code: "# REMOVE: mysqlclient, MySQL-python\n# ADD:\npsycopg2-binary>=2.9\ndj-database-url>=2.0\nwhitenoise>=6.6\ndjango-storages[s3]>=1.14\nboto3>=1.34", note: "Keep all django-cms packages unchanged." },
      { title: "Update settings.py", code: "import dj_database_url\nDATABASES = {'default': dj_database_url.config(default=os.environ.get('DATABASE_URL'))}\nALLOWED_HOSTS = ['localhost', '.railway.app', 'yourdomain.com']\nMIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')\nSTATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'\n# For DO Spaces:\nINSTALLED_APPS += ['storages']\nDEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'", note: "Most critical phase — test locally first." },
      { title: "Add env vars in Railway", code: "# Railway Dashboard → Variables:\nDATABASE_URL (auto-set)\nDJANGO_SECRET_KEY (generate new)\nDEBUG=False\nDO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_BUCKET", note: "Never commit secrets to git." },
    ],
  },
  {
    id: "05",
    title: "Test Deploy on Railway",
    time: "1 hr",
    risk: "low",
    color: "#22c55e",
    danger: null,
    steps: [
      { title: "First deploy", code: "# Enable auto-deploy in Railway\n# Watch the deploy log\n# If fails: check gunicorn start command", note: "First deploy may fail — check logs." },
      { title: "Run migrations", code: "# Railway Dashboard → Deploy → Run Command:\npython manage.py migrate", note: "Or add pre-deploy hook in railway.toml." },
      { title: "Create superuser", code: "# Railway → Deploy → Run Command:\npython manage.py createsuperuser", note: "Need this to test CMS admin." },
      { title: "Test in browser", code: "# Visit: https://your-project.railway.app\n# Login to /admin\n# Check cms pages load\n# Upload test image → verify it appears in DO Spaces", note: "Test all critical user flows." },
    ],
  },
  {
    id: "06",
    title: "Cutover Production",
    time: "1–2 hrs",
    risk: "medium",
    color: "#ef4444",
    danger: "Plan for minimal downtime.",
    steps: [
      { title: "Final data sync", code: "# Put site in maintenance mode on Droplet\n# Final mysqldump → pgloader\n# Verify row counts match", note: "Do this during low-traffic hours." },
      { title: "Point domain to Railway", code: "# DNS: Update A record to Railway IP\n# Or: Add custom domain in Railway → verify DNS", note: "DNS propagation takes ~5 min." },
      { title: "Verify production", code: "# Test live site\n# Test CMS admin\n# Test image uploads → DO Spaces\n# Check SSL cert (automatic)", note: "Keep Droplet running 1 week as backup." },
      { title: "Decommission Droplet", code: "# After 1 week of stable operation:\n# Backup final MySQL dump\n# Delete Droplet\n# Cancel old DO managed DB", note: "Only after confident in migration." },
    ],
  },
];

const GOTCHAS = [
  { title: "Django CMS Sites Framework", severity: "critical", detail: "Django CMS stores your domain in the django_site table. Update it immediately after restore.", fix: "UPDATE django_site SET domain='yournewdomain.com' WHERE id=1;" },
  { title: "CSRF Trusted Origins", severity: "critical", detail: "Without CSRF_TRUSTED_ORIGINS, admin login fails with 403.", fix: "CSRF_TRUSTED_ORIGINS = ['https://*.railway.app', 'https://yourdomain.com']" },
  { title: "Media on ephemeral FS", severity: "critical", detail: "Railway FS wiped on deploy. Media MUST go to DO Spaces.", fix: "django-storages + boto3 + DO Spaces" },
  { title: "collectstatic before deploy", severity: "high", detail: "Admin static files missing if collectstatic skipped.", fix: "Include in startCommand" },
];

const CHECKLIST = {
  before: ["Audit DB engine", "Check Django CMS version", "Measure media size", "Verify local dev", "Create Railway account", "Create DO Spaces", "Backup Droplet"],
  during: ["Railway Postgres created", "requirements.txt updated", "settings.py updated", "Procfile created", "Health check added", "DB dumped", "DB restored", "django_site updated", "Env vars set", "Media synced", "Deploy OK", "Admin works"],
  after: ["Custom domain added", "DNS updated", "SSL works", "24hrs stable", "Snapshot taken", "Droplet off"],
};

const TABS = ["Overview", "Step-by-Step", "Gotchas", "Checklist"];

const severityColors = { critical: "#dc2626", high: "#d97706", medium: "#7c3aed", low: "#16a34a" };
const severityBg = { critical: "#fef2f2", high: "#fffbeb", medium: "#faf5ff", low: "#f0fdf4" };
const severityBorder = { critical: "#fecaca", high: "#fde68a", medium: "#e9d5ff", low: "#bbf7d0" };

export default function InpulsMigrationGuide() {
  const [tab, setTab] = useState(0);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheck = (key) => setCheckedItems(s => ({ ...s, [key]: !s[key] }));

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#f8fafc", minHeight: "100vh", color: "#111827",
    }}>

      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "24px 32px 0" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }}>
              Django CMS + Vue 2.5 + DO Droplet
            </span>
            <span style={{ color: "#9ca3af", fontSize: 18 }}>→</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}>
              Railway (Front + Back) + DO Spaces
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Inpuls Migration Guide
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>
            Complete step-by-step — including database transfer, media files, DNS cutover, and Django CMS gotchas
          </p>
          <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} style={{
                background: "none", border: "none",
                borderBottom: tab === i ? "2px solid #6366f1" : "2px solid transparent",
                color: tab === i ? "#6366f1" : "#6b7280",
                padding: "10px 18px", cursor: "pointer",
                fontSize: 13, fontWeight: tab === i ? 600 : 400,
                fontFamily: "inherit", marginBottom: -1, whiteSpace: "nowrap",
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 32px" }}>

        {/* TAB 0: OVERVIEW */}
        {tab === 0 && (
          <>
            <div style={{
              background: "#fff", border: "1px solid #e5e7eb",
              borderLeft: "4px solid #6366f1", borderRadius: 12,
              padding: "20px 24px", marginBottom: 24,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Complexity Assessment</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{COMPLEXITY.verdict}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ width: 28, height: 10, borderRadius: 3, background: i <= COMPLEXITY.score ? "#6366f1" : "#e5e7eb" }} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>What makes this migration complex</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
              {COMPLEXITY.reasons.map((r, i) => (
                <div key={i} style={{
                  background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 10, padding: "14px 18px",
                  display: "flex", alignItems: "flex-start", gap: 14,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", marginTop: 1,
                    background: severityBg[r.impact], color: severityColors[r.impact], border: `1px solid ${severityBorder[r.impact]}`,
                  }}>{r.impact}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{r.factor}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{r.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Migration phases at a glance</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {PHASES.map((phase, i) => (
                <div key={i} style={{
                  background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 10, padding: "14px 16px",
                  borderTop: `3px solid ${phase.color}`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: phase.color, marginBottom: 4, letterSpacing: "0.06em" }}>PHASE {phase.id}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{phase.title}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>⏱ {phase.time}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB 1: STEP BY STEP */}
        {tab === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PHASES.map((phase, pi) => {
              const isPhaseOpen = expandedPhase === pi;
              return (
                <div key={pi} style={{
                  background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 12, overflow: "hidden",
                  boxShadow: isPhaseOpen ? "0 4px 24px rgba(0,0,0,0.07)" : "none",
                }}>
                  <div
                    onClick={() => setExpandedPhase(isPhaseOpen ? null : pi)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "16px 20px", cursor: "pointer",
                      background: isPhaseOpen ? "#fafafa" : "#fff",
                      borderLeft: `4px solid ${phase.color}`,
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: phase.color, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 800, flexShrink: 0,
                      }}>{phase.id}</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{phase.title}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>⏱ {phase.time}</div>
                      </div>
                    </div>
                    <span style={{ color: "#9ca3af", fontSize: 16 }}>{isPhaseOpen ? "▲" : "▼"}</span>
                  </div>

                  {isPhaseOpen && (
                    <div style={{ padding: "0 20px 20px" }}>
                      {phase.danger && (
                        <div style={{
                          margin: "14px 0", padding: "10px 14px",
                          background: "#fffbeb", border: "1px solid #fde68a",
                          borderRadius: 8, fontSize: 13, color: "#92400e",
                        }}>
                          ⚠ <strong>Skip condition:</strong> {phase.danger}
                        </div>
                      )}

                      {phase.steps.map((step, si) => {
                        const stepKey = `${pi}-${si}`;
                        const isStepOpen = expandedStep === stepKey;
                        return (
                          <div key={si} style={{
                            marginTop: 10,
                            border: `1px solid ${isStepOpen ? "#6366f1" : "#f3f4f6"}`,
                            borderRadius: 8, overflow: "hidden",
                          }}>
                            <div
                              onClick={() => setExpandedStep(isStepOpen ? null : stepKey)}
                              style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "11px 16px", cursor: "pointer",
                                background: isStepOpen ? "#f5f3ff" : "#fafafa",
                              }}>
                              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <span style={{
                                  width: 22, height: 22, borderRadius: "50%",
                                  background: phase.color + "20", color: phase.color,
                                  fontSize: 11, fontWeight: 700,
                                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>{si + 1}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{step.title}</span>
                              </div>
                              <span style={{ color: "#9ca3af", fontSize: 12 }}>{isStepOpen ? "▲" : "▼"}</span>
                            </div>

                            {isStepOpen && (
                              <div style={{ padding: "0 16px 16px" }}>
                                <pre style={{
                                  background: "#1e1b4b", borderRadius: 8,
                                  padding: "14px 16px", fontSize: 11,
                                  color: "#a5b4fc", overflowX: "auto",
                                  fontFamily: "'Fira Code', 'Courier New', monospace",
                                  lineHeight: 1.7, margin: "12px 0",
                                  whiteSpace: "pre",
                                }}>{step.code}</pre>
                                <div style={{
                                  padding: "10px 14px",
                                  background: "#f0f9ff", border: "1px solid #bae6fd",
                                  borderRadius: 8, fontSize: 13, color: "#0369a1",
                                  lineHeight: 1.6,
                                }}>
                                  💡 {step.note}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: GOTCHAS */}
        {tab === 2 && (
          <>
            <div style={{
              background: "#fff", border: "1px solid #fecaca",
              borderLeft: "4px solid #dc2626", borderRadius: 12,
              padding: "14px 20px", marginBottom: 20,
              fontSize: 13, color: "#374151", lineHeight: 1.7,
            }}>
              <strong style={{ color: "#dc2626" }}>These are the real failure points</strong> — things that work fine on your Droplet but silently break after migrating. Read these before you start.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {GOTCHAS.map((g, i) => (
                <div key={i} style={{
                  background: severityBg[g.severity],
                  border: `1px solid ${severityBorder[g.severity]}`,
                  borderLeft: `4px solid ${severityColors[g.severity]}`,
                  borderRadius: 12, padding: "18px 20px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{g.title}</div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: severityColors[g.severity] + "20",
                      color: severityColors[g.severity],
                      border: `1px solid ${severityColors[g.severity]}40`,
                      whiteSpace: "nowrap", marginLeft: 12,
                    }}>{g.severity}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 10 }}>{g.detail}</div>
                  <div style={{
                    background: "#1e1b4b", borderRadius: 6,
                    padding: "8px 12px", fontSize: 11,
                    color: "#a5b4fc", fontFamily: "'Fira Code', 'Courier New', monospace",
                    lineHeight: 1.6,
                  }}>
                    Fix: {g.fix}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB 3: CHECKLIST */}
        {tab === 3 && (
          <>
            {[
              { title: "Before you start", items: CHECKLIST.before, prefix: "before", color: "#6366f1" },
              { title: "During migration", items: CHECKLIST.during, prefix: "during", color: "#f59e0b" },
              { title: "After cutover", items: CHECKLIST.after, prefix: "after", color: "#16a34a" },
            ].map(({ title, items, prefix, color }) => {
              const done = items.filter((_, i) => checkedItems[`${prefix}-${i}`]).length;
              return (
                <div key={prefix} style={{
                  background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 12, overflow: "hidden", marginBottom: 20,
                }}>
                  <div style={{
                    padding: "14px 20px", background: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", borderLeft: `3px solid ${color}`, paddingLeft: 10 }}>{title}</div>
                    <div style={{ fontSize: 12, color: done === items.length ? "#16a34a" : "#9ca3af", fontWeight: 600 }}>
                      {done}/{items.length} complete
                    </div>
                  </div>
                  <div style={{ padding: "8px 20px 16px" }}>
                    {items.map((item, i) => {
                      const key = `${prefix}-${i}`;
                      const checked = !!checkedItems[key];
                      return (
                        <div
                          key={i}
                          onClick={() => toggleCheck(key)}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 12,
                            padding: "9px 0", cursor: "pointer",
                            borderBottom: i < items.length - 1 ? "1px solid #f9fafb" : "none",
                            opacity: checked ? 0.6 : 1, transition: "opacity 0.15s",
                          }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                            border: `2px solid ${checked ? color : "#d1d5db"}`,
                            background: checked ? color : "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s",
                          }}>
                            {checked && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                          </div>
                          <span style={{
                            fontSize: 13, color: "#374151", lineHeight: 1.5,
                            textDecoration: checked ? "line-through" : "none",
                          }}>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}