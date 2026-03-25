import { useState } from 'react'

const MOCK_MESSAGES = [
  { id:1, platform:'twitter',   type:'mention', author:'@john_creator',   avatar:'👨‍💻', content:'Bhai tera latest video kamaal tha! YouTube pe content creation ke baare mein aur batao!', time:'2m ago',  read:false, superfan:true  },
  { id:2, platform:'youtube',   type:'comment', author:'Sarah Ahmed',     avatar:'👩‍🎨', content:'This tutorial really helped me understand the concept. Please make more videos like this!', time:'15m ago', read:false, superfan:true  },
  { id:3, platform:'linkedin',  type:'comment', author:'Ali Raza',        avatar:'👨‍💼', content:'Great insights on personal branding! Would love to connect and discuss more about creator economy.', time:'1h ago',  read:true,  superfan:false },
  { id:4, platform:'twitter',   type:'dm',      author:'@brand_collab',   avatar:'🏢',   content:'Hi! We are interested in collaborating with you for our new product launch. Can we discuss?', time:'2h ago',  read:true,  superfan:false },
  { id:5, platform:'youtube',   type:'comment', author:'Usman Khan',      avatar:'👨‍🚀', content:'Subscribed! Been watching your content for months. You explain things so clearly mashallah!', time:'3h ago',  read:true,  superfan:true  },
  { id:6, platform:'instagram', type:'comment', author:'@creative_mind',  avatar:'🎨',   content:'Love your aesthetic! What camera do you use for your shoots?', time:'5h ago',  read:true,  superfan:false },
  { id:7, platform:'twitter',   type:'mention', author:'@tech_news_pk',   avatar:'📱',   content:'Just shared your thread on AI tools — amazing breakdown! Everyone should read this.', time:'6h ago',  read:true,  superfan:true  },
  { id:8, platform:'linkedin',  type:'dm',      author:'Fatima Sheikh',   avatar:'👩‍💻', content:'Hello! I came across your profile and would love to feature you in our creator spotlight series.', time:'1d ago',  read:true,  superfan:false },
]

const PLATFORM = {
  twitter:   { label:'Twitter / X', icon:'𝕏',  bg:'rgba(29,155,240,0.15)',  border:'rgba(29,155,240,0.35)',  color:'#60b8f5',  dot:'#1d9bf0'  },
  youtube:   { label:'YouTube',     icon:'▶',  bg:'rgba(255,0,0,0.12)',     border:'rgba(255,80,80,0.35)',   color:'#f87171',  dot:'#ef4444'  },
  linkedin:  { label:'LinkedIn',    icon:'in', bg:'rgba(0,119,181,0.15)',   border:'rgba(0,119,181,0.35)',   color:'#5ba8d4',  dot:'#0077b5'  },
  instagram: { label:'Instagram',   icon:'📸', bg:'rgba(217,70,239,0.12)',  border:'rgba(217,70,239,0.35)',  color:'#e879f9',  dot:'#d946ef'  },
}

const TYPE = {
  mention: { label:'Mention', bg:'rgba(139,92,246,0.15)', border:'rgba(139,92,246,0.3)', color:'#c4b5fd' },
  comment: { label:'Comment', bg:'rgba(16,185,129,0.15)', border:'rgba(16,185,129,0.3)', color:'#6ee7b7' },
  dm:      { label:'DM',      bg:'rgba(245,158,11,0.15)', border:'rgba(245,158,11,0.3)', color:'#fbbf24' },
}

const FILTERS = [
  { id:'all',       label:'All'        },
  { id:'unread',    label:'🔵 Unread'  },
  { id:'superfan',  label:'⭐ Superfan'},
  { id:'twitter',   label:'𝕏'          },
  { id:'youtube',   label:'▶'          },
  { id:'linkedin',  label:'in'         },
  { id:'instagram', label:'📸'         },
]

export default function InboxPage() {
  const [messages,    setMessages]    = useState(MOCK_MESSAGES)
  const [selectedMsg, setSelectedMsg] = useState(null)
  const [filter,      setFilter]      = useState('all')
  const [replyText,   setReplyText]   = useState('')
  const [aiLoading,   setAiLoading]   = useState(false)
  const [repliedIds,  setRepliedIds]  = useState([])

  const filtered = messages.filter(m => {
    if (filter === 'all')      return true
    if (filter === 'unread')   return !m.read
    if (filter === 'superfan') return m.superfan
    return m.platform === filter
  })

  const unreadCount   = messages.filter(m => !m.read).length
  const superfanCount = messages.filter(m => m.superfan).length

  const handleSelect = (msg) => {
    setSelectedMsg(msg)
    setReplyText('')
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m))
  }

  const handleAiReply = async () => {
    setAiLoading(true)
    try {
      const res  = await fetch('http://localhost:8000/api/ai/suggest-reply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: selectedMsg.content, platform: selectedMsg.platform, type: selectedMsg.type }),
      })
      const data = await res.json()
      setReplyText(data.reply)
    } catch (e) { alert('AI reply generate nahi hua: ' + e.message) }
    finally { setAiLoading(false) }
  }

  const handleSend = () => {
    if (!replyText.trim()) return
    setRepliedIds(p => [...p, selectedMsg.id])
    setReplyText('')
  }

  const p = selectedMsg ? PLATFORM[selectedMsg.platform] : null
  const t = selectedMsg ? TYPE[selectedMsg.type]         : null

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 0px)',
      margin: '-24px -24px -24px -24px',
      fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)} }
        .msg-row { cursor:pointer; transition:all .15s; border-left:3px solid transparent; }
        .msg-row:hover { background:rgba(255,255,255,0.04) !important; }
        .filter-btn { cursor:pointer; border:none; font-family:'Syne',sans-serif; font-weight:700; transition:all .15s; }
        .filter-btn:hover { filter:brightness(1.2); }
        .inbox-textarea {
          width:100%; background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.08); border-radius:14px;
          padding:14px; color:#f0f0f5; font-family:'DM Sans',sans-serif;
          font-size:13px; resize:none; outline:none; transition:border-color .2s;
          box-sizing:border-box; color-scheme:dark; line-height:1.6;
        }
        .inbox-textarea:focus { border-color:rgba(99,102,241,0.5); }
        .inbox-textarea::placeholder { color:#374151; }
        .msg-scroll::-webkit-scrollbar { width:4px; }
        .msg-scroll::-webkit-scrollbar-track { background:transparent; }
        .msg-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:100px; }
        .send-btn { cursor:pointer; border:none; font-family:'Syne',sans-serif; font-weight:700; transition:all .18s; }
        .send-btn:hover { filter:brightness(1.15); transform:translateY(-1px); }
        .send-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; filter:none; }
      `}</style>

      {/* ══ LEFT PANEL ══════════════════════════════════════════════════ */}
      <div style={{
        width: 320, flexShrink: 0,
        background: '#0d0d14',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding:'20px 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:16 }}>Unified Inbox 📥</h1>
            <div style={{ display:'flex', gap:6 }}>
              {unreadCount > 0 && (
                <span style={{ background:'#6366f1', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, fontFamily:'Syne' }}>
                  {unreadCount} new
                </span>
              )}
              {superfanCount > 0 && (
                <span style={{ background:'rgba(245,158,11,0.2)', border:'1px solid rgba(245,158,11,0.4)', color:'#fbbf24', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, fontFamily:'Syne' }}>
                  ⭐ {superfanCount}
                </span>
              )}
            </div>
          </div>

          {/* Filters */}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {FILTERS.map(f => {
              const isActive = filter === f.id
              return (
                <button key={f.id} className="filter-btn" onClick={() => setFilter(f.id)} style={{
                  padding:'5px 10px', borderRadius:8, fontSize:11,
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  color: isActive ? '#a5b4fc' : '#4b5563',
                }}>{f.label}</button>
              )
            })}
          </div>
        </div>

        {/* Message list */}
        <div className="msg-scroll" style={{ flex:1, overflowY:'auto' }}>
          {filtered.map(msg => {
            const pl       = PLATFORM[msg.platform]
            const tp       = TYPE[msg.type]
            const isActive = selectedMsg?.id === msg.id
            return (
              <div key={msg.id} className="msg-row" onClick={() => handleSelect(msg)} style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: isActive ? 'rgba(99,102,241,0.1)' : (!msg.read ? 'rgba(99,102,241,0.04)' : 'transparent'),
                borderLeft: `3px solid ${isActive ? '#6366f1' : 'transparent'}`,
              }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  {/* Avatar */}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <div style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                      {msg.avatar}
                    </div>
                    <div style={{ position:'absolute', bottom:-1, right:-1, width:12, height:12, borderRadius:'50%', background:pl.dot, border:'2px solid #0d0d14' }}/>
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:12, color:'#f0f0f5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{msg.author}</span>
                      {msg.superfan && <span style={{ fontSize:10 }}>⭐</span>}
                      {!msg.read && <div style={{ width:7, height:7, background:'#6366f1', borderRadius:'50%', marginLeft:'auto', flexShrink:0 }}/>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6, background:tp.bg, border:`1px solid ${tp.border}`, color:tp.color, fontFamily:'Syne' }}>{tp.label}</span>
                      <span style={{ fontSize:10, color:'#374151' }}>{msg.time}</span>
                    </div>
                    <p style={{ fontSize:11, color:'#4b5563', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{msg.content}</p>
                  </div>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ padding:'40px 16px', textAlign:'center', color:'#374151', fontSize:13 }}>
              Koi message nahi mila
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT PANEL ═════════════════════════════════════════════════ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#0a0a0f', overflow:'hidden' }}>
        {selectedMsg ? (
          <>
            {/* Message Header */}
            <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.01)', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:46, height:46, borderRadius:'50%', background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                {selectedMsg.avatar}
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:15 }}>{selectedMsg.author}</h2>
                  {selectedMsg.superfan && (
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.35)', color:'#fbbf24', fontFamily:'Syne' }}>
                      ⭐ Superfan
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', gap:7 }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:p.bg, border:`1px solid ${p.border}`, color:p.color, fontFamily:'Syne' }}>
                    {p.icon} {p.label}
                  </span>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:t.bg, border:`1px solid ${t.border}`, color:t.color, fontFamily:'Syne' }}>
                    {t.label}
                  </span>
                  <span style={{ fontSize:10, color:'#374151' }}>{selectedMsg.time}</span>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="msg-scroll" style={{ flex:1, overflowY:'auto', padding:'24px' }}>
              <div style={{ maxWidth:640 }}>
                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'18px 20px', animation:'slideIn .25s ease' }}>
                  <p style={{ fontSize:14, color:'#d1d5db', lineHeight:1.8 }}>{selectedMsg.content}</p>
                </div>

                {repliedIds.includes(selectedMsg.id) && (
                  <div style={{ marginTop:12, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:14, padding:'12px 16px' }}>
                    <p style={{ fontSize:13, color:'#6ee7b7', fontWeight:600 }}>✅ Reply bhej di!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reply Box */}
            <div style={{ padding:'16px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.01)' }}>
              <div style={{ maxWidth:640 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5 }}>Reply karein</p>
                  <button className="send-btn" onClick={handleAiReply} disabled={aiLoading} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10,
                    background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.35)', color:'#c4b5fd',
                    fontSize:12, fontFamily:'Syne', fontWeight:700,
                  }}>
                    {aiLoading
                      ? <><div style={{ width:12,height:12,border:'2px solid rgba(196,181,253,0.3)',borderTopColor:'#c4b5fd',borderRadius:'50%',animation:'spin .8s linear infinite' }}/> Generating...</>
                      : '✨ AI Reply Suggest karo'}
                  </button>
                </div>

                <textarea className="inbox-textarea" rows={3} value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Apna reply likhein ya AI se generate karo..."
                />

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12 }}>
                  <p style={{ fontSize:11, color:'#374151' }}>
                    {p.icon} {p.label} par reply jayegi
                  </p>
                  <button className="send-btn" onClick={handleSend}
                    disabled={!replyText.trim() || repliedIds.includes(selectedMsg.id)}
                    style={{
                      padding:'10px 22px', borderRadius:12,
                      background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      color:'#fff', fontSize:13,
                    }}>
                    Send Reply →
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:56, marginBottom:16 }}>📥</div>
              <h3 style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, marginBottom:8 }}>Unified Inbox</h3>
              <p style={{ fontSize:13, color:'#4b5563', maxWidth:300, margin:'0 auto 24px', lineHeight:1.6 }}>
                Left side se koi message select karo — reply karein ya AI se suggestion lo!
              </p>
              <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:14, padding:'14px 20px', maxWidth:300, margin:'0 auto' }}>
                <p style={{ fontSize:13, fontWeight:700, color:'#fbbf24', fontFamily:'Syne', marginBottom:4 }}>⚡ Real API Integration</p>
                <p style={{ fontSize:12, color:'#78350f' }}>Twitter, YouTube, LinkedIn APIs connect hongi — real messages yahan dikhenge</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}