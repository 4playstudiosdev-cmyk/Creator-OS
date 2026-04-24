// src/pages/TikTokPage.jsx
// TikTok Studio for Nexora OS

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  Upload, Play, BarChart2, Eye, Heart, MessageCircle,
  Share2, CheckCircle, AlertCircle, Loader, RefreshCw,
  ArrowUpRight, Users, Clock, TrendingUp, Film, Globe, Lock
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
  const d = new Date(typeof ts === 'number' ? ts * 1000 : ts)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const TT_COLOR = '#FE2C55'
const TT_GRAD  = 'linear-gradient(135deg,#FE2C55,#25F4EE)'
const card     = { background: 'rgba(15,26,20,0.6)', border: '1px solid rgba(254,44,85,0.12)', borderRadius: 14, padding: 22 }
const lbl      = { fontSize: 13, fontWeight: 600, color: '#FDA4AF', display: 'block', marginBottom: 6 }
const inp      = { width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(254,44,85,0.15)', borderRadius: 10, color: '#FFE4E6', fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'border-color .18s' }
const ta       = { ...inp, resize: 'vertical', minHeight: 100 }
const tabBtn   = (a) => ({ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13, border: 'none', fontFamily: 'inherit', transition: 'all .15s', background: a ? TT_COLOR : 'rgba(254,44,85,0.08)', color: a ? '#fff' : '#FDA4AF' })
const ttBtn    = (dis) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 16px', background: dis ? 'rgba(254,44,85,0.2)' : TT_COLOR, color: '#fff', border: 'none', borderRadius: 10, cursor: dis ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', marginTop: 14 })
const statCard = { background: 'rgba(254,44,85,0.05)', border: '1px solid rgba(254,44,85,0.1)', borderRadius: 12, padding: '16px 18px' }

const TtIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
)

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TikTokPage() {
  const [tab,      setTab]      = useState('upload')
  const [userId,   setUserId]   = useState(null)
  const [ttStatus, setTtStatus] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const uid = session.user.id
      setUserId(uid)
      checkStatus(uid)
    })
  }, [])

  const checkStatus = async (uid) => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/tiktok/status/${uid}`)
      setTtStatus(await r.json())
    } catch { setTtStatus({ connected: false }) }
    setLoading(false)
  }

  const handleConnect    = () => { if (!userId) return; window.location.href = `${API}/api/tiktok/auth?user_id=${userId}` }
  const handleDisconnect = async () => {
    await fetch(`${API}/api/tiktok/disconnect/${userId}`, { method: 'DELETE' })
    setTtStatus({ connected: false })
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14 }}>
      <div style={{ width: 38, height: 38, border: '3px solid rgba(254,44,85,0.15)', borderTopColor: TT_COLOR, borderRadius: '50%', animation: 'sp .8s linear infinite' }} />
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!ttStatus?.connected) return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      <div style={{ ...card, maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#010101', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: TT_COLOR }}>
          <TtIcon />
        </div>
        <h2 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Connect TikTok</h2>
        <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 28px', lineHeight: 1.6 }}>
          Connect your TikTok account to upload videos, view analytics, and manage your content from Nexora OS.
        </p>
        <button onClick={handleConnect} style={{ ...ttBtn(false), width: 'auto', padding: '12px 32px', margin: '0 auto' }}>
          <TtIcon /> Connect TikTok
        </button>
        <p style={{ fontSize: 11, color: '#6B7280', marginTop: 12 }}>Sandbox mode — test with authorized accounts</p>
      </div>
    </div>
  )

  const tabs = [
    { key: 'upload',    label: 'Upload',    icon: <Upload size={14} />     },
    { key: 'videos',    label: 'My Videos', icon: <Play size={14} />       },
    { key: 'analytics', label: 'Analytics', icon: <BarChart2 size={14} /> },
  ]

  return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", color: '#FFE4E6' }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}} @keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {ttStatus.avatar
            ? <img src={ttStatus.avatar} alt="" style={{ width: 46, height: 46, borderRadius: '50%', border: `2px solid ${TT_COLOR}` }} />
            : <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#010101', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TT_COLOR }}><TtIcon /></div>}
          <div>
            <h1 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>
              @{ttStatus.username || ttStatus.display_name || 'TikTok'}
            </h1>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>TikTok Studio</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => checkStatus(userId)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(254,44,85,0.08)', border: '1px solid rgba(254,44,85,0.2)', borderRadius: 8, color: TT_COLOR, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
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

      {tab === 'upload'    && <UploadTab    userId={userId} ttStatus={ttStatus} />}
      {tab === 'videos'    && <VideosTab    userId={userId} />}
      {tab === 'analytics' && <AnalyticsTab userId={userId} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD TAB
// ─────────────────────────────────────────────────────────────────────────────
function UploadTab({ userId, ttStatus }) {
  const [title,      setTitle]      = useState('')
  const [videoFile,  setVideoFile]  = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [privacy,    setPrivacy]    = useState('SELF_ONLY')
  const [disableDuet,    setDisableDuet]    = useState(false)
  const [disableStitch,  setDisableStitch]  = useState(false)
  const [disableComment, setDisableComment] = useState(false)
  const [state,      setState]      = useState('idle')
  const [msg,        setMsg]        = useState('')
  const [result,     setResult]     = useState(null)
  const fileRef = useRef()

  const onFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setVideoFile(f); setPreview(URL.createObjectURL(f))
  }

  const uploadToSupabase = async (file) => {
    const ext  = file.name.split('.').pop() || 'mp4'
    const name = `tiktok/${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('posts').upload(name, file, { upsert: true, contentType: file.type })
    if (error) throw new Error('Upload failed: ' + error.message)
    return supabase.storage.from('posts').getPublicUrl(name).data.publicUrl
  }

  const handlePost = async () => {
    if (!videoFile) { setMsg('Select a video first.'); setState('error'); return }
    if (!title.trim()) { setMsg('Add a title/caption.'); setState('error'); return }
    setState('loading'); setMsg('')

    try {
      // Upload to Supabase first to get public URL
      const videoUrl = await uploadToSupabase(videoFile)

      const r = await fetch(`${API}/api/tiktok/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:         userId,
          title,
          video_url:       videoUrl,
          privacy,
          disable_duet:    disableDuet,
          disable_stitch:  disableStitch,
          disable_comment: disableComment,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Upload failed.')
      setState('success'); setResult(d)
    } catch (e) { setState('error'); setMsg(e.message) }
  }

  const reset = () => { setState('idle'); setMsg(''); setResult(null); setTitle(''); setVideoFile(null); setPreview(null) }

  const privacyOpts = [
    { value: 'SELF_ONLY',              label: '🔒 Only Me',       desc: 'Private' },
    { value: 'MUTUAL_FOLLOW_FRIENDS',  label: '👥 Mutual Follows', desc: 'Friends' },
    { value: 'FOLLOWER_OF_CREATOR',    label: '👤 Followers',      desc: 'Followers' },
    { value: 'PUBLIC_TO_EVERYONE',     label: '🌐 Everyone',       desc: 'Public' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'start' }}>
      <div style={card}>
        <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 18px' }}>Upload to TikTok</h3>

        {state === 'success' ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <CheckCircle size={44} color="#00E5A0" style={{ display: 'block', margin: '0 auto 14px' }} />
            <p style={{ color: '#00E5A0', fontWeight: 700, fontSize: 15, margin: '0 0 8px' }}>Uploaded to TikTok! 🎉</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 16px' }}>Open TikTok app to review and publish</p>
            <button onClick={reset} style={{ padding: '9px 20px', background: 'none', border: '1px solid rgba(254,44,85,0.3)', borderRadius: 8, color: '#FDA4AF', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Upload Another
            </button>
          </div>
        ) : (
          <>
            {/* Video upload */}
            <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onFile} />
            {preview ? (
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <video src={preview} style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 12, background: '#000', border: '1px solid rgba(254,44,85,0.2)' }} controls />
                <button onClick={() => { setVideoFile(null); setPreview(null) }}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()}
                style={{ border: '2px dashed rgba(254,44,85,0.25)', borderRadius: 12, padding: '32px', textAlign: 'center', cursor: 'pointer', marginBottom: 14 }}
                onMouseEnter={e => e.currentTarget.style.borderColor='rgba(254,44,85,0.5)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='rgba(254,44,85,0.25)'}>
                <Film size={32} style={{ display: 'block', margin: '0 auto 10px', color: 'rgba(254,44,85,0.4)' }} />
                <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Click to select video</p>
                <p style={{ color: '#6B7280', fontSize: 11, margin: '4px 0 0' }}>MP4, MOV • Max 4GB • 9:16 vertical best</p>
              </div>
            )}

            {/* Title/Caption */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>
                Caption / Title
                <span style={{ float: 'right', fontWeight: 400, color: title.length > 140 ? '#F87171' : '#6B7280' }}>{title.length}/150</span>
              </label>
              <textarea style={{ ...ta, minHeight: 80 }} value={title}
                onChange={e => setTitle(e.target.value.slice(0, 150))}
                placeholder="Write your TikTok caption... Add hashtags! 🎵&#10;#fyp #viral #nexoraos"
                onFocus={e => e.target.style.borderColor='rgba(254,44,85,0.5)'}
                onBlur={e => e.target.style.borderColor='rgba(254,44,85,0.15)'} />
            </div>

            {/* Privacy */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Who Can View</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                {privacyOpts.map(o => (
                  <div key={o.value} onClick={() => setPrivacy(o.value)}
                    style={{ padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      border: `1px solid ${privacy===o.value ? 'rgba(254,44,85,0.5)' : 'rgba(254,44,85,0.12)'}`,
                      background: privacy===o.value ? 'rgba(254,44,85,0.1)' : 'transparent',
                      color: privacy===o.value ? '#FDA4AF' : '#9CA3AF' }}>
                    {o.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Options</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  [disableDuet,    setDisableDuet,    'Disable Duet'],
                  [disableStitch,  setDisableStitch,  'Disable Stitch'],
                  [disableComment, setDisableComment, 'Disable Comments'],
                ].map(([val, setVal, label]) => (
                  <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#9CA3AF' }}>
                    <input type="checkbox" checked={val} onChange={e => setVal(e.target.checked)}
                      style={{ accentColor: TT_COLOR, width: 15, height: 15 }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {state === 'error' && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', marginBottom: 12 }}>
                <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#F87171', lineHeight: 1.5 }}>{msg}</span>
              </div>
            )}

            {state === 'loading' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ height: 4, background: 'rgba(254,44,85,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: '60%', background: TT_GRAD, borderRadius: 2, animation: 'slide 1.5s ease infinite' }} />
                </div>
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>Uploading video...</p>
              </div>
            )}

            <button style={ttBtn(state === 'loading')} onClick={handlePost} disabled={state === 'loading'}>
              {state === 'loading'
                ? <><Loader size={15} style={{ animation: 'sp .7s linear infinite' }} /> Uploading...</>
                : <><TtIcon /> Upload to TikTok</>}
            </button>

            <p style={{ fontSize: 11, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
              Video uploads as draft — open TikTok app to review and publish
            </p>
          </>
        )}
      </div>

      {/* Tips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={card}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>🎵 TikTok Tips</h4>
          {[
            'Vertical 9:16 ratio is mandatory',
            'First 3 seconds must hook viewers',
            'Use trending sounds in TikTok app',
            'Post 1-4 times per day',
            'Captions help accessibility + SEO',
            'Use 3-5 relevant hashtags',
            '#fyp and #foryou boost reach',
            'Best time: 7-9PM local time',
          ].map(t => (
            <p key={t} style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 7px', paddingLeft: 12, borderLeft: '2px solid rgba(254,44,85,0.3)', lineHeight: 1.5 }}>{t}</p>
          ))}
        </div>
        <div style={card}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>📋 Specs</h4>
          {[['Aspect Ratio','9:16 vertical'],['Min Resolution','720p'],['Max File Size','4 GB'],['Max Length','10 min'],['Formats','MP4, MOV, WEBM']].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid rgba(254,44,85,0.06)' }}>
              <span style={{ color: '#9CA3AF' }}>{k}</span>
              <span style={{ color: '#FDA4AF', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MY VIDEOS TAB
// ─────────────────────────────────────────────────────────────────────────────
function VideosTab({ userId }) {
  const [videos,  setVideos]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch(`${API}/api/tiktok/videos/${userId}`)
      .then(r => r.json())
      .then(d => { setVideos(d.videos || []); if (d.error) setError(d.error); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [userId])

  if (loading) return <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading videos...</div>

  return (
    <div style={card}>
      <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>
        My TikToks ({videos.length})
      </h3>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: '#FBBF24', margin: 0 }}>ℹ️ {error}</p>
        </div>
      )}

      {videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
          <Play size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: .3 }} />
          No videos found
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {videos.map(v => (
            <a key={v.id} href={v.url} target="_blank" rel="noopener"
              style={{ textDecoration: 'none', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(254,44,85,0.1)', display: 'block', transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(254,44,85,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(254,44,85,0.1)'}>
              {v.cover && <img src={v.cover} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />}
              <div style={{ padding: '10px 12px' }}>
                {v.title && <p style={{ fontSize: 12, color: '#FFE4E6', margin: '0 0 7px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11, color: '#9CA3AF' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={10} />{fmt(v.views)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={10} />{fmt(v.likes)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MessageCircle size={10} />{fmt(v.comments)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Share2 size={10} />{fmt(v.shares)}</span>
                </div>
                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 5 }}>{timeAgo(v.created)}</div>
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
    fetch(`${API}/api/tiktok/profile/${userId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [userId])

  if (loading) return <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading analytics...</div>
  if (error)   return <div style={{ color: '#F87171', padding: 16, background: 'rgba(248,113,113,0.08)', borderRadius: 10 }}>Error: {error}</div>
  if (!data)   return null

  const stats = [
    { label: 'Followers', value: fmt(data.followers), color: '#FE2C55', icon: <Users size={16}/> },
    { label: 'Following', value: fmt(data.following), color: '#25F4EE', icon: <TrendingUp size={16}/> },
    { label: 'Likes',     value: fmt(data.likes),     color: '#FDA4AF', icon: <Heart size={16}/> },
    { label: 'Videos',    value: fmt(data.videos),    color: '#FDE68A', icon: <Film size={16}/> },
  ]

  return (
    <div>
      {/* Profile */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        {data.avatar && <img src={data.avatar} alt="" style={{ width: 60, height: 60, borderRadius: '50%', border: `3px solid ${TT_COLOR}` }} />}
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>@{data.username}</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#FDA4AF', marginTop: 2 }}>{data.display_name}</div>
          {data.bio && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, maxWidth: 400 }}>{data.bio}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {data.verified && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(254,44,85,0.1)', border: '1px solid rgba(254,44,85,0.25)', color: '#FDA4AF', fontWeight: 700 }}>✓ Verified</span>}
            {data.website && <a href={data.website} target="_blank" rel="noopener" style={{ fontSize: 12, color: '#25F4EE', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}><ArrowUpRight size={11} /> {data.website}</a>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={statCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color, marginBottom: 8 }}>
              {s.icon}
              <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Note about analytics */}
      <div style={{ ...card }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>📊 Detailed Analytics</h4>
        <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.7, margin: '0 0 14px' }}>
          Per-video analytics (views, watch time, traffic sources) are available in{' '}
          <a href="https://www.tiktok.com/creator-center/analytics" target="_blank" rel="noopener" style={{ color: '#25F4EE', textDecoration: 'none' }}>TikTok Creator Center →</a>
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="https://www.tiktok.com/creator-center/analytics" target="_blank" rel="noopener"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: TT_COLOR, borderRadius: 9, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            <ArrowUpRight size={13} /> Open Creator Center
          </a>
        </div>
      </div>
    </div>
  )
}