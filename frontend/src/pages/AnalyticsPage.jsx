import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const S = {
  card: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, marginBottom: 16 },
  btn: { cursor: 'pointer', border: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'all .15s', borderRadius: 10 },
}

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', icon: '▶', color: '#ff4444', followers: '45,200', reach: '128,400', eng: '8.2%', posts: 12, growth: '+340' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#e1306c', followers: '28,100', reach: '74,500', eng: '6.7%', posts: 24, growth: '+820' },
  { id: 'twitter', label: 'Twitter / X', icon: '𝕏', color: '#1d9bf0', followers: '12,400', reach: '31,200', eng: '4.1%', posts: 48, growth: '+210' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: '#69c9d0', followers: '8,900', reach: '44,100', eng: '12.4%', posts: 18, growth: '+1,200' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0077b5', followers: '3,200', reach: '9,800', eng: '5.9%', posts: 8, growth: '+180' },
]

const TOP_POSTS = [
  { id: 1, platform: 'youtube', icon: '▶', color: '#ff4444', title: 'How I grew to 10K subscribers in 90 days', date: 'Mar 20', engagement: 2840, reach: 18600, deal: 'Nike — $1,200' },
  { id: 2, platform: 'instagram', icon: '📸', color: '#e1306c', title: 'My content creation setup tour', date: 'Mar 18', engagement: 1560, reach: 9200, deal: null },
  { id: 3, platform: 'tiktok', icon: '🎵', color: '#69c9d0', title: 'POV: Creator life at 3am 😅', date: 'Mar 15', engagement: 4200, reach: 28000, deal: null },
  { id: 4, platform: 'linkedin', icon: '💼', color: '#0077b5', title: 'Creators waste 2 hours daily switching...', date: 'Mar 4', engagement: 856, reach: 4166, deal: 'No deal yet' },
]

const ROI_LINKS = [
  { id: 1, brand: 'Samsung', budget: '$150', slug: 'samsung-mar', clicks: 342, conversions: 28, cvr: '8.2%' },
  { id: 2, brand: 'Nike', budget: '$300', slug: 'nike-feb', clicks: 891, conversions: 67, cvr: '7.5%' },
  { id: 3, brand: 'Notion', budget: '$200', slug: 'notion-mar', clicks: 156, conversions: 12, cvr: '7.7%' },
  { id: 4, brand: 'Safeer', budget: '$500', slug: 'safeer-2', clicks: 0, conversions: 0, cvr: '0%' },
]

const WEEKLY_DATA = [28, 34, 26, 48, 38, 62, 55]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const maxReach = Math.max(...WEEKLY_DATA)

export default function AnalyticsPage() {
  const [activePlatform, setActivePlatform] = useState('all')
  const [range, setRange] = useState('7d')
  const [copiedSlug, setCopiedSlug] = useState('')
  const [showNewLinkModal, setShowNewLinkModal] = useState(false)
  const [newLink, setNewLink] = useState({ brand: '', budget: '', slug: '' })
  const [roiLinks, setRoiLinks] = useState(ROI_LINKS)
  const navigate = useNavigate()

  const copyLink = (slug) => {
    // Copy localhost link — NOT external brand URL
    navigator.clipboard.writeText(`http://localhost:5173/r/${slug}`)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(''), 2000)
  }

  const addNewLink = () => {
    if (!newLink.brand || !newLink.slug) return
    const link = {
      id: Date.now(),
      brand: newLink.brand,
      budget: newLink.budget ? `$${newLink.budget}` : '$0',
      slug: newLink.slug.toLowerCase().replace(/\s+/g, '-'),
      clicks: 0, conversions: 0, cvr: '0%'
    }
    setRoiLinks(prev => [...prev, link])
    setNewLink({ brand: '', budget: '', slug: '' })
    setShowNewLinkModal(false)
  }

  const totalFollowers = PLATFORMS.reduce((sum, p) => sum + parseInt(p.followers.replace(/,/g, '')), 0)
  const totalReach = PLATFORMS.reduce((sum, p) => sum + parseInt(p.reach.replace(/,/g, '')), 0)

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, marginBottom: 4 }}>📊 Analytics</h1>
          <p style={{ color: '#6b7280', fontSize: 13 }}>All your platform stats in one place</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['7d', '30d', '90d'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{ ...S.btn, padding: '7px 14px', fontSize: 12, fontWeight: 600,
                background: range === r ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${range === r ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: range === r ? '#a5b4fc' : '#6b7280',
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Followers', value: totalFollowers.toLocaleString(), chg: '+2,750', color: '#6366f1' },
          { label: 'Total Reach', value: totalReach.toLocaleString(), chg: '+18,400', color: '#10b981' },
          { label: 'Avg. Engagement', value: '7.5%', chg: '+0.8%', color: '#f59e0b' },
          { label: 'Total Posts', value: '110', chg: '+22 this week', color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} style={S.card}>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 24, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>↑ {s.chg}</div>
          </div>
        ))}
      </div>

      {/* Weekly reach chart */}
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>Weekly Reach (K)</span>
          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>↑ +24% vs last week</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
          {WEEKLY_DATA.map((val, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, color: '#6b7280' }}>{val}K</span>
              <div style={{ width: '100%', background: 'linear-gradient(to top,#6366f1,#8b5cf6)', borderRadius: '4px 4px 0 0', height: `${(val / maxReach) * 70}px`, opacity: 0.8 }} />
              <span style={{ fontSize: 10, color: '#4b5563' }}>{DAYS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Platform breakdown */}
      <div style={S.card}>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Platform Breakdown</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setActivePlatform('all')}
            style={{ ...S.btn, padding: '5px 14px', fontSize: 12, fontWeight: 600,
              background: activePlatform === 'all' ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: `1px solid ${activePlatform === 'all' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: activePlatform === 'all' ? '#a5b4fc' : '#6b7280' }}>
            All
          </button>
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setActivePlatform(p.id)}
              style={{ ...S.btn, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                background: activePlatform === p.id ? `${p.color}22` : 'transparent',
                border: `1px solid ${activePlatform === p.id ? p.color + '44' : 'rgba(255,255,255,0.08)'}`,
                color: activePlatform === p.id ? p.color : '#6b7280' }}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Platform', 'Followers', 'Reach', 'Engagement', 'Posts', 'Growth'].map((h, i) => (
                  <th key={i} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 0 ? 'left' : 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLATFORMS.filter(p => activePlatform === 'all' || p.id === activePlatform).map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background .15s' }}>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: p.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{p.icon}</div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: p.color }}>{p.label}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: 13, color: '#f0f0f5', fontWeight: 700, padding: '12px 12px' }}>{p.followers}</td>
                  <td style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', padding: '12px 12px' }}>{p.reach}</td>
                  <td style={{ textAlign: 'center', padding: '12px 12px' }}>
                    <span style={{ padding: '3px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 100, fontSize: 12, color: '#6ee7b7', fontWeight: 700 }}>{p.eng}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', padding: '12px 12px' }}>{p.posts}</td>
                  <td style={{ textAlign: 'center', fontSize: 13, color: '#10b981', fontWeight: 700, padding: '12px 12px' }}>↑ {p.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Posts */}
      <div style={S.card}>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Top Performing Posts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TOP_POSTS.map(post => (
            <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: post.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{post.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</div>
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{post.date}</div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{post.engagement.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>Engagement</div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f5' }}>{post.reach.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>Reach</div>
              </div>
              {post.deal && post.deal !== 'No deal yet' ? (
                <div style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 100, fontSize: 11, color: '#6ee7b7', fontWeight: 700, flexShrink: 0 }}>
                  💰 {post.deal}
                </div>
              ) : (
                <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, fontSize: 11, color: '#4b5563', flexShrink: 0 }}>
                  {post.deal || 'No deal'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ROI Tracking Links — FIXED: opens localhost blog page, not external brand URL */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>Sponsorship ROI Links 🔗</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Share these links with brands — clicks and conversions tracked here</div>
          </div>
          <button onClick={() => setShowNewLinkModal(true)}
            style={{ ...S.btn, padding: '8px 16px', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
            + New Link
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {roiLinks.map(link => (
            <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>{link.brand}</span>
                  <span style={{ padding: '2px 8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 100, fontSize: 11, color: '#6ee7b7', fontWeight: 700 }}>{link.budget}</span>
                </div>
                {/* FIXED: localhost link, not external URL */}
                <div style={{ fontSize: 12, color: '#6366f1', fontFamily: 'monospace' }}>
                  localhost:5173/r/{link.slug}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#f0f0f5' }}>{link.clicks.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>Clicks</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#f0f0f5' }}>{link.conversions.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>Conversions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: link.cvr === '0%' ? '#374151' : '#10b981' }}>{link.cvr}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>CVR</div>
              </div>
              <button onClick={() => copyLink(link.slug)}
                style={{ ...S.btn, padding: '7px 14px', fontSize: 12, fontWeight: 600,
                  background: copiedSlug === link.slug ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${copiedSlug === link.slug ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  color: copiedSlug === link.slug ? '#6ee7b7' : '#9ca3af',
                  flexShrink: 0,
                }}>
                {copiedSlug === link.slug ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* New Link Modal */}
      {showNewLinkModal && (
        <div onClick={() => setShowNewLinkModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, width: 420, maxWidth: '90vw' }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Create ROI Link</h3>
            {[
              { label: 'Brand Name', key: 'brand', placeholder: 'e.g. Samsung' },
              { label: 'Budget / Deal Value', key: 'budget', placeholder: 'e.g. 500' },
              { label: 'Link Slug', key: 'slug', placeholder: 'e.g. samsung-april (no spaces)' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{field.label}</label>
                <input
                  value={newLink[field.key]}
                  onChange={e => setNewLink(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', color: '#f0f0f5', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            {newLink.slug && (
              <div style={{ marginBottom: 16, padding: '8px 12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 12, color: '#a5b4fc', fontFamily: 'monospace' }}>
                localhost:5173/r/{newLink.slug.toLowerCase().replace(/\s+/g, '-')}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowNewLinkModal(false)}
                style={{ ...S.btn, flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={addNewLink}
                style={{ ...S.btn, flex: 1, padding: '10px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                Create Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}