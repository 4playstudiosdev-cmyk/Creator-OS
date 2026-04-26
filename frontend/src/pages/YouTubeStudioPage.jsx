// src/pages/YouTubeStudioPage.jsx
// Nexora OS — YouTube Studio
// Upload + Post Now / Schedule / Draft — all go to scheduler page

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const API = 'https://creator-os-production-0bf8.up.railway.app'

const DARK = {
  bg:'#0A0A0F',card:'#111318',cardAlt:'#1A1D24',border:'rgba(255,255,255,0.07)',
  borderGold:'rgba(245,200,66,0.15)',gold:'#F5C842',goldBg:'rgba(245,200,66,0.08)',
  text:'#FFFFFF',textSub:'#E2E8F0',textMuted:'#64748B',
  success:'#4ADE80',successBg:'rgba(74,222,128,0.1)',
  danger:'#FB7185',dangerBg:'rgba(251,113,133,0.1)',
  yt:'#FF0000',ytBg:'rgba(255,0,0,0.08)',ytBorder:'rgba(255,0,0,0.2)',
  input:'#1A1D24',inputBorder:'rgba(255,255,255,0.1)',
}
const LIGHT = {
  bg:'#FFFDF5',card:'#FFFFFF',cardAlt:'#FEF9E7',border:'rgba(0,0,0,0.08)',
  borderGold:'rgba(180,130,0,0.2)',gold:'#D97706',goldBg:'#FEF3C7',
  text:'#1C1917',textSub:'#44403C',textMuted:'#A8A29E',
  success:'#16A34A',successBg:'#F0FDF4',
  danger:'#E11D48',dangerBg:'#FFF1F2',
  yt:'#FF0000',ytBg:'rgba(255,0,0,0.06)',ytBorder:'rgba(255,0,0,0.15)',
  input:'#FFFFFF',inputBorder:'rgba(0,0,0,0.12)',
}

const AI_TIMES = { youtube:'6:00 PM' }

const fmt = n => !n&&n!==0?'0':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1000?(n/1000).toFixed(1)+'K':String(n)

export default function YouTubeStudioPage() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => localStorage.getItem('nexora-theme')||'dark')
  const T = theme==='dark' ? DARK : LIGHT

  const [tab,        setTab]        = useState('upload')
  const [userId,     setUserId]     = useState(null)
  const [ytStatus,   setYtStatus]   = useState(null)
  const [loading,    setLoading]    = useState(true)

  // Upload form
  const [file,       setFile]       = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [thumb,      setThumb]      = useState(null)
  const [thumbPrev,  setThumbPrev]  = useState(null)
  const [title,      setTitle]      = useState('')
  const [desc,       setDesc]       = useState('')
  const [tags,       setTags]       = useState('')
  const [privacy,    setPrivacy]    = useState('private')
  const [action,     setAction]     = useState('now') // now | schedule | draft
  const [schedDate,  setSchedDate]  = useState('')
  const [schedTime,  setSchedTime]  = useState('')
  const [useAiTime,  setUseAiTime]  = useState(true)
  const [posting,    setPosting]    = useState(false)
  const [postResult, setPostResult] = useState(null)
  const [postError,  setPostError]  = useState('')
  const [progress,   setProgress]   = useState(0)

  // My Videos
  const [videos,     setVideos]     = useState([])
  const [vidLoading, setVidLoading] = useState(false)

  // Analytics
  const [analytics,  setAnalytics]  = useState(null)

  // Comments
  const [comments,   setComments]   = useState([])
  const [comFilter,  setComFilter]  = useState('all')
  const [replyText,  setReplyText]  = useState({})
  const [replySent,  setReplySent]  = useState({})
  const [selComment, setSelComment] = useState(null)

  const fileRef  = useRef()
  const thumbRef = useRef()

  useEffect(() => { localStorage.setItem('nexora-theme', theme) }, [theme])

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
      const r = await fetch(`${API}/api/youtube/status/${uid}`)
      const d = await r.json()
      setYtStatus(d)
    } catch { setYtStatus({ connected: false }) }
    setLoading(false)
  }

  useEffect(() => {
    if (!userId || !ytStatus?.connected) return
    if (tab === 'videos')    loadVideos()
    if (tab === 'analytics') loadAnalytics()
    if (tab === 'comments')  loadComments()
  }, [tab, userId, ytStatus])

  const loadVideos = async () => {
    setVidLoading(true)
    try {
      const r = await fetch(`${API}/api/youtube/videos/${userId}`)
      const d = await r.json()
      setVideos(d.videos || [])
    } catch {}
    setVidLoading(false)
  }

  const loadAnalytics = async () => {
    try {
      const r = await fetch(`${API}/api/youtube/analytics/${userId}`)
      const d = await r.json()
      setAnalytics(d)
    } catch {}
  }

  const loadComments = async () => {
    try {
      const r = await fetch(`${API}/api/youtube/inbox/${userId}?limit=50`)
      const d = await r.json()
      setComments(d.messages || [])
    } catch {}
  }

  const onFile = (e) => {
    const f = e.target.files[0]; if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f))
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g,' '))
  }

  const onThumb = (e) => {
    const f = e.target.files[0]; if (!f) return
    setThumb(f); setThumbPrev(URL.createObjectURL(f))
  }

  const buildScheduledFor = () => {
    if (!schedDate) return null
    const time = useAiTime ? AI_TIMES.youtube : schedTime
    try { return new Date(`${schedDate} ${time}`).toISOString() } catch { return null }
  }

  const saveToScheduler = async (status, scheduledFor = null) => {
    if (!userId) return
    await supabase.from('scheduled_posts').insert({
      user_id:       userId,
      platforms:     ['youtube'],
      content:       desc || title,
      caption:       title,
      title,
      status,
      scheduled_for: scheduledFor,
      privacy,
      created_at:    new Date().toISOString(),
    }).catch(console.error)
  }

  const handlePost = async () => {
    if (!file && action === 'now') { setPostError('Select a video file first.'); return }
    if (!title.trim()) { setPostError('Add a title.'); return }
    setPosting(true); setPostError(''); setPostResult(null); setProgress(0)

    try {
      if (action === 'draft') {
        await saveToScheduler('draft')
        setPostResult({ message: '📝 Draft saved! Check Scheduler.' })

      } else if (action === 'schedule') {
        const sf = buildScheduledFor()
        if (!sf) { setPostError('Pick a date first.'); setPosting(false); return }
        await saveToScheduler('scheduled', sf)
        setPostResult({ message: `📅 Scheduled for ${new Date(sf).toLocaleString()}` })

      } else {
        // Post Now — upload to YouTube
        const form = new FormData()
        form.append('user_id', userId)
        form.append('title', title)
        form.append('description', desc)
        form.append('tags', tags)
        form.append('privacy', privacy)
        form.append('file', file)
        if (thumb) form.append('thumbnail', thumb)

        const progIv = setInterval(() => setProgress(p => Math.min(p+3, 90)), 500)
        const r = await fetch(`${API}/api/youtube/upload`, { method:'POST', body:form })
        clearInterval(progIv); setProgress(100)
        const d = await r.json()
        if (!r.ok) throw new Error(d.detail || 'Upload failed.')
        await saveToScheduler('published')
        setPostResult({ message:'✅ Uploaded to YouTube!', url: d.video_url })
      }
    } catch (e) { setPostError(e.message) }
    setPosting(false)
  }

  const resetForm = () => {
    setFile(null); setPreview(null); setThumb(null); setThumbPrev(null)
    setTitle(''); setDesc(''); setTags(''); setPostResult(null); setPostError('')
    setProgress(0)
  }

  const sendReply = async (commentId) => {
    const text = replyText[commentId]
    if (!text?.trim()) return
    try {
      const r = await fetch(`${API}/api/youtube/reply-comment`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ user_id:userId, comment_id:commentId, message:text })
      })
      if (r.ok) { setReplySent(p=>({...p,[commentId]:true})); setReplyText(p=>({...p,[commentId]:''})) }
    } catch {}
  }

  const changePrivacy = async (videoId, priv) => {
    try {
      await fetch(`${API}/api/youtube/video/${videoId}/privacy`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ user_id:userId, privacy:priv })
      })
      setVideos(v => v.map(vid => vid.id===videoId ? {...vid, privacy:priv} : vid))
    } catch {}
  }

  const card  = { background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:20 }
  const inp   = { background:T.input, border:`1px solid ${T.inputBorder}`, borderRadius:9, padding:'10px 13px', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box', transition:'border-color .15s' }
  const ta    = { ...inp, resize:'vertical', minHeight:90 }
  const lbl   = { fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'.07em', display:'block', marginBottom:7 }
  const h2    = { fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:T.text, margin:'0 0 14px' }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', background:T.bg }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');`}</style>
      <div style={{ width:36,height:36,border:`3px solid ${T.ytBorder}`,borderTopColor:T.yt,borderRadius:'50%',animation:'sp .8s linear infinite' }}/>
    </div>
  )

  if (!ytStatus?.connected) return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');`}</style>
      <div style={{ ...card, maxWidth:440, textAlign:'center', padding:40 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>▶️</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:T.text, margin:'0 0 10px' }}>Connect YouTube</h2>
        <p style={{ color:T.textMuted, fontSize:14, margin:'0 0 24px' }}>Connect your YouTube channel to upload, manage, and analyze your content.</p>
        <button onClick={() => window.location.href=`${API}/api/youtube/auth?user_id=${userId}`}
          style={{ padding:'12px 28px', background:T.yt, color:'#fff', border:'none', borderRadius:11, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:"'Syne',sans-serif" }}>
          ▶ Connect YouTube
        </button>
      </div>
    </div>
  )

  const TABS = [
    { id:'upload',    label:'⬆️ Upload' },
    { id:'videos',    label:'🎬 My Videos' },
    { id:'analytics', label:'📊 Analytics' },
    { id:'comments',  label:'💬 Comments' },
  ]

  const filteredComments = comFilter==='all' ? comments
    : comFilter==='pending' ? comments.filter(c=>!c.replied&&!replySent[c.id])
    : comments.filter(c=>c.replied||replySent[c.id])

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans',sans-serif", color:T.text, transition:'background .25s,color .25s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes sp{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .fa{animation:fadeUp .35s ease both}
        .ch:hover{filter:brightness(1.08)} .ch{transition:all .15s}
        textarea::placeholder,input::placeholder{color:${T.textMuted}}
        *{box-sizing:border-box}
        input[type=date],input[type=time]{color-scheme:${theme}}
      `}</style>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'28px 24px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {ytStatus.thumbnail
              ? <img src={ytStatus.thumbnail} alt="" style={{ width:46,height:46,borderRadius:'50%',border:`2px solid ${T.yt}` }}/>
              : <div style={{ width:46,height:46,borderRadius:'50%',background:T.ytBg,border:`1px solid ${T.ytBorder}`,display:'flex',alignItems:'center',justifyContent:'center',color:T.yt,fontSize:18,fontWeight:900 }}>▶</div>}
            <div>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:T.text, margin:0 }}>
                {ytStatus.channel_title || ytStatus.channel_name || 'YouTube Studio'}
              </h1>
              <p style={{ fontSize:12, color:T.textMuted, margin:0 }}>
                {ytStatus.subscribers ? `${fmt(ytStatus.subscribers)} subscribers` : 'YouTube Studio'}
              </p>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => navigate('/schedule')}
              style={{ padding:'7px 14px', borderRadius:9, background:T.goldBg, border:`1px solid ${T.borderGold}`, color:T.gold, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              📅 Scheduler
            </button>
            <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}
              style={{ padding:'7px 14px', borderRadius:100, background:T.cardAlt, border:`1px solid ${T.border}`, color:T.textMuted, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              {theme==='dark'?'☀️':'🌙'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} className="ch"
              style={{ padding:'9px 18px', borderRadius:9, border:'none', fontFamily:'inherit', fontWeight:600, fontSize:13, cursor:'pointer', transition:'all .15s', background:tab===t.id?T.yt:T.cardAlt, color:tab===t.id?'#fff':T.textMuted }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── UPLOAD TAB ── */}
        {tab === 'upload' && (
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:16 }}>

            {/* Left */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={card}>
                <h2 style={h2}>Upload Video</h2>

                {postResult ? (
                  <div style={{ textAlign:'center', padding:'28px 0' }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>{action==='now'?'🎉':action==='schedule'?'📅':'📝'}</div>
                    <p style={{ color:T.success, fontWeight:700, fontSize:15, margin:'0 0 8px' }}>{postResult.message}</p>
                    {postResult.url && <a href={postResult.url} target="_blank" rel="noopener" style={{ fontSize:13, color:T.yt, textDecoration:'none', display:'block', marginBottom:14 }}>View on YouTube →</a>}
                    <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                      <button onClick={resetForm} style={{ padding:'9px 20px', background:T.ytBg, border:`1px solid ${T.ytBorder}`, borderRadius:9, color:T.yt, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                        Upload Another
                      </button>
                      <button onClick={()=>navigate('/schedule')} style={{ padding:'9px 20px', background:T.goldBg, border:`1px solid ${T.borderGold}`, borderRadius:9, color:T.gold, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                        View Schedule
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Video file */}
                    <input ref={fileRef} type="file" accept="video/*" style={{ display:'none' }} onChange={onFile}/>
                    {preview ? (
                      <div style={{ position:'relative', marginBottom:14 }}>
                        <video src={preview} style={{ width:'100%', borderRadius:12, maxHeight:220, objectFit:'contain', background:'#000' }} controls/>
                        <button onClick={()=>{setFile(null);setPreview(null)}} style={{ position:'absolute',top:8,right:8,width:28,height:28,borderRadius:'50%',background:'rgba(0,0,0,.7)',border:'none',color:'#fff',cursor:'pointer',fontSize:15 }}>×</button>
                      </div>
                    ) : (
                      <div onClick={()=>fileRef.current?.click()} style={{ border:`2px dashed ${T.ytBorder}`, borderRadius:12, padding:'32px', textAlign:'center', cursor:'pointer', marginBottom:14, transition:'border-color .15s' }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=T.yt+'60'}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=T.ytBorder}>
                        <div style={{ fontSize:36, marginBottom:8 }}>🎬</div>
                        <p style={{ color:T.textMuted, fontSize:13, margin:0 }}>Click to select video</p>
                        <p style={{ color:T.textMuted, fontSize:11, margin:'4px 0 0', opacity:.7 }}>MP4, MOV, AVI • Any size</p>
                      </div>
                    )}

                    {/* Title */}
                    <div style={{ marginBottom:12 }}>
                      <label style={lbl}>Title <span style={{ float:'right', fontWeight:400, color:title.length>95?T.danger:T.textMuted }}>{title.length}/100</span></label>
                      <input style={inp} value={title} onChange={e=>setTitle(e.target.value.slice(0,100))} placeholder="Your video title..."
                        onFocus={e=>e.target.style.borderColor=T.yt+'60'} onBlur={e=>e.target.style.borderColor=T.inputBorder}/>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom:12 }}>
                      <label style={lbl}>Description</label>
                      <textarea style={{ ...ta, minHeight:100 }} value={desc} onChange={e=>setDesc(e.target.value)}
                        placeholder="Describe your video... Add timestamps, links, chapters"
                        onFocus={e=>e.target.style.borderColor=T.yt+'60'} onBlur={e=>e.target.style.borderColor=T.inputBorder}/>
                    </div>

                    {/* Tags */}
                    <div style={{ marginBottom:12 }}>
                      <label style={lbl}>Tags (comma separated)</label>
                      <input style={inp} value={tags} onChange={e=>setTags(e.target.value)} placeholder="creator, youtube, tutorial, growth"
                        onFocus={e=>e.target.style.borderColor=T.yt+'60'} onBlur={e=>e.target.style.borderColor=T.inputBorder}/>
                    </div>

                    {/* Thumbnail */}
                    <div style={{ marginBottom:12 }}>
                      <label style={lbl}>Custom Thumbnail (optional)</label>
                      <input ref={thumbRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onThumb}/>
                      {thumbPrev ? (
                        <div style={{ position:'relative' }}>
                          <img src={thumbPrev} alt="" style={{ width:'100%', borderRadius:10, maxHeight:120, objectFit:'cover' }}/>
                          <button onClick={()=>{setThumb(null);setThumbPrev(null)}} style={{ position:'absolute',top:6,right:6,width:24,height:24,borderRadius:'50%',background:'rgba(0,0,0,.7)',border:'none',color:'#fff',cursor:'pointer',fontSize:13 }}>×</button>
                        </div>
                      ) : (
                        <div onClick={()=>thumbRef.current?.click()} style={{ border:`1px dashed ${T.border}`, borderRadius:9, padding:'14px', textAlign:'center', cursor:'pointer', color:T.textMuted, fontSize:12 }}>
                          🖼️ Upload thumbnail (1280×720 recommended)
                        </div>
                      )}
                    </div>

                    {/* Privacy */}
                    <div style={{ marginBottom:14 }}>
                      <label style={lbl}>Privacy</label>
                      <div style={{ display:'flex', gap:7 }}>
                        {['public','private','unlisted'].map(v => (
                          <div key={v} className="ch" onClick={()=>setPrivacy(v)}
                            style={{ flex:1, padding:'9px', borderRadius:9, cursor:'pointer', textAlign:'center', border:`1.5px solid ${privacy===v?T.yt+'60':T.border}`, background:privacy===v?T.ytBg:T.cardAlt }}>
                            <span style={{ fontSize:14 }}>{v==='public'?'🌍':v==='private'?'🔒':'🔗'}</span>
                            <div style={{ fontSize:11, fontWeight:600, color:privacy===v?T.text:T.textMuted, marginTop:2, textTransform:'capitalize' }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Error */}
                    {postError && (
                      <div style={{ padding:'10px 14px', background:T.dangerBg, border:`1px solid ${T.danger}40`, borderRadius:10, color:T.danger, fontSize:13, marginBottom:12 }}>
                        ⚠️ {postError}
                      </div>
                    )}

                    {/* Progress */}
                    {posting && action==='now' && (
                      <div style={{ marginBottom:12 }}>
                        <div style={{ height:4, background:T.border, borderRadius:2, overflow:'hidden', marginBottom:5 }}>
                          <div style={{ height:'100%', width:`${progress}%`, background:T.yt, borderRadius:2, transition:'width .5s' }}/>
                        </div>
                        <p style={{ fontSize:11, color:T.textMuted, textAlign:'center' }}>Uploading to YouTube... {progress}%</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right — Action + Schedule + Tips */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Action */}
              {!postResult && (
                <>
                  <div style={card}>
                    <label style={lbl}>Action</label>
                    <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                      {[
                        { id:'now',      icon:'⚡', label:'Post Now',   desc:'Upload immediately to YouTube' },
                        { id:'schedule', icon:'📅', label:'Schedule',   desc:'AI picks best time — 6 PM' },
                        { id:'draft',    icon:'📝', label:'Save Draft', desc:'Save to scheduler, publish later' },
                      ].map(a => (
                        <div key={a.id} className="ch" onClick={()=>setAction(a.id)}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:11, cursor:'pointer', border:`1.5px solid ${action===a.id?T.yt+'60':T.border}`, background:action===a.id?T.ytBg:T.cardAlt }}>
                          <span style={{ fontSize:20 }}>{a.icon}</span>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:action===a.id?T.text:T.textSub }}>{a.label}</div>
                            <div style={{ fontSize:11, color:T.textMuted }}>{a.desc}</div>
                          </div>
                          {action===a.id && <div style={{ marginLeft:'auto', width:16,height:16,borderRadius:'50%',background:T.yt,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10 }}>✓</div>}
                        </div>
                      ))}
                    </div>

                    {/* Schedule options */}
                    {action === 'schedule' && (
                      <div className="fa" style={{ padding:'12px 14px', background:T.goldBg, border:`1px solid ${T.borderGold}`, borderRadius:11, marginBottom:14 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.gold, marginBottom:3 }}>🤖 AI Recommends: 6:00 PM</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginBottom:10 }}>Peak watch time for YouTube audience</div>
                        <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, cursor:'pointer' }}>
                          <input type="checkbox" checked={useAiTime} onChange={e=>setUseAiTime(e.target.checked)} style={{ accentColor:T.gold }}/>
                          <span style={{ fontSize:12, color:T.textSub, fontWeight:600 }}>Use AI recommended time</span>
                        </label>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                          <div>
                            <label style={{ ...lbl, marginBottom:4 }}>Date</label>
                            <input type="date" style={inp} value={schedDate} min={new Date().toISOString().split('T')[0]}
                              onChange={e=>setSchedDate(e.target.value)}/>
                          </div>
                          <div>
                            <label style={{ ...lbl, marginBottom:4 }}>Time {useAiTime&&<span style={{ color:T.gold }}>(AI)</span>}</label>
                            <input type="time" style={{ ...inp, opacity:useAiTime?.8:1 }} value={useAiTime?'18:00':schedTime} disabled={useAiTime} onChange={e=>setSchedTime(e.target.value)}/>
                          </div>
                        </div>
                      </div>
                    )}

                    <button onClick={handlePost} disabled={posting}
                      style={{ width:'100%', padding:'13px', borderRadius:12, background:posting?T.ytBg:T.yt, color:posting?T.textMuted:'#fff', border:'none', fontSize:15, fontWeight:800, cursor:posting?'not-allowed':'pointer', fontFamily:"'Syne',sans-serif", boxShadow:posting?'none':'0 4px 20px rgba(255,0,0,0.3)', transition:'all .15s' }}>
                      {posting
                        ? <span style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                            <span style={{ width:15,height:15,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'sp .8s linear infinite',display:'inline-block' }}/>
                            {action==='now'?'Uploading...':action==='schedule'?'Scheduling...':'Saving...'}
                          </span>
                        : action==='now' ? '⚡ Upload to YouTube'
                          : action==='schedule' ? '📅 Schedule Post'
                          : '📝 Save as Draft'}
                    </button>
                  </div>

                  {/* Tips */}
                  <div style={card}>
                    <label style={lbl}>YouTube Tips</label>
                    {['Titles under 60 chars rank better','First 48h = critical for algorithm','Add chapters with timestamps','Upload Tue–Thu for best reach','Custom thumbnail = 3× more clicks','End screen in last 20 seconds'].map(tip => (
                      <p key={tip} style={{ fontSize:12, color:T.textMuted, margin:'0 0 7px', paddingLeft:10, borderLeft:`2px solid ${T.ytBorder}`, lineHeight:1.5 }}>{tip}</p>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── MY VIDEOS ── */}
        {tab === 'videos' && (
          <div style={card}>
            <h2 style={h2}>My Videos ({videos.length})</h2>
            {vidLoading ? (
              <div style={{ textAlign:'center', padding:40 }}>
                <div style={{ width:32,height:32,border:`3px solid ${T.ytBorder}`,borderTopColor:T.yt,borderRadius:'50%',animation:'sp .8s linear infinite',margin:'0 auto' }}/>
              </div>
            ) : videos.length===0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:T.textMuted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🎬</div>
                <p style={{ fontSize:13 }}>No videos yet</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {videos.map(v => (
                  <div key={v.id} style={{ display:'flex', gap:14, padding:'14px', background:T.cardAlt, borderRadius:12, border:`1px solid ${T.border}`, alignItems:'center' }}>
                    {v.thumbnail
                      ? <img src={v.thumbnail} alt="" style={{ width:120, height:68, borderRadius:8, objectFit:'cover', flexShrink:0 }}/>
                      : <div style={{ width:120, height:68, borderRadius:8, background:T.border, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:T.textMuted }}>🎬</div>}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.title}</div>
                      <div style={{ display:'flex', gap:12, fontSize:12, color:T.textMuted, flexWrap:'wrap' }}>
                        <span>👁️ {fmt(v.views)}</span>
                        <span>👍 {fmt(v.likes)}</span>
                        <span>💬 {fmt(v.comments)}</span>
                        <span>⏱️ {v.duration}</span>
                      </div>
                    </div>
                    <div style={{ flexShrink:0 }}>
                      <select value={v.privacy||'public'} onChange={e=>changePrivacy(v.id,e.target.value)}
                        style={{ ...inp, width:'auto', padding:'5px 10px', fontSize:12, cursor:'pointer', background:T.card }}>
                        <option value="public">🌍 Public</option>
                        <option value="private">🔒 Private</option>
                        <option value="unlisted">🔗 Unlisted</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab === 'analytics' && (
          <div>
            {!analytics ? (
              <div style={{ textAlign:'center', padding:48 }}>
                <div style={{ width:32,height:32,border:`3px solid ${T.ytBorder}`,borderTopColor:T.yt,borderRadius:'50%',animation:'sp .8s linear infinite',margin:'0 auto 12px' }}/>
                <p style={{ color:T.textMuted }}>Loading analytics...</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
                {[
                  { label:'Views (28d)',        value:fmt(analytics.views_28d||analytics.views||0),    icon:'👁️' },
                  { label:'Watch Time',         value:analytics.watch_time||'—',                        icon:'⏱️' },
                  { label:'Subscribers',        value:'+'+fmt(analytics.new_subscribers||0),           icon:'📈' },
                  { label:'Impressions',        value:fmt(analytics.impressions||0),                   icon:'📢' },
                  { label:'Click-Through',      value:(analytics.ctr||0)+'%',                          icon:'🎯' },
                  { label:'Avg View Duration',  value:analytics.avg_view_duration||'—',               icon:'📊' },
                ].map(stat => (
                  <div key={stat.label} style={{ ...card }}>
                    <div style={{ fontSize:24, marginBottom:8 }}>{stat.icon}</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:T.yt, marginBottom:4 }}>{stat.value}</div>
                    <div style={{ fontSize:11, color:T.textMuted, textTransform:'uppercase', letterSpacing:'.06em' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COMMENTS ── */}
        {tab === 'comments' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:14 }}>
            <div style={card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <h2 style={{ ...h2, margin:0 }}>Comments ({comments.length})</h2>
              </div>
              <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                {[['all','All'],['pending','🔴 Pending'],['replied','✅ Replied']].map(([k,l]) => (
                  <button key={k} onClick={()=>setComFilter(k)}
                    style={{ padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:'none', background:comFilter===k?T.ytBg:T.cardAlt, color:comFilter===k?T.yt:T.textMuted }}>
                    {l}
                  </button>
                ))}
              </div>
              <div style={{ maxHeight:500, overflowY:'auto', display:'flex', flexDirection:'column', gap:5 }}>
                {filteredComments.length===0 ? (
                  <div style={{ textAlign:'center', padding:'28px 0', color:T.textMuted, fontSize:13 }}>No comments</div>
                ) : filteredComments.map(c => (
                  <div key={c.id} onClick={()=>setSelComment(c)}
                    style={{ padding:'10px 12px', borderRadius:10, cursor:'pointer', border:`1.5px solid ${selComment?.id===c.id?T.yt+'60':T.border}`, background:selComment?.id===c.id?T.ytBg:T.cardAlt }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:T.yt }}>@{c.from||c.author}</span>
                      <span style={{ fontSize:9, padding:'1px 6px', borderRadius:100, fontWeight:700, background:c.replied||replySent[c.id]?T.successBg:T.dangerBg, color:c.replied||replySent[c.id]?T.success:T.danger }}>
                        {c.replied||replySent[c.id]?'✓':'pending'}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:T.textSub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              {!selComment ? (
                <div style={{ textAlign:'center', padding:'48px 0', color:T.textMuted }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>💬</div>
                  Select a comment to reply
                </div>
              ) : (
                <>
                  <div style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.yt, marginBottom:6 }}>@{selComment.from||selComment.author}</div>
                    <div style={{ fontSize:14, color:T.textSub, lineHeight:1.65 }}>{selComment.text}</div>
                    {selComment.post_title && <div style={{ fontSize:11, color:T.textMuted, marginTop:6 }}>📹 {selComment.post_title}</div>}
                  </div>
                  {replySent[selComment.id] ? (
                    <div style={{ display:'flex', alignItems:'center', gap:8, color:T.success, fontSize:13, fontWeight:600 }}>
                      <span>✅</span> Reply sent!
                    </div>
                  ) : (
                    <>
                      <label style={lbl}>Your Reply</label>
                      <textarea style={{ ...ta, minHeight:80, marginBottom:10 }}
                        value={replyText[selComment.id]||''}
                        onChange={e=>setReplyText(p=>({...p,[selComment.id]:e.target.value}))}
                        placeholder="Write your reply..."
                        onFocus={e=>e.target.style.borderColor=T.yt+'60'}
                        onBlur={e=>e.target.style.borderColor=T.inputBorder}/>
                      <button onClick={()=>sendReply(selComment.id)}
                        style={{ width:'100%', padding:'11px', background:T.yt, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                        ▶ Send Reply
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}