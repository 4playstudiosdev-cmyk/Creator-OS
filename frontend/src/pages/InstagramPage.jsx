// src/pages/InstagramPage.jsx
// Complete Instagram Studio for Nexora OS
// Uses Instagram Platform API 2024 — No Facebook Page needed

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  Instagram, Upload, Image, BarChart2, MessageCircle,
  CheckCircle, AlertCircle, Loader, RefreshCw,
  Eye, ThumbsUp, Clock, Send, ArrowUpRight,
  Users, Heart, Film, Grid
} from 'lucide-react'

const API = 'https://creator-os-production-0bf8.up.railway.app'

const fmt = (n) => {
  if (!n && n !== 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const timeAgo = (ts) => {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

// ── Styles ────────────────────────────────────────────────────────────────────
const igGrad  = 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'
const card    = { background: 'rgba(188,24,136,0.04)', border: '1px solid rgba(188,24,136,0.15)', borderRadius: 14, padding: 22 }
const lbl     = { fontSize: 13, fontWeight: 600, color: '#F9A8D4', display: 'block', marginBottom: 6 }
const inp     = { width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(188,24,136,0.2)', borderRadius: 10, color: '#F3E8FF', fontSize: 14, outline: 'none', fontFamily: 'inherit' }
const ta      = { ...inp, resize: 'vertical', minHeight: 100 }
const tabBtn  = (a) => ({ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13, border: 'none', fontFamily: 'inherit', transition: 'all .15s', background: a ? '#bc1888' : 'rgba(188,24,136,0.1)', color: a ? '#fff' : '#F9A8D4' })
const igBtn   = (dis) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 16px', background: dis ? 'rgba(188,24,136,0.3)' : igGrad, color: '#fff', border: 'none', borderRadius: 10, cursor: dis ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', marginTop: 14 })

const IgIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)

// ── Main ──────────────────────────────────────────────────────────────────────
export default function InstagramPage() {
  const [tab,      setTab]      = useState('post')
  const [userId,   setUserId]   = useState(null)
  const [igStatus, setIgStatus] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const uid = session.user.id
      setUserId(uid)

      const params = new URLSearchParams(window.location.search)
      if (params.get('connected') === 'true') {
        window.history.replaceState({}, '', '/instagram')
      }
      checkStatus(uid)
    })
  }, [])

  const checkStatus = async (uid) => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/instagram/status/${uid}`)
      setIgStatus(await r.json())
    } catch {
      setIgStatus({ connected: false })
    }
    setLoading(false)
  }

  const handleConnect    = () => { if (!userId) return; window.location.href = `${API}/api/instagram/auth?user_id=${userId}` }
  const handleDisconnect = async () => {
    await fetch(`${API}/api/instagram/disconnect/${userId}`, { method: 'DELETE' })
    setIgStatus({ connected: false })
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14 }}>
      <div style={{ width: 38, height: 38, border: '3px solid rgba(188,24,136,0.15)', borderTopColor: '#bc1888', borderRadius: '50%', animation: 'sp .8s linear infinite' }} />
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // Not connected
  if (!igStatus?.connected) return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      <div style={{ ...card, maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: igGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <IgIcon />
        </div>
        <h2 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
          Connect Instagram
        </h2>
        <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 28px', lineHeight: 1.6 }}>
          Connect your Instagram Business or Creator account to post, manage comments, view analytics — all from Nexora OS.
        </p>
        <button onClick={handleConnect} style={{ ...igBtn(false), width: 'auto', padding: '12px 32px', margin: '0 auto' }}>
          <IgIcon /> Connect Instagram
        </button>
        <p style={{ fontSize: 11, color: '#6B7280', marginTop: 14 }}>
          Requires Business or Creator account
        </p>
      </div>
    </div>
  )

  const tabs = [
    { key: 'post',      label: 'New Post',  icon: <Upload size={14} />       },
    { key: 'feed',      label: 'My Posts',  icon: <Grid size={14} />          },
    { key: 'analytics', label: 'Analytics', icon: <BarChart2 size={14} />    },
    { key: 'inbox',     label: 'Comments',  icon: <MessageCircle size={14} /> },
  ]

  return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", color: '#F3E8FF' }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {igStatus.picture
            ? <img src={igStatus.picture} alt="" style={{ width: 46, height: 46, borderRadius: '50%', border: '2px solid #bc1888' }} />
            : <div style={{ width: 46, height: 46, borderRadius: '50%', background: igGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IgIcon /></div>}
          <div>
            <h1 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>
              @{igStatus.username || igStatus.name || 'Instagram'}
            </h1>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Instagram Studio</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => checkStatus(userId)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(188,24,136,0.08)', border: '1px solid rgba(188,24,136,0.2)', borderRadius: 8, color: '#F9A8D4', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={handleDisconnect}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8, color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Disconnect
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} style={tabBtn(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'post'      && <PostTab      userId={userId} igStatus={igStatus} />}
      {tab === 'feed'      && <FeedTab      userId={userId} />}
      {tab === 'analytics' && <AnalyticsTab userId={userId} />}
      {tab === 'inbox'     && <InboxTab     userId={userId} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// POST TAB
// ─────────────────────────────────────────────────────────────────────────────
function PostTab({ userId, igStatus }) {
  const [caption,    setCaption]    = useState('')
  const [imageFile,  setImageFile]  = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [postType,   setPostType]   = useState('post') // post | story
  const [state,      setState]      = useState('idle')
  const [msg,        setMsg]        = useState('')
  const [result,     setResult]     = useState(null)
  const fileRef = useRef()

  const handleFileSelect = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setImageFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const uploadToSupabase = async (file) => {
    const ext      = file.name.split('.').pop() || 'jpg'
    const filename = `instagram/${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('posts').upload(filename, file, { upsert: true, contentType: file.type })
    if (error) throw new Error('Upload failed: ' + error.message)
    const { data } = supabase.storage.from('posts').getPublicUrl(filename)
    return data.publicUrl
  }

  const handlePost = async () => {
    if (!imageFile) { setMsg('Select an image first.'); setState('error'); return }
    if (postType === 'post' && !caption.trim()) { setMsg('Write a caption.'); setState('error'); return }
    setState('loading'); setMsg('')

    try {
      const imageUrl = await uploadToSupabase(imageFile)

      const endpoint = postType === 'story' ? '/api/instagram/story' : '/api/instagram/post'
      const body     = postType === 'story'
        ? { user_id: userId, image_url: imageUrl }
        : { user_id: userId, caption, image_url: imageUrl }

      const r = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Post failed.')
      setState('success'); setResult(d)
    } catch (e) { setState('error'); setMsg(e.message) }
  }

  const reset = () => { setState('idle'); setMsg(''); setResult(null); setCaption(''); setImageFile(null); setPreview(null) }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'start' }}>
      <div style={card}>
        <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 18px' }}>
          New Instagram Post
        </h3>

        {state === 'success' ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <CheckCircle size={44} color="#00E5A0" style={{ display: 'block', margin: '0 auto 14px' }} />
            <p style={{ color: '#00E5A0', fontWeight: 700, fontSize: 15, margin: '0 0 8px' }}>
              {postType === 'story' ? 'Story Posted! 🎉' : 'Posted to Instagram! 🎉'}
            </p>
            {result?.permalink && (
              <a href={result.permalink} target="_blank" rel="noopener"
                style={{ fontSize: 13, color: '#F9A8D4', textDecoration: 'none', display: 'block', marginBottom: 14 }}>
                View on Instagram →
              </a>
            )}
            <button onClick={reset} style={{ padding: '9px 20px', background: 'none', border: '1px solid rgba(188,24,136,0.3)', borderRadius: 8, color: '#F9A8D4', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Post Again
            </button>
          </div>
        ) : (
          <>
            {/* Post type selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['post', '📸 Feed Post'], ['story', '⭕ Story']].map(([v, l]) => (
                <div key={v} onClick={() => setPostType(v)}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600,
                    border: `1px solid ${postType===v ? 'rgba(188,24,136,0.5)' : 'rgba(188,24,136,0.15)'}`,
                    background: postType===v ? 'rgba(188,24,136,0.15)' : 'transparent',
                    color: postType===v ? '#F9A8D4' : '#9CA3AF' }}>
                  {l}
                </div>
              ))}
            </div>

            {/* Image upload */}
            <div style={{ marginBottom: 14 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
              {preview ? (
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <img src={preview} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(188,24,136,0.2)' }} />
                  <button onClick={() => { setImageFile(null); setPreview(null) }}
                    style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>
                    ×
                  </button>
                  <button onClick={() => fileRef.current?.click()}
                    style={{ position: 'absolute', bottom: 8, right: 8, padding: '5px 10px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11, borderRadius: 6, fontFamily: 'inherit' }}>
                    Change
                  </button>
                </div>
              ) : (
                <div onClick={() => fileRef.current?.click()}
                  style={{ border: '2px dashed rgba(188,24,136,0.25)', borderRadius: 12, padding: '32px', textAlign: 'center', cursor: 'pointer', marginBottom: 8 }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='rgba(188,24,136,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='rgba(188,24,136,0.25)'}>
                  <Image size={32} color="rgba(188,24,136,0.4)" style={{ display: 'block', margin: '0 auto 10px' }} />
                  <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Click to select image</p>
                  <p style={{ color: '#6B7280', fontSize: 11, margin: '4px 0 0' }}>
                    {postType === 'story' ? 'Best: 9:16 ratio (1080×1920)' : 'Best: 1:1 square (1080×1080)'}
                  </p>
                </div>
              )}
            </div>

            {/* Caption — only for feed posts */}
            {postType === 'post' && (
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>
                  Caption
                  <span style={{ float: 'right', fontWeight: 400, color: caption.length > 2100 ? '#F87171' : '#6B7280' }}>{caption.length}/2200</span>
                </label>
                <textarea style={{ ...ta, minHeight: 120 }} value={caption}
                  onChange={e => setCaption(e.target.value.slice(0, 2200))}
                  placeholder="Write your caption... Add hashtags at the end &#10;&#10;#nexoraos #creator #content"
                  onFocus={e => e.target.style.borderColor='rgba(188,24,136,0.5)'}
                  onBlur={e => e.target.style.borderColor='rgba(188,24,136,0.2)'} />
              </div>
            )}

            {state === 'error' && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', marginBottom: 12 }}>
                <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#F87171', lineHeight: 1.5 }}>{msg}</span>
              </div>
            )}

            {state === 'loading' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ height: 4, background: 'rgba(188,24,136,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: '60%', background: igGrad, borderRadius: 2, animation: 'slide 1.5s ease infinite' }} />
                </div>
                <style>{`@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>Uploading and posting...</p>
              </div>
            )}

            <button style={igBtn(state === 'loading')} onClick={handlePost} disabled={state === 'loading'}>
              {state === 'loading'
                ? <><Loader size={15} style={{ animation: 'sp .7s linear infinite' }} /> Posting...</>
                : postType === 'story' ? '⭕ Post Story' : '📸 Post to Instagram'}
            </button>
          </>
        )}
      </div>

      {/* Tips */}
      <div style={card}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>📸 Instagram Tips</h4>
        {(postType === 'story' ? [
          '9:16 ratio works best (1080×1920)',
          'Stories disappear after 24 hours',
          'Add polls/questions in Instagram app',
          'Post stories 2-3x per day',
          'Behind the scenes gets high views',
        ] : [
          'Square (1080×1080) gets best reach',
          'First 125 chars of caption visible',
          'Add 5-10 hashtags for reach',
          'Post Tue-Fri 9AM-11AM best time',
          'Reply to comments within 1 hour',
          'Carousels get 3x more engagement',
        ]).map(t => (
          <p key={t} style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 8px', paddingLeft: 12, borderLeft: '2px solid rgba(188,24,136,0.3)', lineHeight: 1.5 }}>{t}</p>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FEED TAB — My Posts
// ─────────────────────────────────────────────────────────────────────────────
function FeedTab({ userId }) {
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/instagram/media/${userId}?limit=20`)
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  if (loading) return <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading posts...</div>

  const typeIcon = (t) => t === 'VIDEO' ? '🎥' : t === 'CAROUSEL_ALBUM' ? '🖼️' : '📸'

  return (
    <div style={card}>
      <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>
        My Posts ({posts.length})
      </h3>
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>
          <Grid size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: .3 }} />
          No posts found
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {posts.map(p => (
            <a key={p.id} href={p.permalink} target="_blank" rel="noopener"
              style={{ textDecoration: 'none', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(188,24,136,0.1)', display: 'block', transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(188,24,136,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(188,24,136,0.1)'}>
              {p.url && (
                <div style={{ position: 'relative' }}>
                  <img src={p.url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 14 }}>{typeIcon(p.type)}</span>
                </div>
              )}
              <div style={{ padding: '8px 10px' }}>
                {p.caption && <p style={{ fontSize: 12, color: '#D1D5DB', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption}</p>}
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#9CA3AF' }}>
                  <span>❤️ {fmt(p.likes)}</span>
                  <span>💬 {fmt(p.comments)}</span>
                  <span>{timeAgo(p.timestamp)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS TAB
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsTab({ userId }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch(`${API}/api/instagram/analytics/${userId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [userId])

  if (loading) return <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading analytics...</div>
  if (error)   return <div style={{ color: '#F87171', padding: 16 }}>Error: {error}</div>
  if (!data)   return null

  const { account, recent_posts, top_posts } = data

  const stats = [
    { label: 'Followers',  value: fmt(account.followers),   color: '#F9A8D4', icon: <Users size={16}/> },
    { label: 'Following',  value: fmt(account.following),   color: '#C4B5FD', icon: <Heart size={16}/> },
    { label: 'Posts',      value: fmt(account.media_count), color: '#FDE68A', icon: <Grid size={16}/> },
    { label: 'Type',       value: account.type || 'Business', color: '#6EE7B7', icon: <BarChart2 size={16}/> },
  ]

  return (
    <div>
      {/* Profile */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        {account.picture && <img src={account.picture} alt="" style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid #bc1888' }} />}
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>@{account.username}</div>
          {account.bio && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3, maxWidth: 400 }}>{account.bio.slice(0, 100)}</div>}
          {account.website && (
            <a href={account.website} target="_blank" rel="noopener"
              style={{ fontSize: 12, color: '#F9A8D4', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <ArrowUpRight size={11} /> {account.website}
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'rgba(188,24,136,0.05)', border: '1px solid rgba(188,24,136,0.12)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color, marginBottom: 8 }}>{s.icon}<span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</span></div>
            <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Top posts */}
      {top_posts?.length > 0 && (
        <div style={card}>
          <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 14px' }}>
            🔥 Top Posts by Engagement
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {top_posts.map(p => (
              <a key={p.id} href={p.permalink} target="_blank" rel="noopener"
                style={{ textDecoration: 'none', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(188,24,136,0.1)', display: 'block' }}>
                {p.url && <img src={p.url} alt="" style={{ width: '100%', height: 130, objectFit: 'cover' }} />}
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#9CA3AF' }}>
                    <span>❤️ {fmt(p.likes)}</span>
                    <span>💬 {fmt(p.comments)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INBOX / COMMENTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function InboxTab({ userId }) {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [reply,    setReply]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState({})
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    fetch(`${API}/api/instagram/inbox/${userId}?limit=100`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  const sendReply = async (commentId) => {
    if (!reply.trim()) return
    setSending(true)
    try {
      const r = await fetch(`${API}/api/instagram/reply-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, comment_id: commentId, message: reply }),
      })
      if (r.ok) { setSent({ ...sent, [commentId]: true }); setReply('') }
    } catch {}
    setSending(false)
  }

  if (loading) return <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading comments...</div>

  const all        = data?.messages || []
  const responded  = all.filter(c => c.replied || sent[c.id])
  const unresponded= all.filter(c => !c.replied && !sent[c.id])
  const displayed  = filter === 'all' ? all : filter === 'responded' ? responded : unresponded

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16, alignItems: 'start' }}>
      {/* Comment list */}
      <div style={card}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Comments</h3>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{all.length} total</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              ['all',         'All',       all.length,         '156,163,175'],
              ['unresponded', '🔴 Pending', unresponded.length, '248,113,113'],
              ['responded',   '✅ Done',    responded.length,   '0,229,160'],
            ].map(([k, l, cnt, rgb]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                  background: filter===k ? `rgba(${rgb},0.15)` : 'rgba(255,255,255,0.04)',
                  color: filter===k ? `rgb(${rgb})` : '#6B7280' }}>
                {l} ({cnt})
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxHeight: 500, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {displayed.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280', fontSize: 13 }}>
              <MessageCircle size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: .3 }} />
              No comments
            </div>
          )}
          {displayed.map(c => (
            <div key={c.id} onClick={() => { setSelected(c); setReply('') }}
              style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                background: selected?.id === c.id ? 'rgba(188,24,136,0.1)' : 'transparent',
                border: selected?.id === c.id ? '1px solid rgba(188,24,136,0.3)' : '1px solid transparent',
                transition: 'all .15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F9A8D4' }}>@{c.from}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {(c.replied || sent[c.id])
                    ? <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 100, background: 'rgba(0,229,160,0.1)', color: '#00E5A0', fontWeight: 700 }}>✓ replied</span>
                    : <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 100, background: 'rgba(248,113,113,0.1)', color: '#F87171', fontWeight: 700 }}>pending</span>}
                  <span style={{ fontSize: 10, color: '#6B7280' }}>{timeAgo(c.timestamp)}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</div>
              {c.post_caption && <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>on: {c.post_caption}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Reply panel */}
      <div style={card}>
        {!selected ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6B7280' }}>
            <MessageCircle size={34} style={{ display: 'block', margin: '0 auto 14px', opacity: .3 }} />
            Select a comment to reply
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F9A8D4' }}>@{selected.from}</span>
                <span style={{ fontSize: 11, color: '#6B7280' }}>{timeAgo(selected.timestamp)}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(188,24,136,0.15)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#F3E8FF', lineHeight: 1.65, marginBottom: 8 }}>
                {selected.text}
              </div>
              {selected.post_url && (
                <a href={selected.post_url} target="_blank" rel="noopener"
                  style={{ fontSize: 12, color: '#F9A8D4', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowUpRight size={11} /> View post on Instagram
                </a>
              )}
            </div>

            {/* Existing replies */}
            {selected.replies?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 8, fontWeight: 700 }}>REPLIES ({selected.replies.length})</p>
                {selected.replies.map((r, i) => (
                  <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#F9A8D4' }}>@{r.username}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{r.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply box */}
            {sent[selected.id] ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00E5A0', fontSize: 13 }}>
                <CheckCircle size={15} /> Reply sent!
              </div>
            ) : (
              <>
                <label style={lbl}>Your Reply</label>
                <textarea style={{ ...ta, minHeight: 72, marginBottom: 10 }}
                  value={reply} onChange={e => setReply(e.target.value)}
                  placeholder="Write your reply..."
                  onFocus={e => e.target.style.borderColor='rgba(188,24,136,0.5)'}
                  onBlur={e => e.target.style.borderColor='rgba(188,24,136,0.2)'} />
                <button style={igBtn(sending)} onClick={() => sendReply(selected.id)} disabled={sending}>
                  {sending ? 'Sending...' : <><Send size={14} /> Reply</>}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}