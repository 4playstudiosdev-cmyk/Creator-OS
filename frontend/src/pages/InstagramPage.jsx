// InstagramPage.jsx
// Railway backend: https://creator-os-production-0bf8.up.railway.app
// Images: Supabase Storage bucket "posts" (must be PUBLIC)
//
// Add to App.jsx:
//   import InstagramPage from './pages/InstagramPage'
//   <Route path="/instagram" element={<InstagramPage />} />
//
// Add to Layout.jsx navItems:
//   { name: 'Instagram', path: '/instagram', icon: Instagram }

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  Instagram, Send, Image, BarChart2, Inbox,
  Heart, MessageCircle, Eye, Users, RefreshCw,
  CheckCircle, AlertCircle, Upload, BookImage,
  TrendingUp, ArrowUpRight, Loader
} from 'lucide-react'

// ── Your Railway backend URL ──────────────────────────────────────────────────
const API = 'https://creator-os-production-0bf8.up.railway.app'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
const timeAgo = (ts) => {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)   return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const card    = { background:'rgba(15,26,20,0.6)', border:'1px solid rgba(0,229,160,0.1)', borderRadius:14, padding:22 }
const lbl     = { fontSize:13, fontWeight:600, color:'#9DC4B0', display:'block', marginBottom:6 }
const inp     = { width:'100%', padding:'10px 14px', boxSizing:'border-box', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(0,229,160,0.12)', borderRadius:10, color:'#D8EEE5', fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color .18s' }
const ta      = { ...inp, minHeight:110, resize:'vertical' }
const tabBtn  = (a) => ({ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, cursor:'pointer', fontWeight:600, fontSize:13, border:'none', fontFamily:'inherit', transition:'all .15s', background: a ? '#00E5A0' : 'rgba(0,229,160,0.06)', color: a ? '#070D0A' : '#9DC4B0' })
const mainBtn = (dis) => ({ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'12px 16px', background: dis ? 'rgba(0,229,160,0.35)' : '#00E5A0', color:'#070D0A', border:'none', borderRadius:10, cursor: dis ? 'not-allowed' : 'pointer', fontSize:14, fontWeight:700, fontFamily:'inherit', marginTop:14 })
const statCard= { background:'rgba(0,229,160,0.05)', border:'1px solid rgba(0,229,160,0.1)', borderRadius:12, padding:'16px 18px' }
const igGrad  = 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)'

// ── Root component ────────────────────────────────────────────────────────────
export default function InstagramPage() {
  const [tab,    setTab]    = useState('post')
  const [userId, setUserId] = useState(null)
  const [status, setStatus] = useState(null)   // {connected, username, followers}
  const [loading,setLoading]= useState(true)

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
      const r = await fetch(`${API}/api/instagram/status/${uid}`)
      setStatus(await r.json())
    } catch {
      setStatus({ connected: false, error: 'Cannot reach backend' })
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:14 }}>
      <div style={{ width:38, height:38, border:'3px solid rgba(0,229,160,0.15)', borderTopColor:'#00E5A0', borderRadius:'50%', animation:'sp .8s linear infinite' }} />
      <p style={{ color:'#4A6357', fontSize:13, fontFamily:'sans-serif' }}>Connecting to Instagram...</p>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const tabs = [
    { key:'post',      label:'Post',      icon:<Send size={14}/>      },
    { key:'story',     label:'Story',     icon:<BookImage size={14}/> },
    { key:'analytics', label:'Analytics', icon:<BarChart2 size={14}/> },
    { key:'inbox',     label:'Inbox',     icon:<Inbox size={14}/>     },
  ]

  return (
    <div style={{ fontFamily:"'Instrument Sans',system-ui,sans-serif", color:'#D8EEE5' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:46, height:46, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', background:igGrad }}>
            <Instagram size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:22, fontWeight:800, color:'#fff', margin:0, letterSpacing:'-0.02em' }}>
              Instagram Studio
            </h1>
            <p style={{ fontSize:13, color: status?.connected ? '#7A9E8E' : '#F87171', margin:0 }}>
              {status?.connected
                ? `@${status.username}  ·  ${fmt(status.followers)} followers`
                : 'Not connected — run setup SQL and add token'}
            </p>
          </div>
        </div>
        <button onClick={() => checkStatus(userId)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(0,229,160,0.08)', border:'1px solid rgba(0,229,160,0.15)', borderRadius:8, color:'#00E5A0', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} style={tabBtn(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'post'      && <PostTab      userId={userId} />}
      {tab === 'story'     && <StoryTab     userId={userId} />}
      {tab === 'analytics' && <AnalyticsTab userId={userId} />}
      {tab === 'inbox'     && <InboxTab     userId={userId} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// POST TAB
// ─────────────────────────────────────────────────────────────────────────────
function PostTab({ userId }) {
  const [caption,   setCaption]   = useState('')
  const [file,      setFile]      = useState(null)
  const [preview,   setPreview]   = useState(null)
  const [urlMode,   setUrlMode]   = useState(false)
  const [imageUrl,  setImageUrl]  = useState('')
  const [state,     setState]     = useState('idle')  // idle|loading|success|error
  const [msg,       setMsg]       = useState('')
  const [permalink, setPermalink] = useState('')
  const fileRef = useRef()

  const onFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setState('idle'); setMsg('')
  }

  const handlePost = async () => {
    if (!caption.trim())               { setMsg('Caption is required.'); setState('error'); return }
    if (!file && !imageUrl.trim())     { setMsg('Upload an image or paste a URL.'); setState('error'); return }
    setState('loading'); setMsg('')

    try {
      let finalUrl = imageUrl

      // Step 1: Upload to Supabase Storage if file selected
      if (file && !urlMode) {
        const form = new FormData()
        form.append('user_id', userId)
        form.append('file', file)
        const upRes = await fetch(`${API}/api/instagram/upload-image`, { method:'POST', body:form })
        const upData = await upRes.json()
        if (!upRes.ok) throw new Error(upData.detail || 'Upload failed. Check Supabase Storage bucket "posts" is PUBLIC.')
        finalUrl = upData.url
      }

      // Step 2: Post to Instagram
      const res = await fetch(`${API}/api/instagram/post`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ user_id: userId, caption, image_url: finalUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Post failed.')

      setState('success')
      setPermalink(data.permalink)
    } catch (e) {
      setState('error')
      setMsg(e.message)
    }
  }

  const reset = () => {
    setState('idle'); setMsg(''); setCaption('')
    setFile(null); setPreview(null); setImageUrl('')
    setPermalink('')
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }}>

      {/* Form card */}
      <div style={card}>
        <h3 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 18px' }}>
          New Instagram Post
        </h3>

        {state === 'success' ? (
          <div style={{ textAlign:'center', padding:'28px 0' }}>
            <CheckCircle size={44} color="#00E5A0" style={{ display:'block', margin:'0 auto 14px' }} />
            <p style={{ color:'#00E5A0', fontWeight:700, fontSize:15, margin:'0 0 8px' }}>Posted to Instagram! 🎉</p>
            {permalink && (
              <a href={permalink} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:13, color:'#60A5FA', textDecoration:'none' }}>
                View post on Instagram →
              </a>
            )}
            <button onClick={reset}
              style={{ display:'block', margin:'16px auto 0', padding:'9px 20px', background:'none', border:'1px solid rgba(0,229,160,0.2)', borderRadius:8, color:'#9DC4B0', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Post Again
            </button>
          </div>
        ) : (
          <>
            {/* Caption */}
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>
                Caption
                <span style={{ float:'right', fontWeight:400, color: caption.length > 2000 ? '#F87171' : '#4A6357' }}>
                  {caption.length}/2200
                </span>
              </label>
              <textarea style={ta} value={caption}
                onChange={e => setCaption(e.target.value.slice(0, 2200))}
                placeholder="Write your caption here... Add #hashtags at the end"
                onFocus={e => e.target.style.borderColor='rgba(0,229,160,0.4)'}
                onBlur={e  => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
            </div>

            {/* Image mode toggle */}
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <button style={tabBtn(!urlMode)} onClick={() => setUrlMode(false)}>Upload File</button>
              <button style={tabBtn(urlMode)}  onClick={() => setUrlMode(true)}>Paste URL</button>
            </div>

            {/* Upload zone */}
            {!urlMode ? (
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border:'2px dashed rgba(0,229,160,0.2)', borderRadius:10, padding:'22px', textAlign:'center', cursor:'pointer', marginBottom:14, transition:'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.2)'}>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png"
                  style={{ display:'none' }} onChange={onFileChange} />
                {preview
                  ? <img src={preview} alt="preview" style={{ maxHeight:130, borderRadius:8, maxWidth:'100%' }} />
                  : <>
                      <Upload size={26} color="#4A6357" style={{ display:'block', margin:'0 auto 10px' }} />
                      <p style={{ color:'#4A6357', fontSize:13, margin:0 }}>Click to upload JPG or PNG</p>
                      <p style={{ color:'#4A6357', fontSize:11, margin:'5px 0 0' }}>Square 1:1 or Portrait 4:5 recommended</p>
                    </>}
              </div>
            ) : (
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Public Image URL (must be https://)</label>
                <input style={inp} type="url" value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://your-public-image-url.com/image.jpg"
                  onFocus={e => e.target.style.borderColor='rgba(0,229,160,0.4)'}
                  onBlur={e  => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
              </div>
            )}

            {/* Error message */}
            {state === 'error' && (
              <div style={{ display:'flex', gap:8, padding:'10px 14px', borderRadius:10, background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.3)', marginBottom:12 }}>
                <AlertCircle size={15} color="#F87171" style={{ flexShrink:0, marginTop:1 }} />
                <span style={{ fontSize:13, color:'#F87171', lineHeight:1.5 }}>{msg}</span>
              </div>
            )}

            {/* Post button */}
            <button style={mainBtn(state === 'loading')}
              onClick={handlePost} disabled={state === 'loading'}>
              {state === 'loading'
                ? <><Loader size={15} style={{ animation:'sp .7s linear infinite' }} /> Posting to Instagram...</>
                : <><Send size={15}/> Post to Instagram Now</>}
              <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
            </button>
          </>
        )}
      </div>

      {/* Tips card */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={card}>
          <h4 style={{ fontSize:13, fontWeight:700, color:'#fff', margin:'0 0 12px' }}>📐 Image Requirements</h4>
          {[
            ['Format',        'JPG or PNG only'],
            ['Square 1:1',    '1080 × 1080 px'],
            ['Portrait 4:5',  '1080 × 1350 px'],
            ['Landscape',     '1080 × 566 px'],
            ['Max file size', '8 MB'],
            ['Posts per day', 'Max 25'],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(0,229,160,0.06)', fontSize:12 }}>
              <span style={{ color:'#7A9E8E' }}>{k}</span>
              <span style={{ color:'#D8EEE5', fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <h4 style={{ fontSize:13, fontWeight:700, color:'#fff', margin:'0 0 10px' }}>⚡ Caption Tips</h4>
          {[
            'First line is the hook — make it count',
            'Add 5–10 hashtags at the very end',
            'Ask a question to boost comments',
            'Keep it under 125 chars for no truncation',
            'Tag relevant accounts for more reach',
          ].map(t => (
            <p key={t} style={{ fontSize:12, color:'#7A9E8E', margin:'0 0 7px', paddingLeft:12, borderLeft:'2px solid rgba(0,229,160,0.2)', lineHeight:1.5 }}>{t}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY TAB
// ─────────────────────────────────────────────────────────────────────────────
function StoryTab({ userId }) {
  const [file,     setFile]     = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [urlMode,  setUrlMode]  = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [state,    setState]    = useState('idle')
  const [msg,      setMsg]      = useState('')
  const fileRef = useRef()

  const onFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f))
  }

  const handleStory = async () => {
    if (!file && !imageUrl.trim()) { setMsg('Upload an image or paste a URL.'); setState('error'); return }
    setState('loading'); setMsg('')
    try {
      let finalUrl = imageUrl
      if (file && !urlMode) {
        const form = new FormData()
        form.append('user_id', userId)
        form.append('file', file)
        const up = await fetch(`${API}/api/instagram/upload-image`, { method:'POST', body:form })
        const upd = await up.json()
        if (!up.ok) throw new Error(upd.detail || 'Upload failed.')
        finalUrl = upd.url
      }
      const r = await fetch(`${API}/api/instagram/story`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ user_id: userId, image_url: finalUrl }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail)
      setState('success')
    } catch (e) { setState('error'); setMsg(e.message) }
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }}>
      <div style={card}>
        <h3 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 18px' }}>Post Instagram Story</h3>

        {state === 'success' ? (
          <div style={{ textAlign:'center', padding:'28px 0' }}>
            <CheckCircle size={44} color="#00E5A0" style={{ display:'block', margin:'0 auto 14px' }} />
            <p style={{ color:'#00E5A0', fontWeight:700, fontSize:15 }}>Story Posted! 🎉</p>
            <button onClick={() => { setState('idle'); setMsg(''); setPreview(null); setFile(null); setImageUrl('') }}
              style={{ display:'block', margin:'16px auto 0', padding:'9px 20px', background:'none', border:'1px solid rgba(0,229,160,0.2)', borderRadius:8, color:'#9DC4B0', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Post Another
            </button>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <button style={tabBtn(!urlMode)} onClick={() => setUrlMode(false)}>Upload File</button>
              <button style={tabBtn(urlMode)}  onClick={() => setUrlMode(true)}>Paste URL</button>
            </div>

            {!urlMode ? (
              <div onClick={() => fileRef.current?.click()}
                style={{ border:'2px dashed rgba(0,229,160,0.2)', borderRadius:10, padding:'28px', textAlign:'center', cursor:'pointer', marginBottom:14 }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onFileChange} />
                {preview
                  ? <img src={preview} alt="" style={{ maxHeight:160, borderRadius:8, maxWidth:'100%' }} />
                  : <>
                      <BookImage size={28} color="#4A6357" style={{ display:'block', margin:'0 auto 10px' }} />
                      <p style={{ color:'#4A6357', fontSize:13, margin:0 }}>Upload story image</p>
                      <p style={{ color:'#4A6357', fontSize:11, margin:'5px 0 0' }}>9:16 (1080×1920px) works best</p>
                    </>}
              </div>
            ) : (
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Public Image URL</label>
                <input style={inp} value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://example.com/story.jpg"
                  onFocus={e => e.target.style.borderColor='rgba(0,229,160,0.4)'}
                  onBlur={e  => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
              </div>
            )}

            {state === 'error' && (
              <div style={{ fontSize:13, color:'#F87171', padding:'10px 14px', background:'rgba(248,113,113,0.08)', borderRadius:10, marginBottom:12 }}>{msg}</div>
            )}

            <button style={mainBtn(state === 'loading')} onClick={handleStory} disabled={state === 'loading'}>
              {state === 'loading' ? 'Posting Story...' : <><BookImage size={15}/> Post Story Now</>}
            </button>
          </>
        )}
      </div>

      <div style={card}>
        <h4 style={{ fontSize:13, fontWeight:700, color:'#fff', margin:'0 0 12px' }}>📱 Story Requirements</h4>
        {[
          ['Best ratio',  '9:16 vertical'],
          ['Ideal size',  '1080 × 1920 px'],
          ['Format',      'JPG or PNG'],
          ['Duration',    '24 hours'],
          ['Max size',    '8 MB'],
          ['Daily limit', 'No limit'],
        ].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(0,229,160,0.06)', fontSize:12 }}>
            <span style={{ color:'#7A9E8E' }}>{k}</span>
            <span style={{ color:'#D8EEE5', fontWeight:600 }}>{v}</span>
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
    fetch(`${API}/api/instagram/analytics/${userId}`)
      .then(r => r.json())
      .then(d  => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [userId])

  if (loading) return <div style={{ color:'#4A6357', textAlign:'center', padding:48 }}>Loading analytics...</div>
  if (error)   return <div style={{ color:'#F87171', padding:16, background:'rgba(248,113,113,0.08)', borderRadius:10 }}>Error: {error}</div>
  if (!data)   return null

  const { account, insights_30d, top_posts, recent_posts } = data

  const stats = [
    { label:'Followers',     value:fmt(account.followers),            icon:<Users size={17}/>,      color:'#00E5A0' },
    { label:'Impressions',   value:fmt(insights_30d.impressions),     icon:<Eye size={17}/>,        color:'#60A5FA' },
    { label:'Reach',         value:fmt(insights_30d.reach),           icon:<TrendingUp size={17}/>, color:'#A78BFA' },
    { label:'Profile Views', value:fmt(insights_30d.profile_views),   icon:<BarChart2 size={17}/>,  color:'#FBBF24' },
    { label:'New Followers', value:fmt(insights_30d.new_followers),   icon:<ArrowUpRight size={17}/>,color:'#34D399' },
    { label:'Total Posts',   value:fmt(account.media_count),          icon:<Image size={17}/>,      color:'#F87171' },
  ]

  return (
    <div>
      {/* Account header */}
      <div style={{ ...card, display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
        <div style={{ width:54, height:54, borderRadius:'50%', overflow:'hidden', background:'rgba(0,229,160,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {account.profile_pic
            ? <img src={account.profile_pic} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <Instagram size={24} color="#00E5A0" />}
        </div>
        <div>
          <div style={{ fontWeight:700, color:'#fff', fontSize:16 }}>@{account.username}</div>
          <div style={{ fontSize:12, color:'#7A9E8E', marginTop:3 }}>{account.bio}</div>
          {account.website && <a href={account.website} target="_blank" rel="noopener" style={{ fontSize:12, color:'#60A5FA', textDecoration:'none' }}>{account.website}</a>}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
        {stats.map(s => (
          <div key={s.label} style={statCard}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8, color:s.color }}>{s.icon}<span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'#7A9E8E' }}>{s.label}</span></div>
            <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:26, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#4A6357', marginTop:4 }}>Last 30 days</div>
          </div>
        ))}
      </div>

      {/* Top posts */}
      <div style={card}>
        <h3 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 14px' }}>Top Posts by Engagement</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))', gap:10 }}>
          {(top_posts || []).map(post => (
            <a key={post.id} href={post.permalink} target="_blank" rel="noopener"
              style={{ textDecoration:'none', borderRadius:10, overflow:'hidden', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(0,229,160,0.08)', display:'block', transition:'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.25)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.08)'}>
              <div style={{ height:135, background:'rgba(0,229,160,0.05)', overflow:'hidden' }}>
                {post.url && <img src={post.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />}
              </div>
              <div style={{ padding:'8px 10px' }}>
                <div style={{ display:'flex', gap:12, fontSize:12 }}>
                  <span style={{ color:'#F87171', display:'flex', alignItems:'center', gap:3 }}><Heart size={11}/>{fmt(post.likes)}</span>
                  <span style={{ color:'#60A5FA', display:'flex', alignItems:'center', gap:3 }}><MessageCircle size={11}/>{fmt(post.comments)}</span>
                </div>
                <div style={{ fontSize:11, color:'#4A6357', marginTop:4 }}>{timeAgo(post.timestamp)}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INBOX TAB
// ─────────────────────────────────────────────────────────────────────────────
function InboxTab({ userId }) {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [reply,    setReply]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState({})

  useEffect(() => {
    fetch(`${API}/api/instagram/inbox/${userId}?limit=30`)
      .then(r => r.json())
      .then(d  => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  const sendReply = async (cid) => {
    if (!reply.trim()) return
    setSending(true)
    try {
      const r = await fetch(`${API}/api/instagram/reply-comment`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ user_id: userId, comment_id: cid, message: reply }),
      })
      if (r.ok) { setSent({ ...sent, [cid]: true }); setReply('') }
    } catch {}
    setSending(false)
  }

  if (loading) return <div style={{ color:'#4A6357', textAlign:'center', padding:48 }}>Loading inbox...</div>

  const msgs = data?.messages || []

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:16, alignItems:'start' }}>
      {/* Message list */}
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h3 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'#fff', margin:0 }}>Messages</h3>
          <div style={{ fontSize:11, color:'#7A9E8E' }}>{data?.comments || 0} comments · {data?.dms || 0} DMs</div>
        </div>

        <div style={{ maxHeight:520, overflowY:'auto', display:'flex', flexDirection:'column', gap:2 }}>
          {msgs.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 0', color:'#4A6357', fontSize:13 }}>
              <Inbox size={28} style={{ display:'block', margin:'0 auto 10px', opacity:.4 }} />
              No messages yet
            </div>
          )}
          {msgs.map(m => (
            <div key={m.id} onClick={() => { setSelected(m); setReply('') }}
              style={{ padding:'10px 12px', borderRadius:10, cursor:'pointer', background: selected?.id === m.id ? 'rgba(0,229,160,0.1)' : 'transparent', border: selected?.id === m.id ? '1px solid rgba(0,229,160,0.25)' : '1px solid transparent', transition:'all .15s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>@{m.from}</span>
                <span style={{ fontSize:11, color:'#4A6357' }}>{timeAgo(m.timestamp)}</span>
              </div>
              <div style={{ fontSize:12, color:'#7A9E8E', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.text}</div>
              {m.type === 'dm'      && <span style={{ fontSize:10, background:'rgba(96,165,250,0.1)', color:'#60A5FA', padding:'1px 6px', borderRadius:4, display:'inline-block', marginTop:3 }}>DM</span>}
              {m.type === 'comment' && <div style={{ fontSize:10, color:'#4A6357', marginTop:3 }}>on: {m.post_caption || 'your post'}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Reply panel */}
      <div style={card}>
        {!selected ? (
          <div style={{ textAlign:'center', padding:'48px 20px', color:'#4A6357' }}>
            <Inbox size={34} style={{ display:'block', margin:'0 auto 14px', opacity:.3 }} />
            Select a message from the left to reply
          </div>
        ) : (
          <>
            <div style={{ marginBottom:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>@{selected.from}</span>
                <span style={{ fontSize:11, color:'#4A6357' }}>{timeAgo(selected.timestamp)}</span>
              </div>
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(0,229,160,0.08)', borderRadius:10, padding:'12px 14px', fontSize:14, color:'#D8EEE5', lineHeight:1.65 }}>
                {selected.text}
              </div>
              {selected.post_url && (
                <a href={selected.post_url} target="_blank" rel="noopener"
                  style={{ display:'inline-block', marginTop:7, fontSize:12, color:'#60A5FA', textDecoration:'none' }}>
                  View original post →
                </a>
              )}
            </div>

            {selected.type === 'comment' && (
              sent[selected.id] ? (
                <div style={{ display:'flex', alignItems:'center', gap:8, color:'#00E5A0', fontSize:13 }}>
                  <CheckCircle size={15}/> Reply sent!
                </div>
              ) : (
                <>
                  <label style={lbl}>Your Reply</label>
                  <textarea style={{ ...ta, minHeight:80, marginBottom:12 }}
                    value={reply} onChange={e => setReply(e.target.value)}
                    placeholder="Write your reply..."
                    onFocus={e => e.target.style.borderColor='rgba(0,229,160,0.4)'}
                    onBlur={e  => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
                  <button style={mainBtn(sending)} onClick={() => sendReply(selected.id)} disabled={sending}>
                    {sending ? 'Sending...' : <><Send size={14}/> Send Reply</>}
                  </button>
                </>
              )
            )}

            {selected.type === 'dm' && (
              <div style={{ padding:'12px 14px', background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:10, fontSize:13, color:'#FBBF24', lineHeight:1.6 }}>
                <strong>DM replies</strong> require <code style={{ fontSize:11, background:'rgba(251,191,36,0.1)', padding:'1px 5px', borderRadius:4 }}>instagram_manage_messages</code> permission which needs Meta app review. This becomes available when your app goes live.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}