import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [copied, setCopied] = useState(false)
  const [scheduledCount, setScheduledCount] = useState(0)
  const [pipelineValue, setPipelineValue] = useState(0)
  const [upcomingPosts, setUpcomingPosts] = useState([])
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
  }, [])

  useEffect(() => {
    if (session) { fetchProfile(); fetchStats() }
  }, [session])

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles').select('username, full_name')
        .eq('id', session.user.id).single()
      if (data) setProfile(data)
    } catch (e) {}
  }

  const fetchStats = async () => {
    try {
      const postsRes = await axios.get(
        "http://localhost:8000/api/posts/user/" + session.user.id,
        { headers: { Authorization: "Bearer " + session.access_token } }
      )
      const posts = postsRes.data?.data || []
      setScheduledCount(posts.length)
      const now = new Date()
      const upcoming = posts
        .filter(p => new Date(p.scheduled_for) >= now)
        .sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for))
        .slice(0, 3)
      setUpcomingPosts(upcoming)

      const dealsRes = await axios.get(
        "http://localhost:8000/api/deals/user/" + session.user.id,
        { headers: { Authorization: "Bearer " + session.access_token } }
      )
      const deals = dealsRes.data || []
      const total = deals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
      setPipelineValue(total)
    } catch (e) {}
  }

  const publicUrl = profile?.username
    ? window.location.origin + "/u/" + profile.username : null

  const handleCopy = () => {
    if (!publicUrl) return
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getPlatformStyle = (platforms) => {
    if (platforms?.includes('twitter'))  return { label: 'Twitter',  color: '#1d9bf0' }
    if (platforms?.includes('linkedin')) return { label: 'LinkedIn', color: '#0077b5' }
    if (platforms?.includes('youtube'))  return { label: 'YouTube',  color: '#ff0000' }
    return { label: 'Post', color: '#6b7280' }
  }

  const stats = [
    { label: 'Scheduled Posts',  value: scheduledCount.toString(),         sub: 'Total drafts & scheduled', icon: '📅', accent: '#6366f1' },
    { label: 'Pipeline Value',   value: '$' + pipelineValue.toLocaleString(), sub: 'Active brand deals',      icon: '💰', accent: '#10b981' },
    { label: 'Total Audience',   value: '—',                               sub: 'Connect accounts to see',  icon: '👥', accent: '#8b5cf6' },
  ]

  const quickActions = [
    { label: 'Schedule a Post', icon: '📅', path: '/schedule',      accent: '#6366f1' },
    { label: 'Generate Clips',  icon: '✂️', path: '/auto-clip',     accent: '#8b5cf6' },
    { label: 'Write a Script',  icon: '✍️', path: '/script-studio', accent: '#10b981' },
    { label: 'Brand Deals',     icon: '🤝', path: '/deals',         accent: '#f59e0b' },
    { label: 'YouTube Studio',  icon: '🎬', path: '/youtube-studio',accent: '#ef4444' },
    { label: 'AI Tools',        icon: '🤖', path: '/ai-tools',      accent: '#06b6d4' },
  ]

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div style={{ fontFamily: "'Syne', 'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .dash-fadein { animation: fadeUp 0.5s ease both; }
        .dash-fadein-2 { animation: fadeUp 0.5s 0.08s ease both; }
        .dash-fadein-3 { animation: fadeUp 0.5s 0.16s ease both; }
        .dash-fadein-4 { animation: fadeUp 0.5s 0.24s ease both; }
        .dash-fadein-5 { animation: fadeUp 0.5s 0.32s ease both; }

        .shimmer-text {
          background: linear-gradient(90deg, #a5b4fc, #818cf8, #c4b5fd, #818cf8, #a5b4fc);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 22px 20px;
          transition: transform 0.2s, border-color 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.12);
        }

        .action-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }
        .action-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-2px);
        }

        .post-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          transition: background 0.2s;
        }
        .post-row:hover { background: rgba(255,255,255,0.04); }

        .section-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 24px;
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Header ── */}
        <div className="dash-fadein">
          <p style={{ fontSize: 13, color: '#6b7280', fontFamily: 'DM Sans', marginBottom: 4 }}>
            {greeting()},
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#f0f0f5', letterSpacing: '-1px', lineHeight: 1.1 }}>
            {profile?.full_name || 'Creator'} <span className="shimmer-text">🚀</span>
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6, fontFamily: 'DM Sans' }}>
            Here's your brand performance summary for today.
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="dash-fadein-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'DM Sans' }}>
                  {s.label}
                </p>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: s.accent + '18',
                  border: `1px solid ${s.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{s.icon}</div>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#f0f0f5', letterSpacing: '-1px' }}>{s.value}</p>
              <p style={{ fontSize: 12, color: '#4b5563', marginTop: 4, fontFamily: 'DM Sans' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Media Kit Banner ── */}
        <div className="dash-fadein-3" style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 20, padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🔗</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f5' }}>Your Public Media Kit</p>
              {publicUrl ? (
                <p style={{ fontSize: 12, color: '#a5b4fc', marginTop: 2, fontFamily: 'DM Sans' }}>{publicUrl}</p>
              ) : (
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2, fontFamily: 'DM Sans' }}>
                  No username set —{' '}
                  <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', padding: 0, fontSize: 12, textDecoration: 'underline' }}>
                    Set it in Settings
                  </button>
                </p>
              )}
            </div>
          </div>
          {publicUrl && (
            <button onClick={handleCopy} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px',
              background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 10, color: copied ? '#6ee7b7' : '#f0f0f5',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Syne', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div className="dash-fadein-4 section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'DM Sans' }}>
              Quick Actions
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {quickActions.map((a, i) => (
              <button key={i} className="action-card" onClick={() => navigate(a.path)}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: a.accent + '18', border: `1px solid ${a.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                }}>{a.icon}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#d1d5db', fontFamily: 'Syne' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Upcoming Content ── */}
        <div className="dash-fadein-5 section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15 }}>🕐</span>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'DM Sans' }}>
                Upcoming Content
              </p>
            </div>
            <button onClick={() => navigate('/schedule')} style={{
              background: 'none', border: 'none', color: '#a5b4fc',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              View All →
            </button>
          </div>

          {upcomingPosts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingPosts.map((post, i) => {
                const platform = getPlatformStyle(post.platforms)
                return (
                  <div key={i} className="post-row">
                    <span style={{
                      padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                      background: platform.color + '18', color: platform.color,
                      border: `1px solid ${platform.color}30`, whiteSpace: 'nowrap', fontFamily: 'Syne',
                    }}>
                      {platform.label}
                    </span>
                    <p style={{ fontSize: 13, color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'DM Sans' }}>
                      {post.content}
                    </p>
                    <p style={{ fontSize: 12, color: '#4b5563', whiteSpace: 'nowrap', fontFamily: 'DM Sans' }}>
                      {new Date(post.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{
              border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 14,
              padding: '40px 20px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>📭</p>
              <p style={{ fontSize: 14, color: '#4b5563', fontFamily: 'DM Sans', marginBottom: 16 }}>
                No upcoming posts scheduled yet.
              </p>
              <button onClick={() => navigate('/schedule')} style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: 'white', border: 'none', padding: '10px 22px',
                borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Syne',
              }}>
                Create New Post
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}