import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const NAV_LINKS = ["Features", "How It Works", "Pricing", "Testimonials", "Contact"];

const FEATURES = [
  {
    icon: "✂️",
    title: "AI Auto Clipping",
    desc: "Upload any long video and our AI finds the most viral, high-engagement moments — automatically cut into perfect 9:16 clips ready for Shorts, Reels & TikTok.",
    color: "#6366f1",
    tag: "Most Popular"
  },
  {
    icon: "📅",
    title: "Content Scheduler",
    desc: "Plan, write, and auto-publish your posts across Twitter, LinkedIn, and YouTube from one clean calendar view. Never miss a posting day again.",
    color: "#10b981",
    tag: ""
  },
  {
    icon: "🎬",
    title: "Browser Video Editor",
    desc: "Trim, cut, and polish your videos directly in the browser — no downloads, no Premiere Pro, no friction. Export in one click.",
    color: "#f59e0b",
    tag: ""
  },
  {
    icon: "✍️",
    title: "Script Studio",
    desc: "AI-powered script writer trained on viral content. Generate hooks, outlines, and full scripts for YouTube, podcasts, and short-form content in seconds.",
    color: "#ec4899",
    tag: ""
  },
  {
    icon: "🤝",
    title: "Brand Deals CRM",
    desc: "Track every sponsorship, manage deal stages, log emails, and see your total pipeline value. Your agent-level deal management, built right in.",
    color: "#8b5cf6",
    tag: ""
  },
  {
    icon: "📊",
    title: "Analytics Dashboard",
    desc: "See your scheduled posts, pipeline value, and audience growth at a glance. Know exactly where your creator business stands today.",
    color: "#06b6d4",
    tag: ""
  },
  {
    icon: "💼",
    title: "Media Kit Builder",
    desc: "Generate a stunning, shareable media kit with your stats, niche, and rates. Send brands a professional link — not a PDF.",
    color: "#f97316",
    tag: ""
  },
  {
    icon: "🚀",
    title: "YouTube Studio",
    desc: "Manage uploads, view channel stats, and auto-upload AI clips directly to YouTube Shorts — all without leaving Creator OS.",
    color: "#ef4444",
    tag: ""
  },
  {
    icon: "🤖",
    title: "AI Tools Suite",
    desc: "Caption generator, hashtag optimizer, thumbnail ideas, repurposing engine — a full AI creative toolkit built for creators who move fast.",
    color: "#14b8a6",
    tag: ""
  },
];

const STEPS = [
  { step: "01", title: "Upload Your Video", desc: "Drop any long-form video — podcast, stream, YouTube video — and let our AI do the heavy lifting." },
  { step: "02", title: "AI Finds Viral Moments", desc: "Groq-powered AI transcribes your audio and identifies the highest-engagement clips worth sharing." },
  { step: "03", title: "Edit & Customize", desc: "Review AI-suggested titles, descriptions, hashtags. Tweak or publish as-is — your choice." },
  { step: "04", title: "Auto-Upload to YouTube", desc: "One click sends your clips straight to YouTube Shorts with captions, tags, and privacy settings set automatically." },
];

const PLANS = [
  {
    name: "Solo",
    price: "$19",
    period: "/month",
    desc: "Perfect for independent creators just getting started.",
    features: [
      "AI Auto Clipping (10 videos/mo)",
      "Content Scheduler",
      "Script Studio",
      "Media Kit Builder",
      "Brand Deals CRM (up to 10 deals)",
      "Analytics Dashboard",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$39",
    period: "/month",
    desc: "For creators serious about growing their brand.",
    features: [
      "Everything in Solo",
      "Unlimited AI Clipping",
      "YouTube Auto-Upload",
      "Browser Video Editor",
      "AI Tools Suite",
      "Priority Support",
      "Unlimited Brand Deals",
    ],
    cta: "Get Pro",
    highlight: true,
  },
  {
    name: "Agency",
    price: "$99",
    period: "/month",
    desc: "Manage multiple creators under one roof.",
    features: [
      "Everything in Pro",
      "Up to 10 Creator Accounts",
      "Agency Analytics",
      "Team Scheduling",
      "White-label Media Kits",
      "Dedicated Support",
    ],
    cta: "Contact Us",
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Aria Chen",
    handle: "@ariamakes",
    avatar: "AC",
    color: "#6366f1",
    text: "Creator OS replaced 4 different tools I was paying for. The auto-clipping alone saves me 6 hours a week. This is the future of creator workflows.",
    role: "YouTube Creator · 280K subs"
  },
  {
    name: "Marcus Webb",
    handle: "@marcuswebb",
    avatar: "MW",
    color: "#10b981",
    text: "The Brand Deals CRM is insane. I used to track everything in Notion. Now I have a real pipeline view, deal stages, and my total earnings at a glance.",
    role: "Podcast Host · 50K listeners"
  },
  {
    name: "Zara Ahmed",
    handle: "@zaracreates",
    avatar: "ZA",
    color: "#f59e0b",
    text: "I uploaded a 2-hour stream and got 9 ready-to-post Shorts in under 10 minutes. The AI titles were better than what I would have written myself.",
    role: "Twitch Streamer · 95K followers"
  },
];

const FAQS = [
  { q: "Do I need any technical skills?", a: "None at all. If you can upload a video, you can use Creator OS. Everything is designed for creators, not engineers." },
  { q: "Does AI auto-upload work with my YouTube?", a: "Yes! Connect YouTube once in Settings and all your AI-generated clips get uploaded directly to YouTube Shorts with titles, descriptions, and hashtags." },
  { q: "Can I cancel anytime?", a: "Absolutely. No contracts, no lock-in. Cancel with one click from your account settings anytime." },
  { q: "What video formats are supported?", a: "MP4, MOV, AVI, MKV — most common formats work. We use ffmpeg under the hood for rock-solid processing." },
  { q: "How is this different from Opus Clip?", a: "Opus Clip does clipping only and charges $29-49/mo. Creator OS includes clipping PLUS scheduling, CRM, video editor, media kit, script writer and more — starting at $19/mo." },
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ fontFamily: "'Syne', 'DM Sans', sans-serif", background: "#0a0a0f", color: "#f0f0f5", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .glow { box-shadow: 0 0 60px rgba(99,102,241,0.15); }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .hero-animate { animation: fadeUp 0.8s ease forwards; }
        .hero-animate-2 { animation: fadeUp 0.8s 0.15s ease both; }
        .hero-animate-3 { animation: fadeUp 0.8s 0.3s ease both; }
        .hero-animate-4 { animation: fadeUp 0.8s 0.45s ease both; }

        .float { animation: float 4s ease-in-out infinite; }

        .shimmer-text {
          background: linear-gradient(90deg, #a5b4fc, #818cf8, #c4b5fd, #818cf8, #a5b4fc);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .card-hover {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }

        .nav-link {
          color: #9ca3af;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
          cursor: pointer;
        }
        .nav-link:hover { color: #f0f0f5; }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .btn-outline {
          background: transparent;
          color: #f0f0f5;
          border: 1px solid rgba(255,255,255,0.15);
          padding: 14px 28px;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-outline:hover { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); }

        .grid-noise {
          background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        .section { padding: 100px 24px; max-width: 1100px; margin: 0 auto; }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.3);
          color: #a5b4fc;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 100px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        input, textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 12px 16px;
          color: #f0f0f5;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus, textarea:focus { border-color: rgba(99,102,241,0.6); }
        input::placeholder, textarea::placeholder { color: #4b5563; }

        .faq-item { border-bottom: 1px solid rgba(255,255,255,0.06); }

        .plan-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 36px 30px;
          flex: 1;
          min-width: 260px;
          transition: all 0.25s;
        }
        .plan-card.highlight {
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
          border-color: rgba(99,102,241,0.4);
          box-shadow: 0 0 60px rgba(99,102,241,0.1);
          position: relative;
        }

        @media (max-width: 768px) {
          .section { padding: 70px 20px; }
          .plans-row { flex-direction: column !important; }
          .hero-title { font-size: 44px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "16px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(10,10,15,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16
          }}>⚡</div>
          <span style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>
            Creator <span style={{ color: "#818cf8" }}>OS</span>
          </span>
        </div>

        <div className="nav-links" style={{ display: "flex", gap: 32 }}>
          {NAV_LINKS.map(l => (
            <span key={l} className="nav-link" onClick={() => scrollTo(l.toLowerCase().replace(" ", "-"))}>
              {l}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/login" style={{ textDecoration: "none" }}>
            <button className="btn-outline" style={{ padding: "10px 20px", fontSize: 14 }}>Log In</button>
          </Link>
          <Link to="/login?tab=signup" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ padding: "10px 20px", fontSize: 14 }}>Get Started Free</button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="hero" className="grid-noise" style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "140px 24px 100px",
        position: "relative", overflow: "hidden",
      }}>
        {/* bg orbs */}
        <div style={{ position: "absolute", top: "15%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="tag hero-animate">⚡ The All-in-One Creator Platform</div>

        <h1 className="hero-animate-2 hero-title" style={{
          fontSize: 72, fontWeight: 800, lineHeight: 1.05,
          letterSpacing: "-2px", maxWidth: 820, marginBottom: 24,
        }}>
          Everything a Creator Needs,{" "}
          <span className="shimmer-text">In One Place.</span>
        </h1>

        <p className="hero-animate-3" style={{
          fontSize: 18, color: "#9ca3af", maxWidth: 560,
          lineHeight: 1.7, marginBottom: 40, fontFamily: "DM Sans",
        }}>
          AI-powered clipping, content scheduling, brand deal CRM, video editor, script writer, and YouTube auto-upload — built for creators who are serious about growth.
        </p>

        <div className="hero-animate-4" style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 60 }}>
          <Link to="/login?tab=signup" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ fontSize: 16, padding: "16px 32px" }}>
              Start for Free <span>→</span>
            </button>
          </Link>
          <button className="btn-outline" style={{ fontSize: 16, padding: "16px 32px" }} onClick={() => scrollTo("how-it-works")}>
            See How It Works
          </button>
        </div>

        {/* Hero mockup card */}
        <div className="float" style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24, padding: "24px 28px",
          maxWidth: 680, width: "100%",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }} />
            <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280", fontFamily: "DM Sans" }}>creatoros.io — Auto Clipping</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {["🎯 Viral Moment #1", "🔥 Best Hook", "💡 Key Insight"].map((clip, i) => (
              <div key={i} style={{
                background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 12, padding: "14px 12px", textAlign: "center",
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{clip.split(" ")[0]}</div>
                <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 600 }}>{clip.slice(2)}</div>
                <div style={{ marginTop: 10, height: 4, borderRadius: 4, background: "rgba(99,102,241,0.3)" }}>
                  <div style={{ width: `${[75, 92, 60][i]}%`, height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
                </div>
                <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>Engagement Score: {[75, 92, 60][i]}%</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button className="btn-primary" style={{ padding: "10px 20px", fontSize: 13 }}>
              Upload to YouTube Shorts ↑
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: 48, marginTop: 60, flexWrap: "wrap", justifyContent: "center" }}>
          {[["10x", "Faster content creation"], ["$0", "Extra tools needed"], ["9:16", "Auto-formatted Shorts"]].map(([val, label]) => (
            <div key={val} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#818cf8" }}>{val}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2, fontFamily: "DM Sans" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="section">
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="tag" style={{ margin: "0 auto 20px" }}>🛠 Features</div>
          <h2 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 16 }}>
            One platform. <span className="shimmer-text">Infinite leverage.</span>
          </h2>
          <p style={{ fontSize: 16, color: "#9ca3af", maxWidth: 520, margin: "0 auto", fontFamily: "DM Sans", lineHeight: 1.7 }}>
            Creator OS replaces 6+ tools and gives you a unified workspace to grow, monetize, and automate your creator business.
          </p>
        </div>

        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card-hover" style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18, padding: "28px 24px",
              position: "relative", overflow: "hidden",
            }}>
              {f.tag && (
                <span style={{
                  position: "absolute", top: 16, right: 16,
                  background: "rgba(99,102,241,0.2)", color: "#a5b4fc",
                  fontSize: 10, fontWeight: 700, padding: "4px 10px",
                  borderRadius: 100, letterSpacing: 0.5,
                }}>⭐ {f.tag}</span>
              )}
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: f.color + "22", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 22, marginBottom: 16,
                border: `1px solid ${f.color}33`,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.65, fontFamily: "DM Sans" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "100px 24px", background: "rgba(99,102,241,0.04)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="tag" style={{ margin: "0 auto 20px" }}>⚙️ How It Works</div>
            <h2 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-1.5px" }}>
              From video to viral — <span className="shimmer-text">in minutes.</span>
            </h2>
          </div>

          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={i} className="card-hover" style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18, padding: "28px 22px",
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#6366f1", letterSpacing: 2, marginBottom: 16 }}>{s.step}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.65, fontFamily: "DM Sans" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="section">
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="tag" style={{ margin: "0 auto 20px" }}>💳 Pricing</div>
          <h2 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 16 }}>
            Simple pricing. <span className="shimmer-text">No surprises.</span>
          </h2>
          <p style={{ color: "#9ca3af", fontFamily: "DM Sans", fontSize: 16 }}>
            Cancel anytime. No credit card required to start.
          </p>
        </div>

        <div className="plans-row" style={{ display: "flex", gap: 24, alignItems: "stretch", flexWrap: "wrap" }}>
          {PLANS.map((plan, i) => (
            <div key={i} className={`plan-card card-hover ${plan.highlight ? "highlight" : ""}`}>
              {plan.highlight && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: "white", fontSize: 11, fontWeight: 800,
                  padding: "5px 16px", borderRadius: 100, letterSpacing: 1,
                  whiteSpace: "nowrap",
                }}>MOST POPULAR</div>
              )}
              <div style={{ marginBottom: 8, fontSize: 14, color: "#9ca3af", fontFamily: "DM Sans" }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginBottom: 8 }}>
                <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-2px" }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: "#6b7280", paddingBottom: 10 }}>{plan.period}</span>
              </div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24, fontFamily: "DM Sans" }}>{plan.desc}</p>
              <ul style={{ listStyle: "none", marginBottom: 32, display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#d1d5db", fontFamily: "DM Sans" }}>
                    <span style={{ color: "#6366f1", fontSize: 16 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link to="/login?tab=signup" style={{ textDecoration: "none" }}>
                <button className={plan.highlight ? "btn-primary" : "btn-outline"} style={{ width: "100%", justifyContent: "center" }}>
                  {plan.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", marginTop: 32, color: "#6b7280", fontSize: 13, fontFamily: "DM Sans" }}>
          Compare to Opus Clip ($29-49/mo, clipping only) · Creator OS is an all-in-one platform starting at $19/mo
        </p>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ padding: "100px 24px", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="tag" style={{ margin: "0 auto 20px" }}>💬 Testimonials</div>
            <h2 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-1.5px" }}>
              Creators <span className="shimmer-text">love it.</span>
            </h2>
          </div>

          <div className="testi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card-hover" style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20, padding: "28px 24px",
              }}>
                <div style={{ fontSize: 32, marginBottom: 16, color: "#f59e0b" }}>❝</div>
                <p style={{ fontSize: 15, color: "#d1d5db", lineHeight: 1.7, fontFamily: "DM Sans", marginBottom: 24 }}>{t.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: t.color + "33", border: `2px solid ${t.color}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: t.color,
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "DM Sans" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="tag" style={{ margin: "0 auto 20px" }}>❓ FAQ</div>
            <h2 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-1.5px" }}>
              Common <span className="shimmer-text">questions.</span>
            </h2>
          </div>

          {FAQS.map((faq, i) => (
            <div key={i} className="faq-item" style={{ padding: "20px 0" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%", background: "none", border: "none",
                  color: "#f0f0f5", display: "flex", justifyContent: "space-between",
                  alignItems: "center", cursor: "pointer", textAlign: "left",
                  fontFamily: "Syne", fontWeight: 600, fontSize: 16,
                }}>
                {faq.q}
                <span style={{ fontSize: 20, color: "#6366f1", transition: "transform 0.2s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
              </button>
              {openFaq === i && (
                <p style={{ marginTop: 14, fontSize: 14, color: "#9ca3af", lineHeight: 1.7, fontFamily: "DM Sans" }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding: "100px 24px", background: "rgba(99,102,241,0.04)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="tag" style={{ margin: "0 auto 20px" }}>📬 Contact</div>
            <h2 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 14 }}>
              Get in <span className="shimmer-text">touch.</span>
            </h2>
            <p style={{ color: "#9ca3af", fontFamily: "DM Sans", fontSize: 15, lineHeight: 1.7 }}>
              Have a question, feature request, or partnership idea? We'd love to hear from you.
            </p>
          </div>

          {submitted ? (
            <div style={{
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 16, padding: 40, textAlign: "center",
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Message sent!</h3>
              <p style={{ color: "#9ca3af", fontFamily: "DM Sans" }}>We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 6, letterSpacing: 0.5 }}>NAME</label>
                  <input
                    required placeholder="Your name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 6, letterSpacing: 0.5 }}>EMAIL</label>
                  <input
                    required type="email" placeholder="your@email.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 6, letterSpacing: 0.5 }}>MESSAGE</label>
                <textarea
                  required rows={5} placeholder="Tell us what's on your mind..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 16, padding: "15px" }}>
                Send Message →
              </button>
            </form>
          )}

          <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[["📧", "support@creatoros.io"], ["🐦", "@creatoroshq"], ["💼", "linkedin.com/company/creatoros"]].map(([icon, val]) => (
              <div key={val} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", fontFamily: "DM Sans" }}>
                <span>{icon}</span><span>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "48px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 20, maxWidth: 1100, margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          }}>⚡</div>
          <span style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 16 }}>
            Creator <span style={{ color: "#818cf8" }}>OS</span>
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#4b5563", fontFamily: "DM Sans" }}>
          © 2025 Creator OS. All rights reserved.
        </p>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy Policy", "Terms of Service", "Contact"].map(link => (
            <span key={link} style={{ fontSize: 13, color: "#6b7280", cursor: "pointer", fontFamily: "DM Sans" }} className="nav-link">{link}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

