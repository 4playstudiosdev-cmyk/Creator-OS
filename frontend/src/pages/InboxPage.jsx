import { useState, useRef, useEffect } from 'react'

const PLATFORMS = [
  { id: 'all',       label: 'All',       icon: '📬', color: '#6366f1' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#e1306c' },
  { id: 'youtube',   label: 'YouTube',   icon: '▶',  color: '#ff4444' },
  { id: 'twitter',   label: 'Twitter',   icon: '𝕏',  color: '#1d9bf0' },
  { id: 'linkedin',  label: 'LinkedIn',  icon: '💼', color: '#0077b5' },
  { id: 'tiktok',    label: 'TikTok',    icon: '🎵', color: '#69c9d0' },
]

const ALL_THREADS = [
  {
    id: 1, platform: 'instagram', platformColor: '#e1306c', platformIcon: '📸',
    sender: 'Ahmed Khan', handle: '@ahmed_creates', avatar: 'AK',
    preview: 'Bhai your content is fire! How do you come up with these ideas?',
    time: '2 min ago', unread: true, priority: 'high',
    messages: [
      { id: 1, from: 'them', text: 'Bhai your content is fire! 🔥 How do you come up with these ideas every week?', time: '2 min ago' },
    ]
  },
  {
    id: 2, platform: 'instagram', platformColor: '#e1306c', platformIcon: '📸',
    sender: 'Sara Photography', handle: '@saraphoto', avatar: 'SP',
    preview: 'Love your reel editing style! Can we collab on something?',
    time: '22 min ago', unread: true, priority: 'medium',
    messages: [
      { id: 1, from: 'them', text: 'Love your reel editing style! Can we collab on something for the travel niche?', time: '22 min ago' },
    ]
  },
  {
    id: 3, platform: 'youtube', platformColor: '#ff4444', platformIcon: '▶',
    sender: 'TechReviewsYT', handle: 'TechReviewsYT', avatar: 'TR',
    preview: 'Great video! What camera setup are you using for your vlogs?',
    time: '1 hr ago', unread: false, priority: 'low',
    messages: [
      { id: 1, from: 'them', text: 'Great video! What camera setup are you using? The quality is insane!', time: '1 hr ago' },
      { id: 2, from: 'me',   text: 'Thanks! I use Sony ZV-E10 with a Sigma 16mm lens. Great value!', time: '55 min ago' },
    ]
  },
  {
    id: 4, platform: 'youtube', platformColor: '#ff4444', platformIcon: '▶',
    sender: 'Creator Guide', handle: 'CreatorGuide', avatar: 'CG',
    preview: 'Your tutorial helped me a lot. Just subscribed!',
    time: '3 hr ago', unread: true, priority: 'low',
    messages: [
      { id: 1, from: 'them', text: 'Your tutorial helped me a lot. Just subscribed! Keep up the amazing work.', time: '3 hr ago' },
    ]
  },
  {
    id: 5, platform: 'twitter', platformColor: '#1d9bf0', platformIcon: '𝕏',
    sender: 'Sarah Digital', handle: '@sarahdigital', avatar: 'SD',
    preview: 'Would love to collab on a video about content creation tools!',
    time: '4 hr ago', unread: true, priority: 'medium',
    messages: [
      { id: 1, from: 'them', text: 'Hey! I saw your thread on creator tools. Would love to collab on a video?', time: '4 hr ago' },
    ]
  },
  {
    id: 6, platform: 'twitter', platformColor: '#1d9bf0', platformIcon: '𝕏',
    sender: 'Dev Patel', handle: '@devbuilds', avatar: 'DP',
    preview: "Loved your thread on creator economy. RT'd it!",
    time: '6 hr ago', unread: false, priority: 'low',
    messages: [
      { id: 1, from: 'them', text: 'Loved your thread on the creator economy. Just RT\'d it — great insights!', time: '6 hr ago' },
    ]
  },
  {
    id: 7, platform: 'linkedin', platformColor: '#0077b5', platformIcon: '💼',
    sender: 'Brand Manager - Nike', handle: 'Nike Marketing', avatar: 'NK',
    preview: 'Hi! We would love to discuss a partnership opportunity.',
    time: '3 hr ago', unread: true, priority: 'high',
    messages: [
      { id: 1, from: 'them', text: 'Hi! We at Nike would love to discuss a partnership. Are you available for a call this week?', time: '3 hr ago' },
    ]
  },
  {
    id: 8, platform: 'tiktok', platformColor: '#69c9d0', platformIcon: '🎵',
    sender: 'Zain Creator', handle: '@zaincreator', avatar: 'ZC',
    preview: 'Your editing style is so unique! What software do you use?',
    time: '1 day ago', unread: false, priority: 'low',
    messages: [
      { id: 1, from: 'them', text: 'Your editing style is so unique bro! What software do you use for your cuts?', time: '1 day ago' },
      { id: 2, from: 'me',   text: 'Thanks! I use Premiere Pro for main edits and After Effects for motion graphics.', time: '1 day ago' },
      { id: 3, from: 'them', text: 'Bro that\'s expensive. Is there a free alternative?', time: '23 hr ago' },
    ]
  },
]

const AI_SUGGESTIONS = [
  "Thank you so much for the kind words! I really appreciate your support. Stay tuned for more content! 🙏",
  "Hey! Thanks for reaching out. I'd love to connect — let me know a good time for a call!",
  "That's a great question! I've actually been planning to cover this topic soon. Subscribe so you don't miss it! 🎬",
  "Really appreciate the support! Feel free to DM me anytime. Happy to help! 😊",
  "Thanks for watching! I use a mix of tools — I'll share a full breakdown in an upcoming video!",
]

const S = {
  btn: { cursor: 'pointer', border: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'all .15s', borderRadius: 10 },
}

export default function InboxPage() {
  const [threads, setThreads]       = useState(ALL_THREADS)
  const [activePlatform, setActivePlatform] = useState('all')
  const [activeId, setActiveId]     = useState(ALL_THREADS[0].id)
  const [replyText, setReplyText]   = useState('')
  const [loadingAI, setLoadingAI]   = useState(false)
  const [search, setSearch]         = useState('')
  const [filterUnread, setFilterUnread] = useState(false)
  const messagesEndRef = useRef(null)

  const activeThread = threads.find(t => t.id === activeId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeThread?.messages?.length])

  const filteredThreads = threads.filter(t => {
    const matchPlatform = activePlatform === 'all' || t.platform === activePlatform
    const matchSearch   = !search || t.sender.toLowerCase().includes(search.toLowerCase()) || t.preview.toLowerCase().includes(search.toLowerCase())
    const matchUnread   = !filterUnread || t.unread
    return matchPlatform && matchSearch && matchUnread
  })

  const platformCount = (pid) => pid === 'all' ? threads.filter(t => t.unread).length : threads.filter(t => t.platform === pid && t.unread).length

  const selectThread = (id) => {
    setActiveId(id)
    setThreads(prev => prev.map(t => t.id === id ? { ...t, unread: false } : t))
  }

  const handleSendReply = () => {
    const trimmed = replyText.trim()
    if (!trimmed) return
    const newMsg = { id: Date.now(), from: 'me', text: trimmed, time: 'Just now' }
    setThreads(prev => prev.map(t =>
      t.id === activeId
        ? { ...t, messages: [...t.messages, newMsg], preview: trimmed, unread: false }
        : t
    ))
    setReplyText('')
  }

  const handleAISuggest = async () => {
    setLoadingAI(true)
    await new Promise(r => setTimeout(r, 1100))
    const suggestion = AI_SUGGESTIONS[Math.floor(Math.random() * AI_SUGGESTIONS.length)]
    setReplyText(suggestion)
    setLoadingAI(false)
  }

  const totalUnread = threads.filter(t => t.unread).length

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 24, marginBottom: 3 }}>💬 Unified Inbox</h1>
            <p style={{ color: '#6b7280', fontSize: 13 }}>All DMs from Instagram, YouTube, Twitter, LinkedIn & TikTok</p>
          </div>
          {totalUnread > 0 && (
            <div style={{ padding: '6px 14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 100, fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>
              {totalUnread} unread
            </div>
          )}
        </div>
      </div>

      {/* Platform category tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {PLATFORMS.map(p => {
          const count = platformCount(p.id)
          return (
            <button key={p.id} onClick={() => { setActivePlatform(p.id); setActiveId(null) }}
              style={{ ...S.btn, padding: '8px 14px', fontSize: 13, fontWeight: 600, flexShrink: 0,
                background: activePlatform === p.id ? `${p.color}20` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activePlatform === p.id ? p.color + '55' : 'rgba(255,255,255,0.08)'}`,
                color: activePlatform === p.id ? p.color : '#6b7280',
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
              <span>{p.icon}</span>
              <span>{p.label}</span>
              {count > 0 && (
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: p.color, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, display: 'flex', gap: 0, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', minHeight: 0 }}>

        {/* Thread list */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column' }}>
          {/* Search + filter */}
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              placeholder="Search messages..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '7px 12px', color: '#f0f0f5', fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
            />
            <button onClick={() => setFilterUnread(!filterUnread)}
              style={{ ...S.btn, fontSize: 11, padding: '4px 12px', fontWeight: 600,
                background: filterUnread ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: `1px solid ${filterUnread ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`,
                color: filterUnread ? '#a5b4fc' : '#6b7280',
              }}>
              Unread only
            </button>
          </div>

          {/* Thread items */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredThreads.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: '#374151', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                No messages{activePlatform !== 'all' ? ` on ${activePlatform}` : ''}
              </div>
            ) : (
              filteredThreads.map(thread => (
                <div key={thread.id} onClick={() => selectThread(thread.id)}
                  style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background .15s',
                    background: activeId === thread.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                    borderLeft: activeId === thread.id ? '2px solid #6366f1' : '2px solid transparent',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${thread.platformColor}22`, border: `1px solid ${thread.platformColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: thread.platformColor }}>
                      {thread.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontWeight: thread.unread ? 700 : 500, fontSize: 13, color: thread.unread ? '#f0f0f5' : '#9ca3af' }}>
                          {thread.sender}
                        </span>
                        <span style={{ fontSize: 9, color: '#374151' }}>{thread.time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                        <span style={{ fontSize: 10 }}>{thread.platformIcon}</span>
                        <span style={{ fontSize: 10, color: thread.platformColor }}>{thread.handle}</span>
                        {thread.priority === 'high' && <span style={{ fontSize: 9, color: '#f87171', fontWeight: 700 }}>🔥 Priority</span>}
                      </div>
                      <p style={{ fontSize: 11, color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                        {thread.preview}
                      </p>
                    </div>
                    {thread.unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 8 }} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conversation */}
        {activeThread ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Conv header */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${activeThread.platformColor}22`, border: `1px solid ${activeThread.platformColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: activeThread.platformColor }}>
                {activeThread.avatar}
              </div>
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>{activeThread.sender}</div>
                <div style={{ fontSize: 11, color: activeThread.platformColor }}>{activeThread.platformIcon} {activeThread.handle}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <div style={{ padding: '4px 12px', background: `${activeThread.platformColor}15`, border: `1px solid ${activeThread.platformColor}30`, borderRadius: 100, fontSize: 11, color: activeThread.platformColor, fontWeight: 700 }}>
                  {PLATFORMS.find(p => p.id === activeThread.platform)?.label}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeThread.messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '72%' }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: msg.from === 'me' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: msg.from === 'me' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.06)',
                      border: msg.from === 'me' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      fontSize: 13, color: '#f0f0f5', lineHeight: 1.55,
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize: 10, color: '#374151', marginTop: 3, textAlign: msg.from === 'me' ? 'right' : 'left' }}>
                      {msg.from === 'me' ? '✓ You · ' : ''}{msg.time}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply box */}
            <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              {/* AI suggest bar */}
              <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#6b7280' }}>AI:</span>
                <button onClick={handleAISuggest} disabled={loadingAI}
                  style={{ ...S.btn, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                    background: loadingAI ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc',
                    display: 'flex', alignItems: 'center', gap: 5, opacity: loadingAI ? 0.7 : 1,
                  }}>
                  {loadingAI ? (
                    <><svg style={{ animation: 'spin 1s linear infinite' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity=".3"/><path d="M12 3a9 9 0 019 9"/></svg> Thinking...</>
                  ) : '✨ Suggest Reply'}
                </button>
                {replyText && !loadingAI && (
                  <span style={{ fontSize: 10, color: '#6ee7b7' }}>✓ Edit or send below</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <textarea rows={3}
                  placeholder={`Reply on ${PLATFORMS.find(p => p.id === activeThread.platform)?.label || 'this platform'}...`}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSendReply() }}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '9px 13px', color: '#f0f0f5', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.5 }}
                />
                <button onClick={handleSendReply} disabled={!replyText.trim()}
                  style={{ ...S.btn, padding: '9px 18px', alignSelf: 'flex-end',
                    background: replyText.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.04)',
                    color: replyText.trim() ? '#fff' : '#374151',
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700,
                    boxShadow: replyText.trim() ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                  }}>
                  Send
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </div>
              <p style={{ fontSize: 10, color: '#374151', marginTop: 5 }}>Ctrl+Enter to send</p>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#374151' }}>
            <span style={{ fontSize: 40 }}>💬</span>
            <p style={{ fontSize: 14, fontWeight: 600 }}>Select a conversation</p>
            <p style={{ fontSize: 12 }}>Choose from the {filteredThreads.length} threads on the left</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

