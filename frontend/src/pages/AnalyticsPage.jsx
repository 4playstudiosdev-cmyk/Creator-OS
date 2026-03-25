import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const AUDIENCE_GROWTH = [
  { month:'Oct', twitter:1200, youtube:800,  linkedin:400,  instagram:600  },
  { month:'Nov', twitter:1800, youtube:1100, linkedin:550,  instagram:900  },
  { month:'Dec', twitter:2400, youtube:1600, linkedin:700,  instagram:1400 },
  { month:'Jan', twitter:3100, youtube:2200, linkedin:950,  instagram:2000 },
  { month:'Feb', twitter:4200, youtube:3100, linkedin:1200, instagram:2800 },
  { month:'Mar', twitter:5800, youtube:4200, linkedin:1600, instagram:3900 },
]

const POSTING_TIME_DATA = [
  { time:'6am',  engagement:12 }, { time:'8am',  engagement:45 },
  { time:'10am', engagement:78 }, { time:'12pm', engagement:92 },
  { time:'2pm',  engagement:65 }, { time:'4pm',  engagement:88 },
  { time:'6pm',  engagement:95 }, { time:'8pm',  engagement:72 },
  { time:'10pm', engagement:38 },
]

const PLATFORM_BREAKDOWN = [
  { name:'Twitter',   value:42, color:'#1d9bf0' },
  { name:'YouTube',   value:28, color:'#ef4444' },
  { name:'LinkedIn',  value:18, color:'#0077b5' },
  { name:'Instagram', value:12, color:'#d946ef' },
]

const TOP_POSTS = [
  { id:1, platform:'𝕏',  content:'AI is revolutionizing content creation...', engagement:1240, reach:8900,  deal:'Samsung — $150', date:'Mar 7' },
  { id:2, platform:'in', content:'The Rise of AI-Assisted Design...',           engagement:890,  reach:5600,  deal:null,             date:'Mar 6' },
  { id:3, platform:'𝕏',  content:'YouTube has completely changed how...',      engagement:2100, reach:14200, deal:'Nike — $300',    date:'Mar 5' },
  { id:4, platform:'in', content:'Creators waste 2 hours daily switching...',  engagement:650,  reach:4100,  deal:null,             date:'Mar 4' },
]

const ROI_LINKS_INIT = [
  { id:1, brand:'Samsung', link:'creatoros.app/r/samsung-mar', clicks:342, conversions:28, deal:'$150' },
  { id:2, brand:'Nike',    link:'creatoros.app/r/nike-feb',    clicks:891, conversions:67, deal:'$300' },
  { id:3, brand:'Notion',  link:'creatoros.app/r/notion-mar',  clicks:156, conversions:12, deal:'$200' },
]

const CHART_LINES = [
  { key:'twitter',   color:'#1d9bf0', label:'Twitter'   },
  { key:'youtube',   color:'#ef4444', label:'YouTube'   },
  { key:'linkedin',  color:'#0077b5', label:'LinkedIn'  },
  { key:'instagram', color:'#d946ef', label:'Instagram' },
]

// Dark recharts tooltip
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px' }}>
      <p style={{ fontSize:11, color:'#6b7280', marginBottom:4 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ fontSize:12, color:p.color, fontWeight:600 }}>{p.name}: {p.value}{p.unit||''}</p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [activeChart, setActiveChart]   = useState('all')
  const [aiInsight,   setAiInsight]     = useState('')
  const [aiLoading,   setAiLoading]     = useState(false)
  const [copiedLink,  setCopiedLink]    = useState(null)
  const [roiLinks,    setRoiLinks]      = useState(ROI_LINKS_INIT)
  const [showForm,    setShowForm]      = useState(false)
  const [newLink,     setNewLink]       = useState({ brand:'', deal:'' })

  const last    = AUDIENCE_GROWTH[AUDIENCE_GROWTH.length - 1]
  const prev    = AUDIENCE_GROWTH[AUDIENCE_GROWTH.length - 2]
  const totalNow  = last.twitter + last.youtube + last.linkedin + last.instagram
  const totalPrev = prev.twitter + prev.youtube + prev.linkedin + prev.instagram
  const growth    = (((totalNow - totalPrev) / totalPrev) * 100).toFixed(1)
  const bestTime  = POSTING_TIME_DATA.reduce((a,b) => a.engagement > b.engagement ? a : b)

  const visibleLines = activeChart === 'all' ? CHART_LINES : CHART_LINES.filter(l => l.key === activeChart)

  const handleAiInsight = async () => {
    setAiLoading(true)
    try {
      const res  = await fetch('http://localhost:8000/api/ai/analytics-insight', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ total_audience:totalNow, growth_percent:growth, best_time:bestTime.time, top_platform:'Twitter', total_posts:TOP_POSTS.length }),
      })
      const data = await res.json()
      setAiInsight(data.insight)
    } catch { setAiInsight('AI insight generate nahi hua. Backend check karein.') }
    finally { setAiLoading(false) }
  }

  const handleCopy = (id, link) => {
    navigator.clipboard.writeText('https://' + link)
    setCopiedLink(id); setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleCreateLink = () => {
    if (!newLink.brand.trim()) return
    const slug = newLink.brand.toLowerCase().replace(/\s/g,'-') + '-' + new Date().getMonth()
    setRoiLinks(p => [...p, { id:p.length+1, brand:newLink.brand, link:`creatoros.app/r/${slug}`, clicks:0, conversions:0, deal:newLink.deal }])
    setNewLink({ brand:'', deal:'' }); setShowForm(false)
  }

  const card = { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20 }

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:'#f0f0f5' }}>
      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        .an-input {
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
          border-radius:10px; padding:9px 14px; color:#f0f0f5;
          font-family:'DM Sans',sans-serif; font-size:13px; outline:none;
          transition:border-color .2s; box-sizing:border-box; color-scheme:dark;
        }
        .an-input:focus { border-color:rgba(99,102,241,0.5); }
        .an-input::placeholder { color:#374151; }
        .an-btn { cursor:pointer; border:none; font-family:'Syne',sans-serif; font-weight:700; transition:all .18s; }
        .an-btn:hover { filter:brightness(1.15); transform:translateY(-1px); }
        .an-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; filter:none; }
        .chart-filter { cursor:pointer; border:none; font-family:'Syne',sans-serif; font-weight:700; transition:all .15s; }
        .roi-row { transition:background .15s; }
        .roi-row:hover { background:rgba(255,255,255,0.03) !important; }
        .recharts-cartesian-grid-horizontal line,
        .recharts-cartesian-grid-vertical line { stroke:rgba(255,255,255,0.05) !important; }
        .recharts-text { fill:#4b5563 !important; }
        .recharts-legend-item-text { color:#6b7280 !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:12, color:'#6b7280', marginBottom:6, letterSpacing:1, textTransform:'uppercase', fontWeight:600 }}>Overview</p>
        <h1 style={{ fontSize:28, fontWeight:800, fontFamily:'Syne', letterSpacing:'-0.5px', marginBottom:4 }}>Analytics 📊</h1>
        <p style={{ fontSize:13, color:'#6b7280' }}>Apni growth, engagement aur ROI track karein</p>
      </div>

      {/* Stats Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Audience', value:totalNow.toLocaleString(), sub:`+${growth}% this month`, subColor:'#6ee7b7' },
          { label:'Best Post Time', value:bestTime.time, sub:`${bestTime.engagement}% engagement rate`, subColor:'#93c5fd' },
          { label:'Top Platform',   value:'𝕏 Twitter', sub:`${PLATFORM_BREAKDOWN[0].value}% of audience`, subColor:'#9ca3af' },
          { label:'ROI Links',      value:roiLinks.length, sub:`${roiLinks.reduce((s,l)=>s+l.clicks,0)} total clicks`, subColor:'#c4b5fd' },
        ].map((s,i) => (
          <div key={i} style={{ ...card, padding:'16px 18px' }}>
            <p style={{ fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, fontWeight:700 }}>{s.label}</p>
            <p style={{ fontFamily:'Syne', fontWeight:800, fontSize:22, marginBottom:4 }}>{s.value}</p>
            <p style={{ fontSize:11, color:s.subColor }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* AI Insight Banner */}
      <div style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.2))', border:'1px solid rgba(99,102,241,0.3)', borderRadius:18, padding:'18px 22px', marginBottom:20, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
        <div style={{ flex:1 }}>
          <p style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:6 }}>✨ AI Growth Insight</p>
          {aiInsight
            ? <p style={{ fontSize:13, color:'#c7d2fe', lineHeight:1.7 }}>{aiInsight}</p>
            : <p style={{ fontSize:13, color:'#6b7280' }}>AI tumhara data analyze karke personalized growth tips dega!</p>
          }
        </div>
        <button className="an-btn" onClick={handleAiInsight} disabled={aiLoading} style={{
          flexShrink:0, padding:'9px 18px', borderRadius:12,
          background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)',
          color:'#f0f0f5', fontSize:13, display:'flex', alignItems:'center', gap:7,
        }}>
          {aiLoading
            ? <><div style={{ width:13,height:13,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite' }}/> Analyzing...</>
            : (aiInsight ? '🔄 Refresh' : '✨ Get Insight')}
        </button>
      </div>

      {/* Audience Growth Chart */}
      <div style={{ ...card, padding:24, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:16 }}>Audience Growth</h2>
          <div style={{ display:'flex', gap:5 }}>
            {[{id:'all',label:'All'},{id:'twitter',label:'𝕏'},{id:'youtube',label:'▶'},{id:'linkedin',label:'in'},{id:'instagram',label:'📸'}].map(f => (
              <button key={f.id} className="chart-filter" onClick={() => setActiveChart(f.id)} style={{
                padding:'5px 12px', borderRadius:8, fontSize:12,
                background: activeChart===f.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeChart===f.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                color: activeChart===f.id ? '#a5b4fc' : '#4b5563',
              }}>{f.label}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={AUDIENCE_GROWTH}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize:11, fill:'#4b5563' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'#4b5563' }} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} />
            <Legend wrapperStyle={{ fontSize:12 }} />
            {visibleLines.map(l => (
              <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color}
                strokeWidth={2.5} dot={{ r:4, fill:l.color, strokeWidth:0 }}
                activeDot={{ r:6 }} name={l.label} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Best Time + Platform Breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>

        {/* Best Posting Time */}
        <div style={{ ...card, padding:24 }}>
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:16, marginBottom:4 }}>Best Posting Times</h2>
          <p style={{ fontSize:11, color:'#4b5563', marginBottom:18 }}>Engagement rate by hour</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={POSTING_TIME_DATA} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize:10, fill:'#4b5563' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'#4b5563' }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} formatter={v => v + '%'} />
              <Bar dataKey="engagement" radius={[6,6,0,0]}
                fill="url(#barGrad)"
              >
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop:12, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:12, padding:'10px 14px' }}>
            <p style={{ fontSize:12, color:'#a5b4fc', fontWeight:600 }}>
              🏆 Best time: <span style={{ color:'#f0f0f5' }}>{bestTime.time}</span> — {bestTime.engagement}% engagement
            </p>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div style={{ ...card, padding:24 }}>
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:16, marginBottom:4 }}>Platform Breakdown</h2>
          <p style={{ fontSize:11, color:'#4b5563', marginBottom:18 }}>Audience distribution</p>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <ResponsiveContainer width="50%" height={190}>
              <PieChart>
                <Pie data={PLATFORM_BREAKDOWN} cx="50%" cy="50%" innerRadius={48} outerRadius={78} dataKey="value" strokeWidth={0}>
                  {PLATFORM_BREAKDOWN.map((e,i) => <Cell key={i} fill={e.color} opacity={0.9} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} formatter={v => v + '%'} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
              {PLATFORM_BREAKDOWN.map(p => (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:'#9ca3af', flex:1 }}>{p.name}</span>
                  <span style={{ fontFamily:'Syne', fontWeight:800, fontSize:13, color:'#f0f0f5' }}>{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Posts + Deal Attribution */}
      <div style={{ ...card, padding:24, marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:16, marginBottom:18 }}>Top Posts — Deal Attribution 🔗</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {TOP_POSTS.map(post => (
            <div key={post.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, flexShrink:0, color:'#f0f0f5' }}>{post.platform}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'#f0f0f5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{post.content}</p>
                <p style={{ fontSize:10, color:'#4b5563' }}>{post.date}</p>
              </div>
              <div style={{ textAlign:'center', minWidth:70 }}>
                <p style={{ fontFamily:'Syne', fontWeight:800, fontSize:14 }}>{post.engagement.toLocaleString()}</p>
                <p style={{ fontSize:10, color:'#4b5563' }}>Engagement</p>
              </div>
              <div style={{ textAlign:'center', minWidth:70 }}>
                <p style={{ fontFamily:'Syne', fontWeight:800, fontSize:14 }}>{post.reach.toLocaleString()}</p>
                <p style={{ fontSize:10, color:'#4b5563' }}>Reach</p>
              </div>
              <div style={{ minWidth:110, textAlign:'right' }}>
                {post.deal
                  ? <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:100, background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', color:'#6ee7b7', fontFamily:'Syne' }}>💰 {post.deal}</span>
                  : <span style={{ fontSize:11, padding:'4px 10px', borderRadius:100, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'#374151' }}>No deal yet</span>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI Tracking Links */}
      <div style={{ ...card, padding:24 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:16, marginBottom:4 }}>Sponsorship ROI Links 📈</h2>
            <p style={{ fontSize:11, color:'#4b5563' }}>Brands ko ye links do — clicks aur conversions track hongi</p>
          </div>
          <button className="an-btn" onClick={() => setShowForm(!showForm)} style={{
            padding:'9px 16px', borderRadius:12,
            background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.35)',
            color:'#a5b4fc', fontSize:13,
          }}>+ New Link</button>
        </div>

        {/* New Link Form */}
        {showForm && (
          <div style={{ marginBottom:16, padding:'16px', background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:14 }}>
            <div style={{ display:'flex', gap:10 }}>
              <input className="an-input" style={{ flex:1 }} value={newLink.brand} onChange={e => setNewLink(p=>({...p,brand:e.target.value}))} placeholder="Brand name (e.g. Samsung)" />
              <input className="an-input" style={{ width:140 }} value={newLink.deal}  onChange={e => setNewLink(p=>({...p,deal:e.target.value}))}  placeholder="Deal (e.g. $200)" />
              <button className="an-btn" onClick={handleCreateLink} disabled={!newLink.brand.trim()} style={{
                padding:'9px 18px', borderRadius:12,
                background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:13,
              }}>Create</button>
            </div>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {roiLinks.map(link => (
            <div key={link.id} className="roi-row" style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:13, color:'#f0f0f5' }}>{link.brand}</span>
                  {link.deal && <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', color:'#6ee7b7', fontFamily:'Syne' }}>{link.deal}</span>}
                </div>
                <p style={{ fontSize:11, color:'#6366f1', fontFamily:'monospace' }}>{link.link}</p>
              </div>
              {[
                { val:link.clicks,      label:'Clicks',      color:'#f0f0f5' },
                { val:link.conversions, label:'Conversions', color:'#f0f0f5' },
                { val:(link.clicks>0?((link.conversions/link.clicks)*100).toFixed(1):0)+'%', label:'CVR', color:'#6ee7b7' },
              ].map((s,i) => (
                <div key={i} style={{ textAlign:'center', minWidth:60 }}>
                  <p style={{ fontFamily:'Syne', fontWeight:800, fontSize:14, color:s.color }}>{s.val}</p>
                  <p style={{ fontSize:10, color:'#4b5563' }}>{s.label}</p>
                </div>
              ))}
              <button className="an-btn" onClick={() => handleCopy(link.id, link.link)} style={{
                padding:'7px 14px', borderRadius:10, fontSize:11,
                background: copiedLink===link.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${copiedLink===link.id ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: copiedLink===link.id ? '#6ee7b7' : '#6b7280',
              }}>{copiedLink===link.id ? '✅ Copied!' : '📋 Copy'}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}