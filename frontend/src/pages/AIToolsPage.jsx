import { useState } from 'react'

const NICHES = [
  'Tech & AI', 'Personal Finance', 'Fitness & Health', 'Content Creation',
  'Entrepreneurship', 'Digital Marketing', 'Travel', 'Food & Cooking',
  'Fashion & Style', 'Mental Health', 'Crypto & Web3', 'Education'
]
const PLATFORMS = ['Twitter', 'LinkedIn', 'YouTube', 'Instagram']

const TABS = [
  { id: 'idea-matrix', label: '🧠 Idea Matrix',    desc: 'Trending topics' },
  { id: 'calendar',    label: '📅 Calendar Fill',  desc: 'Auto schedule'   },
  { id: 'ab-test',     label: '🔬 A/B Testing',    desc: 'Best post'       },
  { id: 'hashtags',    label: '#️⃣ Hashtags',       desc: 'Viral score'     },
]

const TAB_ACCENTS = {
  'idea-matrix': { color: '#818cf8', bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.4)'  },
  'calendar':    { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.35)' },
  'ab-test':     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)' },
  'hashtags':    { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)'},
}

export default function AIToolsPage() {
  const [activeTab, setActiveTab] = useState('idea-matrix')

  // Idea Matrix
  const [selectedNiche, setSelectedNiche] = useState('')
  const [customNiche,   setCustomNiche]   = useState('')
  const [ideaLoading,   setIdeaLoading]   = useState(false)
  const [ideas,         setIdeas]         = useState([])

  // Calendar
  const [calendarNiche,    setCalendarNiche]    = useState('')
  const [calendarPlatform, setCalendarPlatform] = useState('Twitter')
  const [calendarLoading,  setCalendarLoading]  = useState(false)
  const [calendarPlan,     setCalendarPlan]     = useState([])

  // A/B Test
  const [postA,      setPostA]      = useState('')
  const [postB,      setPostB]      = useState('')
  const [abPlatform, setAbPlatform] = useState('Twitter')
  const [abLoading,  setAbLoading]  = useState(false)
  const [abResult,   setAbResult]   = useState(null)

  // Hashtags
  const [hashtagTopic,    setHashtagTopic]    = useState('')
  const [hashtagPlatform, setHashtagPlatform] = useState('Instagram')
  const [hashtagLoading,  setHashtagLoading]  = useState(false)
  const [hashtagResult,   setHashtagResult]   = useState(null)

  const post = (url, body) =>
    fetch(`http://localhost:8000${url}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json())

  const handleGenerateIdeas = async () => {
    const niche = customNiche || selectedNiche
    if (!niche) return
    setIdeaLoading(true); setIdeas([])
    try { const d = await post('/api/ai/idea-matrix', { niche }); setIdeas(d.ideas || []) }
    catch (e) { alert('Error: ' + e.message) }
    finally { setIdeaLoading(false) }
  }

  const handleCalendarFill = async () => {
    if (!calendarNiche) return
    setCalendarLoading(true); setCalendarPlan([])
    try { const d = await post('/api/ai/calendar-fill', { niche: calendarNiche, platform: calendarPlatform }); setCalendarPlan(d.plan || []) }
    catch (e) { alert('Error: ' + e.message) }
    finally { setCalendarLoading(false) }
  }

  const handleAbTest = async () => {
    if (!postA.trim() || !postB.trim()) return
    setAbLoading(true); setAbResult(null)
    try { const d = await post('/api/ai/ab-test', { post_a: postA, post_b: postB, platform: abPlatform }); setAbResult(d) }
    catch (e) { alert('Error: ' + e.message) }
    finally { setAbLoading(false) }
  }

  const handleHashtags = async () => {
    if (!hashtagTopic.trim()) return
    setHashtagLoading(true); setHashtagResult(null)
    try { const d = await post('/api/ai/hashtags', { topic: hashtagTopic, platform: hashtagPlatform }); setHashtagResult(d) }
    catch (e) { alert('Error: ' + e.message) }
    finally { setHashtagLoading(false) }
  }

  const accent = TAB_ACCENTS[activeTab]

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5' }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        .ai-input {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 11px 14px; color: #f0f0f5;
          font-family: 'DM Sans',sans-serif; font-size: 13px; outline: none;
          transition: border-color .2s; box-sizing: border-box; color-scheme: dark;
        }
        .ai-input:focus { border-color: rgba(99,102,241,0.5); }
        .ai-input::placeholder { color: #374151; }
        .ai-select {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 11px 14px; color: #f0f0f5;
          font-family: 'DM Sans',sans-serif; font-size: 13px; outline: none;
          color-scheme: dark; cursor: pointer;
        }
        .ai-textarea {
          width: 100%; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
          padding: 12px 14px; color: #f0f0f5; font-family: 'DM Sans',sans-serif;
          font-size: 13px; resize: vertical; outline: none;
          transition: border-color .2s; box-sizing: border-box; color-scheme: dark;
          line-height: 1.6;
        }
        .ai-textarea:focus { border-color: rgba(99,102,241,0.5); }
        .ai-textarea::placeholder { color: #374151; }
        .ai-btn { cursor:pointer; border:none; font-family:'Syne',sans-serif; font-weight:700; transition:all .18s; }
        .ai-btn:hover { filter:brightness(1.15); transform:translateY(-1px); }
        .ai-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; filter:none; }
        .chip-btn { cursor:pointer; border:none; font-family:'DM Sans',sans-serif; font-weight:600; transition:all .15s; }
        .chip-btn:hover { filter:brightness(1.1); }
        .tab-btn { cursor:pointer; border:none; transition:all .2s; text-align:left; }
        .tab-btn:hover { transform:translateY(-1px); }
        .hashtag-tag { cursor:pointer; transition:all .15s; user-select:none; }
        .hashtag-tag:hover { filter:brightness(1.2); transform:scale(1.04); }
        .fade-in { animation: fadeUp 0.3s ease both; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize:12, color:'#6b7280', marginBottom:6, letterSpacing:1, textTransform:'uppercase', fontWeight:600 }}>AI Suite</p>
        <h1 style={{ fontSize:28, fontWeight:800, fontFamily:'Syne', letterSpacing:'-0.5px', marginBottom:4 }}>AI Power Tools 🤖</h1>
        <p style={{ fontSize:13, color:'#6b7280' }}>AI se apni content strategy supercharge karein</p>
      </div>

      {/* Tab Nav */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {TABS.map(tab => {
          const a    = TAB_ACCENTS[tab.id]
          const isA  = activeTab === tab.id
          return (
            <button key={tab.id} className="tab-btn" onClick={() => setActiveTab(tab.id)} style={{
              padding: '14px 16px', borderRadius: 16,
              background: isA ? a.bg : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isA ? a.border : 'rgba(255,255,255,0.07)'}`,
            }}>
              <p style={{ fontFamily:'Syne', fontWeight:700, fontSize:13, color: isA ? a.color : '#6b7280', marginBottom:3 }}>{tab.label}</p>
              <p style={{ fontSize:11, color: isA ? a.color : '#374151', opacity: isA ? 0.8 : 1 }}>{tab.desc}</p>
            </button>
          )
        })}
      </div>

      {/* ── Tab 1: Idea Matrix ── */}
      {activeTab === 'idea-matrix' && (
        <div className="fade-in" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:24 }}>
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:17, marginBottom:4 }}>🧠 AI Idea Matrix</h2>
          <p style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>Apna niche chunein — AI 10 trending content ideas dega</p>

          <div style={{ marginBottom:16 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 }}>Quick Select</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {NICHES.map(n => {
                const active = selectedNiche === n
                return (
                  <button key={n} className="chip-btn" onClick={() => { setSelectedNiche(n); setCustomNiche('') }} style={{
                    padding:'6px 14px', borderRadius:100, fontSize:12,
                    background: active ? accent.bg : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? accent.border : 'rgba(255,255,255,0.08)'}`,
                    color: active ? accent.color : '#6b7280',
                  }}>{n}</button>
                )
              })}
            </div>
          </div>

          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            <input className="ai-input" style={{ flex:1 }} value={customNiche}
              onChange={e => { setCustomNiche(e.target.value); setSelectedNiche('') }}
              placeholder="Ya apna custom niche likhein..."
              onKeyDown={e => e.key === 'Enter' && handleGenerateIdeas()}
            />
            <button className="ai-btn" onClick={handleGenerateIdeas}
              disabled={ideaLoading || (!selectedNiche && !customNiche)}
              style={{ padding:'11px 22px', borderRadius:12, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
              {ideaLoading
                ? <><div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite' }}/> Generating...</>
                : '✨ Generate Ideas'}
            </button>
          </div>

          {ideas.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {ideas.map((idea, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, transition:'border-color .15s' }}>
                  <span style={{ width:24, height:24, borderRadius:'50%', background:accent.bg, border:`1px solid ${accent.border}`, color:accent.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0, fontFamily:'Syne' }}>{i+1}</span>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:'#f0f0f5', lineHeight:1.4, marginBottom:idea.hook?4:0 }}>{idea.title}</p>
                    {idea.hook && <p style={{ fontSize:11, color:'#4b5563', lineHeight:1.5 }}>{idea.hook}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!ideaLoading && ideas.length === 0 && (
            <div style={{ border:'2px dashed rgba(255,255,255,0.06)', borderRadius:16, padding:'50px 24px', textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🧠</div>
              <p style={{ fontSize:13, color:'#4b5563' }}>Niche chunein aur Generate dabao!</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Calendar Fill ── */}
      {activeTab === 'calendar' && (
        <div className="fade-in" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:24 }}>
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:17, marginBottom:4 }}>📅 Content Calendar Auto-fill</h2>
          <p style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>AI ek hafte ka content plan banayega — din, waqt, aur topic ke saath</p>

          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            <input className="ai-input" style={{ flex:1 }} value={calendarNiche} onChange={e => setCalendarNiche(e.target.value)} placeholder="Apna niche likhein (e.g. AI tools, Fitness)" />
            <select className="ai-select" value={calendarPlatform} onChange={e => setCalendarPlatform(e.target.value)}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="ai-btn" onClick={handleCalendarFill} disabled={calendarLoading || !calendarNiche.trim()}
              style={{ padding:'11px 20px', borderRadius:12, background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:13, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:8 }}>
              {calendarLoading
                ? <><div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite' }}/> Planning...</>
                : '📅 Generate Plan'}
            </button>
          </div>

          {calendarPlan.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {calendarPlan.map((day, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14 }}>
                  <div style={{ textAlign:'center', flexShrink:0, minWidth:56 }}>
                    <p style={{ fontSize:11, fontWeight:800, color:'#34d399', background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.3)', padding:'3px 8px', borderRadius:8, fontFamily:'Syne' }}>{day.day}</p>
                    <p style={{ fontSize:10, color:'#4b5563', marginTop:4 }}>{day.time}</p>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'#f0f0f5', marginBottom:2 }}>{day.topic}</p>
                    <p style={{ fontSize:11, color:'#4b5563' }}>{day.format}</p>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)', color:'#34d399', padding:'3px 10px', borderRadius:100, whiteSpace:'nowrap', fontFamily:'Syne' }}>
                    {day.platform}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!calendarLoading && calendarPlan.length === 0 && (
            <div style={{ border:'2px dashed rgba(255,255,255,0.06)', borderRadius:16, padding:'50px 24px', textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>📅</div>
              <p style={{ fontSize:13, color:'#4b5563' }}>Niche aur platform chunein — AI 7 din ka plan banayega!</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: A/B Testing ── */}
      {activeTab === 'ab-test' && (
        <div className="fade-in" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:24 }}>
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:17, marginBottom:4 }}>🔬 A/B Post Testing</h2>
          <p style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>2 versions likhein — AI batayega konsa better perform karega aur kyun</p>

          <div style={{ marginBottom:16 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>Platform</p>
            <div style={{ display:'flex', gap:7 }}>
              {PLATFORMS.map(p => (
                <button key={p} className="chip-btn" onClick={() => setAbPlatform(p)} style={{
                  padding:'6px 16px', borderRadius:100, fontSize:12,
                  background: abPlatform===p ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${abPlatform===p ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: abPlatform===p ? '#fbbf24' : '#6b7280',
                }}>{p}</button>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            {[
              { label:'Version A', value:postA, set:setPostA, winner:'A' },
              { label:'Version B', value:postB, set:setPostB, winner:'B' },
            ].map(v => {
              const isWinner = abResult?.winner === v.winner
              return (
                <div key={v.winner}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color: isWinner ? '#6ee7b7' : '#6b7280', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>
                    {v.label} {isWinner && '🏆 Winner!'}
                  </label>
                  <textarea className="ai-textarea" rows={7} value={v.value} onChange={e => v.set(e.target.value)}
                    placeholder={`${v.label} likhein...`}
                    style={{ borderColor: isWinner ? 'rgba(16,185,129,0.5)' : undefined }}
                  />
                </div>
              )
            })}
          </div>

          <button className="ai-btn" onClick={handleAbTest} disabled={abLoading || !postA.trim() || !postB.trim()}
            style={{ width:'100%', padding:'13px', borderRadius:12, background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {abLoading
              ? <><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite' }}/> Analyzing...</>
              : '🔬 Analyze Both Versions'}
          </button>

          {abResult && (
            <div style={{ marginTop:16, padding:'18px 20px', background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <span style={{ fontSize:24 }}>🏆</span>
                <h3 style={{ fontFamily:'Syne', fontWeight:800, fontSize:15 }}>Version {abResult.winner} Better Hai!</h3>
              </div>
              <p style={{ fontSize:13, color:'#d1d5db', lineHeight:1.7, marginBottom:12 }}>{abResult.reason}</p>
              {abResult.tips && (
                <div style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:12, padding:'12px 14px' }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#a5b4fc', marginBottom:4 }}>💡 Improvement Tips:</p>
                  <p style={{ fontSize:12, color:'#c7d2fe', lineHeight:1.6 }}>{abResult.tips}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: Hashtags ── */}
      {activeTab === 'hashtags' && (
        <div className="fade-in" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:24 }}>
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:17, marginBottom:4 }}>#️⃣ Auto-Hashtag + Best Time</h2>
          <p style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>Topic dein — AI best hashtags, viral score aur posting time suggest karega</p>

          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            <input className="ai-input" style={{ flex:1 }} value={hashtagTopic} onChange={e => setHashtagTopic(e.target.value)}
              placeholder="Post ka topic likhein (e.g. AI tools for creators)"
              onKeyDown={e => e.key === 'Enter' && handleHashtags()}
            />
            <select className="ai-select" value={hashtagPlatform} onChange={e => setHashtagPlatform(e.target.value)}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="ai-btn" onClick={handleHashtags} disabled={hashtagLoading || !hashtagTopic.trim()}
              style={{ padding:'11px 20px', borderRadius:12, background:'linear-gradient(135deg,#8b5cf6,#a78bfa)', color:'#fff', fontSize:13, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:8 }}>
              {hashtagLoading
                ? <><div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite' }}/> Generating...</>
                : '✨ Generate'}
            </button>
          </div>

          {hashtagResult && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

              {/* Viral Score */}
              {hashtagResult.viral_score && (
                <div style={{ padding:'18px 20px', background:'rgba(249,115,22,0.07)', border:'1px solid rgba(249,115,22,0.25)', borderRadius:16 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#fb923c' }}>🔥 Content Potential Score</p>
                    <div style={{ fontFamily:'Syne', fontWeight:900, fontSize:28, color:'#f97316' }}>
                      {hashtagResult.viral_score.score}<span style={{ fontSize:16, color:'#9a3412' }}>/100</span>
                    </div>
                  </div>
                  {/* Score bar */}
                  <div style={{ height:6, background:'rgba(249,115,22,0.15)', borderRadius:100, marginBottom:12, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:100, width:`${hashtagResult.viral_score.score}%`,
                      background: hashtagResult.viral_score.score>=70 ? '#10b981' : hashtagResult.viral_score.score>=50 ? '#f59e0b' : '#ef4444',
                      transition:'width 0.6s ease' }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:10 }}>
                    {[
                      { label:'Demand',      val:hashtagResult.viral_score.demand,      hi:'High',  hiColor:'#6ee7b7' },
                      { label:'Competition', val:hashtagResult.viral_score.competition, hi:'Low',   hiColor:'#6ee7b7' },
                      { label:'Trend',       val:hashtagResult.viral_score.trend,       hi:'Rising',hiColor:'#6ee7b7' },
                    ].map(s => (
                      <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
                        <p style={{ fontSize:10, color:'#4b5563', marginBottom:4 }}>{s.label}</p>
                        <p style={{ fontSize:13, fontWeight:700, fontFamily:'Syne', color: s.val===s.hi ? '#6ee7b7' : '#fbbf24' }}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize:12, color:'#9a3412' }}>{hashtagResult.viral_score.reason}</p>
                </div>
              )}

              {/* Hashtags */}
              {hashtagResult.hashtags && (
                <div style={{ padding:'16px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:0.5, marginBottom:14 }}>📌 Hashtags by Reach</p>
                  {[
                    { key:'high_reach',   label:'🔴 High Reach',   bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.3)',   color:'#f87171' },
                    { key:'medium_reach', label:'🟡 Medium Reach', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.3)', color:'#fbbf24' },
                    { key:'niche',        label:'🔵 Niche',        bg:'rgba(59,130,246,0.12)',  border:'rgba(59,130,246,0.3)', color:'#93c5fd' },
                  ].map(g => hashtagResult.hashtags[g.key]?.length > 0 && (
                    <div key={g.key} style={{ marginBottom:14 }}>
                      <p style={{ fontSize:10, fontWeight:700, color:g.color, textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>{g.label}</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                        {hashtagResult.hashtags[g.key].map((tag,i) => (
                          <span key={i} className="hashtag-tag" onClick={() => navigator.clipboard.writeText(tag)}
                            title="Click to copy"
                            style={{ background:g.bg, border:`1px solid ${g.border}`, color:g.color, padding:'5px 12px', borderRadius:100, fontSize:12, fontWeight:600 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize:11, color:'#374151', marginTop:4 }}>💡 Hashtag par click karein copy karne ke liye</p>
                </div>
              )}

              {/* Best Times */}
              {hashtagResult.best_times && (
                <div style={{ padding:'16px 20px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:16 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#34d399', textTransform:'uppercase', letterSpacing:0.5, marginBottom:14 }}>⏰ Best Posting Times — {hashtagPlatform}</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {hashtagResult.best_times.map((t, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 14px' }}>
                        <span style={{ fontSize:11, fontWeight:800, color:'#34d399', minWidth:18, fontFamily:'Syne' }}>{i+1}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:'#f0f0f5', minWidth:90 }}>{t.day}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:'#6ee7b7', fontFamily:'Syne' }}>{t.range}</span>
                        {t.reason && <span style={{ fontSize:11, color:'#4b5563', marginLeft:'auto' }}>{t.reason}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategy */}
              {hashtagResult.strategy && (
                <div style={{ padding:'14px 18px', background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:14 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#c4b5fd', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>🎯 Strategy Tip</p>
                  <p style={{ fontSize:13, color:'#ddd6fe', lineHeight:1.7 }}>{hashtagResult.strategy}</p>
                </div>
              )}
            </div>
          )}

          {!hashtagLoading && !hashtagResult && (
            <div style={{ border:'2px dashed rgba(255,255,255,0.06)', borderRadius:16, padding:'50px 24px', textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>#️⃣</div>
              <p style={{ fontSize:13, color:'#4b5563' }}>Topic aur platform chunein — AI best hashtags, viral score aur time batayega!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}