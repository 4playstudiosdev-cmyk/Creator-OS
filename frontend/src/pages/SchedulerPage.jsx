// src/pages/SchedulerPage.jsx
// Nexora OS — Smart Content Scheduler
// Post Now | Schedule | Draft — YouTube, Instagram, LinkedIn, TikTok, Twitter(soon), Facebook(soon)

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const API = 'https://creator-os-production-0bf8.up.railway.app'

// ── Theme ──────────────────────────────────────────────────────────────────
const DARK = {
  bg:'#0A0A0F',card:'#111318',cardAlt:'#1A1D24',border:'rgba(255,255,255,0.07)',
  borderGold:'rgba(245,200,66,0.15)',gold:'#F5C842',goldBg:'rgba(245,200,66,0.08)',
  text:'#FFFFFF',textSub:'#E2E8F0',textMuted:'#64748B',
  success:'#4ADE80',successBg:'rgba(74,222,128,0.1)',
  danger:'#FB7185',dangerBg:'rgba(251,113,133,0.1)',
  info:'#38BDF8',input:'#1A1D24',inputBorder:'rgba(255,255,255,0.1)',
}
const LIGHT = {
  bg:'#FFFDF5',card:'#FFFFFF',cardAlt:'#FEF9E7',border:'rgba(0,0,0,0.08)',
  borderGold:'rgba(180,130,0,0.2)',gold:'#D97706',goldBg:'#FEF3C7',
  text:'#1C1917',textSub:'#44403C',textMuted:'#A8A29E',
  success:'#16A34A',successBg:'#F0FDF4',
  danger:'#E11D48',dangerBg:'#FFF1F2',
  info:'#0284C7',input:'#FFFFFF',inputBorder:'rgba(0,0,0,0.12)',
}

// ── Platforms config ───────────────────────────────────────────────────────
const PLATFORMS = [
  { id:'youtube',   label:'YouTube',   color:'#FF0000', icon:'▶', types:['video'], comingSoon:false },
  { id:'instagram', label:'Instagram', color:'#E1306C', icon:'📸', types:['post','story'], comingSoon:false },
  { id:'linkedin',  label:'LinkedIn',  color:'#0A66C2', icon:'in', types:['post','video'], comingSoon:false },
  { id:'tiktok',    label:'TikTok',    color:'#FE2C55', icon:'♪', types:['video'], comingSoon:false },
  { id:'twitter',   label:'Twitter/X', color:'#1DA1F2', icon:'𝕏', types:['tweet'], comingSoon:true },
  { id:'facebook',  label:'Facebook',  color:'#1877F2', icon:'f', types:['post'], comingSoon:true },
]

const CONTENT_TYPES = {
  youtube:   [{ id:'video', label:'📹 Video' }],
  instagram: [{ id:'post', label:'📸 Post' }, { id:'story', label:'⭕ Story' }],
  linkedin:  [{ id:'post', label:'📝 Post' }, { id:'video', label:'🎥 Video' }],
  tiktok:    [{ id:'video', label:'🎵 Video' }],
  twitter:   [{ id:'tweet', label:'🐦 Tweet' }],
  facebook:  [{ id:'post', label:'📝 Post' }],
}

const AI_TIMES = {
  youtube:   '6:00 PM',
  instagram: '9:00 AM',
  linkedin:  '8:00 AM',
  tiktok:    '7:00 PM',
  twitter:   '12:00 PM',
  facebook:  '3:00 PM',
}

const AI_TIME_REASONS = {
  youtube:   'Peak watch time for your audience',
  instagram: 'Highest engagement window Tue–Fri',
  linkedin:  'Professional morning scroll',
  tiktok:    'Evening FYP algorithm peak',
  twitter:   'Lunch break browsing spike',
  facebook:  'Afternoon engagement peak',
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function SchedulerPage() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => localStorage.getItem('nexora-theme')||'dark')
  const T = theme==='dark' ? DARK : LIGHT

  const [userId,      setUserId]      = useState(null)
  const [connected,   setConnected]   = useState({}) // { youtube: true, ... }
  const [view,        setView]        = useState('compose') // compose | calendar
  const [calDate,     setCalDate]     = useState(new Date())

  // Compose state
  const [selPlatform, setSelPlatform] = useState('youtube')
  const [selType,     setSelType]     = useState('video')
  const [caption,     setCaption]     = useState('')
  const [file,        setFile]        = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [schedDate,   setSchedDate]   = useState('')
  const [schedTime,   setSchedTime]   = useState('')
  const [useAiTime,   setUseAiTime]   = useState(true)
  const [privacy,     setPrivacy]     = useState('public')
  const [action,      setAction]      = useState('schedule') // schedule | now | draft
  const [posting,     setPosting]     = useState(false)
  const [postResult,  setPostResult]  = useState(null)
  const [postError,   setPostError]   = useState('')

  // Calendar state
  const [calPosts,    setCalPosts]    = useState([])
  const [calLoading,  setCalLoading]  = useState(false)

  const fileRef = useRef()

  useEffect(() => {
    localStorage.setItem('nexora-theme', theme)
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const uid = session.user.id
      setUserId(uid)
      checkConnections(uid)
      loadCalendarPosts(uid)
    })
  }, [])

  useEffect(() => {
    // Reset content type when platform changes
    const types = CONTENT_TYPES[selPlatform]
    setSelType(types[0].id)
    setFile(null); setFilePreview(null); setPostResult(null); setPostError('')
  }, [selPlatform])

  const checkConnections = async (uid) => {
    const result = {}
    await Promise.allSettled([
      fetch(`${API}/api/youtube/status/${uid}`).then(r=>r.json()).then(d=>{ result.youtube=d.connected }),
      fetch(`${API}/api/instagram/status/${uid}`).then(r=>r.json()).then(d=>{ result.instagram=d.connected }),
      fetch(`${API}/api/linkedin/status/${uid}`).then(r=>r.json()).then(d=>{ result.linkedin=d.connected }),
      fetch(`${API}/api/tiktok/status/${uid}`).then(r=>r.json()).then(d=>{ result.tiktok=d.connected }),
    ])
    setConnected(result)
  }

  const loadCalendarPosts = async (uid) => {
    setCalLoading(true)
    try {
      // Only load last 3 months + next 3 months for performance
      const from = new Date(); from.setMonth(from.getMonth() - 1)
      const to   = new Date(); to.setMonth(to.getMonth() + 3)
      const { data } = await supabase.from('scheduled_posts')
        .select('id, platforms, platform, content, caption, title, status, scheduled_for, scheduled_at, content_type, media_url')
        .eq('user_id', uid)
        .order('scheduled_for', { ascending: true })
        .limit(200)
      setCalPosts(data || [])
    } catch (e) { console.error('[Calendar] Load error:', e) }
    setCalLoading(false)
  }

  const onFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setFilePreview(URL.createObjectURL(f))
  }

  const getEffectiveTime = () => {
    if (useAiTime) return AI_TIMES[selPlatform]
    return schedTime
  }

  const buildScheduledFor = () => {
    if (!schedDate) return null
    const time = useAiTime ? AI_TIMES[selPlatform] : schedTime
    if (!time) return null
    try {
      return new Date(`${schedDate} ${time}`).toISOString()
    } catch { return null }
  }

  const saveToSupabase = async (status, scheduledFor = null, mediaUrl = null) => {
    if (!userId) return
    const { error } = await supabase.from('scheduled_posts').insert({
      user_id:      userId,
      platforms:    [selPlatform],
      content:      caption,
      caption:      caption,
      status:       status,
      scheduled_for: scheduledFor,
      privacy:      privacy,
      media_url:    mediaUrl || null,
      created_at:   new Date().toISOString(),
    })
    if (error) console.error('[Scheduler] Save error:', error)
    else loadCalendarPosts(userId)
  }

  const handlePost = async () => {
    const plat = PLATFORMS.find(p => p.id === selPlatform)
    if (!connected[selPlatform] && !plat?.comingSoon) {
      setPostError(`Connect ${plat?.label} first in Settings.`); return
    }
    if (!caption.trim() && !file) {
      setPostError('Add a caption or media first.'); return
    }

    setPosting(true); setPostError(''); setPostResult(null)

    try {
      // ── STEP 1: Upload file to Supabase (always — for all actions) ──────
      let uploadedUrl = null
      if (file) {
        const ext  = (file.name || 'file').split('.').pop().toLowerCase() || 'mp4'
        const path = `scheduler/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('posts')
          .upload(path, file, { upsert: true, contentType: file.type })

        if (upErr) {
          console.error('[Scheduler] Storage upload error:', upErr)
          setPostError(`File upload failed: ${upErr.message}`)
          setPosting(false); return
        }
        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(path)
        uploadedUrl = urlData?.publicUrl || null
        console.log('[Scheduler] File uploaded to Supabase:', uploadedUrl)
      }

      // ── STEP 2: Action ───────────────────────────────────────────────────
      if (action === 'draft') {
        await saveToSupabase('draft', null, uploadedUrl)
        setPostResult({ success: true, message: `✅ Draft saved for ${plat?.label}!` })

      } else if (action === 'schedule') {
        const scheduledFor = buildScheduledFor()
        if (!scheduledFor) {
          setPostError('Pick a date and time for scheduling.')
          setPosting(false); return
        }
        await saveToSupabase('scheduled', scheduledFor, uploadedUrl)
        setPostResult({
          success: true,
          message: `📅 Scheduled for ${new Date(scheduledFor).toLocaleString('en', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}`
        })

      } else if (action === 'now') {
        // ── Post Now — call platform API ──────────────────────────────────
        let r, d

        if (selPlatform === 'youtube') {
          if (!file) { setPostError('Select a video file for YouTube.'); setPosting(false); return }
          const form = new FormData()
          form.append('user_id',     userId)
          form.append('title',       caption.slice(0, 100) || 'Nexora OS Upload')
          form.append('description', caption)
          form.append('privacy',     privacy)
          form.append('file',        file)
          r = await fetch(`${API}/api/youtube/upload-video`, { method:'POST', body:form })
          d = await r.json()

        } else if (selPlatform === 'instagram') {
          if (!uploadedUrl) {
            setPostError('Select an image/video first — Instagram requires media.')
            setPosting(false); return
          }
          r = await fetch(`${API}/api/instagram/${selType==='story'?'story':'post'}`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ user_id:userId, caption, image_url:uploadedUrl })
          })
          d = await r.json()

        } else if (selPlatform === 'linkedin') {
          const vis  = privacy==='CONNECTIONS'?'CONNECTIONS':'PUBLIC'
          const body = { user_id:userId, text:caption, visibility:vis }
          if (uploadedUrl) {
            if (selType === 'video') body.video_url = uploadedUrl
            else body.image_url = uploadedUrl
          }
          const endpoint = (uploadedUrl && selType==='video') ? 'post-video' : 'post'
          r = await fetch(`${API}/api/linkedin/${endpoint}`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify(body)
          })
          d = await r.json()

        } else if (selPlatform === 'tiktok') {
          if (!file) { setPostError('Select a video for TikTok.'); setPosting(false); return }
          const form = new FormData()
          form.append('user_id', userId)
          form.append('title',   caption.slice(0, 150))
          form.append('privacy', 'SELF_ONLY')
          form.append('file',    file)
          r = await fetch(`${API}/api/tiktok/upload-file`, { method:'POST', body:form })
          d = await r.json()

        } else {
          setPostError(`${plat?.label} coming soon!`)
          setPosting(false); return
        }

        if (!r?.ok) throw new Error(d?.detail || d?.message || `Post failed (${r?.status})`)
        await saveToSupabase('published', null, uploadedUrl)
        setPostResult({ success:true, message:`🎉 Posted to ${plat?.label}!` })
      }

    } catch (e) {
      console.error('[Scheduler] handlePost error:', e)
      setPostError(e.message || 'Something went wrong. Try again.')
    }
    setPosting(false)
  }

  const resetCompose = () => {
    setCaption(''); setFile(null); setFilePreview(null)
    setPostResult(null); setPostError(''); setSchedDate(''); setSchedTime('')
  }

  // ── Calendar helpers ───────────────────────────────────────────────────────
  const getDaysInMonth = (date) => {
    const year = date.getFullYear(), month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const getPostsForDay = (day) => {
    try {
      const d = new Date(calDate.getFullYear(), calDate.getMonth(), day)
      return calPosts.filter(p => {
        if (!p.scheduled_for && !p.scheduled_at) return false
        try {
          const pd = new Date(p.scheduled_for || p.scheduled_at)
          return pd.getDate()===d.getDate() && pd.getMonth()===d.getMonth() && pd.getFullYear()===d.getFullYear()
        } catch { return false }
      })
    } catch { return [] }
  }

  const today = new Date()
  const { firstDay, daysInMonth } = getDaysInMonth(calDate)

  // ── Styles ─────────────────────────────────────────────────────────────────
  const card  = { background: T.card,    border: `1px solid ${T.border}`,     borderRadius: 16, padding: 20 }
  const inp   = { background: T.input,   border: `1px solid ${T.inputBorder}`, borderRadius: 9,  padding: '10px 13px', color: T.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
  const ta    = { ...inp, resize: 'vertical', minHeight: 100 }
  const lbl   = { fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 7 }
  const h2    = { fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 14px' }

  const platColor = PLATFORMS.find(p=>p.id===selPlatform)?.color || T.gold

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans',sans-serif", color:T.text, transition:'background .25s,color .25s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes sp{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .fade{animation:fadeUp .35s ease both}
        .plat:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .plat{transition:all .15s}
        .act:hover{filter:brightness(1.08)}
        .act{transition:all .15s}
        *{box-sizing:border-box}
        input[type=date],input[type=time]{color-scheme:${theme}}
        textarea::placeholder,input::placeholder{color:${T.textMuted}}
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:900, color:T.text, margin:0 }}>Content Scheduler</h1>
            <p style={{ fontSize:13, color:T.textMuted, marginTop:3 }}>Post now, schedule for later, or save as draft</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {/* View toggle */}
            <div style={{ display:'flex', background:T.cardAlt, borderRadius:10, border:`1px solid ${T.border}`, overflow:'hidden' }}>
              {[['compose','✍️ Compose'],['calendar','📅 Calendar']].map(([v,l]) => (
                <button key={v} onClick={()=>setView(v)}
                  style={{ padding:'7px 16px', background:view===v?T.goldBg:'transparent', color:view===v?T.gold:T.textMuted, border:'none', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', borderRight:v==='compose'?`1px solid ${T.border}`:'none', transition:'all .15s' }}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}
              style={{ padding:'7px 14px', borderRadius:100, background:T.goldBg, border:`1px solid ${T.borderGold}`, color:T.gold, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {theme==='dark'?'☀️':'🌙'}
            </button>
          </div>
        </div>

        {/* ── COMPOSE VIEW ── */}
        {view === 'compose' && (
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:16, alignItems:'start' }}>

            {/* Left — Compose */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Platform selector */}
              <div style={card}>
                <label style={lbl}>Select Platform</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {PLATFORMS.map(p => (
                    <div key={p.id} className="plat"
                      onClick={() => !p.comingSoon && setSelPlatform(p.id)}
                      style={{ position:'relative', padding:'10px 12px', borderRadius:11, cursor:p.comingSoon?'not-allowed':'pointer', opacity:p.comingSoon?0.5:1,
                        border:`1.5px solid ${selPlatform===p.id?p.color+'60':T.border}`,
                        background:selPlatform===p.id?`${p.color}12`:T.cardAlt }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:14, fontWeight:900, color:p.color }}>{p.icon}</span>
                        <span style={{ fontSize:12, fontWeight:600, color:selPlatform===p.id?T.text:T.textMuted }}>{p.label}</span>
                      </div>
                      {p.comingSoon && (
                        <span style={{ position:'absolute', top:5, right:6, fontSize:8, fontWeight:700, color:T.textMuted, background:T.cardAlt, padding:'1px 5px', borderRadius:5, border:`1px solid ${T.border}` }}>Soon</span>
                      )}
                      {!p.comingSoon && !connected[p.id] && (
                        <span style={{ fontSize:9, color:T.danger, marginTop:2, display:'block' }}>Not connected</span>
                      )}
                      {!p.comingSoon && connected[p.id] && (
                        <span style={{ fontSize:9, color:T.success, marginTop:2, display:'block' }}>✓ Connected</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Content type */}
              {CONTENT_TYPES[selPlatform]?.length > 1 && (
                <div style={card}>
                  <label style={lbl}>Content Type</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {CONTENT_TYPES[selPlatform].map(ct => (
                      <div key={ct.id} onClick={()=>setSelType(ct.id)}
                        style={{ flex:1, padding:'9px', borderRadius:9, cursor:'pointer', textAlign:'center', fontSize:13, fontWeight:600, border:`1.5px solid ${selType===ct.id?platColor+'60':T.border}`, background:selType===ct.id?`${platColor}12`:T.cardAlt, color:selType===ct.id?T.text:T.textMuted, transition:'all .15s' }}>
                        {ct.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Caption / Content */}
              <div style={card}>
                <label style={lbl}>
                  Caption / Content
                  <span style={{ float:'right', fontWeight:400, color:caption.length>2000?T.danger:T.textMuted }}>{caption.length}/2200</span>
                </label>
                <textarea style={{ ...ta, minHeight:120, borderColor:T.inputBorder }}
                  value={caption} onChange={e=>setCaption(e.target.value.slice(0,2200))}
                  placeholder={selPlatform==='linkedin'
                    ? "Write your LinkedIn post...\n\nSharing something valuable today..."
                    : selPlatform==='youtube'
                    ? "Video title and description..."
                    : "Write your caption... ✨\n\n#nexoraos #creator"}
                  onFocus={e=>e.target.style.borderColor=platColor+'80'}
                  onBlur={e=>e.target.style.borderColor=T.inputBorder} />

                {/* AI enhance hint */}
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <span style={{ fontSize:11, color:T.textMuted }}>✨ Tip: Add hooks in the first line for best engagement</span>
                </div>
              </div>

              {/* Media upload */}
              {selPlatform !== 'twitter' && (
                <div style={card}>
                  <label style={lbl}>
                    {selType==='video'||selType==='story'||selPlatform==='tiktok' ? 'Video File' : 'Image / Media'}
                    {selPlatform==='tiktok' && <span style={{ color:T.danger, marginLeft:4 }}>*required</span>}
                  </label>
                  <input ref={fileRef} type="file"
                    accept={selType==='video'||selPlatform==='tiktok'||selPlatform==='youtube' ? 'video/*' : 'image/*,video/*'}
                    style={{ display:'none' }} onChange={onFile} />

                  {filePreview ? (
                    <div style={{ position:'relative' }}>
                      {file?.type?.startsWith('video')
                        ? <video src={filePreview} style={{ width:'100%', borderRadius:10, maxHeight:200, objectFit:'contain', background:'#000' }} controls/>
                        : <img src={filePreview} alt="" style={{ width:'100%', borderRadius:10, maxHeight:200, objectFit:'cover' }}/>}
                      <button onClick={()=>{setFile(null);setFilePreview(null)}}
                        style={{ position:'absolute', top:8, right:8, width:26, height:26, borderRadius:'50%', background:'rgba(0,0,0,0.7)', border:'none', color:'#fff', cursor:'pointer', fontSize:14 }}>×</button>
                    </div>
                  ) : (
                    <div onClick={()=>fileRef.current?.click()}
                      style={{ border:`2px dashed ${platColor}30`, borderRadius:12, padding:'24px', textAlign:'center', cursor:'pointer', transition:'border-color .15s' }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=platColor+'60'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=platColor+'30'}>
                      <div style={{ fontSize:28, marginBottom:8 }}>
                        {selType==='video'||selPlatform==='tiktok'||selPlatform==='youtube' ? '🎬' : '🖼️'}
                      </div>
                      <p style={{ color:T.textMuted, fontSize:13, margin:0 }}>Click to select file</p>
                      <p style={{ color:T.textMuted, fontSize:11, margin:'4px 0 0', opacity:.7 }}>
                        {selPlatform==='youtube' ? 'MP4, MOV • Any length'
                          : selPlatform==='tiktok' ? 'MP4, MOV • 9:16 vertical best'
                          : selType==='story' ? '9:16 best (1080×1920)'
                          : 'JPG, PNG, AVIF, MP4'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Privacy */}
              {(selPlatform==='youtube'||selPlatform==='tiktok'||selPlatform==='linkedin') && (
                <div style={card}>
                  <label style={lbl}>Privacy</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {selPlatform==='youtube'
                      ? ['public','private','unlisted'].map(v=>(
                          <div key={v} onClick={()=>setPrivacy(v)}
                            style={{ flex:1, padding:'8px', borderRadius:9, cursor:'pointer', textAlign:'center', fontSize:12, fontWeight:600, border:`1.5px solid ${privacy===v?platColor+'60':T.border}`, background:privacy===v?`${platColor}12`:T.cardAlt, color:privacy===v?T.text:T.textMuted, textTransform:'capitalize' }}>
                            {v==='public'?'🌍':v==='private'?'🔒':'🔗'} {v}
                          </div>
                        ))
                      : (selPlatform==='linkedin' ? [
                          { v:'PUBLIC', l:'🌍 Public' },
                          { v:'CONNECTIONS', l:'🔗 Connections' }
                        ] : [
                          { v:'SELF_ONLY', l:'🔒 Only Me' },
                          { v:'PUBLIC_TO_EVERYONE', l:'🌍 Everyone' }
                        ]).map(({ v, l }) => (
                          <div key={v} onClick={()=>setPrivacy(v)}
                            style={{ flex:1, padding:'8px', borderRadius:9, cursor:'pointer', textAlign:'center', fontSize:12, fontWeight:600, border:`1.5px solid ${privacy===v?platColor+'60':T.border}`, background:privacy===v?`${platColor}12`:T.cardAlt, color:privacy===v?T.text:T.textMuted }}>
                            {l}
                          </div>
                        ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right — Action panel */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Action selector */}
              <div style={card}>
                <label style={lbl}>Action</label>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { id:'now',      icon:'⚡', label:'Post Now',    desc:'Publish immediately to platform' },
                    { id:'schedule', icon:'📅', label:'Schedule',    desc:'AI picks the best time for you' },
                    { id:'draft',    icon:'📝', label:'Save Draft',  desc:'Save for later, not published' },
                  ].map(a => (
                    <div key={a.id} onClick={()=>setAction(a.id)}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:11, cursor:'pointer', border:`1.5px solid ${action===a.id?platColor+'60':T.border}`, background:action===a.id?`${platColor}10`:T.cardAlt, transition:'all .15s' }}>
                      <span style={{ fontSize:20 }}>{a.icon}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:action===a.id?T.text:T.textSub }}>{a.label}</div>
                        <div style={{ fontSize:11, color:T.textMuted }}>{a.desc}</div>
                      </div>
                      {action===a.id && <div style={{ marginLeft:'auto', width:16, height:16, borderRadius:'50%', background:platColor, display:'flex', alignItems:'center', justifyContent:'center' }}>✓</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule options */}
              {action === 'schedule' && (
                <div style={card} className="fade">
                  {/* AI time recommendation */}
                  <div style={{ padding:'12px 14px', background:T.goldBg, border:`1px solid ${T.borderGold}`, borderRadius:11, marginBottom:14 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.gold, marginBottom:3 }}>
                      🤖 AI Recommends: {AI_TIMES[selPlatform]}
                    </div>
                    <div style={{ fontSize:11, color:T.textMuted }}>{AI_TIME_REASONS[selPlatform]}</div>
                    <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, cursor:'pointer' }}>
                      <input type="checkbox" checked={useAiTime} onChange={e=>setUseAiTime(e.target.checked)} style={{ accentColor:T.gold, width:14, height:14 }}/>
                      <span style={{ fontSize:12, color:T.textSub, fontWeight:600 }}>Use AI recommended time</span>
                    </label>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div>
                      <label style={lbl}>Date</label>
                      <input type="date" style={inp} value={schedDate} min={new Date().toISOString().split('T')[0]}
                        onChange={e=>setSchedDate(e.target.value)}
                        onFocus={e=>e.target.style.borderColor=platColor+'80'}
                        onBlur={e=>e.target.style.borderColor=T.inputBorder}/>
                    </div>
                    <div>
                      <label style={lbl}>Time {useAiTime && <span style={{ color:T.gold }}>(AI)</span>}</label>
                      <input type="time" style={{ ...inp, opacity:useAiTime?.8:1 }} value={useAiTime?AI_TIMES[selPlatform].replace(' AM','').replace(' PM',''):schedTime}
                        disabled={useAiTime} onChange={e=>setSchedTime(e.target.value)}/>
                    </div>
                  </div>
                  {schedDate && (
                    <p style={{ fontSize:11, color:T.textMuted, marginTop:8 }}>
                      📅 Will post on {new Date(schedDate).toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'})} at {getEffectiveTime()}
                    </p>
                  )}
                </div>
              )}

              {/* Preview panel */}
              <div style={card}>
                <label style={lbl}>Preview</label>
                <div style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:12, padding:14, minHeight:120 }}>
                  {/* Platform header */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:`${platColor}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:platColor, fontWeight:900 }}>
                      {PLATFORMS.find(p=>p.id===selPlatform)?.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:T.text }}>Your {PLATFORMS.find(p=>p.id===selPlatform)?.label} account</div>
                      <div style={{ fontSize:10, color:T.textMuted }}>Just now</div>
                    </div>
                  </div>

                  {filePreview && (file?.type?.startsWith('video')
                    ? <video src={filePreview} style={{ width:'100%', borderRadius:8, maxHeight:140, objectFit:'cover', background:'#000', marginBottom:8 }}/>
                    : <img src={filePreview} alt="" style={{ width:'100%', borderRadius:8, maxHeight:140, objectFit:'cover', marginBottom:8 }}/>)}

                  {caption
                    ? <p style={{ fontSize:13, color:T.textSub, lineHeight:1.6, margin:0, whiteSpace:'pre-wrap' }}>{caption.slice(0,200)}{caption.length>200?'...':''}</p>
                    : <p style={{ fontSize:12, color:T.textMuted, fontStyle:'italic', margin:0 }}>Your caption will appear here...</p>}
                </div>
              </div>

              {/* Error / Result */}
              {postError && (
                <div style={{ padding:'12px 16px', background:T.dangerBg, border:`1px solid ${T.danger}40`, borderRadius:11, color:T.danger, fontSize:13 }}>
                  ⚠️ {postError}
                  {postError.includes('Connect') && (
                    <button onClick={()=>navigate('/settings')} style={{ display:'block', marginTop:8, color:T.gold, background:T.goldBg, border:`1px solid ${T.borderGold}`, padding:'5px 12px', borderRadius:7, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>
                      Go to Settings →
                    </button>
                  )}
                </div>
              )}

              {postResult && (
                <div style={{ padding:'12px 16px', background:T.successBg, border:`1px solid ${T.success}40`, borderRadius:11, color:T.success, fontSize:13, fontWeight:600 }}>
                  ✅ {postResult.message}
                  <button onClick={resetCompose} style={{ display:'block', marginTop:8, color:T.textMuted, background:'transparent', border:`1px solid ${T.border}`, padding:'5px 12px', borderRadius:7, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                    Create another post
                  </button>
                </div>
              )}

              {/* Submit button */}
              {!postResult && (
                <button onClick={handlePost} disabled={posting}
                  style={{ width:'100%', padding:'13px', borderRadius:12, background:posting?`${platColor}50`:platColor, color:posting?T.textMuted:theme==='dark'?'#0A0A0F':'#fff', border:'none', fontSize:15, fontWeight:800, cursor:posting?'not-allowed':'pointer', fontFamily:"'Syne',sans-serif", transition:'all .15s', boxShadow:posting?'none':`0 4px 20px ${platColor}40` }}>
                  {posting
                    ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                        <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'sp .8s linear infinite', display:'inline-block' }}/>
                        {action==='now'?'Posting...':action==='schedule'?'Scheduling...':'Saving draft...'}
                      </span>
                    : action==='now' ? `⚡ Post Now to ${PLATFORMS.find(p=>p.id===selPlatform)?.label}`
                      : action==='schedule' ? `📅 Schedule Post`
                      : `📝 Save as Draft`}
                </button>
              )}

              {/* Platform tips */}
              <div style={card}>
                <label style={{ ...lbl, marginBottom:10 }}>💡 Tips for {PLATFORMS.find(p=>p.id===selPlatform)?.label}</label>
                {({
                  youtube:   ['Upload MP4/MOV for best quality','Add chapters with timestamps','First 3 seconds hook viewers','Titles under 60 chars perform better'],
                  instagram: ['Square (1:1) gets most reach','First 125 chars show in feed','5-10 hashtags optimal','Post Tue–Fri 9–11 AM'],
                  linkedin:  ['Start with a hook line','No hashtags in first line','3–5 hashtags only','Post Mon–Thu mornings'],
                  tiktok:    ['9:16 vertical mandatory','First 3 seconds = everything','Use trending sounds in app','Post 7–9 PM'],
                  twitter:   ['Under 280 chars for max reach','Threads boost engagement','Add media for 3× reach','Post at lunch breaks'],
                  facebook:  ['Native video gets more reach','Ask questions for engagement','Post 3–5 PM weekdays','Keep captions conversational'],
                }[selPlatform]||[]).map(tip => (
                  <p key={tip} style={{ fontSize:12, color:T.textMuted, margin:'0 0 6px', paddingLeft:10, borderLeft:`2px solid ${platColor}40`, lineHeight:1.5 }}>{tip}</p>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ── CALENDAR VIEW ── */}
        {view === 'calendar' && (() => {
          // Safe calendar rendering with all error handling inline
          const year  = calDate.getFullYear()
          const month = calDate.getMonth()
          const firstDaySafe  = Math.max(0, new Date(year, month, 1).getDay())
          const daysInMonthSafe = new Date(year, month + 1, 0).getDate()
          const todaySafe = new Date()

          const getPostsSafe = (day) => {
            try {
              return calPosts.filter(p => {
                const dt = p.scheduled_for || p.scheduled_at
                if (!dt) return false
                const pd = new Date(dt)
                return !isNaN(pd) && pd.getDate()===day && pd.getMonth()===month && pd.getFullYear()===year
              })
            } catch { return [] }
          }

          return (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={card}>
                {/* Month nav */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <button onClick={()=>setCalDate(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}
                    style={{ width:32,height:32,borderRadius:8,background:T.cardAlt,border:`1px solid ${T.border}`,color:T.text,cursor:'pointer',fontSize:18 }}>‹</button>
                  <h2 style={{ ...h2, margin:0 }}>
                    {MONTHS[month]} {year}
                  </h2>
                  <button onClick={()=>setCalDate(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}
                    style={{ width:32,height:32,borderRadius:8,background:T.cardAlt,border:`1px solid ${T.border}`,color:T.text,cursor:'pointer',fontSize:18 }}>›</button>
                </div>

                {/* Day headers */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:8 }}>
                  {DAYS.map(d => (
                    <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color:T.textMuted, padding:'4px 0', textTransform:'uppercase', letterSpacing:'.06em' }}>{d}</div>
                  ))}
                </div>

                {/* Grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                  {Array.from({ length: firstDaySafe }).map((_,i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonthSafe }).map((_,i) => {
                    const day = i + 1
                    const isToday = todaySafe.getDate()===day && todaySafe.getMonth()===month && todaySafe.getFullYear()===year
                    const posts = getPostsSafe(day)
                    return (
                      <div key={`day-${day}`} style={{ minHeight:72, padding:'6px 7px', borderRadius:10, background:isToday?T.goldBg:T.cardAlt, border:`1px solid ${isToday?T.borderGold:T.border}` }}>
                        <div style={{ fontSize:12, fontWeight:isToday?800:500, color:isToday?T.gold:T.textMuted, marginBottom:4 }}>{day}</div>
                        {posts.slice(0,2).map((p,pi) => {
                          const platId = Array.isArray(p.platforms) ? p.platforms[0] : (p.platform||'')
                          const pc = PLATFORMS.find(pl=>pl.id===platId)?.color || T.gold
                          return (
                            <div key={pi} style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:`${pc}20`, color:pc, fontWeight:700, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {platId} · {(p.caption||p.content||'Post').slice(0,10)}
                            </div>
                          )
                        })}
                        {posts.length > 2 && <div style={{ fontSize:9, color:T.textMuted }}>+{posts.length-2}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Scheduled posts list */}
              <div style={card}>
                <h2 style={h2}>Scheduled Posts ({calPosts.filter(p=>p.status==='scheduled').length})</h2>
                {calLoading
                  ? <div style={{ textAlign:'center',padding:24 }}><div style={{ width:24,height:24,border:`2px solid ${T.borderGold}`,borderTopColor:T.gold,borderRadius:'50%',animation:'sp .8s linear infinite',margin:'0 auto' }}/></div>
                  : calPosts.filter(p=>p.status==='scheduled').length===0
                  ? <div style={{ textAlign:'center',padding:'32px 0',color:T.textMuted }}>
                      <div style={{ fontSize:36,marginBottom:10 }}>📅</div>
                      <p style={{ fontSize:13 }}>No scheduled posts</p>
                      <button onClick={()=>setView('compose')} style={{ marginTop:10,padding:'8px 18px',background:T.goldBg,border:`1px solid ${T.borderGold}`,borderRadius:9,color:T.gold,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>
                        Create a Post
                      </button>
                    </div>
                  : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
                      {calPosts.filter(p=>p.status==='scheduled').map(post => {
                        const platId = Array.isArray(post.platforms)?post.platforms[0]:(post.platform||'')
                        const pc = PLATFORMS.find(p=>p.id===platId)?.color || T.gold
                        const dt = post.scheduled_for || post.scheduled_at
                        return (
                          <div key={post.id} style={{ padding:'12px 14px',borderRadius:12,background:T.cardAlt,border:`1px solid ${T.border}` }}>
                            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                              <span style={{ fontSize:11,fontWeight:700,color:pc,background:`${pc}18`,padding:'2px 8px',borderRadius:100 }}>{platId||'—'}</span>
                              <span style={{ fontSize:10,color:T.textMuted }}>{post.content_type||'post'}</span>
                            </div>
                            <p style={{ fontSize:12,color:T.text,margin:'0 0 6px',overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>
                              {post.caption||post.content||'No content'}
                            </p>
                            <div style={{ fontSize:11,color:T.textMuted }}>
                              📅 {dt ? (() => { try { return new Date(dt).toLocaleString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) } catch { return dt } })() : '—'}
                            </div>
                          </div>
                        )
                      })}
                    </div>}
              </div>

              {/* Drafts */}
              {calPosts.filter(p=>p.status==='draft').length > 0 && (
                <div style={card}>
                  <h2 style={h2}>Drafts ({calPosts.filter(p=>p.status==='draft').length})</h2>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:8 }}>
                    {calPosts.filter(p=>p.status==='draft').map(post => {
                      const platId = Array.isArray(post.platforms)?post.platforms[0]:(post.platform||'')
                      const pc = PLATFORMS.find(p=>p.id===platId)?.color || T.gold
                      return (
                        <div key={post.id} style={{ padding:'11px 13px',borderRadius:11,background:T.cardAlt,border:`1px solid ${T.border}` }}>
                          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                            <span style={{ fontSize:10,fontWeight:700,color:pc }}>{platId||'draft'}</span>
                            <span style={{ fontSize:9,padding:'1px 6px',borderRadius:100,background:T.goldBg,color:T.gold,fontWeight:700 }}>Draft</span>
                          </div>
                          <p style={{ fontSize:12,color:T.textSub,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                            {post.caption||post.content||'Empty draft'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })()}