import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const fmt = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

export default function YouTubeStudioPage() {
  const [loading, setLoading]       = useState(false)
  const [data, setData]             = useState(null)
  const [error, setError]           = useState('')
  const [ytStatus, setYtStatus]     = useState(null) // null=checking, false=not connected, true=connected
  const [sortBy, setSortBy]         = useState('views')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  // ── Check YouTube connection status ─────────────────────────────────────────
  const checkYtStatus = useCallback(async () => {
    try {
      const { data: sd } = await supabase.auth.getSession()
      if (!sd.session) return setYtStatus(false)
      const res = await fetch('http://localhost:8000/api/clipping/youtube-status', {
        headers: { Authorization: `Bearer ${sd.session.access_token}` }
      })
      const json = await res.json()
      setYtStatus(json.connected === true)
    } catch { setYtStatus(false) }
  }, [])

  // ── Fetch videos ─────────────────────────────────────────────────────────────
  const fetchVideos = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const { data: sd } = await supabase.auth.getSession()
      if (!sd.session) throw new Error('Login zaroori hai')
      const res = await fetch('http://localhost:8000/api/social/youtube/videos', {
        headers: { Authorization: `Bearer ${sd.session.access_token}` }
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Fetch failed')
      setData(json)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    checkYtStatus()
  }, [checkYtStatus])

  useEffect(() => {
    if (ytStatus === true) fetchVideos()
  }, [ytStatus, fetchVideos])

  const sortedVideos = (() => {
    if (!data?.videos) return []
    let v = [...data.videos]
    if (searchQuery) v = v.filter(x => x.title.toLowerCase().includes(searchQuery.toLowerCase()))
    v.sort((a, b) => {
      if (sortBy === 'views')    return b.views - a.views
      if (sortBy === 'likes')    return b.likes - a.likes
      if (sortBy === 'comments') return b.comments - a.comments
      if (sortBy === 'date')     return new Date(b.published_at) - new Date(a.published_at)
      return 0
    })
    return v
  })()

  const topVideo = sortedVideos[0]

  const handleWriteScript = (video) => {
    localStorage.setItem('script_topic', video.title)
    navigate('/script-studio')
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const card = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
  }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5' }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        .yt-input {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 10px 16px; color: #f0f0f5;
          font-family: 'DM Sans',sans-serif; font-size: 13px; outline: none;
          transition: border-color .2s; width: 100%; box-sizing: border-box; color-scheme: dark;
        }
        .yt-input:focus { border-color: rgba(239,68,68,0.5); }
        .yt-input::placeholder { color: #374151; }
        .yt-card-hover { transition: all 0.2s; }
        .yt-card-hover:hover { transform: translateY(-2px); border-color: rgba(239,68,68,0.3) !important; }
        .sort-btn { cursor:pointer; border:none; font-family:'Syne',sans-serif; font-weight:700; transition:all .15s; }
        .action-btn { cursor:pointer; border:none; font-family:'Syne',sans-serif; font-weight:700; transition:all .18s; }
        .action-btn:hover { filter:brightness(1.2); transform:translateY(-1px); }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <p style={{ fontSize:12, color:'#6b7280', marginBottom:6, letterSpacing:1, textTransform:'uppercase', fontWeight:600 }}>Analytics</p>
          <h1 style={{ fontSize:28, fontWeight:800, fontFamily:'Syne', letterSpacing:'-0.5px', marginBottom:4 }}>YouTube Studio 📺</h1>
          <p style={{ fontSize:13, color:'#6b7280' }}>Apni videos ka analytics aur performance dekho</p>
        </div>
        {ytStatus && (
          <button className="action-btn" onClick={fetchVideos} disabled={loading} style={{
            display:'flex', alignItems:'center', gap:8, padding:'10px 18px',
            borderRadius:12, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.35)',
            color:'#f87171', fontSize:13, opacity: loading ? 0.6 : 1,
          }}>
            {loading
              ? <div style={{ width:14,height:14,border:'2px solid rgba(248,113,113,0.3)',borderTopColor:'#f87171',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>
              : '🔄'} Refresh
          </button>
        )}
      </div>

      {/* ── Checking status ── */}
      {ytStatus === null && (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
          <div style={{ width:40,height:40,border:'4px solid rgba(239,68,68,0.2)',borderTopColor:'#ef4444',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>
        </div>
      )}

      {/* ── Not connected ── */}
      {ytStatus === false && (
        <div style={{ ...card, padding:'80px 24px', textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>📺</div>
          <h3 style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, marginBottom:8 }}>YouTube Connected Nahi</h3>
          <p style={{ fontSize:13, color:'#4b5563', marginBottom:24, maxWidth:340, margin:'0 auto 24px' }}>
            Settings mein YouTube connect karo apni videos aur analytics dekhne ke liye
          </p>
          <button className="action-btn" onClick={() => navigate('/settings')} style={{
            padding:'12px 28px', borderRadius:12,
            background:'linear-gradient(135deg,#ef4444,#ec4899)',
            color:'#fff', fontSize:14, fontFamily:'Syne', fontWeight:700,
          }}>⚙️ Settings mein jao</button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:14, padding:'14px 18px', marginBottom:18 }}>
          <p style={{ fontSize:13, color:'#fca5a5', fontWeight:600 }}>❌ {error}</p>
          <button onClick={() => navigate('/settings')} style={{ background:'none', border:'none', color:'#f87171', fontSize:12, cursor:'pointer', padding:0, marginTop:4, textDecoration:'underline' }}>
            Token expired? Settings mein reconnect karo
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && !data && ytStatus && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 0' }}>
          <div style={{ width:48,height:48,border:'4px solid rgba(239,68,68,0.2)',borderTopColor:'#ef4444',borderRadius:'50%',animation:'spin .8s linear infinite',marginBottom:16 }}/>
          <p style={{ color:'#6b7280', fontSize:14 }}>YouTube se videos fetch ho rahi hain...</p>
        </div>
      )}

      {/* ── Main Content ── */}
      {data && !loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:18, animation:'fadeUp .4s ease' }}>

          {/* Channel Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(236,72,153,0.2) 100%)',
            border: '1px solid rgba(239,68,68,0.25)', borderRadius:20, padding:24,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
              {data.channel?.thumbnail && (
                <img src={data.channel.thumbnail} alt="ch" style={{ width:56,height:56,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.2)' }}/>
              )}
              <div>
                <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, marginBottom:2 }}>{data.channel?.name}</h2>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>YouTube Channel</p>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { label:'Subscribers', value:fmt(data.channel?.subscribers), icon:'👥' },
                { label:'Total Views',  value:fmt(data.channel?.total_views),  icon:'👁️' },
                { label:'Total Videos', value:fmt(data.channel?.total_videos), icon:'🎬' },
              ].map((s,i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.08)', borderRadius:14, padding:'14px', textAlign:'center', backdropFilter:'blur(10px)' }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
                  <p style={{ fontFamily:'Syne', fontWeight:800, fontSize:18 }}>{s.value}</p>
                  <p style={{ fontSize:10, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Video */}
          {topVideo && (
            <div style={{ background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:18, padding:20 }}>
              <p style={{ fontFamily:'Syne', fontWeight:700, fontSize:12, color:'#fbbf24', textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>🏆 Best Performing Video</p>
              <div style={{ display:'flex', gap:16 }}>
                {topVideo.thumbnail && (
                  <img src={topVideo.thumbnail} alt="" style={{ width:160, height:90, objectFit:'cover', borderRadius:12, flexShrink:0 }}/>
                )}
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:8, lineHeight:1.4 }}>{topVideo.title}</p>
                  <div style={{ display:'flex', gap:16, fontSize:12, color:'#9ca3af', marginBottom:14 }}>
                    <span>👁️ {fmt(topVideo.views)}</span>
                    <span>❤️ {fmt(topVideo.likes)}</span>
                    <span>💬 {fmt(topVideo.comments)}</span>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="action-btn" onClick={() => handleWriteScript(topVideo)} style={{
                      padding:'8px 14px', borderRadius:10, fontSize:12,
                      background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.4)', color:'#f87171',
                    }}>✍️ Write Similar Script</button>
                    <a href={topVideo.url} target="_blank" rel="noreferrer" style={{
                      padding:'8px 14px', borderRadius:10, fontSize:12, fontWeight:700,
                      background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.35)', color:'#fbbf24',
                      textDecoration:'none', fontFamily:'Syne',
                    }}>▶️ Watch</a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search + Sort */}
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            <input className="yt-input" style={{ flex:1, minWidth:200 }} placeholder="🔍 Search videos..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
            <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:4 }}>
              {['views','likes','date'].map(s => (
                <button key={s} className="sort-btn" onClick={()=>setSortBy(s)} style={{
                  padding:'6px 14px', borderRadius:9, fontSize:12, textTransform:'capitalize',
                  background: sortBy===s ? 'rgba(239,68,68,0.2)' : 'transparent',
                  border: sortBy===s ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
                  color: sortBy===s ? '#f87171' : '#4b5563',
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Video Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
            {sortedVideos.map(video => (
              <div key={video.id} className="yt-card-hover" style={{ ...card, overflow:'hidden' }}>
                {/* Thumbnail */}
                <div style={{ position:'relative', aspectRatio:'16/9' }}>
                  <img src={video.thumbnail} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                  <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.75)', color:'#fff', fontSize:10, padding:'3px 8px', borderRadius:6 }}>
                    {fmtDate(video.published_at)}
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding:16 }}>
                  <p style={{ fontFamily:'Syne', fontWeight:700, fontSize:13, lineHeight:1.4, marginBottom:12, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {video.title}
                  </p>
                  <div style={{ display:'flex', justifyContent:'space-around', marginBottom:14 }}>
                    {[
                      { label:'Views',    val:fmt(video.views),    color:'#f0f0f5' },
                      { label:'Likes',    val:fmt(video.likes),    color:'#f87171' },
                      { label:'Engage %', val: video.views > 0 ? (((video.likes+video.comments)/video.views)*100).toFixed(1)+'%' : '0%', color:'#6ee7b7' },
                    ].map((s,i) => (
                      <div key={i} style={{ textAlign:'center' }}>
                        <p style={{ fontSize:10, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>{s.label}</p>
                        <p style={{ fontFamily:'Syne', fontWeight:800, fontSize:14, color:s.color }}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="action-btn" onClick={() => handleWriteScript(video)} style={{
                      flex:1, padding:'9px', borderRadius:10, fontSize:12,
                      background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171',
                    }}>✍️ Script</button>
                    <a href={video.url} target="_blank" rel="noreferrer" style={{
                      flex:1, padding:'9px', borderRadius:10, fontSize:12, fontWeight:700,
                      background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#9ca3af',
                      textDecoration:'none', fontFamily:'Syne', textAlign:'center',
                    }}>▶️ Watch</a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedVideos.length === 0 && searchQuery && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#4b5563', fontSize:14 }}>
              No videos found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}