// src/pages/Dashboard.jsx
// Nexora OS — Main Dashboard
// Dark/Light mode, all platform stats, earnings, deals, scheduled posts

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const API = 'https://creator-os-production-0bf8.up.railway.app'

const DARK = {
  bg:'#0A0A0F',card:'#111318',cardAlt:'#1A1D24',border:'rgba(255,255,255,0.07)',
  borderGold:'rgba(245,200,66,0.15)',borderActive:'rgba(245,200,66,0.4)',
  gold:'#F5C842',goldMuted:'#C49A1A',goldBg:'rgba(245,200,66,0.08)',
  text:'#FFFFFF',textSub:'#E2E8F0',textMuted:'#64748B',
  success:'#4ADE80',successBg:'rgba(74,222,128,0.1)',
  danger:'#FB7185',dangerBg:'rgba(251,113,133,0.1)',
  info:'#38BDF8',infoBg:'rgba(56,189,248,0.1)',
}
const LIGHT = {
  bg:'#FFFDF5',card:'#FFFFFF',cardAlt:'#FEF9E7',border:'rgba(0,0,0,0.08)',
  borderGold:'rgba(180,130,0,0.2)',borderActive:'rgba(180,130,0,0.5)',
  gold:'#D97706',goldMuted:'#B8860B',goldBg:'#FEF3C7',
  text:'#1C1917',textSub:'#44403C',textMuted:'#A8A29E',
  success:'#16A34A',successBg:'#F0FDF4',
  danger:'#E11D48',dangerBg:'#FFF1F2',
  info:'#0284C7',infoBg:'#E0F2FE',
}

const fmt = n => !n&&n!==0?'0':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1000?(n/1000).toFixed(1)+'K':String(n)
const fmtMoney = n => !n&&n!==0?'$0':n>=1000?'$'+(n/1000).toFixed(1)+'K':'$'+Number(n).toFixed(0)

function Sparkline({ data, color, w=80, h=28 }) {
  if (!data||data.length<2) return null
  const max=Math.max(...data),min=Math.min(...data),range=max-min||1
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*h}`).join(' ')
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
    <polyline points={pts} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}

const PLATFORMS = [
  { id:'youtube',   label:'YouTube',   color:'#FF0000', icon:'▶', route:'/youtube-studio' },
  { id:'instagram', label:'Instagram', color:'#E1306C', icon:'📸', route:'/instagram' },
  { id:'linkedin',  label:'LinkedIn',  color:'#0A66C2', icon:'in', route:'/linkedin' },
  { id:'tiktok',    label:'TikTok',    color:'#FE2C55', icon:'♪', route:'/tiktok' },
]

const QUICK_ACTIONS = [
  { icon:'✂️', label:'Auto Clip',    route:'/auto-clip' },
  { icon:'🎬', label:'Video Editor', route:'/video-editor' },
  { icon:'📅', label:'Schedule',     route:'/schedule' },
  { icon:'✍️', label:'Scripts',      route:'/script-studio' },
  { icon:'📊', label:'Analytics',    route:'/analytics' },
  { icon:'🤝', label:'Brand Deals',  route:'/deals' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [theme,     setTheme]     = useState(() => localStorage.getItem('nexora-theme')||'dark')
  const [userId,    setUserId]    = useState(null)
  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [pData,     setPData]     = useState({})
  const [earnings,  setEarnings]  = useState({ total:0, breakdown:{} })
  const [deals,     setDeals]     = useState([])
  const [scheduled, setScheduled] = useState([])
  const [monthPosts,setMonthPosts]= useState(0)
  const [greeting,  setGreeting]  = useState('Good morning')

  const T = theme==='dark' ? DARK : LIGHT

  useEffect(() => {
    const h=new Date().getHours()
    setGreeting(h<12?'Good morning':h<17?'Good afternoon':'Good evening')
  },[])

  useEffect(() => {
    localStorage.setItem('nexora-theme', theme)
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => {
      if (!session) return
      const uid = session.user.id
      setUserId(uid)
      loadAll(uid)
    })
  }, [])

  const loadAll = async (uid) => {
    setLoading(true)
    const [prof] = await Promise.allSettled([
      supabase.from('profiles').select('*').eq('id',uid).maybeSingle().then(r=>r.data),
    ])
    if (prof.status==='fulfilled') setProfile(prof.value)

    // Load platform statuses in parallel
    const platResults = {}
    await Promise.allSettled(PLATFORMS.map(async p => {
      try {
        const endpoints = {
          youtube:   `${API}/api/youtube/status/${uid}`,
          instagram: `${API}/api/instagram/status/${uid}`,
          linkedin:  `${API}/api/linkedin/status/${uid}`,
          tiktok:    `${API}/api/tiktok/status/${uid}`,
        }
        const r = await fetch(endpoints[p.id])
        const d = await r.json()
        platResults[p.id] = {
          connected: d.connected || false,
          username:  d.channel_title||d.channel_name||d.username||d.name||'',
          avatar:    d.thumbnail||d.picture||d.avatar||'',
          stats:     p.id==='youtube'
            ? { subscribers: d.subscribers||0 }
            : p.id==='instagram'
            ? { followers: d.followers||0 }
            : p.id==='tiktok'
            ? { followers: d.followers||0 }
            : { connections: 0 },
          sparkline: [
            Math.random()*100,Math.random()*120,Math.random()*110,
            Math.random()*140,Math.random()*130,Math.random()*160,Math.random()*180
          ].map(Math.round),
        }
      } catch {
        platResults[p.id] = { connected: false }
      }
    }))
    setPData(platResults)

    // Earnings
    try {
      const { data: earnData } = await supabase.from('earnings').select('*').eq('user_id', uid)
      if (earnData?.length) {
        const total = earnData.reduce((a,e) => a+(e.amount||0), 0)
        const breakdown = {}
        earnData.forEach(e => { breakdown[e.platform]=(breakdown[e.platform]||0)+e.amount })
        setEarnings({ total, breakdown })
      }
    } catch {}

    // Deals
    try {
      const { data } = await supabase.from('deals').select('*').eq('user_id',uid)
        .in('status',['active','pending','negotiation']).order('created_at',{ascending:false}).limit(4)
      setDeals(data||[])
    } catch {}

    // Scheduled posts
    try {
      const { data } = await supabase.from('scheduled_posts').select('*').eq('user_id',uid)
        .gte('scheduled_for',new Date().toISOString()).order('scheduled_for',{ascending:true}).limit(5)
      setScheduled(data||[])

      const startMonth = new Date(); startMonth.setDate(1); startMonth.setHours(0,0,0,0)
      const { count } = await supabase.from('scheduled_posts').select('*',{count:'exact',head:true})
        .eq('user_id',uid).gte('created_at',startMonth.toISOString())
      setMonthPosts(count||0)
    } catch {}

    setLoading(false)
  }

  const connectedCount = Object.values(pData).filter(p=>p.connected).length
  const totalReach = Object.values(pData).reduce((a,p) => {
    if (!p.connected||!p.stats) return a
    return a + Object.values(p.stats).reduce((s,v)=>s+v,0)
  },0)

  const card = { background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:20 }
  const h2   = { fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:T.text, margin:'0 0 14px' }
  const lbl  = { fontSize:10, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'.08em' }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', background:T.bg }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');`}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:38,height:38,border:`3px solid ${T.borderGold}`,borderTopColor:T.gold,borderRadius:'50%',animation:'sp .8s linear infinite',margin:'0 auto 12px' }}/>
        <p style={{ color:T.textMuted,fontSize:13,fontFamily:'DM Sans,sans-serif' }}>Loading...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans',sans-serif", color:T.text, transition:'background .25s,color .25s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes sp{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .da{animation:fadeUp .45s ease both}
        .da:nth-child(1){animation-delay:.04s}.da:nth-child(2){animation-delay:.08s}
        .da:nth-child(3){animation-delay:.12s}.da:nth-child(4){animation-delay:.16s}
        .qa:hover{transform:translateY(-2px);border-color:${T.borderGold}!important;background:${T.goldBg}!important}
        .qa{transition:all .15s!important}
        .pb:hover{filter:brightness(1.05);transform:translateX(2px)}
        .pb{transition:all .15s}
        *{box-sizing:border-box}
      `}</style>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'28px 24px' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
          <div>
            <p style={{ fontSize:13, color:T.textMuted, margin:'0 0 3px' }}>{greeting} 👋</p>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:900, color:T.text, margin:0 }}>
              {profile?.full_name||profile?.username||'Creator'}
            </h1>
            <p style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>
              {connectedCount} platform{connectedCount!==1?'s':''} connected · {monthPosts} posts this month
            </p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={() => setTheme(t=>t==='dark'?'light':'dark')}
              style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:100,background:theme==='dark'?'rgba(255,255,255,0.07)':T.goldBg,border:`1px solid ${T.borderGold}`,color:T.gold,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all .25s' }}>
              {theme==='dark'?'☀️ Light':'🌙 Dark'}
            </button>
            <button onClick={()=>navigate('/settings')}
              style={{ padding:'7px 16px',borderRadius:9,background:T.goldBg,border:`1px solid ${T.borderGold}`,color:T.gold,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Syne',sans-serif" }}>
              ⚙️ Settings
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[
            { label:'Total Reach', value:fmt(totalReach), sub:'Across all platforms', up:true, spark:[100,120,115,140,155,145,180] },
            { label:'Total Earnings', value:fmtMoney(earnings.total), sub:earnings.total>0?'Revenue tracked':'No earnings yet', up:earnings.total>0, spark:[0,0,10,30,50,80,earnings.total||0] },
            { label:'Active Deals', value:String(deals.length), sub:deals.length>0?`${deals.length} in pipeline`:'No active deals', up:deals.length>0, spark:[1,0,2,1,3,2,deals.length] },
            { label:'Posts This Month', value:String(monthPosts), sub:'Scheduled + posted', up:monthPosts>0, spark:[0,2,4,3,6,5,monthPosts] },
          ].map((stat,i) => (
            <div key={stat.label} className="da" style={{ ...card, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute',top:-24,right:-24,width:70,height:70,borderRadius:'50%',background:T.goldBg,filter:'blur(18px)',pointerEvents:'none' }}/>
              <div style={{ ...lbl, marginBottom:8 }}>{stat.label}</div>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:900,color:T.gold,lineHeight:1,marginBottom:4 }}>{stat.value}</div>
              <div style={{ fontSize:11,color:T.textMuted,marginBottom:10 }}>{stat.sub}</div>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <span style={{ fontSize:11,fontWeight:700,color:stat.up?T.success:T.textMuted,background:stat.up?T.successBg:'transparent',padding:stat.up?'2px 8px':0,borderRadius:100 }}>
                  {stat.up?'↑ Active':'—'}
                </span>
                <Sparkline data={stat.spark} color={T.gold}/>
              </div>
            </div>
          ))}
        </div>

        {/* ── Platforms + Scheduled ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14, marginBottom:20 }}>

          {/* Platform Status */}
          <div style={card}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
              <h2 style={h2}>Connected Platforms</h2>
              <button onClick={()=>navigate('/settings')} style={{ fontSize:11,color:T.gold,background:T.goldBg,border:`1px solid ${T.borderGold}`,padding:'4px 10px',borderRadius:7,cursor:'pointer',fontFamily:'inherit',fontWeight:700 }}>Manage</button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {PLATFORMS.map(p => {
                const d = pData[p.id]||{}
                const reach = d.stats ? Object.values(d.stats).reduce((a,v)=>a+v,0) : 0
                return (
                  <div key={p.id} className="pb"
                    onClick={()=>navigate(d.connected?p.route:'/settings')}
                    style={{ display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:12,cursor:'pointer',background:d.connected?T.cardAlt:'transparent',border:`1px solid ${d.connected?T.border:T.border}` }}>
                    <div style={{ width:38,height:38,borderRadius:11,background:`${p.color}18`,border:`1px solid ${p.color}35`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:16,color:p.color,fontWeight:900 }}>
                      {d.avatar
                        ? <img src={d.avatar} alt="" style={{ width:30,height:30,borderRadius:9,objectFit:'cover' }}/>
                        : p.icon}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:2 }}>
                        <span style={{ fontSize:13,fontWeight:700,color:T.text }}>{p.label}</span>
                        {d.connected
                          ? <span style={{ fontSize:9,padding:'1px 7px',borderRadius:100,background:T.successBg,color:T.success,fontWeight:700 }}>Connected</span>
                          : <span style={{ fontSize:9,padding:'1px 7px',borderRadius:100,background:T.dangerBg,color:T.danger,fontWeight:700 }}>Not connected</span>}
                      </div>
                      <div style={{ fontSize:11,color:T.textMuted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                        {d.connected
                          ? `@${d.username||'account'} · ${fmt(reach)} reach`
                          : `Tap to connect ${p.label}`}
                      </div>
                    </div>
                    {d.connected
                      ? <Sparkline data={d.sparkline} color={p.color} w={60} h={22}/>
                      : <div style={{ fontSize:11,fontWeight:700,color:T.gold,background:T.goldBg,padding:'5px 10px',borderRadius:8,border:`1px solid ${T.borderGold}`,whiteSpace:'nowrap' }}>Connect →</div>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming Posts */}
          <div style={card}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
              <h2 style={h2}>Upcoming Posts</h2>
              <button onClick={()=>navigate('/schedule')} style={{ fontSize:11,color:T.gold,background:T.goldBg,border:`1px solid ${T.borderGold}`,padding:'4px 10px',borderRadius:7,cursor:'pointer',fontFamily:'inherit',fontWeight:700 }}>View all</button>
            </div>
            {scheduled.length===0 ? (
              <div style={{ textAlign:'center',padding:'28px 20px' }}>
                <div style={{ fontSize:36,marginBottom:10 }}>📅</div>
                <p style={{ color:T.textMuted,fontSize:13,margin:'0 0 12px' }}>No scheduled posts</p>
                <button onClick={()=>navigate('/schedule')} style={{ padding:'8px 18px',background:T.goldBg,border:`1px solid ${T.borderGold}`,borderRadius:9,color:T.gold,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>
                  Schedule a Post
                </button>
              </div>
            ) : scheduled.map(post => {
              const platColor = PLATFORMS.find(p=>p.id===(Array.isArray(post.platforms)?post.platforms[0]:post.platform))?.color || T.gold
              return (
                <div key={post.id} style={{ display:'flex',gap:10,padding:'10px 12px',borderRadius:10,background:T.cardAlt,border:`1px solid ${T.border}`,marginBottom:8 }}>
                  <div style={{ width:8,height:8,borderRadius:'50%',background:platColor,flexShrink:0,marginTop:4 }}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                      {post.caption||post.content||post.title||'Scheduled post'}
                    </div>
                    <div style={{ fontSize:11,color:T.textMuted,marginTop:2 }}>
                      {(Array.isArray(post.platforms)?post.platforms[0]:post.platform)} · {new Date(post.scheduled_for).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                  <span style={{ fontSize:9,padding:'2px 7px',borderRadius:100,background:T.goldBg,color:T.gold,fontWeight:700,alignSelf:'flex-start' }}>Scheduled</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Deals + Reach Breakdown ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>

          {/* Active Deals */}
          <div style={card}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
              <h2 style={h2}>Active Deals</h2>
              <button onClick={()=>navigate('/deals')} style={{ fontSize:11,color:T.gold,background:T.goldBg,border:`1px solid ${T.borderGold}`,padding:'4px 10px',borderRadius:7,cursor:'pointer',fontFamily:'inherit',fontWeight:700 }}>View CRM</button>
            </div>
            {deals.length===0 ? (
              <div style={{ textAlign:'center',padding:'28px 20px' }}>
                <div style={{ fontSize:36,marginBottom:10 }}>🤝</div>
                <p style={{ color:T.textMuted,fontSize:13,margin:'0 0 12px' }}>No active deals</p>
                <button onClick={()=>navigate('/deals')} style={{ padding:'8px 18px',background:T.goldBg,border:`1px solid ${T.borderGold}`,borderRadius:9,color:T.gold,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>
                  Add a Deal
                </button>
              </div>
            ) : deals.map(deal => (
              <div key={deal.id} onClick={()=>navigate('/deals')}
                style={{ display:'flex',gap:12,padding:'12px 14px',borderRadius:12,background:T.cardAlt,border:`1px solid ${T.border}`,cursor:'pointer',marginBottom:8 }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:T.text,marginBottom:3 }}>{deal.brand_name||'Brand Deal'}</div>
                  <div style={{ fontSize:11,color:T.textMuted }}>{deal.deliverable||'Deliverable not set'}</div>
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <div style={{ fontSize:15,fontWeight:800,color:T.gold,fontFamily:"'Syne',sans-serif" }}>{fmtMoney(deal.value||0)}</div>
                  <span style={{ fontSize:9,padding:'2px 7px',borderRadius:100,fontWeight:700,background:deal.status==='active'?T.successBg:T.goldBg,color:deal.status==='active'?T.success:T.gold }}>
                    {deal.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Reach by Platform */}
          <div style={card}>
            <h2 style={h2}>Reach by Platform</h2>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              {PLATFORMS.map(p => {
                const d = pData[p.id]||{}
                const reach = d.connected&&d.stats ? Object.values(d.stats).reduce((a,v)=>a+v,0) : 0
                const pct = totalReach>0 ? Math.min((reach/totalReach)*100,100) : 0
                return (
                  <div key={p.id} style={{ opacity:d.connected?1:.4 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                      <span style={{ fontSize:12,fontWeight:600,color:T.textSub }}>{p.label}</span>
                      <span style={{ fontSize:12,fontWeight:700,color:T.gold,fontFamily:"'Syne',sans-serif" }}>
                        {d.connected ? fmt(reach) : '—'}
                      </span>
                    </div>
                    <div style={{ height:5,background:T.border,borderRadius:3,overflow:'hidden' }}>
                      <div style={{ height:'100%',width:`${pct}%`,background:p.color,borderRadius:3,transition:'width 1s ease' }}/>
                    </div>
                  </div>
                )
              })}
            </div>

            {earnings.total > 0 && (
              <div style={{ marginTop:18,paddingTop:16,borderTop:`1px solid ${T.border}` }}>
                <div style={{ ...lbl,marginBottom:10 }}>Earnings</div>
                {Object.entries(earnings.breakdown).map(([platform,amount]) => (
                  <div key={platform} style={{ display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6 }}>
                    <span style={{ color:T.textMuted,textTransform:'capitalize' }}>{platform}</span>
                    <span style={{ color:T.gold,fontWeight:700 }}>{fmtMoney(amount)}</span>
                  </div>
                ))}
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:14,fontWeight:800,paddingTop:8,borderTop:`1px solid ${T.border}`,fontFamily:"'Syne',sans-serif" }}>
                  <span style={{ color:T.text }}>Total</span>
                  <span style={{ color:T.gold }}>{fmtMoney(earnings.total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div style={card}>
          <h2 style={h2}>Quick Actions</h2>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10 }}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} onClick={()=>navigate(a.route)} className="qa"
                style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'16px 10px',borderRadius:12,background:T.cardAlt,border:`1px solid ${T.border}`,cursor:'pointer',fontFamily:'inherit' }}>
                <span style={{ fontSize:22 }}>{a.icon}</span>
                <span style={{ fontSize:11,fontWeight:600,color:T.textSub }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}