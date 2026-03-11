import { useState } from 'react'

const MOCK_MESSAGES = [
  {
    id: 1,
    platform: 'twitter',
    type: 'mention',
    author: '@john_creator',
    avatar: '👨‍💻',
    content: 'Bhai tera latest video kamaal tha! YouTube pe content creation ke baare mein aur batao!',
    time: '2m ago',
    read: false,
    superfan: true,
  },
  {
    id: 2,
    platform: 'youtube',
    type: 'comment',
    author: 'Sarah Ahmed',
    avatar: '👩‍🎨',
    content: 'This tutorial really helped me understand the concept. Please make more videos like this!',
    time: '15m ago',
    read: false,
    superfan: true,
  },
  {
    id: 3,
    platform: 'linkedin',
    type: 'comment',
    author: 'Ali Raza',
    avatar: '👨‍💼',
    content: 'Great insights on personal branding! Would love to connect and discuss more about creator economy.',
    time: '1h ago',
    read: true,
    superfan: false,
  },
  {
    id: 4,
    platform: 'twitter',
    type: 'dm',
    author: '@brand_collab',
    avatar: '🏢',
    content: 'Hi! We are interested in collaborating with you for our new product launch. Can we discuss?',
    time: '2h ago',
    read: true,
    superfan: false,
  },
  {
    id: 5,
    platform: 'youtube',
    type: 'comment',
    author: 'Usman Khan',
    avatar: '👨‍🚀',
    content: 'Subscribed! Been watching your content for months. You explain things so clearly mashallah!',
    time: '3h ago',
    read: true,
    superfan: true,
  },
  {
    id: 6,
    platform: 'instagram',
    type: 'comment',
    author: '@creative_mind',
    avatar: '🎨',
    content: 'Love your aesthetic! What camera do you use for your shoots?',
    time: '5h ago',
    read: true,
    superfan: false,
  },
  {
    id: 7,
    platform: 'twitter',
    type: 'mention',
    author: '@tech_news_pk',
    avatar: '📱',
    content: 'Just shared your thread on AI tools — amazing breakdown! Everyone should read this.',
    time: '6h ago',
    read: true,
    superfan: true,
  },
  {
    id: 8,
    platform: 'linkedin',
    type: 'dm',
    author: 'Fatima Sheikh',
    avatar: '👩‍💻',
    content: 'Hello! I came across your profile and would love to feature you in our creator spotlight series.',
    time: '1d ago',
    read: true,
    superfan: false,
  },
]

const PLATFORM_CONFIG = {
  twitter: { label: 'Twitter / X', emoji: '🐦', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500' },
  youtube: { label: 'YouTube', emoji: '🎥', color: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
  linkedin: { label: 'LinkedIn', emoji: '💼', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-700' },
  instagram: { label: 'Instagram', emoji: '📸', color: 'bg-pink-100 text-pink-600', dot: 'bg-pink-500' },
}

const TYPE_CONFIG = {
  mention: { label: 'Mention', color: 'bg-purple-100 text-purple-600' },
  comment: { label: 'Comment', color: 'bg-green-100 text-green-600' },
  dm: { label: 'DM', color: 'bg-orange-100 text-orange-600' },
}

export default function InboxPage() {
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [selectedMsg, setSelectedMsg] = useState(null)
  const [filter, setFilter] = useState('all')
  const [replyText, setReplyText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [repliedIds, setRepliedIds] = useState([])

  const filteredMessages = messages.filter(msg => {
    if (filter === 'all') return true
    if (filter === 'unread') return !msg.read
    if (filter === 'superfan') return msg.superfan
    return msg.platform === filter
  })

  const unreadCount = messages.filter(m => !m.read).length
  const superfanCount = messages.filter(m => m.superfan).length

  const handleSelect = (msg) => {
    setSelectedMsg(msg)
    setReplyText('')
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m))
  }

  const handleAiReply = async () => {
    setAiLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/ai/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: selectedMsg.content,
          platform: selectedMsg.platform,
          type: selectedMsg.type
        })
      })
      const data = await response.json()
      setReplyText(data.reply)
    } catch (error) {
      alert("AI reply generate nahi hua: " + error.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSendReply = () => {
    if (!replyText.trim()) return
    setRepliedIds(prev => [...prev, selectedMsg.id])
    setReplyText('')
    alert("Reply bhej di! ✅ (Real API Month 8 mein connect hogi)")
  }

  return (
    <div className="flex h-screen -m-8 -mt-8">

      {/* Left Panel */}
      <div className="w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">

        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Unified Inbox 📥</h1>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} new
                </span>
              )}
              {superfanCount > 0 && (
                <span className="bg-yellow-400 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  ⭐ {superfanCount}
                </span>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: '🔵 Unread' },
              { id: 'superfan', label: '⭐ Superfans' },
              { id: 'twitter', label: '🐦' },
              { id: 'youtube', label: '🎥' },
              { id: 'linkedin', label: '💼' },
              { id: 'instagram', label: '📸' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={"px-2.5 py-1 rounded-lg text-xs font-medium transition-all " + (filter === f.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto">
          {filteredMessages.map(msg => {
            const platform = PLATFORM_CONFIG[msg.platform]
            const type = TYPE_CONFIG[msg.type]
            const isSelected = selectedMsg?.id === msg.id

            return (
              <div
                key={msg.id}
                onClick={() => handleSelect(msg)}
                className={"p-4 border-b border-gray-50 cursor-pointer transition-colors " +
                  (isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50') +
                  (!msg.read && !isSelected ? ' bg-blue-50/30' : '')}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                      {msg.avatar}
                    </div>
                    <div className={"absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white " + platform.dot}></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-800 text-sm truncate">{msg.author}</span>
                      {msg.superfan && <span className="text-yellow-400 text-xs">⭐</span>}
                      {!msg.read && <div className="w-2 h-2 bg-blue-600 rounded-full ml-auto flex-shrink-0"></div>}
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={"text-xs px-1.5 py-0.5 rounded " + type.color}>{type.label}</span>
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{msg.content}</p>
                  </div>
                </div>
              </div>
            )
          })}

          {filteredMessages.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              Koi message nahi mila
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedMsg ? (
          <>
            {/* Message Header */}
            <div className="bg-white border-b border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                  {selectedMsg.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">{selectedMsg.author}</h2>
                    {selectedMsg.superfan && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        ⭐ Superfan
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={"text-xs px-2 py-0.5 rounded-full " + PLATFORM_CONFIG[selectedMsg.platform].color}>
                      {PLATFORM_CONFIG[selectedMsg.platform].emoji} {PLATFORM_CONFIG[selectedMsg.platform].label}
                    </span>
                    <span className={"text-xs px-2 py-0.5 rounded-full " + TYPE_CONFIG[selectedMsg.type].color}>
                      {TYPE_CONFIG[selectedMsg.type].label}
                    </span>
                    <span className="text-xs text-gray-400">{selectedMsg.time}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm max-w-2xl">
                <p className="text-gray-800 leading-relaxed">{selectedMsg.content}</p>
              </div>

              {repliedIds.includes(selectedMsg.id) && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-4 max-w-2xl">
                  <p className="text-green-700 text-sm font-medium">✅ Reply bhej di!</p>
                </div>
              )}
            </div>

            {/* Reply Box */}
            <div className="bg-white border-t border-gray-200 p-5">
              <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Reply karein</p>
                  <button
                    onClick={handleAiReply}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors font-medium disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <div className="w-3 h-3 border border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>✨ AI Reply Suggest karo</>
                    )}
                  </button>
                </div>

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Apna reply likhein..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm"
                />

                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-400">
                    {PLATFORM_CONFIG[selectedMsg.platform].emoji} {PLATFORM_CONFIG[selectedMsg.platform].label} par reply jayegi
                  </p>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || repliedIds.includes(selectedMsg.id)}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Send Reply →
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📥</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Unified Inbox</h3>
              <p className="text-gray-400 max-w-sm">
                Left side se koi message select karo — reply karein ya AI se suggestion lo!
              </p>
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl max-w-sm">
                <p className="text-yellow-700 text-sm font-medium">⚡ Real API Integration</p>
                <p className="text-yellow-600 text-xs mt-1">Twitter, YouTube, LinkedIn APIs Month 8 mein connect hongi</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}