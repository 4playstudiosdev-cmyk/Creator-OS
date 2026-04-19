// src/pages/YouTubeStudio.jsx
// Complete YouTube Studio — Upload, Community, Videos (privacy edit), Analytics, Comments+Video Detail

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  Youtube, Upload, Users, BarChart2, MessageCircle,
  CheckCircle, AlertCircle, Loader, RefreshCw,
  Play, Eye, ThumbsUp, Clock, Send, Image,
  Calendar, Lock, Globe, EyeOff, ChevronLeft,
  TrendingUp, Tag, Hash, ArrowUpRight
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

// Get browser timezone offset in minutes (e.g. PKT = -300)
const getBrowserOffset = () => new Date().getTimezoneOffset()

const card    = { background: 'rgba(15,26,20,0.6)', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 14, padding: 22 }
const lbl     = { fontSize: 13, fontWeight: 600, color: '#9DC4B0', display: 'block', marginBottom: 6 }
const inp     = { width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 10, color: '#D8EEE5', fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'border-color .18s' }
const ta      = { ...inp, resize: 'vertical', minHeight: 90 }
const tabBtn  = (a) => ({ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13, border: 'none', fontFamily: 'inherit', transition: 'all .15s', background: a ? '#FF0000' : 'rgba(255,0,0,0.08)', color: a ? '#fff' : '#9DC4B0' })
const redBtn  = (dis) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 16px', background: dis ? 'rgba(255,0,0,0.3)' : '#FF0000', color: '#fff', border: 'none', borderRadius: 10, cursor: dis ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', marginTop: 14 })
const statCard = { background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.1)', borderRadius: 12, padding: '16px 18px' }

export default function YouTubeStudio() {
  const [tab,     setTab]     = useState('upload')
  const [userId,  setUserId]  = useState(null)
  const [ytStatus,setYtStatus]= useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const uid = session.user.id
      setUserId(uid)
      const params = new URLSearchParams(window.location.search)
      if (params.get('connected') === 'true') {
        window.history.replaceState({}, '', '/youtube')
      }
      checkStatus(uid)
    })
  }, [])

  const checkStatus = async (uid) => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/youtube/status/${uid}`)
      setYtStatus(await r.json())
    } catch {
      setYtStatus({ connected: false, error: 'Cannot reach backend' })
    }
    setLoading(false)
  }

  const handleConnect    = () => { if (!userId) return; window.location.href = `${API}/api/youtube/auth?user_id=${userId}` }
  const handleDisconnect = async () => {
    if (!userId) return
    await fetch(`${API}/api/youtube/disconnect/${userId}`, { method: 'DELETE' })
    setYtStatus({ connected: false })
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14 }}>
      <div style={{ width: 38, height: 38, border: '3px solid rgba(255,0,0,0.15)', borderTopColor: '#FF0000', borderRadius: '50%', animation: 'sp .8s linear infinite' }} />
      <p style={{ color: '#4A6357', fontSize: 13 }}>Loading YouTube Studio...</p>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!ytStatus?.connected) return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      <div style={{ ...card, maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Youtube size={32} color="#FF0000" />
        </div>
        <h2 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Connect YouTube</h2>
        <p style={{ fontSize: 14, color: '#7A9E8E', margin: '0 0 28px', lineHeight: 1.6 }}>
          Connect your YouTube channel to upload videos, post to Community, view analytics, and manage comments.
        </p>
        <button onClick={handleConnect} style={{ ...redBtn(false), width: 'auto', padding: '12px 32px', margin: '0 auto' }}>
          <Youtube size={16} /> Connect YouTube Channel
        </button>
        {ytStatus?.error && <p style={{ fontSize: 12, color: '#F87171', marginTop: 12 }}>{ytStatus.error}</p>}
      </div>
    </div>
  )

  const tabs = [
    { key: 'upload',    label: 'Upload',    icon: <Upload size={14} />      },
    { key: 'community', label: 'Community', icon: <Users size={14} />       },
    { key: 'videos',    label: 'My Videos', icon: <Play size={14} />        },
    { key: 'analytics', label: 'Analytics', icon: <BarChart2 size={14} />   },
    { key: 'inbox',     label: 'Comments',  icon: <MessageCircle size={14}/> },
  ]

  return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", color: '#D8EEE5' }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {ytStatus.channel_thumb
            ? <img src={ytStatus.channel_thumb} alt="" style={{ width: 46, height: 46, borderRadius: '50%', border: '2px solid #FF0000' }} />
            : <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Youtube size={22} color="#FF0000" /></div>}
          <div>
            <h1 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{ytStatus.channel_name || 'YouTube Studio'}</h1>
            <p style={{ fontSize: 13, color: '#7A9E8E', margin: 0 }}>
              {fmt(ytStatus.subscribers)} subscribers
              {ytStatus.expired && <span style={{ color: '#F87171', marginLeft: 8 }}>⚠ Token expired — reconnect</span>}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => checkStatus(userId)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.15)', borderRadius: 8, color: '#FF0000', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          {ytStatus.expired && (
            <button onClick={handleConnect}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#FF0000', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Reconnect
            </button>
          )}
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

      {tab === 'upload'    && <UploadTab    userId={userId} />}
      {tab === 'community' && <CommunityTab userId={userId} />}
      {tab === 'videos'    && <VideosTab    userId={userId} />}
      {tab === 'analytics' && <AnalyticsTab userId={userId} />}
      {tab === 'inbox'     && <InboxTab     userId={userId} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD TAB — timezone fix
// ─────────────────────────────────────────────────────────────────────────────
function UploadTab({ userId }) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [tags,        setTags]        = useState('')
  const [privacy,     setPrivacy]     = useState('private')
  const [scheduleAt,  setScheduleAt]  = useState('')
  const [file,        setFile]        = useState(null)
  const [state,       setState]       = useState('idle')
  const [msg,         setMsg]         = useState('')
  const [result,      setResult]      = useState(null)
  const [progress,    setProgress]    = useState(0)
  const fileRef = useRef()

  // Get local timezone info for display
  const tzOffset = getBrowserOffset()
  const tzHours  = -tzOffset / 60
  const tzLabel  = `UTC${tzHours >= 0 ? '+' : ''}${tzHours}`

  const handleUpload = async () => {
    if (!title.trim()) { setMsg('Title is required.'); setState('error'); return }
    if (!file) { setMsg('Please select a video file.'); setState('error'); return }
    if (privacy === 'scheduled' && !scheduleAt) { setMsg('Please set schedule date/time.'); setState('error'); return }

    setState('loading'); setMsg(''); setProgress(0)

    const form = new FormData()
    form.append('user_id', userId)
    form.append('title', title)
    form.append('description', description)
    form.append('tags', tags)
    form.append('privacy', privacy)
    form.append('scheduled_at', scheduleAt)
    form.append('timezone_offset', String(tzOffset)) // send browser offset to backend
    form.append('file', file)

    try {
      const progressInterval = setInterval(() => setProgress(p => Math.min(p + 4, 88)), 1200)
      const res = await fetch(`${API}/api/youtube/upload-video`, { method: 'POST', body: form })
      clearInterval(progressInterval)
      setProgress(100)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload failed.')
      setState('success'); setResult(data)
    } catch (e) { setState('error'); setMsg(e.message); setProgress(0) }
  }

  const privacyOptions = [
    { value: 'public',    label: 'Public',   icon: <Globe size={13} />,   desc: 'Publish immediately'   },
    { value: 'private',   label: 'Draft',    icon: <Lock size={13} />,    desc: 'Save as draft'         },
    { value: 'unlisted',  label: 'Unlisted', icon: <EyeOff size={13} />,  desc: 'Link only'             },
    { value: 'scheduled', label: 'Schedule', icon: <Calendar size={13}/>, desc: 'Auto-publish at time'  },
  ]

  const reset = () => { setState('idle'); setMsg(''); setResult(null); setTitle(''); setDescription(''); setTags(''); setFile(null); setPrivacy('private'); setScheduleAt(''); setProgress(0) }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'start' }}>
      <div style={card}>
        <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 18px' }}>Upload Video</h3>

        {state === 'success' ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <CheckCircle size={44} color="#00E5A0" style={{ display: 'block', margin: '0 auto 14px' }} />
            <p style={{ color: '#00E5A0', fontWeight: 700, fontSize: 15, margin: '0 0 8px' }}>
              {result?.status === 'scheduled' ? 'Video Scheduled! 📅' : result?.status === 'private' ? 'Saved as Draft! 📝' : 'Video Published! 🎉'}
            </p>
            {result?.url && <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#60A5FA', textDecoration: 'none', display: 'block', marginBottom: 16 }}>View on YouTube →</a>}
            <button onClick={reset} style={{ padding: '9px 20px', background: 'none', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, color: '#9DC4B0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Upload Another</button>
          </div>
        ) : (
          <>
            {/* File zone */}
            <div onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed rgba(255,0,0,0.2)', borderRadius: 10, padding: '24px', textAlign: 'center', cursor: 'pointer', marginBottom: 16 }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(255,0,0,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,0,0,0.2)'}>
              <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { setFile(e.target.files[0]); setState('idle'); setMsg('') }} />
              {file ? (
                <div><Play size={24} color="#FF0000" style={{ display: 'block', margin: '0 auto 8px' }} />
                  <p style={{ color: '#D8EEE5', fontSize: 13, margin: 0, fontWeight: 600 }}>{file.name}</p>
                  <p style={{ color: '#4A6357', fontSize: 11, margin: '4px 0 0' }}>{(file.size/1024/1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <><Upload size={26} color="#4A6357" style={{ display: 'block', margin: '0 auto 10px' }} />
                  <p style={{ color: '#4A6357', fontSize: 13, margin: 0 }}>Click to select video</p>
                  <p style={{ color: '#4A6357', fontSize: 11, margin: '5px 0 0' }}>MP4, MOV, AVI • Max 128GB</p></>
              )}
            </div>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Title <span style={{ float: 'right', fontWeight: 400, color: title.length > 90 ? '#F87171' : '#4A6357' }}>{title.length}/100</span></label>
              <input style={inp} value={title} onChange={e => setTitle(e.target.value.slice(0, 100))} placeholder="Video title..."
                onFocus={e => e.target.style.borderColor='rgba(255,0,0,0.4)'} onBlur={e => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Description</label>
              <textarea style={ta} value={description} onChange={e => setDescription(e.target.value)} placeholder="Add timestamps, links, hashtags..."
                onFocus={e => e.target.style.borderColor='rgba(255,0,0,0.4)'} onBlur={e => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Tags <span style={{ fontWeight: 400, color: '#4A6357' }}>(comma separated)</span></label>
              <input style={inp} value={tags} onChange={e => setTags(e.target.value)} placeholder="nexora, creator, tutorial"
                onFocus={e => e.target.style.borderColor='rgba(255,0,0,0.4)'} onBlur={e => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
            </div>

            {/* Privacy */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Visibility</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {privacyOptions.map(opt => (
                  <div key={opt.value} onClick={() => setPrivacy(opt.value)}
                    style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${privacy===opt.value ? 'rgba(255,0,0,0.4)' : 'rgba(0,229,160,0.1)'}`, background: privacy===opt.value ? 'rgba(255,0,0,0.08)' : 'transparent', transition: 'all .15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: privacy===opt.value ? '#FF0000' : '#9DC4B0', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                      {opt.icon} {opt.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#4A6357' }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule — timezone aware */}
            {privacy === 'scheduled' && (
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>
                  Schedule Date & Time
                  <span style={{ float: 'right', fontWeight: 400, color: '#00E5A0' }}>Your local time ({tzLabel})</span>
                </label>
                <input style={inp} type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                  onFocus={e => e.target.style.borderColor='rgba(255,0,0,0.4)'} onBlur={e => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
                <p style={{ fontSize: 11, color: '#4A6357', marginTop: 5 }}>
                  ✅ Enter your local time — Nexora automatically converts to UTC for YouTube.
                </p>
              </div>
            )}

            {/* Progress */}
            {state === 'loading' && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#7A9E8E' }}>
                  <span>Uploading to YouTube...</span><span>{progress}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: '#FF0000', borderRadius: 3, transition: 'width .5s' }} />
                </div>
              </div>
            )}

            {/* Error */}
            {state === 'error' && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', marginBottom: 12 }}>
                <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#F87171' }}>{msg}</span>
              </div>
            )}

            <button style={redBtn(state === 'loading')} onClick={handleUpload} disabled={state === 'loading'}>
              {state === 'loading'
                ? <><Loader size={15} style={{ animation: 'sp .7s linear infinite' }} /> Uploading...</>
                : <><Upload size={15} /> {privacy==='scheduled' ? 'Schedule Video' : privacy==='private' ? 'Save as Draft' : 'Publish Video'}</>}
            </button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={card}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>📹 Upload Tips</h4>
          {[['Best format','MP4 (H.264)'],['Resolution','1080p or 4K'],['Max size','128 GB'],['Thumbnail','Add after in YT Studio'],['Chapters','Use timestamps in desc']].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,0,0,0.06)', fontSize: 12 }}>
              <span style={{ color: '#7A9E8E' }}>{k}</span><span style={{ color: '#D8EEE5', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>🕐 Schedule Timezone</h4>
          <p style={{ fontSize: 13, color: '#00E5A0', fontWeight: 700, marginBottom: 6 }}>Your timezone: {tzLabel}</p>
          <p style={{ fontSize: 12, color: '#7A9E8E', lineHeight: 1.6 }}>
            Enter your <strong style={{ color: '#D8EEE5' }}>local time</strong> — Nexora converts it automatically to UTC for YouTube. No manual conversion needed.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY TAB
// ─────────────────────────────────────────────────────────────────────────────
function CommunityTab({ userId }) {
  const [text,     setText]     = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [state,    setState]    = useState('idle')
  const [msg,      setMsg]      = useState('')

  const handlePost = async () => {
    if (!text.trim()) { setMsg('Write something.'); setState('error'); return }
    setState('loading'); setMsg('')
    try {
      const r = await fetch(`${API}/api/youtube/community-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, text, image_url: imageUrl || undefined }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Failed to post.')
      setState('success')
    } catch (e) { setState('error'); setMsg(e.message) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'start' }}>
      <div style={card}>
        <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 18px' }}>Community Post</h3>

        {state === 'success' ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <CheckCircle size={44} color="#00E5A0" style={{ display: 'block', margin: '0 auto 14px' }} />
            <p style={{ color: '#00E5A0', fontWeight: 700, fontSize: 15 }}>Community Post Published! 🎉</p>
            <button onClick={() => { setState('idle'); setMsg(''); setText(''); setImageUrl('') }}
              style={{ display: 'block', margin: '16px auto 0', padding: '9px 20px', background: 'none', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, color: '#9DC4B0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Post Again
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Post Text <span style={{ float: 'right', fontWeight: 400, color: text.length > 2800 ? '#F87171' : '#4A6357' }}>{text.length}/3000</span></label>
              <textarea style={{ ...ta, minHeight: 120 }} value={text} onChange={e => setText(e.target.value.slice(0, 3000))}
                placeholder="Share an update, behind-the-scenes, ask a question..."
                onFocus={e => e.target.style.borderColor='rgba(255,0,0,0.4)'} onBlur={e => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}><Image size={12} style={{ display: 'inline', marginRight: 4 }} /> Image URL (optional)</label>
              <input style={inp} value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onFocus={e => e.target.style.borderColor='rgba(255,0,0,0.4)'} onBlur={e => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
            </div>
            {state === 'error' && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', marginBottom: 12 }}>
                <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#F87171', lineHeight: 1.5 }}>{msg}</span>
              </div>
            )}
            <button style={redBtn(state === 'loading')} onClick={handlePost} disabled={state === 'loading'}>
              {state === 'loading' ? 'Posting...' : <><Send size={15} /> Post to Community</>}
            </button>
          </>
        )}
      </div>
      <div style={card}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>📢 Community Tips</h4>
        {['Requires 500+ subscribers to post','Text-only posts perform great','Share behind-the-scenes content','Ask questions to boost engagement','Announce new videos before publishing','Max 3000 characters per post'].map(t => (
          <p key={t} style={{ fontSize: 12, color: '#7A9E8E', margin: '0 0 7px', paddingLeft: 12, borderLeft: '2px solid rgba(255,0,0,0.2)', lineHeight: 1.5 }}>{t}</p>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MY VIDEOS TAB — with privacy edit
// ─────────────────────────────────────────────────────────────────────────────
function VideosTab({ userId }) {
  const [videos,        setVideos]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [updatingId,    setUpdatingId]    = useState(null)
  const [updateMsg,     setUpdateMsg]     = useState({})

  useEffect(() => {
    fetch(`${API}/api/youtube/videos/${userId}`)
      .then(r => r.json())
      .then(d => { setVideos(d.videos || []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [userId])

  const updatePrivacy = async (videoId, newPrivacy) => {
    setUpdatingId(videoId)
    try {
      const r = await fetch(`${API}/api/youtube/update-video`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, video_id: videoId, privacy: newPrivacy }),
      })
      const d = await r.json()
      if (r.ok) {
        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, status: newPrivacy } : v))
        setUpdateMsg({ ...updateMsg, [videoId]: '✅ Updated!' })
        setTimeout(() => setUpdateMsg(m => { const n = {...m}; delete n[videoId]; return n }), 2000)
      } else {
        setUpdateMsg({ ...updateMsg, [videoId]: `❌ ${d.detail}` })
      }
    } catch (e) {
      setUpdateMsg({ ...updateMsg, [videoId]: `❌ ${e.message}` })
    }
    setUpdatingId(null)
  }

  if (loading) return <div style={{ color: '#4A6357', textAlign: 'center', padding: 48 }}>Loading videos...</div>
  if (error)   return <div style={{ color: '#F87171', padding: 16, background: 'rgba(248,113,113,0.08)', borderRadius: 10 }}>Error: {error}</div>

  const privacyColor = (s) => s === 'public' ? '#00E5A0' : s === 'private' ? '#F87171' : '#FBBF24'

  return (
    <div style={card}>
      <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>
        My Videos ({videos.length})
      </h3>
      {videos.length === 0 && <div style={{ textAlign: 'center', padding: '32px 0', color: '#4A6357' }}>No videos found</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {videos.map(v => (
          <div key={v.id} style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,229,160,0.06)', transition: 'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='rgba(255,0,0,0.2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.06)'}>
            {/* Thumbnail */}
            {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: 128, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <a href={v.url} target="_blank" rel="noopener"
                style={{ fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                {v.title}
              </a>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#7A9E8E', marginBottom: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={11} />{fmt(v.views)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><ThumbsUp size={11} />{fmt(v.likes)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MessageCircle size={11} />{fmt(v.comments)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />{timeAgo(v.published_at)}</span>
              </div>

              {/* Privacy selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#7A9E8E' }}>Visibility:</span>
                {['public', 'private', 'unlisted'].map(p => (
                  <button key={p} onClick={() => updatePrivacy(v.id, p)} disabled={updatingId === v.id || v.status === p}
                    style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: v.status === p || updatingId === v.id ? 'default' : 'pointer', fontFamily: 'inherit', border: 'none',
                      background: v.status === p ? (p==='public' ? 'rgba(0,229,160,0.15)' : p==='private' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)') : 'rgba(255,255,255,0.05)',
                      color: v.status === p ? privacyColor(p) : '#4A6357',
                      opacity: updatingId === v.id && v.status !== p ? 0.5 : 1,
                    }}>
                    {p === 'public' ? '🌐' : p === 'private' ? '🔒' : '🔗'} {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
                {updatingId === v.id && <span style={{ fontSize: 11, color: '#7A9E8E' }}>Updating...</span>}
                {updateMsg[v.id] && <span style={{ fontSize: 11, color: updateMsg[v.id].startsWith('✅') ? '#00E5A0' : '#F87171' }}>{updateMsg[v.id]}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
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
    fetch(`${API}/api/youtube/analytics/${userId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [userId])

  if (loading) return <div style={{ color: '#4A6357', textAlign: 'center', padding: 48 }}>Loading analytics...</div>
  if (error)   return <div style={{ color: '#F87171', padding: 16, background: 'rgba(248,113,113,0.08)', borderRadius: 10 }}>Error: {error}</div>
  if (!data)   return null

  const { channel, recent_videos } = data
  const stats = [
    { label: 'Subscribers', value: fmt(channel.subscribers), icon: <Users size={17} />,      color: '#FF0000' },
    { label: 'Total Views',  value: fmt(channel.total_views), icon: <Eye size={17} />,        color: '#60A5FA' },
    { label: 'Videos',       value: fmt(channel.video_count), icon: <Play size={17} />,       color: '#A78BFA' },
    { label: 'Country',      value: channel.country || '—',   icon: <BarChart2 size={17} />,  color: '#FBBF24' },
  ]

  return (
    <div>
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <img src={channel.thumbnail} alt="" style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid #FF0000' }} />
        <div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>{channel.name}</div>
          {channel.description && <div style={{ fontSize: 12, color: '#7A9E8E', marginTop: 3 }}>{channel.description.slice(0, 120)}</div>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={statCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: s.color }}>{s.icon}<span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#7A9E8E' }}>{s.label}</span></div>
            <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={card}>
        <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 14px' }}>Recent Videos Performance</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
          {(recent_videos || []).map(v => (
            <a key={v.id} href={v.url} target="_blank" rel="noopener"
              style={{ textDecoration: 'none', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,0,0,0.08)', display: 'block', transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(255,0,0,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,0,0,0.08)'}>
              {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: '100%', height: 90, objectFit: 'cover' }} />}
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#D8EEE5', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#7A9E8E' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={10} />{fmt(v.views)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><ThumbsUp size={10} />{fmt(v.likes)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INBOX TAB — comments with full video detail panel
// ─────────────────────────────────────────────────────────────────────────────
function InboxTab({ userId }) {
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState(null)
  const [reply,      setReply]      = useState('')
  const [sending,    setSending]    = useState(false)
  const [sent,       setSent]       = useState({})
  const [videoDetail,setVideoDetail]= useState({})  // videoId → detail
  const [loadingVid, setLoadingVid] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/youtube/comments/${userId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  const selectComment = async (c) => {
    setSelected(c); setReply('')
    // Load video detail if not already loaded
    if (!videoDetail[c.video_id]) {
      setLoadingVid(c.video_id)
      try {
        const r = await fetch(`${API}/api/youtube/video-detail/${userId}/${c.video_id}`)
        const d = await r.json()
        setVideoDetail(prev => ({ ...prev, [c.video_id]: d }))
      } catch {}
      setLoadingVid(null)
    }
  }

  const sendReply = async (commentId) => {
    if (!reply.trim()) return
    setSending(true)
    try {
      const r = await fetch(`${API}/api/youtube/reply-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, comment_id: commentId, text: reply }),
      })
      if (r.ok) { setSent({ ...sent, [commentId]: true }); setReply('') }
    } catch {}
    setSending(false)
  }

  if (loading) return <div style={{ color: '#4A6357', textAlign: 'center', padding: 48 }}>Loading comments...</div>

  const comments = data?.comments || []
  const vd = selected ? videoDetail[selected.video_id] : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, alignItems: 'start' }}>

      {/* Comment list */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Comments</h3>
          <span style={{ fontSize: 11, color: '#7A9E8E' }}>{comments.length} total</span>
        </div>
        <div style={{ maxHeight: 560, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#4A6357', fontSize: 13 }}>
              <MessageCircle size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: .4 }} />
              No comments yet
            </div>
          )}
          {comments.map(c => (
            <div key={c.id} onClick={() => selectComment(c)}
              style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: selected?.id === c.id ? 'rgba(255,0,0,0.08)' : 'transparent', border: selected?.id === c.id ? '1px solid rgba(255,0,0,0.25)' : '1px solid transparent', transition: 'all .15s' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                {c.author_pic && <img src={c.author_pic} alt="" style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{c.author}</span>
                    <span style={{ fontSize: 11, color: '#4A6357' }}>{timeAgo(c.published_at)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#7A9E8E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{c.text}</div>
                </div>
              </div>
              {c.reply_count > 0 && <div style={{ fontSize: 10, color: '#4A6357', marginLeft: 32 }}>{c.reply_count} replies</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — video detail + comment + reply */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!selected ? (
          <div style={{ ...card, textAlign: 'center', padding: '48px 20px', color: '#4A6357' }}>
            <MessageCircle size={34} style={{ display: 'block', margin: '0 auto 14px', opacity: .3 }} />
            Select a comment to view video details and reply
          </div>
        ) : (
          <>
            {/* Video detail card */}
            <div style={card}>
              {loadingVid === selected.video_id ? (
                <div style={{ color: '#4A6357', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Loader size={14} style={{ animation: 'sp .7s linear infinite' }} /> Loading video details...
                </div>
              ) : vd ? (
                <>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    {vd.thumbnail && <img src={vd.thumbnail} alt="" style={{ width: 140, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href={vd.url} target="_blank" rel="noopener"
                        style={{ fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none', display: 'block', marginBottom: 4, lineHeight: 1.4 }}>
                        {vd.title} <ArrowUpRight size={12} style={{ display: 'inline', opacity: .6 }} />
                      </a>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: vd.status==='public' ? 'rgba(0,229,160,0.1)' : vd.status==='private' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)', color: vd.status==='public' ? '#00E5A0' : vd.status==='private' ? '#F87171' : '#FBBF24', fontWeight: 700 }}>
                          {vd.status}
                        </span>
                        <span style={{ fontSize: 11, color: '#4A6357' }}>⏱ {vd.duration}</span>
                        <span style={{ fontSize: 11, color: '#4A6357' }}>{timeAgo(vd.published_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: vd.tags?.length ? 12 : 0 }}>
                    {[
                      { label: 'Views',    value: fmt(vd.stats.views),    color: '#60A5FA', icon: <Eye size={13}/> },
                      { label: 'Likes',    value: fmt(vd.stats.likes),    color: '#F87171', icon: <ThumbsUp size={13}/> },
                      { label: 'Comments', value: fmt(vd.stats.comments), color: '#A78BFA', icon: <MessageCircle size={13}/> },
                    ].map(s => (
                      <div key={s.label} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: s.color, marginBottom: 4 }}>{s.icon}</div>
                        <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: '#4A6357' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  {vd.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {vd.tags.slice(0, 8).map(t => (
                        <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.1)', color: '#7A9E8E' }}>#{t}</span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <a href={`https://youtube.com/watch?v=${selected.video_id}`} target="_blank" rel="noopener"
                  style={{ fontSize: 13, color: '#60A5FA', textDecoration: 'none' }}>
                  View video on YouTube →
                </a>
              )}
            </div>

            {/* Comment + reply */}
            <div style={card}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                {selected.author_pic && <img src={selected.author_pic} alt="" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{selected.author}</div>
                  <div style={{ fontSize: 11, color: '#4A6357' }}>{timeAgo(selected.published_at)} · {selected.likes} likes</div>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,229,160,0.08)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#D8EEE5', lineHeight: 1.65, marginBottom: 12 }}>
                {selected.text}
              </div>

              {/* Existing replies */}
              {selected.replies?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: '#4A6357', marginBottom: 8, fontWeight: 700 }}>REPLIES ({selected.replies.length})</p>
                  {selected.replies.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', marginBottom: 4 }}>
                      {r.author_pic && <img src={r.author_pic} alt="" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }} />}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9DC4B0' }}>{r.author}</div>
                        <div style={{ fontSize: 12, color: '#7A9E8E', lineHeight: 1.5 }}>{r.text}</div>
                      </div>
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
                    onFocus={e => e.target.style.borderColor='rgba(255,0,0,0.4)'}
                    onBlur={e => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
                  <button style={redBtn(sending)} onClick={() => sendReply(selected.id)} disabled={sending}>
                    {sending ? 'Sending...' : <><Send size={14} /> Send Reply</>}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}