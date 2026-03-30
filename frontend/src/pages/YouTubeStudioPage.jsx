import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const S = {
  card: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, marginBottom: 16 },
  btn:  { cursor: 'pointer', border: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s', borderRadius: 12 },
  input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#f0f0f5', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  label: { fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7, display: 'block' },
}

// ── Demo data ──────────────────────────────────────────────
const DEMO_VIDEOS = [
  { id: 'v1', type: 'long', title: 'How I grew to 10K subscribers in 90 days — Full Strategy', views: '18,400', likes: '1,240', comments: 84, duration: '14:32', date: 'Mar 20', thumb: '#6366f1', status: 'public' },
  { id: 'v2', type: 'long', title: 'My complete creator setup tour 2026 — Camera, Mic, Lights', views: '9,200',  likes: '640',   comments: 52, duration: '11:18', date: 'Mar 14', thumb: '#8b5cf6', status: 'public' },
  { id: 'v3', type: 'long', title: 'How to monetize your YouTube channel (even under 1000 subs)', views: '7,100',  likes: '520',   comments: 38, duration: '18:44', date: 'Mar 7',  thumb: '#ec4899', status: 'public' },
  { id: 'v4', type: 'long', title: 'Creator tools I use daily — honest review', views: '4,600', likes: '310', comments: 29, duration: '9:55', date: 'Feb 28', thumb: '#f59e0b', status: 'unlisted' },
]
const DEMO_SHORTS = [
  { id: 's1', type: 'short', title: 'POV: Creator life at 3am 😅 #shorts', views: '44,100', likes: '3,200', comments: 198, duration: '0:58', date: 'Mar 22', thumb: '#10b981', status: 'public' },
  { id: 's2', type: 'short', title: '5 tips I wish I knew before starting YouTube #shorts', views: '28,000', likes: '2,100', comments: 142, duration: '0:45', date: 'Mar 18', thumb: '#06b6d4', status: 'public' },
  { id: 's3', type: 'short', title: 'Day in the life of a creator 🎬 #shorts', views: '12,400', likes: '940',   comments: 61,  duration: '0:52', date: 'Mar 10', thumb: '#f43f5e', status: 'public' },
]
const DEMO_COMMUNITY = [
  { id: 'c1', type: 'text',  text: '🎉 Just hit 10K subscribers! Thank you all so much. Working on something big — dropping next week. Stay tuned!', likes: 420, comments: 84, date: '2 days ago' },
  { id: 'c2', type: 'poll',  text: 'What topic should I cover next?', options: [{ label: 'YouTube Growth Tips', votes: 342 }, { label: 'AI Tools for Creators', votes: 289 }, { label: 'Brand Deal Negotiation', votes: 178 }], likes: 210, date: '5 days ago' },
  { id: 'c3', type: 'text',  text: '📹 Behind the scenes of my latest video. What do you think of the new setup? Let me know in the comments!', likes: 186, comments: 42, date: '1 week ago' },
]
const ANALYTICS = {
  views28: '62,400', watchTime: '4,820 hrs', subscribers: '+1,240', revenue: '$384',
  topVideo: 'How I grew to 10K subscribers',
  avgViewDuration: '6:42',
  clickThrough: '4.8%',
  impressions: '284,000',
  weekly: [4200, 5800, 4900, 8200, 7100, 9400, 8800],
}

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const maxW  = Math.max(...ANALYTICS.weekly)

export default function YouTubeStudioPage() {
  const [activeTab, setActiveTab] = useState('videos')
  const [videoFilter, setVideoFilter] = useState('all')
  const [showPostModal, setShowPostModal] = useState(false)
  const [postType, setPostType] = useState('video') // 'video' | 'short' | 'community'
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)

  // Post form state
  const [postForm, setPostForm] = useState({ title: '', description: '', tags: '', privacy: 'public', communityText: '', pollOptions: ['', ''] })
  const fileRef = useRef(null)
  const thumbRef = useRef(null)
  const [videoFile, setVideoFile] = useState(null)
  const [thumbFile, setThumbFile] = useState(null)

  const updatePost = (k, v) => setPostForm(p => ({ ...p, [k]: v }))

  const allVideos = [...DEMO_VIDEOS, ...DEMO_SHORTS]
  const filtered  = videoFilter === 'all' ? allVideos : allVideos.filter(v => v.type === videoFilter)

  const handlePost = async () => {
    setPosting(true)
    await new Promise(r => setTimeout(r, 2000)) // simulate upload
    setPosting(false)
    setPosted(true)
    setTimeout(() => { setPosted(false); setShowPostModal(false) }, 2500)
  }

  const TABS = [
    { id: 'videos',     label: '🎬 Videos',    },
    { id: 'analytics',  label: '📊 Analytics',  },
    { id: 'community',  label: '💬 Community',  },
  ]

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', paddingBottom: 48 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 100, color: '#fca5a5', fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
            ▶ YOUTUBE STUDIO
          </div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, marginBottom: 4 }}>YouTube Studio</h1>
          <p style={{ color: '#6b7280', fontSize: 13 }}>Manage your videos, Shorts, community posts and channel analytics</p>
        </div>
        <button onClick={() => { setShowPostModal(true); setPosted(false) }}
          style={{ ...S.btn, padding: '10px 20px', fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,#ff4444,#ef4444)', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(239,68,68,0.35)' }}>
          <span style={{ fontSize: 16 }}>+</span> Post to YouTube
        </button>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Views (28 days)', value: ANALYTICS.views28,     color: '#ff4444', icon: '👁' },
          { label: 'Watch Time',      value: ANALYTICS.watchTime,    color: '#f59e0b', icon: '⏱' },
          { label: 'New Subscribers', value: ANALYTICS.subscribers,  color: '#10b981', icon: '👥' },
          { label: 'Est. Revenue',    value: ANALYTICS.revenue,      color: '#8b5cf6', icon: '💰' },
        ].map((s, i) => (
          <div key={i} style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
            </div>
            <div style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 22, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ ...S.btn, padding: '8px 18px', fontSize: 13, fontWeight: 700,
              background: activeTab === t.id ? 'linear-gradient(135deg,#ff4444,#ef4444)' : 'transparent',
              color: activeTab === t.id ? '#fff' : '#6b7280',
              boxShadow: activeTab === t.id ? '0 4px 12px rgba(239,68,68,0.3)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── VIDEOS TAB ─────────────────────────────────────────── */}
      {activeTab === 'videos' && (
        <div>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { id: 'all',   label: `All (${allVideos.length})` },
              { id: 'long',  label: `Long Videos (${DEMO_VIDEOS.length})` },
              { id: 'short', label: `Shorts (${DEMO_SHORTS.length})` },
            ].map(f => (
              <button key={f.id} onClick={() => setVideoFilter(f.id)}
                style={{ ...S.btn, padding: '6px 16px', fontSize: 12, fontWeight: 600,
                  background: videoFilter === f.id ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${videoFilter === f.id ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: videoFilter === f.id ? '#fca5a5' : '#6b7280',
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* ── LONG VIDEOS ── */}
          {(videoFilter === 'all' || videoFilter === 'long') && (
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <span style={{ fontSize: 16 }}>🎬</span>
                <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15 }}>Long Videos</span>
                <span style={{ padding: '2px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 100, fontSize: 11, color: '#fca5a5', fontWeight: 700 }}>{DEMO_VIDEOS.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {DEMO_VIDEOS.map(v => <VideoRow key={v.id} v={v} />)}
              </div>
            </div>
          )}

          {/* ── SHORTS ── */}
          {(videoFilter === 'all' || videoFilter === 'short') && (
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <span style={{ fontSize: 16 }}>⚡</span>
                <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15 }}>YouTube Shorts</span>
                <span style={{ padding: '2px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 100, fontSize: 11, color: '#6ee7b7', fontWeight: 700 }}>{DEMO_SHORTS.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
                {DEMO_SHORTS.map(v => <ShortCard key={v.id} v={v} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ─────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div>
          {/* Chart */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15 }}>Daily Views (Last 7 Days)</span>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>↑ +24% vs last week</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
              {ANALYTICS.weekly.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>{(v/1000).toFixed(1)}K</span>
                  <div style={{ width: '100%', background: 'linear-gradient(to top,#ff4444,#f87171)', borderRadius: '4px 4px 0 0', height: `${(v/maxW)*90}px`, opacity: 0.8 }} />
                  <span style={{ fontSize: 10, color: '#4b5563' }}>{DAYS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 14 }}>
            {[
              { label: 'Avg. View Duration', value: ANALYTICS.avgViewDuration, desc: 'Time viewers spend watching', icon: '⏱', color: '#f59e0b' },
              { label: 'Click Through Rate', value: ANALYTICS.clickThrough,    desc: 'Impressions that led to clicks', icon: '🎯', color: '#6366f1' },
              { label: 'Impressions',         value: ANALYTICS.impressions,     desc: 'Times thumbnails were shown', icon: '👁', color: '#8b5cf6' },
              { label: 'Top Performing Video',value: ANALYTICS.topVideo,        desc: 'Most views in last 28 days', icon: '🏆', color: '#10b981' },
            ].map((m, i) => (
              <div key={i} style={{ ...S.card, marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: m.color + '22', border: `1px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{m.icon}</div>
                  <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{m.label}</span>
                </div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: m.color, marginBottom: 4 }}>{m.value}</div>
                <div style={{ fontSize: 11, color: '#4b5563' }}>{m.desc}</div>
              </div>
            ))}
          </div>

          {/* Top videos table */}
          <div style={S.card}>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Top Videos by Views</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Title', 'Views', 'Watch Time', 'CTR', 'Subscribers'].map((h, i) => (
                    <th key={i} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', textAlign: i === 0 ? 'left' : 'center', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...DEMO_VIDEOS, ...DEMO_SHORTS].slice(0,5).map((v, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 10px', fontSize: 12, color: '#f0f0f5', maxWidth: 220 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ marginRight: 6 }}>{v.type === 'short' ? '⚡' : '🎬'}</span>{v.title}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 12, color: '#f0f0f5', fontWeight: 700, padding: '10px 10px' }}>{v.views}</td>
                    <td style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', padding: '10px 10px' }}>{v.duration}</td>
                    <td style={{ textAlign: 'center', padding: '10px 10px' }}>
                      <span style={{ padding: '2px 8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 100, fontSize: 11, color: '#6ee7b7' }}>{(3 + i * 0.4).toFixed(1)}%</span>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 12, color: '#10b981', fontWeight: 700, padding: '10px 10px' }}>+{20 + i * 12}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── COMMUNITY TAB ─────────────────────────────────────── */}
      {activeTab === 'community' && (
        <div>
          {/* Create new community post */}
          <div style={{ ...S.card, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.04)', marginBottom: 20 }}>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 14 }}>✏️ Create Community Post</div>
            <textarea
              placeholder="Share an update, announcement, or poll with your community..."
              style={{ ...S.input, minHeight: 90, resize: 'vertical', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={{ ...S.btn, padding: '8px 16px', fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                + Add Poll
              </button>
              <button style={{ ...S.btn, padding: '8px 20px', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#ff4444,#ef4444)', color: '#fff', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                Post to Community
              </button>
            </div>
          </div>

          {/* Existing posts */}
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 14 }}>Recent Community Posts</div>
          {DEMO_COMMUNITY.map(post => (
            <div key={post.id} style={{ ...S.card }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#ff4444,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>▶</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>Your Channel</span>
                    <span style={{ fontSize: 11, color: '#4b5563' }}>{post.date}</span>
                    {post.type === 'poll' && <span style={{ padding: '2px 8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 100, fontSize: 10, color: '#a5b4fc', fontWeight: 700 }}>POLL</span>}
                  </div>
                  <p style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.65, marginBottom: 14 }}>{post.text}</p>

                  {post.type === 'poll' && post.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {post.options.map((opt, i) => {
                        const total = post.options.reduce((s, o) => s + o.votes, 0)
                        const pct   = Math.round((opt.votes / total) * 100)
                        return (
                          <div key={i} style={{ position: 'relative', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'rgba(99,102,241,0.15)', transition: 'width .5s' }} />
                            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                              <span>{opt.label}</span>
                              <span style={{ fontWeight: 700, color: '#a5b4fc' }}>{pct}%</span>
                            </div>
                          </div>
                        )
                      })}
                      <div style={{ fontSize: 11, color: '#4b5563' }}>{post.options.reduce((s, o) => s + o.votes, 0).toLocaleString()} votes</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>👍 {post.likes}</span>
                    {post.comments && <span style={{ fontSize: 12, color: '#6b7280' }}>💬 {post.comments} comments</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── POST MODAL ────────────────────────────────────────── */}
      {showPostModal && (
        <div onClick={() => setShowPostModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>Post to YouTube</h3>
              <button onClick={() => setShowPostModal(false)} style={{ ...S.btn, width: 32, height: 32, background: 'rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: 14 }}>✕</button>
            </div>

            <div style={{ padding: '20px 28px' }}>
              {/* Post type selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Post Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'video',     label: '🎬 Long Video', color: '#ff4444' },
                    { id: 'short',     label: '⚡ YouTube Short', color: '#10b981' },
                    { id: 'community', label: '💬 Community Post', color: '#6366f1' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setPostType(t.id)}
                      style={{ ...S.btn, flex: 1, padding: '9px 8px', fontSize: 12, fontWeight: 700,
                        background: postType === t.id ? `${t.color}22` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${postType === t.id ? t.color + '55' : 'rgba(255,255,255,0.08)'}`,
                        color: postType === t.id ? t.color : '#6b7280',
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video upload fields */}
              {(postType === 'video' || postType === 'short') && (
                <>
                  {/* Video file */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Video File</label>
                    <div onClick={() => fileRef.current?.click()}
                      style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: `2px dashed ${videoFile ? '#10b981' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, textAlign: 'center', cursor: 'pointer', transition: 'border-color .2s' }}>
                      {videoFile ? (
                        <div style={{ color: '#6ee7b7', fontSize: 13, fontWeight: 600 }}>✓ {videoFile.name}</div>
                      ) : (
                        <>
                          <div style={{ fontSize: 24, marginBottom: 8 }}>🎬</div>
                          <div style={{ fontSize: 13, color: '#6b7280' }}>Click to select video file</div>
                          <div style={{ fontSize: 11, color: '#374151', marginTop: 4 }}>MP4, MOV, AVI — max 128GB</div>
                        </>
                      )}
                      <input ref={fileRef} type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} style={{ display: 'none' }} />
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>Title</label>
                    <input style={S.input} value={postForm.title} onChange={e => updatePost('title', e.target.value)} placeholder={postType === 'short' ? 'Short title with #shorts' : 'Enter video title...'} />
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>Description</label>
                    <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={postForm.description} onChange={e => updatePost('description', e.target.value)} placeholder="Video description, links, timestamps..." />
                  </div>

                  {/* Tags + Privacy */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={S.label}>Tags (comma separated)</label>
                      <input style={S.input} value={postForm.tags} onChange={e => updatePost('tags', e.target.value)} placeholder="creator, youtube, tips" />
                    </div>
                    <div>
                      <label style={S.label}>Privacy</label>
                      <select style={{ ...S.input, cursor: 'pointer' }} value={postForm.privacy} onChange={e => updatePost('privacy', e.target.value)}>
                        <option value="public">Public</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Custom Thumbnail (optional)</label>
                    <div onClick={() => thumbRef.current?.click()}
                      style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: `1px dashed ${thumbFile ? '#10b981' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>🖼</span>
                      <span style={{ fontSize: 12, color: thumbFile ? '#6ee7b7' : '#6b7280' }}>{thumbFile ? `✓ ${thumbFile.name}` : 'Upload custom thumbnail (1280×720 recommended)'}</span>
                      <input ref={thumbRef} type="file" accept="image/*" onChange={e => setThumbFile(e.target.files[0])} style={{ display: 'none' }} />
                    </div>
                  </div>
                </>
              )}

              {/* Community post fields */}
              {postType === 'community' && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>Community Post Text</label>
                    <textarea style={{ ...S.input, minHeight: 120, resize: 'vertical' }} value={postForm.communityText} onChange={e => updatePost('communityText', e.target.value)} placeholder="Share an update, tip, or announcement with your community..." />
                  </div>
                  <div style={{ marginBottom: 14, padding: '12px 16px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 700, marginBottom: 8 }}>+ Add Poll Options (optional)</div>
                    {postForm.pollOptions.map((opt, i) => (
                      <input key={i} style={{ ...S.input, marginBottom: 8, fontSize: 13 }} value={opt} onChange={e => { const o = [...postForm.pollOptions]; o[i] = e.target.value; updatePost('pollOptions', o) }} placeholder={`Option ${i + 1}...`} />
                    ))}
                    {postForm.pollOptions.length < 5 && (
                      <button onClick={() => updatePost('pollOptions', [...postForm.pollOptions, ''])} style={{ ...S.btn, fontSize: 12, padding: '5px 12px', background: 'transparent', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                        + Add option
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Backend note */}
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, fontSize: 12, color: '#fbbf24' }}>
                ⚠ YouTube OAuth must be connected in Settings for direct upload. Otherwise the video will be saved as draft.
              </div>

              {/* Submit */}
              <button onClick={handlePost} disabled={posting || posted}
                style={{ ...S.btn, width: '100%', padding: '13px', fontSize: 14, fontWeight: 700,
                  background: posted ? 'rgba(16,185,129,0.15)' : posting ? 'rgba(239,68,68,0.4)' : 'linear-gradient(135deg,#ff4444,#ef4444)',
                  color: posted ? '#6ee7b7' : '#fff',
                  border: posted ? '1px solid rgba(16,185,129,0.3)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: posted || posting ? 'none' : '0 4px 16px rgba(239,68,68,0.35)',
                }}>
                {posting ? (
                  <>
                    <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity=".3"/><path d="M12 3a9 9 0 019 9"/></svg>
                    Uploading to YouTube...
                  </>
                ) : posted ? (
                  '✓ Posted Successfully!'
                ) : (
                  `▶ Post ${postType === 'community' ? 'Community Update' : postType === 'short' ? 'YouTube Short' : 'Video'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────
function VideoRow({ v }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14 }}>
      {/* Thumb */}
      <div style={{ width: 96, height: 54, borderRadius: 10, background: v.thumb + '33', border: `1px solid ${v.thumb}44`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 20 }}>🎬</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f5', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#4b5563' }}>
          <span>{v.date}</span>
          <span>{v.duration}</span>
          <span style={{ padding: '1px 7px', borderRadius: 100, background: v.status === 'public' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${v.status === 'public' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`, color: v.status === 'public' ? '#6ee7b7' : '#fbbf24', fontWeight: 700 }}>
            {v.status}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f5' }}>{v.views}</div>
        <div style={{ fontSize: 10, color: '#6b7280' }}>views</div>
      </div>
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f5' }}>{v.likes}</div>
        <div style={{ fontSize: 10, color: '#6b7280' }}>likes</div>
      </div>
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f5' }}>{v.comments}</div>
        <div style={{ fontSize: 10, color: '#6b7280' }}>comments</div>
      </div>
    </div>
  )
}

function ShortCard({ v }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ height: 140, background: v.thumb + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, position: 'relative' }}>
        ⚡
        <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '2px 7px', background: 'rgba(0,0,0,0.6)', borderRadius: 6, fontSize: 10, color: '#fff', fontWeight: 700 }}>{v.duration}</div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f5', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{v.title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280' }}>
          <span>👁 {v.views}</span>
          <span>👍 {v.likes}</span>
        </div>
      </div>
    </div>
  )
}