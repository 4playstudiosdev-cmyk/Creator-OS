// Dashboard.jsx
// SECURITY: All queries use .eq('user_id', uid) — Supabase RLS adds a second
// layer: even if someone changes uid in JS, the DB rejects it server-side.
// Each user sees ONLY their own profile, deals, posts, earnings, and socials.

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
  CalendarDays, Sparkles, TrendingUp, DollarSign,
  Briefcase, Settings, ArrowRight, RefreshCw,
  Youtube, Instagram, Twitter, Linkedin
} from 'lucide-react'

const fmt = (n) => {
  if (!n && n !== 0) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K'
  return String(n)
}
const fmtMoney = (n) => '$' + Number(n || 0).toLocaleString()
const greet = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const PLATFORM_ICONS = {
  youtube:   { icon: Youtube,   color: '#ff4444' },
  instagram: { icon: Instagram, color: '#e1306c' },
  twitter:   { icon: Twitter,   color: '#1da1f2' },
  linkedin:  { icon: Linkedin,  color: '#0a66c2' },
}

const STAGE_STYLE = {
  lead:      { bg:'rgba(59,130,246,0.12)',  color:'#60a5fa',  label:'Lead'      },
  pitched:   { bg:'rgba(139,92,246,0.12)', color:'#a78bfa',  label:'Pitched'   },
  active:    { bg:'rgba(245,158,11,0.12)', color:'#fbbf24',  label:'Active'    },
  completed: { bg:'rgba(16,185,129,0.12)', color:'#34d399',  label:'Completed' },
  paid:      { bg:'rgba(0,229,160,0.12)',  color:'#00E5A0',  label:'Paid ✓'   },
}

export default function Dashboard() {
  const [profile,     setProfile]     = useState(null)
  const [deals,       setDeals]       = useState([])
  const [scheduled,   setScheduled]   = useState([])
  const [earnings,    setEarnings]    = useState({ total: 0 })
  const [socials,     setSocials]     = useState({})
  const [loading,     setLoading]     = useState(true)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)

    // Security: verify session first
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/login', { replace: true }); return }
    const uid = session.user.id

    // Parallel fetch — all queries scoped to uid (+ RLS on server side)
    const [profRes, dealsRes, postsRes, earningsRes, socialsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),

      supabase.from('deals')
        .select('id,brand,value,stage,due_date')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(5),

      supabase.from('scheduled_posts')
        .select('id,title,platform,scheduled_at,status')
        .eq('user_id', uid)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5),

      supabase.from('earnings')
        .select('amount,source')
        .eq('user_id', uid),

      supabase.from('social_connections')
        .select('platform,username,followers')
        .eq('user_id', uid),
    ])

    setProfile(profRes.data)
    setDeals(dealsRes.data || [])
    setScheduled(postsRes.data || [])

    if (earningsRes.data) {
      const total = earningsRes.data.reduce((s, e) => s + (e.amount || 0), 0)
      setEarnings({ total })
    }

    if (socialsRes.data) {
      const map = {}
      socialsRes.data.forEach(s => { map[s.platform] = s })
      setSocials(map)
    }

    setLoading(false)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(0,229,160,0.15)', borderTopColor:'#00E5A0', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      <p style={{ color:'#4A6357', fontSize:13, fontFamily:'sans-serif' }}>Loading your dashboard...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const name        = profile?.full_name || profile?.username || 'Creator'
  const totalReach  = Object.values(socials).reduce((s, p) => s + (p.followers || 0), 0)
  const activeDeals = deals.filter(d => !['paid','completed'].includes(d.stage)).length
  const pendingVal  = deals.filter(d => d.stage !== 'paid').reduce((s, d) => s + (d.value || 0), 0)

  return (
    <div style={{ fontFamily:"'Instrument Sans',system-ui,sans-serif", color:'#D8EEE5' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');
        .dc{background:rgba(15,26,20,0.6);border:1px solid rgba(0,229,160,0.1);border-radius:14px;padding:20px 22px;transition:border-color .2s;}
        .dc:hover{border-color:rgba(0,229,160,0.18);}
        .ds{background:rgba(0,229,160,0.05);border:1px solid rgba(0,229,160,0.1);border-radius:12px;padding:18px 20px;transition:all .2s;}
        .ds:hover{background:rgba(0,229,160,0.08);border-color:rgba(0,229,160,0.2);}
        .dl{color:#00E5A0;text-decoration:none;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:4px;}
        .dl:hover{opacity:.8;}
        .dp{display:inline-flex;align-items:center;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600;}
        .dr{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(0,229,160,0.06);}
        .dr:last-child{border-bottom:none;}
        .dso{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(0,229,160,0.08);margin-bottom:7px;transition:all .15s;}
        .dso:hover{background:rgba(0,229,160,0.04);border-color:rgba(0,229,160,0.15);}
        .dso:last-child{margin-bottom:0;}
        .de{color:#4A6357;font-size:13px;text-align:center;padding:20px 0;}
        .dqa{display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(0,229,160,0.04);border:1px solid rgba(0,229,160,0.1);border-radius:10px;color:#9DC4B0;font-size:13px;font-weight:500;text-decoration:none;transition:all .15s;}
        .dqa:hover{background:rgba(0,229,160,0.08);color:#00E5A0;}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:26, fontWeight:800, color:'#fff', letterSpacing:'-0.02em', marginBottom:5 }}>
            {greet()}, {name} 👋
          </h1>
          <p style={{ color:'#7A9E8E', fontSize:14 }}>
            {profile?.niche && <span style={{ marginRight:10 }}>📍 {profile.niche}</span>}
            {profile?.primary_platform && <span style={{ textTransform:'capitalize' }}>🎯 {profile.primary_platform}</span>}
          </p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(0,229,160,0.08)', border:'1px solid rgba(0,229,160,0.15)', borderRadius:8, color:'#00E5A0', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:12, marginBottom:24 }}>
        {[
          { label:'Total Reach',      value: fmt(totalReach),       sub:'Across all platforms'     },
          { label:'Total Earnings',   value: fmtMoney(earnings.total), sub:'From all sources'     },
          { label:'Active Deals',     value: activeDeals,            sub: fmtMoney(pendingVal) + ' pipeline' },
          { label:'Scheduled Posts',  value: scheduled.length,       sub:'Upcoming'                },
        ].map(s => (
          <div key={s.label} className="ds">
            <div style={{ fontSize:11, color:'#7A9E8E', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:28, fontWeight:900, color:'#00E5A0', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#4A6357', marginTop:5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16, marginBottom:16 }}>

        {/* Connected Platforms */}
        <div className="dc">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'#fff' }}>Connected Platforms</h3>
            <Link to="/settings" className="dl">Manage <ArrowRight size={12}/></Link>
          </div>
          {Object.entries(PLATFORM_ICONS).map(([p, cfg]) => {
            const Icon = cfg.icon
            const conn = socials[p]
            return (
              <div key={p} className="dso">
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Icon size={16} style={{ color: cfg.color }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color: conn ? '#fff' : '#4A6357', textTransform:'capitalize' }}>{p}</div>
                    {conn && <div style={{ fontSize:11, color:'#7A9E8E' }}>@{conn.username}</div>}
                  </div>
                </div>
                {conn ? (
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#00E5A0' }}>{fmt(conn.followers)}</div>
                    <div style={{ fontSize:10, color:'#4A6357' }}>followers</div>
                  </div>
                ) : (
                  <Link to="/settings" style={{ fontSize:11, color:'#7A9E8E', textDecoration:'none', padding:'4px 10px', background:'rgba(0,229,160,0.06)', borderRadius:6, border:'1px solid rgba(0,229,160,0.1)' }}>
                    Connect
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* Scheduled Posts */}
        <div className="dc">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'#fff' }}>Upcoming Posts</h3>
            <Link to="/schedule" className="dl">View all <ArrowRight size={12}/></Link>
          </div>
          {scheduled.length === 0 ? (
            <div className="de">
              <CalendarDays size={26} style={{ display:'block', margin:'0 auto 8px', opacity:.3 }}/>
              No upcoming posts<br/>
              <Link to="/schedule" style={{ color:'#00E5A0', fontSize:12, textDecoration:'none' }}>+ Schedule one →</Link>
            </div>
          ) : scheduled.map(p => {
            const cfg = PLATFORM_ICONS[p.platform] || {}
            const Icon = cfg.icon
            return (
              <div key={p.id} className="dr">
                {Icon && <Icon size={14} style={{ color: cfg.color, flexShrink:0 }} />}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color:'#D8EEE5', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title || 'Untitled'}</div>
                  <div style={{ fontSize:11, color:'#4A6357' }}>{new Date(p.scheduled_at).toLocaleString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <span className="dp" style={{ background:'rgba(0,229,160,0.08)', color:'#00E5A0', fontSize:10 }}>{p.status||'scheduled'}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Brand Deals */}
      <div className="dc" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h3 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'#fff' }}>Brand Deals Pipeline</h3>
          <Link to="/deals" className="dl">View all <ArrowRight size={12}/></Link>
        </div>
        {deals.length === 0 ? (
          <div className="de">
            <Briefcase size={26} style={{ display:'block', margin:'0 auto 8px', opacity:.3 }}/>
            No brand deals yet<br/>
            <Link to="/deals" style={{ color:'#00E5A0', fontSize:12, textDecoration:'none' }}>+ Add a deal →</Link>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:'#4A6357', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>
                  {['Brand','Value','Stage','Due'].map(h => (
                    <th key={h} style={{ textAlign:'left', paddingBottom:10, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deals.map(d => {
                  const sc = STAGE_STYLE[d.stage] || STAGE_STYLE.lead
                  return (
                    <tr key={d.id} style={{ borderTop:'1px solid rgba(0,229,160,0.06)' }}>
                      <td style={{ padding:'10px 0', color:'#D8EEE5', fontWeight:500 }}>{d.brand}</td>
                      <td style={{ padding:'10px 0', color:'#00E5A0', fontWeight:700 }}>{fmtMoney(d.value)}</td>
                      <td style={{ padding:'10px 0' }}>
                        <span className="dp" style={{ background:sc.bg, color:sc.color }}>{sc.label}</span>
                      </td>
                      <td style={{ padding:'10px 0', color:'#7A9E8E', fontSize:12 }}>
                        {d.due_date ? new Date(d.due_date).toLocaleDateString('en',{month:'short',day:'numeric'}) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))', gap:10 }}>
        {[
          { label:'Schedule Post',   icon:<CalendarDays size={15}/>, to:'/schedule'     },
          { label:'Repurpose Video', icon:<Sparkles    size={15}/>, to:'/repurpose'     },
          { label:'Add Brand Deal',  icon:<Briefcase   size={15}/>, to:'/deals'         },
          { label:'Script Studio',   icon:<TrendingUp  size={15}/>, to:'/script-studio' },
          { label:'Track Earnings',  icon:<DollarSign  size={15}/>, to:'/earnings'      },
          { label:'Settings',        icon:<Settings    size={15}/>, to:'/settings'      },
        ].map(a => (
          <Link key={a.to} to={a.to} className="dqa">{a.icon}{a.label}</Link>
        ))}
      </div>
    </div>
  )
}