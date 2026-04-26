// src/pages/ScriptStudioPage.jsx
// Nexora OS — AI Script Studio
// Hook generator, scene breakdown, interactive editing, score, templates

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const DARK = {
  bg:'#0A0A0F',card:'#111318',cardAlt:'#1A1D24',border:'rgba(255,255,255,0.07)',
  borderGold:'rgba(245,200,66,0.15)',gold:'#F5C842',goldBg:'rgba(245,200,66,0.08)',
  text:'#FFFFFF',textSub:'#E2E8F0',textMuted:'#64748B',
  success:'#4ADE80',successBg:'rgba(74,222,128,0.1)',
  danger:'#FB7185',info:'#38BDF8',infoBg:'rgba(56,189,248,0.1)',
  input:'#1A1D24',inputBorder:'rgba(255,255,255,0.1)',purple:'#A78BFA',purpleBg:'rgba(167,139,250,0.1)',
}
const LIGHT = {
  bg:'#FFFDF5',card:'#FFFFFF',cardAlt:'#FEF9E7',border:'rgba(0,0,0,0.08)',
  borderGold:'rgba(180,130,0,0.2)',gold:'#D97706',goldBg:'#FEF3C7',
  text:'#1C1917',textSub:'#44403C',textMuted:'#A8A29E',
  success:'#16A34A',successBg:'#F0FDF4',
  danger:'#E11D48',info:'#0284C7',infoBg:'#E0F2FE',
  input:'#FFFFFF',inputBorder:'rgba(0,0,0,0.12)',purple:'#7C3AED',purpleBg:'#EDE9FE',
}

const PLATFORMS = [
  { id:'youtube',  label:'YouTube',        icon:'▶',  color:'#FF0000', structure:true },
  { id:'shorts',   label:'YouTube Shorts', icon:'📱', color:'#FF0000', fast:true },
  { id:'tiktok',   label:'TikTok',         icon:'♪',  color:'#FE2C55', fast:true },
  { id:'reels',    label:'Instagram Reels',icon:'📸', color:'#E1306C', fast:true },
  { id:'linkedin', label:'LinkedIn',       icon:'in', color:'#0A66C2', professional:true },
  { id:'podcast',  label:'Podcast',        icon:'🎙️', color:'#8B5CF6', long:true },
]

const DURATIONS = [
  { id:'30s', label:'30s',  words:'~75 words',   for:['shorts','tiktok','reels'] },
  { id:'60s', label:'60s',  words:'~150 words',  for:['shorts','tiktok','reels','youtube'] },
  { id:'3m',  label:'3 min',words:'~450 words',  for:['youtube','reels','linkedin'] },
  { id:'5m',  label:'5 min',words:'~750 words',  for:['youtube','linkedin','podcast'] },
  { id:'10m', label:'10 min',words:'~1500 words',for:['youtube','podcast'] },
  { id:'15m', label:'15+ min',words:'2000+ words',for:['youtube','podcast'] },
]

const TONES = [
  { id:'educational',  label:'📚 Educational', desc:'Teach & inform' },
  { id:'entertaining', label:'😂 Entertaining', desc:'Fun & engaging' },
  { id:'storytelling', label:'📖 Storytelling', desc:'Narrative arc' },
  { id:'controversial',label:'🔥 Controversial', desc:'Debate-worthy' },
  { id:'inspirational',label:'⚡ Inspirational', desc:'Motivate action' },
]

const TEMPLATES = [
  { icon:'🎬', label:'Viral YouTube Script',    type:'viral_yt',     desc:'Hook-heavy, retention-optimized' },
  { icon:'⚡', label:'30-sec Hook Script',      type:'hook_30',      desc:'Maximum impact, minimum time' },
  { icon:'📖', label:'Storytelling Reel',       type:'story_reel',   desc:'Emotional narrative arc' },
  { icon:'🎓', label:'Tutorial Format',         type:'tutorial',     desc:'Step-by-step educational' },
  { icon:'🔥', label:'Controversial Take',      type:'controversial', desc:'Opinion-driven engagement' },
  { icon:'💼', label:'LinkedIn Thought Piece',  type:'linkedin_tp',  desc:'Professional authority' },
]

const LOADING_MSGS = [
  'Analyzing viral patterns…','Crafting your hook…','Building scene structure…',
  'Optimizing for retention…','Adding CTA magic…','Almost ready…'
]

const SCENE_COLORS = ['#F5C842','#38BDF8','#4ADE80','#A78BFA','#FB7185','#F97316']

export default function ScriptStudioPage() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => localStorage.getItem('nexora-theme')||'dark')
  const T = theme==='dark' ? DARK : LIGHT

  const [userId,      setUserId]      = useState(null)
  const [topic,       setTopic]       = useState('')
  const [platform,    setPlatform]    = useState('youtube')
  const [duration,    setDuration]    = useState('5m')
  const [tone,        setTone]        = useState('educational')
  const [energy,      setEnergy]      = useState(70)  // 0-100
  const [complexity,  setComplexity]  = useState(50)  // 0-100
  const [sceneMode,   setSceneMode]   = useState(false)
  const [fastMode,    setFastMode]    = useState(false)

  const [hooks,       setHooks]       = useState([])
  const [selHook,     setSelHook]     = useState(null)
  const [loadingHooks,setLoadingHooks]= useState(false)

  const [script,      setScript]      = useState(null)  // { full, scenes, score, hook_strength, cta_strength, retention_risk }
  const [loading,     setLoading]     = useState(false)
  const [loadMsg,     setLoadMsg]     = useState('')
  const [progress,    setProgress]    = useState(0)

  const [editScene,   setEditScene]   = useState(null)
  const [saved,       setSaved]       = useState([])
  const [copied,      setCopied]      = useState(false)

  const msgTimer = useRef(null)

  useEffect(() => { localStorage.setItem('nexora-theme', theme) }, [theme])
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id)
        loadSaved(session.user.id)
      }
    })
  }, [])

  const loadSaved = async (uid) => {
    try {
      const { data } = await supabase.from('scripts').select('id,topic,platform,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(10)
      setSaved(data||[])
    } catch {}
  }

  const plat = PLATFORMS.find(p=>p.id===platform) || PLATFORMS[0]
  const platColor = plat.color

  const handleTemplate = (t) => {
    const map = {
      viral_yt:     { platform:'youtube', tone:'entertaining', duration:'5m', topic:'[Your topic here] — paste or type your idea' },
      hook_30:      { platform:'shorts',  tone:'controversial', duration:'30s', topic:'[Hook topic] — what shocking truth or tip do you want to share?' },
      story_reel:   { platform:'reels',   tone:'storytelling', duration:'60s', topic:'[Story idea] — describe the story arc' },
      tutorial:     { platform:'youtube', tone:'educational',  duration:'10m', topic:'How to [your tutorial topic]' },
      controversial:{ platform:'youtube', tone:'controversial', duration:'5m', topic:'Why [controversial opinion] is actually right' },
      linkedin_tp:  { platform:'linkedin',tone:'inspirational',duration:'3m', topic:'[Professional insight or lesson]' },
    }
    const cfg = map[t.type]
    if (cfg) { setPlatform(cfg.platform); setTone(cfg.tone); setDuration(cfg.duration); setTopic(cfg.topic) }
  }

  const generateHooks = async () => {
    if (!topic.trim()) return
    setLoadingHooks(true); setHooks([]); setSelHook(null)
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'anthropic-dangerous-direct-browser-ipc':'true' },
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1000,
          system:'You are a viral content hook expert. Generate 5 diverse, high-performing hooks. Return ONLY valid JSON.',
          messages:[{ role:'user', content:`Generate 5 different hook styles for this topic: "${topic}"
Platform: ${plat.label}
Tone: ${tone}
Return JSON: {"hooks":[{"style":"Question Hook","text":"...","why":"why this works"},{"style":"Shock Stat","text":"...","why":"..."},{"style":"Story Hook","text":"...","why":"..."},{"style":"Controversial","text":"...","why":"..."},{"style":"Promise Hook","text":"...","why":"..."}]}` }]
        })
      })
      const d = await r.json()
      const m = (d.content?.[0]?.text||'').match(/\{[\s\S]*\}/)
      if (m) { const p = JSON.parse(m[0]); setHooks(p.hooks||[]) }
    } catch {}
    setLoadingHooks(false)
  }

  const generateScript = async () => {
    if (!topic.trim()) return
    setLoading(true); setProgress(0); setScript(null)
    let mi=0; setLoadMsg(LOADING_MSGS[0])
    msgTimer.current = setInterval(() => { mi=(mi+1)%LOADING_MSGS.length; setLoadMsg(LOADING_MSGS[mi]); setProgress(p=>Math.min(p+15,88)) }, 1000)

    try {
      const hookLine = selHook ? `Opening hook: "${hooks.find(h=>h.style===selHook)?.text}"` : ''
      const dur = DURATIONS.find(d=>d.id===duration)
      const fastPace = PLATFORMS.find(p=>p.id===platform)?.fast || fastMode

      const systemMsg = `You are a world-class content script writer trained on viral YouTube, TikTok, and Instagram content. Generate complete, ready-to-use scripts. Return ONLY valid JSON.`

      const prompt = `Write a complete ${dur?.label} ${plat.label} script.

Topic: ${topic}
Tone: ${tone}
Target length: ${dur?.words}
Energy level: ${energy}/100 (${energy>70?'high-energy, fast-paced':energy>40?'moderate pace':'calm, measured'})
Complexity: ${complexity}/100 (${complexity>70?'expert level':complexity>40?'intermediate':'beginner-friendly'})
${hookLine}
${fastPace?'Style: Fast-paced, pattern interrupts every 15-20 seconds':''}
${sceneMode?'IMPORTANT: Include scene-by-scene breakdown with camera directions':''}

Return this exact JSON:
{
  "full_script": "Complete word-for-word script with natural line breaks",
  "scenes": [
    {"name":"Hook","duration":"0-3s","content":"exact words","camera":"Camera direction","emoji":"🎣"},
    {"name":"Problem","duration":"3-15s","content":"exact words","camera":"Camera direction","emoji":"❗"},
    {"name":"Solution","duration":"15-45s","content":"exact words","camera":"Camera direction","emoji":"💡"},
    {"name":"Proof/Story","duration":"45-90s","content":"exact words","camera":"Camera direction","emoji":"📖"},
    {"name":"CTA","duration":"final 5s","content":"exact words","camera":"Camera direction","emoji":"📣"}
  ],
  "score": {
    "hook_strength": 85,
    "retention_score": 78,
    "cta_strength": 72,
    "overall": 80
  },
  "feedback": {
    "hook": "Hook feedback here",
    "retention": "Retention risk note",
    "cta": "CTA improvement tip"
  },
  "word_count": 450,
  "estimated_duration": "4 min 30 sec"
}`

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json','anthropic-dangerous-direct-browser-ipc':'true'},
        body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:4000, system:systemMsg, messages:[{role:'user',content:prompt}] })
      })
      const d = await r.json()
      const txt = d.content?.[0]?.text||''
      const m = txt.match(/\{[\s\S]*\}/)
      if (!m) throw new Error('Parse failed')
      const parsed = JSON.parse(m[0])
      clearInterval(msgTimer.current); setProgress(100)
      setScript(parsed)

      // Save to Supabase
      if (userId) {
        supabase.from('scripts').insert({ user_id:userId, topic, platform, tone, duration, script_data:parsed, created_at:new Date().toISOString() }).catch(()=>{})
      }
    } catch(e) {
      clearInterval(msgTimer.current)
      setScript({ full_script:`Script generation failed.\n\nTopic: ${topic}\n\nPlease try again.`, scenes:[], score:{hook_strength:0,retention_score:0,cta_strength:0,overall:0}, feedback:{hook:'Try again',retention:'',cta:''}, word_count:0, estimated_duration:'—' })
    }
    clearInterval(msgTimer.current); setLoading(false); setProgress(100)
  }

  const copyScript = () => {
    navigator.clipboard.writeText(script?.full_script||'')
    setCopied(true); setTimeout(()=>setCopied(false),2000)
  }

  const scoreColor = s => s>=80?'#4ADE80':s>=60?'#F5C842':'#FB7185'
  const scoreLabel = s => s>=80?'Strong':s>=60?'Good':'Needs work'

  const card = { background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:20 }
  const inp  = { background:T.input, border:`1px solid ${T.inputBorder}`, borderRadius:9, padding:'10px 13px', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box', transition:'border-color .15s' }
  const lbl  = { fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'.07em', display:'block', marginBottom:8 }
  const h2   = { fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:T.text, margin:'0 0 14px' }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans',sans-serif", color:T.text, transition:'background .25s,color .25s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes sp{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .fa{animation:fadeUp .35s ease both}
        .ch:hover{filter:brightness(1.1);transform:translateY(-1px)} .ch{transition:all .15s}
        textarea::placeholder,input::placeholder{color:${T.textMuted}}
        *{box-sizing:border-box}
        input[type=range]{accent-color:${T.gold}}
      `}</style>

      <div style={{ maxWidth:1320, margin:'0 auto', padding:'28px 24px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:900, color:T.text, margin:0 }}>✍️ Script Studio</h1>
            <p style={{ fontSize:13, color:T.textMuted, marginTop:3 }}>AI-powered scripts with hooks, scenes, scores & instant editing</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {saved.length>0 && (
              <button style={{ padding:'7px 14px', borderRadius:9, background:T.cardAlt, border:`1px solid ${T.border}`, color:T.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                📂 Saved ({saved.length})
              </button>
            )}
            <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}
              style={{ padding:'7px 14px', borderRadius:100, background:T.goldBg, border:`1px solid ${T.borderGold}`, color:T.gold, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {theme==='dark'?'☀️':'🌙'}
            </button>
          </div>
        </div>

        {/* Templates */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {TEMPLATES.map(t => (
            <button key={t.type} className="ch" onClick={()=>handleTemplate(t)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:100, background:T.cardAlt, border:`1px solid ${T.border}`, color:T.textSub, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:16, alignItems:'start' }}>

          {/* ── LEFT — Settings ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Topic */}
            <div style={card}>
              <label style={lbl}>Topic / Idea</label>
              <textarea
                style={{ ...inp, resize:'vertical', minHeight:80, lineHeight:1.6 }}
                value={topic}
                onChange={e=>setTopic(e.target.value)}
                placeholder="What's your script about?\n\ne.g. '5 morning habits that doubled my productivity' or 'Why most people fail at investing'"
                onFocus={e=>e.target.style.borderColor=T.gold+'80'}
                onBlur={e=>e.target.style.borderColor=T.inputBorder}
              />

              {/* Hook Generator */}
              <button onClick={generateHooks} disabled={loadingHooks||!topic.trim()}
                style={{ width:'100%', marginTop:10, padding:'10px', borderRadius:10, background:T.purpleBg, border:`1px solid ${T.purple}40`, color:T.purple, fontSize:13, fontWeight:700, cursor:!topic.trim()?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .15s' }}>
                {loadingHooks
                  ? <><span style={{ width:14,height:14,border:`2px solid ${T.purple}40`,borderTopColor:T.purple,borderRadius:'50%',animation:'sp .8s linear infinite',display:'inline-block' }}/>Generating hooks...</>
                  : '🎣 Generate 5 Hook Ideas First'}
              </button>

              {/* Hooks */}
              {hooks.length > 0 && (
                <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:7 }}>
                  <div style={lbl}>Pick a Hook (optional)</div>
                  {hooks.map((h,i) => (
                    <div key={i} className="ch" onClick={()=>setSelHook(selHook===h.style?null:h.style)}
                      style={{ padding:'10px 12px', borderRadius:10, cursor:'pointer', border:`1.5px solid ${selHook===h.style?T.purple+'60':T.border}`, background:selHook===h.style?T.purpleBg:T.cardAlt }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:T.purple, background:T.purpleBg, padding:'1px 7px', borderRadius:100 }}>{h.style}</span>
                        {selHook===h.style && <span style={{ fontSize:10, color:T.success }}>✓ Selected</span>}
                      </div>
                      <div style={{ fontSize:13, color:T.text, lineHeight:1.5, fontStyle:'italic' }}>"{h.text}"</div>
                      {h.why && <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>💡 {h.why}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform */}
            <div style={card}>
              <label style={lbl}>Platform</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
                {PLATFORMS.map(p => (
                  <div key={p.id} className="ch" onClick={()=>setPlatform(p.id)}
                    style={{ padding:'9px 8px', borderRadius:9, cursor:'pointer', textAlign:'center', border:`1.5px solid ${platform===p.id?p.color+'60':T.border}`, background:platform===p.id?`${p.color}12`:T.cardAlt }}>
                    <div style={{ fontSize:16, marginBottom:2 }}>{p.icon}</div>
                    <div style={{ fontSize:11, fontWeight:600, color:platform===p.id?T.text:T.textMuted }}>{p.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div style={card}>
              <label style={lbl}>Duration & Length</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
                {DURATIONS.map(d => (
                  <div key={d.id} className="ch" onClick={()=>setDuration(d.id)}
                    style={{ padding:'8px', borderRadius:9, cursor:'pointer', textAlign:'center', border:`1.5px solid ${duration===d.id?T.gold+'60':T.border}`, background:duration===d.id?T.goldBg:T.cardAlt }}>
                    <div style={{ fontSize:14, fontWeight:800, color:duration===d.id?T.gold:T.text, fontFamily:"'Syne',sans-serif" }}>{d.label}</div>
                    <div style={{ fontSize:9, color:T.textMuted, marginTop:2 }}>{d.words}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div style={card}>
              <label style={lbl}>Tone</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {TONES.map(t => (
                  <div key={t.id} className="ch" onClick={()=>setTone(t.id)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:9, cursor:'pointer', border:`1.5px solid ${tone===t.id?T.gold+'55':T.border}`, background:tone===t.id?T.goldBg:T.cardAlt }}>
                    <span style={{ fontSize:13, fontWeight:600, color:tone===t.id?T.gold:T.text }}>{t.label}</span>
                    <span style={{ fontSize:11, color:T.textMuted }}>{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Style sliders */}
            <div style={card}>
              <label style={lbl}>Style DNA</label>
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, color:T.textMuted }}>Energy</span>
                  <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>{energy<40?'🧘 Calm':energy<70?'😊 Moderate':'⚡ High-Energy'}</span>
                </div>
                <input type="range" min={0} max={100} value={energy} onChange={e=>setEnergy(Number(e.target.value))} style={{ width:'100%', height:4 }}/>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textMuted, marginTop:3 }}>
                  <span>Calm</span><span>High-Energy</span>
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, color:T.textMuted }}>Complexity</span>
                  <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>{complexity<40?'🌱 Beginner':complexity<70?'📘 Intermediate':'🎓 Expert'}</span>
                </div>
                <input type="range" min={0} max={100} value={complexity} onChange={e=>setComplexity(Number(e.target.value))} style={{ width:'100%', height:4 }}/>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textMuted, marginTop:3 }}>
                  <span>Beginner</span><span>Expert</span>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  [sceneMode, setSceneMode, '🎬 Scene-by-scene breakdown'],
                  [fastMode,  setFastMode,  '⚡ Fast-paced (pattern interrupts)'],
                ].map(([val, setVal, label]) => (
                  <label key={label} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                    <div onClick={()=>setVal(!val)} style={{ width:34,height:18,borderRadius:100,background:val?T.gold:'rgba(255,255,255,0.1)',position:'relative',transition:'background .2s',cursor:'pointer',flexShrink:0 }}>
                      <div style={{ width:12,height:12,background:'#fff',borderRadius:'50%',position:'absolute',top:3,left:val?19:3,transition:'left .2s' }}/>
                    </div>
                    <span style={{ fontSize:12, color:T.textSub }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate button */}
            {!script ? (
              <button onClick={generateScript} disabled={loading||!topic.trim()}
                style={{ width:'100%', padding:'15px', borderRadius:14, background:loading||!topic.trim()?T.cardAlt:`linear-gradient(135deg,${T.gold},#E5A800)`, color:loading||!topic.trim()?T.textMuted:theme==='dark'?'#0A0A0F':'#fff', border:'none', fontSize:15, fontWeight:800, cursor:loading||!topic.trim()?'not-allowed':'pointer', fontFamily:"'Syne',sans-serif", transition:'all .2s', boxShadow:loading?'none':`0 6px 24px ${T.gold}35` }}>
                {loading
                  ? <span style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
                      <span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'sp .8s linear infinite',display:'inline-block' }}/>
                      {loadMsg}
                    </span>
                  : `✍️ Generate ${plat.label} Script`}
              </button>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>{setScript(null);setHooks([]);setSelHook(null)}}
                  style={{ flex:1, padding:'12px', borderRadius:12, background:T.cardAlt, border:`1px solid ${T.border}`, color:T.textMuted, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  ← New Script
                </button>
                <button onClick={generateScript} disabled={loading}
                  style={{ flex:2, padding:'12px', borderRadius:12, background:T.goldBg, border:`1px solid ${T.borderGold}`, color:T.gold, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  🔄 Regenerate
                </button>
              </div>
            )}

            {loading && (
              <div>
                <div style={{ height:4, background:T.border, borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${T.gold},#E5A800)`, borderRadius:2, transition:'width .6s ease' }}/>
                </div>
                <p style={{ fontSize:11, color:T.textMuted, textAlign:'center', marginTop:5 }}>~5 seconds · This will take a moment</p>
              </div>
            )}
          </div>

          {/* ── RIGHT — Output ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {!script && !loading && (
              <div style={{ ...card, textAlign:'center', padding:'52px 20px' }}>
                <div style={{ fontSize:52, marginBottom:16 }}>✍️</div>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:T.text, margin:'0 0 10px' }}>Script Studio</h3>
                <p style={{ color:T.textMuted, fontSize:13, lineHeight:1.8, maxWidth:320, margin:'0 auto 24px' }}>
                  Enter your topic, pick a platform, choose your tone — AI writes a complete ready-to-use script with scenes, hooks, and scores.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, maxWidth:340, margin:'0 auto' }}>
                  {['🎣 Hook Generator','📊 Script Score','🎬 Scene Breakdown','✏️ Inline Editing','⚡ Regenerate Parts','📅 Save & Schedule'].map(f => (
                    <div key={f} style={{ padding:'8px 12px', background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:9, fontSize:11, color:T.textSub, fontWeight:600 }}>{f}</div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div style={{ ...card, textAlign:'center', padding:'52px 20px' }}>
                <div style={{ width:56,height:56,border:`3px solid ${T.borderGold}`,borderTopColor:T.gold,borderRadius:'50%',animation:'sp 1s linear infinite',margin:'0 auto 20px' }}/>
                <p style={{ color:T.gold, fontWeight:700, fontSize:15, margin:'0 0 5px' }}>{loadMsg}</p>
                <p style={{ color:T.textMuted, fontSize:12 }}>Writing your {plat.label} script...</p>
              </div>
            )}

            {script && (
              <>
                {/* Score Card */}
                <div className="fa" style={{ ...card, border:`1px solid ${T.borderGold}` }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <h2 style={h2}>📊 Script Score</h2>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:900, color:scoreColor(script.score?.overall||75) }}>
                      {script.score?.overall||75}/100
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
                    {[
                      { label:'Hook Strength',     val:script.score?.hook_strength||75,  tip:script.feedback?.hook },
                      { label:'Retention Score',   val:script.score?.retention_score||70, tip:script.feedback?.retention },
                      { label:'CTA Strength',      val:script.score?.cta_strength||68,   tip:script.feedback?.cta },
                    ].map(s => (
                      <div key={s.label} style={{ padding:'10px', background:T.cardAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>{s.label}</div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:scoreColor(s.val), marginBottom:4 }}>{s.val}</div>
                        <div style={{ height:3, background:T.border, borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${s.val}%`, background:scoreColor(s.val), borderRadius:2 }}/>
                        </div>
                        {s.tip && <div style={{ fontSize:10, color:T.textMuted, marginTop:5, lineHeight:1.4 }}>{s.tip}</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:10, fontSize:12, color:T.textMuted }}>
                    <span>📝 {script.word_count||'—'} words</span>
                    <span>⏱️ {script.estimated_duration||'—'}</span>
                    <span>{plat.icon} {plat.label}</span>
                  </div>
                </div>

                {/* Scene Breakdown */}
                {script.scenes?.length > 0 && (
                  <div className="fa" style={card}>
                    <h2 style={h2}>🎬 Scene Breakdown</h2>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {script.scenes.map((scene, i) => (
                        <div key={i} style={{ borderRadius:11, border:`1px solid ${T.border}`, overflow:'hidden' }}>
                          {/* Scene header */}
                          <div
                            onClick={() => setEditScene(editScene===i?null:i)}
                            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:T.cardAlt, cursor:'pointer' }}>
                            <div style={{ width:28,height:28,borderRadius:8,background:`${SCENE_COLORS[i%SCENE_COLORS.length]}20`,border:`1px solid ${SCENE_COLORS[i%SCENE_COLORS.length]}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0 }}>
                              {scene.emoji||'🎬'}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{scene.name}</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>{scene.duration} · {scene.camera}</div>
                            </div>
                            <span style={{ fontSize:12, color:T.textMuted }}>{editScene===i?'▲':'▼'}</span>
                          </div>

                          {/* Scene content */}
                          {editScene === i && (
                            <div style={{ padding:'12px 14px', borderTop:`1px solid ${T.border}` }}>
                              <textarea
                                value={scene.content}
                                onChange={e => setScript(prev => ({ ...prev, scenes: prev.scenes.map((sc,si) => si===i?{...sc,content:e.target.value}:sc) }))}
                                style={{ ...inp, resize:'vertical', minHeight:80, lineHeight:1.6, fontSize:13, marginBottom:10 }}
                                onFocus={e=>e.target.style.borderColor=SCENE_COLORS[i%SCENE_COLORS.length]+'80'}
                                onBlur={e=>e.target.style.borderColor=T.inputBorder}
                              />
                              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                {['✨ Make punchier','🎯 Add hook','✂️ Shorten','🔥 More energy'].map(a => (
                                  <button key={a} style={{ padding:'4px 9px', borderRadius:6, background:T.cardAlt, border:`1px solid ${T.border}`, color:T.textMuted, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                                    {a}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Script */}
                <div className="fa" style={card}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <h2 style={h2}>📄 Full Script</h2>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={copyScript}
                        style={{ padding:'7px 14px', borderRadius:8, background:copied?T.successBg:T.cardAlt, border:`1px solid ${copied?T.success+'40':T.border}`, color:copied?T.success:T.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
                        {copied?'✅ Copied':'📋 Copy'}
                      </button>
                      <button onClick={()=>navigate('/schedule',{state:{content:script.full_script}})}
                        style={{ padding:'7px 14px', borderRadius:8, background:T.goldBg, border:`1px solid ${T.borderGold}`, color:T.gold, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                        📅 Schedule
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={script.full_script||''}
                    onChange={e => setScript(prev => ({ ...prev, full_script: e.target.value }))}
                    style={{ ...inp, resize:'vertical', minHeight:300, lineHeight:1.8, fontSize:13, fontFamily:'inherit' }}
                    onFocus={e=>e.target.style.borderColor=T.gold+'80'}
                    onBlur={e=>e.target.style.borderColor=T.inputBorder}
                  />

                  {/* Edit toolbar */}
                  <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                    {['✨ Improve hook','⚡ Add energy','✂️ Shorten middle','📣 Stronger CTA','😂 Add humor'].map(a => (
                      <button key={a} style={{ padding:'5px 10px', borderRadius:7, background:T.cardAlt, border:`1px solid ${T.border}`, color:T.textMuted, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}