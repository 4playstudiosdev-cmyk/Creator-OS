// DASHBOARD FIX — Media Kit link
// In your existing Dashboard.jsx, find the Media Kit link/button and change it to:
// Instead of: window.open('https://creatoros.com/u/safeer') or any external URL
// Use: navigate('/mediakit') — this opens the local Media Kit page

// If you have a "Copy media kit link" button that copies a URL:
// Change it to copy: `http://localhost:5173/u/${username}` (localhost)
// NOT: `https://creatoros.com/u/${username}` (external)

// ─────────────────────────────────────────────────────────
// COMPLETE DASHBOARD with fixed Media Kit link
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const S = {
  card: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, marginBottom: 16 },
  btn: { cursor: 'pointer', border: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s', borderRadius: 12 },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
  }, [])

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Creator'

  const stats = [
    { label: 'Total Reach', value: '48.2K', change: '+12%', color: '#6366f1', icon: '👁' },
    { label: 'Brand Earnings', value: '$3,240', change: '+8%', color: '#f59e0b', icon: '💰' },
    { label: 'Posts Scheduled', value: '12', change: 'Next: Tomorrow', color: '#10b981', icon: '📅' },
    { label: 'Avg. Engagement', value: '6.4%', change: 'Above avg', color: '#8b5cf6', icon: '📊' },
  ]

  const recentPosts = [
    { platform: '▶', platformColor: 'rgba(255,68,68,0.12)', title: '10 Creator Tools You Need in 2026', meta: 'YouTube · Tomorrow 10:00 AM', badge: 'Scheduled', badgeBg: 'rgba(74,174,222,0.15)', badgeColor: '#60a5fa' },
    { platform: '📸', platformColor: 'rgba(225,48,108,0.12)', title: 'Behind the scenes — Studio setup', meta: 'Instagram · Live now', badge: 'Live', badgeBg: 'rgba(16,185,129,0.15)', badgeColor: '#6ee7b7' },
    { platform: '𝕏', platformColor: 'rgba(255,255,255,0.06)', title: 'Thread: How I got 10K subs in 30 days', meta: 'Twitter · Draft', badge: 'Draft', badgeBg: 'rgba(255,255,255,0.06)', badgeColor: '#6b7280' },
  ]

  const quickActions = [
    { label: 'Schedule Post', icon: '📅', action: () => navigate('/schedule'), color: '#6366f1' },
    { label: 'Repurpose Content', icon: '⚡', action: () => navigate('/repurpose'), color: '#f59e0b' },
    { label: 'Add Brand Deal', icon: '💰', action: () => navigate('/deals'), color: '#10b981' },
    // FIXED: Media Kit link goes to /mediakit (internal route), NOT external URL
    { label: 'View Media Kit', icon: '🎨', action: () => navigate('/mediakit'), color: '#8b5cf6' },
  ]

  const WEEKLY = [28, 34, 26, 48, 38, 62, 55]
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const maxVal = Math.max(...WEEKLY)

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 28, marginBottom: 4 }}>
          {greeting}, {firstName}! 👋
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {stats.map((s, i) => (
          <div key={i} style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
            </div>
            <div style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>↑ {s.change}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 16 }}>
        {/* Chart */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>Weekly Reach</span>
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>↑ +24% vs last week</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 110 }}>
            {WEEKLY.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, color: '#6b7280' }}>{v}K</span>
                <div style={{ width: '100%', background: 'linear-gradient(to top,#6366f1,#8b5cf6)', borderRadius: '4px 4px 0 0', height: `${(v / maxVal) * 80}px`, opacity: 0.8, transition: 'height .5s' }} />
                <span style={{ fontSize: 10, color: '#4b5563' }}>{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={S.card}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickActions.map((a, i) => (
              <button key={i} onClick={a.action}
                style={{ ...S.btn, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                  color: '#f0f0f5', fontSize: 14, fontWeight: 600,
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: a.color + '22', border: `1px solid ${a.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {a.icon}
                </div>
                {a.label}
                <svg style={{ marginLeft: 'auto', color: '#374151' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>Recent Posts</span>
          <button onClick={() => navigate('/schedule')} style={{ ...S.btn, padding: '6px 14px', fontSize: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 600 }}>
            View All →
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recentPosts.map((post, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: post.platformColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                {post.platform}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</div>
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{post.meta}</div>
              </div>
              <div style={{ padding: '4px 10px', background: post.badgeBg, borderRadius: 100, fontSize: 11, fontWeight: 700, color: post.badgeColor, flexShrink: 0 }}>
                {post.badge}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Media Kit promo — FIXED: navigates to /mediakit, not external URL */}
      <div style={{ ...S.card, background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ fontSize: 40 }}>🎨</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Your Media Kit is ready to share</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Share your creator stats and rates with brands. View and edit your media kit below.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={() => navigate('/mediakit')}
            style={{ ...S.btn, padding: '9px 20px', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
            Edit Media Kit →
          </button>
        </div>
      </div>
    </div>
  )
}
