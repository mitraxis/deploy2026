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

const CUD = {
  complexity: { score: 3, label: "Medium", desc: "Requires database conversion + media migration" },
  urgency: { score: 2, label: "Low", desc: "Your current stack works — no fire to put out" },
  difficulty: { score: 3, label: "Medium", desc: "Django CMS adds complexity vs plain Django" },
};

export default function MigrationGuide() {
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);

  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      background: "#07080d",
      minHeight: "100vh",
      color: "#cbd5e1",
      padding: "28px 36px",
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, color: "#f97316", letterSpacing: "0.2em", marginBottom: 8 }}>
            ● DJANGO CMS ON DIGITALOCEAN → RAILWAY
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px", lineHeight: 1.3 }}>
            Migration Guide
          </h1>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            Step-by-step plan to migrate your Django CMS + Vue frontend from DO Droplet to Railway
          </p>
        </div>

        {/* Complexity */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28,
        }}>
          {[
            { label: "COMPLEXITY", value: CUD.complexity.score, color: "#f97316", desc: CUD.complexity.desc },
            { label: "URGENCY", value: CUD.urgency.score, color: "#22c55e", desc: CUD.urgency.desc },
            { label: "DIFFICULTY", value: CUD.difficulty.score, color: "#f59e0b", desc: CUD.difficulty.desc },
          ].map((c, i) => (
            <div key={i} style={{
              background: "#0d0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: 16,
            }}>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.12em", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: c.color, marginBottom: 4 }}>
                {"●".repeat(c.value)}{"○".repeat(5 - c.value)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Complexity reasons */}
        <div style={{
          background: "#09090f", border: "1px solid #1e293b", borderRadius: 8, padding: "14px 18px", marginBottom: 28,
        }}>
          <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.12em", marginBottom: 12 }}>
            WHY THIS RATING
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {COMPLEXITY.reasons.map((r, i) => (
              <div key={i} style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                <span style={{ color: { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" }[r.impact] }}>●</span>{" "}
                <strong style={{ color: "#e2e8f0" }}>{r.factor}</strong>: {r.detail}
              </div>
            ))}
          </div>
        </div>

        {/* Phases */}
        <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.12em", marginBottom: 16 }}>
          6-PHASE MIGRATION PLAN
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PHASES.map((phase, i) => (
            <div key={i} style={{
              background: "#09090f", border: "1px solid #1e293b", borderRadius: 8, overflow: "hidden",
            }}>
              <div
                onClick={() => setExpandedPhase(expandedPhase === i ? null : i)}
                style={{
                  padding: "14px 18px", cursor: "pointer",
                  background: expandedPhase === i ? "#0d0f1a" : "transparent",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: phase.color, minWidth: 30 }}>{phase.id}</span>
                  <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{phase.title}</span>
                  <span style={{ fontSize: 10, color: "#64748b" }}>{phase.time}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {phase.danger && (
                      <span style={{ fontSize: 10, color: "#ef4444", background: "#ef444411", padding: "2px 8px", borderRadius: 20 }}>
                        !
                      </span>
                    )}
                    <span style={{ fontSize: 14, color: "#475569" }}>{expandedPhase === i ? "▲" : "▼"}</span>
                  </div>
                </div>
                {phase.danger && expandedPhase !== i && (
                  <div style={{ fontSize: 10, color: "#ef4444", marginTop: 8 }}>{phase.danger}</div>
                )}
              </div>

              {expandedPhase === i && (
                <div style={{ padding: "0 18px 18px" }}>
                  {phase.steps.map((step, si) => (
                    <div key={si} style={{
                      marginTop: si > 0 ? 12 : 0,
                      background: "#0d0f1a", border: "1px solid #1e293b", borderRadius: 6, overflow: "hidden",
                    }}>
                      <div
                        onClick={() => setExpandedStep(expandedStep === `${i}-${si}` ? null : `${i}-${si}`)}
                        style={{
                          padding: "10px 14px", cursor: "pointer",
                          borderBottom: expandedStep === `${i}-${si}` ? "1px solid #1e293b" : "none",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{step.title}</span>
                          <span style={{ fontSize: 11, color: "#475569" }}>{expandedStep === `${i}-${si}` ? "−" : "+"}</span>
                        </div>
                      </div>
                      {expandedStep === `${i}-${si}` && (
                        <div style={{ padding: "12px 14px" }}>
                          <pre style={{
                            background: "#07080d", border: "1px solid #1e293b", borderRadius: 4,
                            padding: 12, fontSize: 11, color: "#94a3b8", overflow: "auto", margin: "0 0 10px",
                          }}>{step.code}</pre>
                          <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
                            <span style={{ color: phase.color }}>→</span> {step.note}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div style={{
          marginTop: 28, padding: "16px 20px",
          background: "#0d1a0d", border: "1px solid #22c55e22",
          borderLeft: "3px solid #22c55e", borderRadius: 8,
          fontSize: 11, color: "#94a3b8", lineHeight: 1.7,
        }}>
          <span style={{ color: "#22c55e", fontWeight: 700 }}>Pro tip: </span>
          Do a full dry run on a staging branch first. Deploy to a test Railway project,
          verify everything works, then repeat for production. This adds a few hours but
          eliminates production risk entirely.
        </div>

      </div>
    </div>
  );
}