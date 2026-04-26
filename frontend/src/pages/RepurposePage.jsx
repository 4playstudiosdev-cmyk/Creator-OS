// src/pages/RepurposePage.jsx
// Nexora OS — Multi-Platform Content Repurposing Engine

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const DARK = {
  bg:'#0A0A0F',card:'#111318',cardAlt:'#1A1D24',border:'rgba(255,255,255,0.07)',
  borderGold:'rgba(245,200,66,0.15)',gold:'#F5C842',goldBg:'rgba(245,200,66,0.08)',
  text:'#FFFFFF',textSub:'#E2E8F0',textMuted:'#64748B',
  success:'#4ADE80',successBg:'rgba(74,222,128,0.1)',
  danger:'#FB7185',info:'#38BDF8',infoBg:'rgba(56,189,248,0.1)',
  input:'#1A1D24',inputBorder:'rgba(255,255,255,0.1)',
}
const LIGHT = {
  bg:'#FFFDF5',card:'#FFFFFF',cardAlt:'#FEF9E7',border:'rgba(0,0,0,0.08)',
  borderGold:'rgba(180,130,0,0.2)',gold:'#D97706',goldBg:'#FEF3C7',
  text:'#1C1917',textSub:'#44403C',textMuted:'#A8A29E',
  success:'#16A34A',successBg:'#F0FDF4',
  danger:'#E11D48',info:'#0284C7',infoBg:'#E0F2FE',
  input:'#FFFFFF',inputBorder:'rgba(0,0,0,0.12)',
}

const PLATFORMS = [
  { id:'twitter',   label:'Twitter/X',  icon:'𝕏',  color:'#1DA1F2', limit:280  },
  { id:'instagram', label:'Instagram',  icon:'📸', color:'#E1306C', limit:2200 },
  { id:'linkedin',  label:'LinkedIn',   icon:'in', color:'#0A66C2', limit:3000 },
  { id:'tiktok',    label:'TikTok',     icon:'♪',  color:'#FE2C55', limit:2200 },
  { id:'youtube',   label:'YouTube',    icon:'▶',  color:'#FF0000', limit:5000 },
  { id:'facebook',  label:'Facebook',   icon:'f',  color:'#1877F2', limit:9999 },
]

const TONES = [
  { id:'viral',        label:'🔥 Viral',       desc:'Hook-first, shareable' },
  { id:'professional', label:'💼 Professional', desc:'Authoritative, polished' },
  { id:'casual',       label:'😊 Casual',       desc:'Friendly, conversational' },
  { id:'storytelling', label:'📖 Story',        desc:'Narrative, emotional' },
]

const LENGTHS = [
  { id:'short',  label:'Short',  desc:'~75 words'  },
  { id:'medium', label:'Medium', desc:'~200 words' },
  { id:'long',   label:'Long',   desc:'300+ words' },
]

const AUDIENCES = ['General','Beginners','Experts','Startup founders','Content creators']

const TEMPLATES = [
  { icon:'📺', label:'YouTube → 5 posts',    platforms:['twitter','instagram','linkedin','tiktok','facebook'] },
  { icon:'🎙️', label:'Podcast → Snippets',   platforms:['instagram','tiktok','twitter'] },
  { icon:'📝', label:'Blog → Thread',        platforms:['twitter','linkedin'] },
  { icon:'🎬', label:'Script → All',         platforms:['twitter','instagram','linkedin','tiktok','youtube'] },
]

const PLAT_OPTIONS = {
  twitter:   { key:'thread_length', label:'Thread', opts:['5 tweets','7 tweets','10 tweets'] },
  instagram: { key:'hashtags',      label:'Hashtags', toggle:true },
  linkedin:  { key:'thought_lead',  label:'Thought-leadership mode', toggle:true },
  tiktok:    { key:'hook',          label:'Hook intensity', opts:['Low','Medium','High','Max'] },
}

const LOADING_MSGS = [
  'Crafting viral hooks…','Optimizing for each platform…',
  'Analyzing engagement patterns…','Writing platform-native content…','Almost done…'
]

const AI_TIMES = { twitter:'12 PM',instagram:'9 AM',linkedin:'8 AM',tiktok:'7 PM',youtube:'6 PM',facebook:'3 PM' }

const scoreColor = s => s>=85?'#4ADE80':s>=70?'#F5C842':'#FB7185'
const viralColor = v => v==='high'?'#4ADE80':v==='medium'?'#F5C842':'#64748B'
const viralIcon  = v => v==='high'?'🔥':v==='medium'?'⚡':'📊'

export default function RepurposePage() {
  const navigate = useNavigate()
  const [theme,        setTheme]        = useState(() => localStorage.getItem('nexora-theme')||'dark')
  const T = theme==='dark' ? DARK : LIGHT

  const [userId,       setUserId]       = useState(null)
  const [input,        setInput]        = useState('')
  const [contentType,  setContentType]  = useState('')
  const [hints,        setHints]        = useState([])
  const [selPlats,     setSelPlats]     = useState(['twitter','instagram','linkedin'])
  const [tone,         setTone]         = useState('viral')
  const [length,       setLength]       = useState('medium')
  const [audience,     setAudience]     = useState('General')
  const [platOpts,     setPlatOpts]     = useState({})
  const [loading,      setLoading]      = useState(false)
  const [loadMsg,      setLoadMsg]      = useState('')
  const [progress,     setProgress]     = useState(0)
  const [generated,    setGenerated]    = useState(null)
  const [editPlatform, setEditPlatform] = useState(null)
  const [copied,       setCopied]       = useState({})
  const [history,      setHistory]      = useState([])

  const hintTimer = useRef(null)
  const msgTimer  = useRef(null)

  useEffect(() => { localStorage.setItem('nexora-theme', theme) }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id)
    })
  }, [])

  useEffect(() => {
    if (!input.trim()) { setHints([]); setContentType(''); return }
    if (input.length > 800) setContentType('long-form article')
    else if (input.toLowerCase().includes('podcast') || input.toLowerCase().includes('episode')) setContentType('podcast')
    else if (input.includes('youtube.com') || input.includes('youtu.be')) setContentType('YouTube video')
    else if (input.includes('\n\n') && input.length > 300) setContentType('blog post')
    else if (input.length < 200) setContentType('short idea')
    else setContentType('content piece')

    clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => {
      const h = []
      if (!input.includes('?') && selPlats.includes('twitter')) h.push('💡 Add a question to boost Twitter replies')
      if (input.length > 400 && selPlats.includes('tiktok')) h.push('💡 This would work great as a TikTok script')
      if (input.toLowerCase().includes('how to')) h.push('💡 Tutorial content gets 3× more saves on Instagram')
      setHints(h.slice(0,2))
    }, 700)
  }, [input, selPlats])

  const togglePlat = id => setSelPlats(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id])
  const setPlatOpt = (plat, key, val) => setPlatOpts(p => ({ ...p, [plat]: { ...p[plat], [key]: val } }))

  const handleGenerate = async () => {
    if (!input.trim() || selPlats.length === 0) return
    setLoading(true); setProgress(0); setGenerated(null); setEditPlatform(null)

    let mi = 0
    setLoadMsg(LOADING_MSGS[0])
    msgTimer.current = setInterval(() => {
      mi = (mi+1) % LOADING_MSGS.length
      setLoadMsg(LOADING_MSGS[mi])
      setProgress(p => Math.min(p+16, 88))
    }, 1100)

    try {
      const sys = `You are a viral content strategist. Generate platform-optimized content. Return ONLY valid JSON, no markdown.`

      const platDetails = selPlats.map(pid => {
        const p = PLATFORMS.find(pl => pl.id===pid)
        const opts = platOpts[pid]
        let extra = ''
        if (pid==='twitter') extra = `Format as numbered thread (1/ 2/ etc). ${opts?.thread_length||'7 tweets'}`
        if (pid==='instagram') extra = opts?.hashtags ? 'Include 20-25 relevant hashtags at end.' : 'No hashtags.'
        if (pid==='linkedin') extra = opts?.thought_lead ? 'Thought-leadership style with personal story.' : 'Professional with clear value.'
        if (pid==='tiktok') extra = `Hook intensity: ${opts?.hook||'High'}. Start with strongest hook. TikTok script format.`
        if (pid==='youtube') extra = 'YouTube description with timestamps structure.'
        return `- ${p.label} (max ${p.limit} chars): ${extra}`
      }).join('\n')

      const prompt = `Repurpose this content for multiple social platforms.

CONTENT:
"""
${input.slice(0, 2000)}
"""

SETTINGS:
- Tone: ${tone}
- Length: ${length}
- Audience: ${audience}

PLATFORM REQUIREMENTS:
${platDetails}

Return this exact JSON (no extra text):
{
  "platforms": {
    ${selPlats.map(p => `"${p}": {"content": "platform-optimized content here", "score": 85, "virality": "high", "best_time": "${AI_TIMES[p]}", "tip": "one actionable tip"}`).join(',\n    ')}
  }
}`

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: sys,
          messages: [{ role:'user', content: prompt }],
        }),
      })
      const d = await r.json()
      const txt = d.content?.[0]?.text || ''
      const m = txt.match(/\{[\s\S]*\}/)
      if (!m) throw new Error('Parse error')
      const parsed = JSON.parse(m[0])
      clearInterval(msgTimer.current)
      setProgress(100)
      setGenerated(parsed.platforms || {})
      setHistory(prev => [{ id:Date.now(), input:input.slice(0,80), ts:new Date(), plats:selPlats, data:parsed.platforms }, ...prev].slice(0,8))

    } catch (e) {
      clearInterval(msgTimer.current)
      // Fallback
      const fb = {}
      selPlats.forEach(p => { fb[p] = { content:`Could not generate AI content. Please check your connection.\n\nOriginal:\n${input.slice(0,200)}`, score:65, virality:'medium', best_time:AI_TIMES[p], tip:'Try again or edit manually.' } })
      setGenerated(fb)
    }

    clearInterval(msgTimer.current)
    setLoading(false)
    setProgress(100)
  }

  const copy = (pid, txt) => {
    navigator.clipboard.writeText(txt)
    setCopied(p => ({ ...p, [pid]:true }))
    setTimeout(() => setCopied(p => ({ ...p, [pid]:false })), 2000)
  }

  const goSchedule = async (pid, content) => {
    if (userId) {
      await supabase.from('scheduled_posts').insert({ user_id:userId, platforms:[pid], content, caption:content, status:'draft', created_at:new Date().toISOString() }).catch(()=>{})
    }
    navigate('/schedule')
  }

  const card = { background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:20 }
  const inp  = { background:T.input, border:`1px solid ${T.inputBorder}`, borderRadius:9, padding:'10px 13px', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box', transition:'border-color .15s' }
  const lbl  = { fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'.07em', display:'block', marginBottom:8 }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans',sans-serif", color:T.text, transition:'background .25s,color .25s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes sp{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .fa{animation:fadeUp .35s ease both}
        .ch:hover{filter:brightness(1.08);transform:translateY(-1px)} .ch{transition:all .15s}
        .pc:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.12)} .pc{transition:all .2s}
        textarea::placeholder,input::placeholder{color:${T.textMuted}}
        *{box-sizing:border-box}
      `}</style>

      <div style={{ maxWidth:1320, margin:'0 auto', padding:'28px 24px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:900, color:T.text, margin:0 }}>⚡ Repurposing Engine</h1>
            <p style={{ fontSize:13, color:T.textMuted, marginTop:3 }}>One piece of content → viral posts for every platform</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {history.length > 0 && (
              <button onClick={() => { setInput(history[0].input); setGenerated(history[0].data) }}
                style={{ padding:'7px 14px', borderRadius:9, background:T.cardAlt, border:`1px solid ${T.border}`, color:T.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                📂 History ({history.length})
              </button>
            )}
            <button onClick={() => setTheme(t=>t==='dark'?'light':'dark')}
              style={{ padding:'7px 14px', borderRadius:100, background:T.goldBg, border:`1px solid ${T.borderGold}`, color:T.gold, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {theme==='dark'?'☀️':'🌙'}
            </button>
          </div>
        </div>

        {/* Quick templates */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {TEMPLATES.map(t => (
            <button key={t.label} className="ch"
              onClick={() => { setInput(`[${t.label}] — Paste your content here...`); setSelPlats(t.platforms) }}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:100, background:T.cardAlt, border:`1px solid ${T.border}`, color:T.textSub, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {t.icon} {t.label}
            </button>
          ))}
          <button className="ch"
            onClick={() => {
              const ideas = ['10 productivity hacks that changed my life','Why most creators fail in year one','How I grew to 100K with no budget','The uncomfortable truth about social media algorithms']
              setInput(ideas[Math.floor(Math.random()*ideas.length)])
            }}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:100, background:T.goldBg, border:`1px solid ${T.borderGold}`, color:T.gold, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            ✨ Random Topic
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }}>

          {/* ── LEFT ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Input */}
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <label style={lbl}>Your Content</label>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  {contentType && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:100, background:T.infoBg, color:T.info, fontWeight:700 }}>📄 {contentType}</span>}
                  {input && <button onClick={()=>setInput('')} style={{ fontSize:11, color:T.textMuted, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Clear</button>}
                </div>
              </div>
              <textarea
                style={{ ...inp, resize:'vertical', minHeight:150, lineHeight:1.6 }}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={'Paste your content here — YouTube transcript, blog post, podcast notes, or just an idea...\n\nOr tap a template above ↑'}
                onFocus={e => e.target.style.borderColor=T.gold+'80'}
                onBlur={e => e.target.style.borderColor=T.inputBorder}
              />
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:5 }}>
                <span style={{ fontSize:11, color:T.textMuted }}>{input.length} chars</span>
              </div>
              {hints.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                  {hints.map((h,i) => (
                    <div key={i} style={{ padding:'7px 10px', background:T.goldBg, border:`1px solid ${T.borderGold}`, borderRadius:8, fontSize:12, color:T.textSub }}>{h}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Platforms */}
            <div style={card}>
              <label style={lbl}>Platforms ({selPlats.length} selected)</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {PLATFORMS.map(p => {
                  const active = selPlats.includes(p.id)
                  const opts = PLAT_OPTIONS[p.id]
                  return (
                    <div key={p.id} className="ch"
                      onClick={() => togglePlat(p.id)}
                      style={{ padding:'10px', borderRadius:10, cursor:'pointer', border:`1.5px solid ${active?p.color+'55':T.border}`, background:active?`${p.color}10`:T.cardAlt }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:active&&opts?6:0 }}>
                        <span style={{ fontSize:14, fontWeight:900, color:p.color }}>{p.icon}</span>
                        <span style={{ fontSize:12, fontWeight:600, color:active?T.text:T.textMuted }}>{p.label}</span>
                        {active && <span style={{ marginLeft:'auto', fontSize:14, color:p.color }}>✓</span>}
                      </div>
                      {active && opts && (
                        <div onClick={e=>e.stopPropagation()} style={{ marginTop:6 }}>
                          {opts.toggle ? (
                            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:10, color:T.textMuted }}>
                              <input type="checkbox" checked={platOpts[p.id]?.[opts.key]||false} onChange={e=>setPlatOpt(p.id,opts.key,e.target.checked)} style={{ accentColor:p.color }}/>
                              {opts.label}
                            </label>
                          ) : (
                            <div>
                              <div style={{ fontSize:9, color:T.textMuted, marginBottom:4 }}>{opts.label}</div>
                              <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                                {opts.opts.map(o => (
                                  <span key={o} onClick={()=>setPlatOpt(p.id,opts.key,o)}
                                    style={{ fontSize:9, padding:'2px 6px', borderRadius:5, cursor:'pointer', background:platOpts[p.id]?.[opts.key]===o?`${p.color}30`:T.card, border:`1px solid ${platOpts[p.id]?.[opts.key]===o?p.color+'50':T.border}`, color:platOpts[p.id]?.[opts.key]===o?p.color:T.textMuted }}>
                                    {o}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tone */}
            <div style={card}>
              <label style={lbl}>Tone & Style</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                {TONES.map(t => (
                  <div key={t.id} className="ch" onClick={()=>setTone(t.id)}
                    style={{ padding:'9px 12px', borderRadius:9, cursor:'pointer', border:`1.5px solid ${tone===t.id?T.gold+'55':T.border}`, background:tone===t.id?T.goldBg:T.cardAlt }}>
                    <div style={{ fontSize:12, fontWeight:700, color:tone===t.id?T.gold:T.text }}>{t.label}</div>
                    <div style={{ fontSize:10, color:T.textMuted }}>{t.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Length</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {LENGTHS.map(l => (
                      <div key={l.id} className="ch" onClick={()=>setLength(l.id)}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:8, cursor:'pointer', border:`1px solid ${length===l.id?T.gold+'50':T.border}`, background:length===l.id?T.goldBg:T.cardAlt }}>
                        <span style={{ fontSize:12, fontWeight:600, color:length===l.id?T.gold:T.text }}>{l.label}</span>
                        <span style={{ fontSize:10, color:T.textMuted }}>{l.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Audience</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {AUDIENCES.map(a => (
                      <div key={a} className="ch" onClick={()=>setAudience(a)}
                        style={{ padding:'8px 10px', borderRadius:8, cursor:'pointer', border:`1px solid ${audience===a?T.gold+'50':T.border}`, background:audience===a?T.goldBg:T.cardAlt, fontSize:12, fontWeight:600, color:audience===a?T.gold:T.text }}>
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Generate */}
            {!generated ? (
              <button onClick={handleGenerate} disabled={loading||!input.trim()||selPlats.length===0}
                style={{ width:'100%', padding:'15px', borderRadius:14, background:loading||!input.trim()||selPlats.length===0?T.cardAlt:`linear-gradient(135deg,${T.gold},#E5A800)`, color:loading||!input.trim()||selPlats.length===0?T.textMuted:theme==='dark'?'#0A0A0F':'#fff', border:'none', fontSize:15, fontWeight:800, cursor:loading||!input.trim()||selPlats.length===0?'not-allowed':'pointer', fontFamily:"'Syne',sans-serif", transition:'all .2s', boxShadow:loading?'none':`0 6px 24px ${T.gold}35` }}>
                {loading
                  ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                      <span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'sp .8s linear infinite',display:'inline-block' }}/>
                      {loadMsg}
                    </span>
                  : `⚡ Turn This Into Viral Content → ${selPlats.length} platform${selPlats.length!==1?'s':''}`}
              </button>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>{setGenerated(null);setEditPlatform(null)}}
                  style={{ flex:1, padding:'12px', borderRadius:12, background:T.cardAlt, border:`1px solid ${T.border}`, color:T.textMuted, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  ← Edit Input
                </button>
                <button onClick={handleGenerate} disabled={loading}
                  style={{ flex:2, padding:'12px', borderRadius:12, background:T.goldBg, border:`1px solid ${T.borderGold}`, color:T.gold, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  🔄 Regenerate All
                </button>
              </div>
            )}

            {loading && (
              <div>
                <div style={{ height:4, background:T.border, borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${T.gold},#E5A800)`, borderRadius:2, transition:'width .6s ease' }}/>
                </div>
                <p style={{ fontSize:11, color:T.textMuted, marginTop:5, textAlign:'center' }}>
                  Generating for {selPlats.join(', ')}...
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT — Output ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {!generated && !loading && (
              <div style={{ ...card, textAlign:'center', padding:'52px 20px' }}>
                <div style={{ fontSize:52, marginBottom:16 }}>⚡</div>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:T.text, margin:'0 0 10px' }}>
                  Ready to Repurpose
                </h3>
                <p style={{ color:T.textMuted, fontSize:13, lineHeight:1.8, maxWidth:320, margin:'0 auto 20px' }}>
                  Paste content, pick platforms, set tone — AI generates platform-native viral content in seconds.
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
                  {['🔥 Viral hooks','📱 6 platforms','📊 Engagement scores','⏰ Best post times','✏️ Inline editing','📅 One-click schedule'].map(f => (
                    <span key={f} style={{ fontSize:11, padding:'4px 10px', borderRadius:100, background:T.goldBg, border:`1px solid ${T.borderGold}`, color:T.gold, fontWeight:600 }}>{f}</span>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div style={{ ...card, textAlign:'center', padding:'52px 20px' }}>
                <div style={{ width:56,height:56,border:`3px solid ${T.borderGold}`,borderTopColor:T.gold,borderRadius:'50%',animation:'sp 1s linear infinite',margin:'0 auto 20px' }}/>
                <p style={{ color:T.gold, fontWeight:700, fontSize:15, margin:'0 0 5px' }}>{loadMsg}</p>
                <p style={{ color:T.textMuted, fontSize:12 }}>
                  Writing for {selPlats.map(p=>PLATFORMS.find(pl=>pl.id===p)?.label).join(', ')}
                </p>
              </div>
            )}

            {generated && selPlats.filter(pid => generated[pid]).map((platId, idx) => {
              const plat = PLATFORMS.find(p => p.id===platId)
              const data = generated[platId]
              const isEdit = editPlatform === platId
              const charPct = Math.min(((data.content?.length||0) / plat.limit) * 100, 100)

              return (
                <div key={platId} className="pc fa" style={{ ...card, border:`1px solid ${plat.color}22`, animationDelay:`${idx*0.08}s` }}>

                  {/* Header */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <div style={{ width:34,height:34,borderRadius:10,background:`${plat.color}18`,border:`1px solid ${plat.color}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,color:plat.color }}>
                        {plat.icon}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{plat.label}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>
                          {data.content?.length||0}/{plat.limit} · Best: {data.best_time}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ textAlign:'center', padding:'4px 8px', borderRadius:8, background:`${scoreColor(data.score||75)}15`, border:`1px solid ${scoreColor(data.score||75)}30` }}>
                        <div style={{ fontSize:14, fontWeight:800, color:scoreColor(data.score||75), fontFamily:"'Syne',sans-serif", lineHeight:1 }}>{data.score||75}</div>
                        <div style={{ fontSize:8, color:T.textMuted }}>score</div>
                      </div>
                      <div style={{ padding:'4px 8px', borderRadius:8, background:T.cardAlt, border:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:10, fontWeight:700, color:viralColor(data.virality||'medium') }}>
                          {viralIcon(data.virality||'medium')} {data.virality||'medium'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Char bar */}
                  <div style={{ height:3, background:T.border, borderRadius:2, marginBottom:10, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${charPct}%`, background:charPct>90?'#FB7185':plat.color, borderRadius:2 }}/>
                  </div>

                  {/* Content */}
                  {isEdit ? (
                    <textarea
                      value={data.content||''}
                      onChange={e => setGenerated(prev => ({ ...prev, [platId]: { ...prev[platId], content: e.target.value } }))}
                      style={{ ...inp, resize:'vertical', minHeight:130, marginBottom:10, fontSize:13, lineHeight:1.65 }}
                      onFocus={e => e.target.style.borderColor=plat.color+'60'}
                      onBlur={e => e.target.style.borderColor=T.inputBorder}
                    />
                  ) : (
                    <div
                      onClick={() => setEditPlatform(platId)}
                      style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:10, padding:'12px 14px', marginBottom:10, minHeight:90, fontSize:13, color:T.textSub, lineHeight:1.7, whiteSpace:'pre-wrap', cursor:'text' }}>
                      {data.content || '—'}
                    </div>
                  )}

                  {/* Inline edit toolbar */}
                  {isEdit && (
                    <div style={{ display:'flex', gap:5, marginBottom:10, flexWrap:'wrap' }}>
                      {['✨ Make punchier','🎯 Add hook','✂️ Shorten','🔥 More viral','📣 Add CTA'].map(a => (
                        <button key={a}
                          style={{ padding:'4px 9px', borderRadius:6, background:T.cardAlt, border:`1px solid ${T.border}`, color:T.textMuted, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                          {a}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tip */}
                  {data.tip && (
                    <div style={{ fontSize:11, color:T.textMuted, padding:'5px 10px', background:T.goldBg, border:`1px solid ${T.borderGold}`, borderRadius:7, marginBottom:10 }}>
                      💡 {data.tip}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => copy(platId, data.content||'')}
                      style={{ flex:1, padding:'8px', borderRadius:8, background:copied[platId]?T.successBg:T.cardAlt, border:`1px solid ${copied[platId]?T.success+'40':T.border}`, color:copied[platId]?T.success:T.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
                      {copied[platId]?'✅ Copied':'📋 Copy'}
                    </button>
                    <button onClick={() => setEditPlatform(isEdit?null:platId)}
                      style={{ flex:1, padding:'8px', borderRadius:8, background:isEdit?`${plat.color}15`:T.cardAlt, border:`1px solid ${isEdit?plat.color+'40':T.border}`, color:isEdit?plat.color:T.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      {isEdit?'✓ Done':'✏️ Edit'}
                    </button>
                    <button onClick={() => setGenerated(prev => ({ ...prev, [platId]: { ...prev[platId], content:prev[platId].content+'\n\n[Tap Regenerate All to refresh]' } }))}
                      style={{ flex:1, padding:'8px', borderRadius:8, background:T.cardAlt, border:`1px solid ${T.border}`, color:T.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      🔄 Redo
                    </button>
                    <button onClick={() => goSchedule(platId, data.content||'')}
                      style={{ flex:1, padding:'8px', borderRadius:8, background:`${plat.color}15`, border:`1px solid ${plat.color}40`, color:plat.color, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      📅 Schedule
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}