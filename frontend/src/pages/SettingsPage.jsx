import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSearchParams } from 'react-router-dom'

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    full_name: '', username: '', bio: '', website: '',
    twitter: '', linkedin: '', youtube: '', instagram: '',
  })
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [message,       setMessage]       = useState(null)
  const [searchParams]                    = useSearchParams()
  const [activeTab,     setActiveTab]     = useState('profile')

  const [twitterConnected,  setTwitterConnected]  = useState(false)
  const [ytConnected,       setYtConnected]       = useState(false)  // from clipping OAuth
  const [linkedinConnected, setLinkedinConnected] = useState(false)
  const [twitterStats,      setTwitterStats]      = useState(null)
  const [youtubeStats,      setYoutubeStats]      = useState(null)
  const [linkedinStats,     setLinkedinStats]     = useState(null)
  const [loadingStats,      setLoadingStats]      = useState(false)
  const [ytConnecting,      setYtConnecting]      = useState(false)

  useEffect(() => {
    fetchProfile()
    checkConnections()

    const connected = searchParams.get('connected')
    const ytConn    = searchParams.get('yt_connected')
    const error     = searchParams.get('error')
    const ytErr     = searchParams.get('yt_error')

    if (connected) {
      setMessage({ type: 'success', text: `${connected} connected! ✅` })
      setActiveTab('social')
    }
    if (ytConn) {
      setYtConnected(true)
      setMessage({ type: 'success', text: 'YouTube connected successfully! ✅ Ab Auto Clipping se upload kar sakte ho.' })
      setActiveTab('social')
      window.history.replaceState({}, '', '/settings')
    }
    if (error) {
      setMessage({ type: 'error', text: `Connection failed: ${error}` })
      setActiveTab('social')
    }
    if (ytErr) {
      setMessage({ type: 'error', text: `YouTube connect failed: ${ytErr}` })
      setActiveTab('social')
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  const checkConnections = async () => {
    setTwitterConnected(!!localStorage.getItem('twitter_token'))
    setLinkedinConnected(!!localStorage.getItem('linkedin_token'))
    // YouTube: check from backend (clipping OAuth)
    try {
      const r = await fetch('http://localhost:8000/api/clipping/youtube-status')
      const d = await r.json()
      setYtConnected(d.connected)
    } catch {
      setYtConnected(false)
    }
  }

  const loadStats = async () => {
    setLoadingStats(true)
    const tToken = localStorage.getItem('twitter_token')
    const lToken = localStorage.getItem('linkedin_token')
    try {
      if (tToken) {
        const r = await fetch(`http://localhost:8000/api/social/twitter/stats?access_token=${tToken}`)
        const d = await r.json()
        if (!d.error) setTwitterStats(d)
      }
      // YouTube stats from clipping service (no token needed)
      const ytR = await fetch('http://localhost:8000/api/social/youtube/stats')
      const ytD = await ytR.json()
      if (!ytD.error) setYoutubeStats(ytD)

      if (lToken) {
        const r = await fetch(`http://localhost:8000/api/social/linkedin/stats?access_token=${lToken}`)
        const d = await r.json()
        if (!d.error) setLinkedinStats(d)
      }
    } catch (e) { console.error(e) }
    setLoadingStats(false)
  }

  const fetchProfile = async () => {
    setLoading(true)
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return
    const { data } = await supabase.from('profiles').select('*').eq('id', sessionData.session.user.id).single()
    if (data) setProfile(data)
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true); setMessage(null)
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return
    const { error } = await supabase.from('profiles').upsert({ ...profile, id: sessionData.session.user.id })
    setMessage(error
      ? { type: 'error',   text: 'Error saving: ' + error.message }
      : { type: 'success', text: 'Profile saved! ✅' }
    )
    setSaving(false)
  }

  const handleConnectTwitter  = async () => {
    const r = await fetch('http://localhost:8000/api/social/twitter/auth')
    const d = await r.json()
    window.location.href = d.url
  }

  // ── YouTube: single connect point via clipping OAuth ──────────────────────
  const handleConnectYouTube = async () => {
    setYtConnecting(true)
    try {
      const r = await fetch('http://localhost:8000/api/clipping/connect-youtube', { method: 'POST' })
      const d = await r.json()
      if (d.auth_url) {
        // Redirect to Google OAuth — comes back to /settings?yt_connected=1
        window.location.href = d.auth_url
      } else {
        setMessage({ type: 'error', text: d.detail || 'Auth URL nahi mili' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Connect error: ' + e.message })
    }
    setYtConnecting(false)
  }

  const handleDisconnectYouTube = async () => {
    // Just tell user to restart backend (service is in-memory)
    if (window.confirm('YouTube disconnect karne ke liye backend restart karna hoga. Theek hai?')) {
      setYtConnected(false)
      setYoutubeStats(null)
      setMessage({ type: 'success', text: 'YouTube disconnected. Backend restart karo aur reconnect karo.' })
    }
  }

  const handleConnectLinkedIn = async () => {
    const r = await fetch('http://localhost:8000/api/social/linkedin/auth')
    const d = await r.json()
    window.location.href = d.url
  }

  const handleDisconnect = (platform) => {
    localStorage.removeItem(`${platform}_token`)
    localStorage.removeItem(`${platform}_refresh_token`)
    if (platform === 'twitter')  { setTwitterConnected(false);  setTwitterStats(null)  }
    if (platform === 'linkedin') { setLinkedinConnected(false); setLinkedinStats(null) }
    setMessage({ type: 'success', text: `${platform} disconnected!` })
  }

  const tabs = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'social',  label: '🔗 Social Accounts' },
    { id: 'account', label: '⚙️ Account' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Settings ⚙️</h1>
        <p className="text-gray-500 mt-1">Apna profile aur connections manage karo</p>
      </header>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success'
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'social') loadStats() }}
            className={"px-4 py-2.5 text-sm font-medium border-b-2 transition-colors " +
              (activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[{ key:'full_name', label:'Full Name', placeholder:'Aapka naam' },
              { key:'username',  label:'Username',  placeholder:'@username'  }].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input type="text" value={profile[f.key] || ''} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
              placeholder="Apne baare mein likho..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input type="url" value={profile.website || ''} onChange={e => setProfile({ ...profile, website: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              placeholder="https://yourwebsite.com" />
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Social Handles</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{ key:'twitter',   label:'🐦 Twitter',   placeholder:'@username'               },
                { key:'linkedin',  label:'💼 LinkedIn',  placeholder:'linkedin.com/in/username' },
                { key:'youtube',   label:'🎬 YouTube',   placeholder:'youtube.com/@channel'    },
                { key:'instagram', label:'📸 Instagram', placeholder:'@username'               }].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                  <input type="text" value={profile[field.key] || ''} onChange={e => setProfile({ ...profile, [field.key]: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    placeholder={field.placeholder} />
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      )}

      {/* ── SOCIAL ACCOUNTS TAB ── */}
      {activeTab === 'social' && (
        <div className="space-y-4">

          {/* Twitter */}
          <div className={"rounded-xl border p-5 shadow-sm " + (twitterConnected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl font-bold">𝕏</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Twitter / X</p>
                  {twitterConnected && twitterStats
                    ? <p className="text-xs text-blue-600">@{twitterStats.username} • {Number(twitterStats.followers).toLocaleString()} followers</p>
                    : <p className="text-xs text-gray-400">Post tweets + fetch analytics</p>}
                </div>
              </div>
              {twitterConnected ? (
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✅ Connected</span>
                  <button onClick={() => handleDisconnect('twitter')}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold hover:bg-red-200 transition-colors">Disconnect</button>
                </div>
              ) : (
                <button onClick={handleConnectTwitter}
                  className="px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">Connect</button>
              )}
            </div>
            {twitterConnected && twitterStats && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[{ label:'Followers', value: Number(twitterStats.followers).toLocaleString() },
                  { label:'Following', value: Number(twitterStats.following).toLocaleString() },
                  { label:'Tweets',   value: Number(twitterStats.tweets).toLocaleString()   }].map((s, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 text-center border border-blue-100">
                    <p className="text-lg font-bold text-gray-800">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── YOUTUBE — Single connect point ── */}
          <div className={"rounded-xl border p-5 shadow-sm " + (ytConnected ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">▶</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">YouTube</p>
                  {ytConnected && youtubeStats
                    ? <p className="text-xs text-red-600">{youtubeStats.channel_name} • {Number(youtubeStats.subscribers).toLocaleString()} subscribers</p>
                    : ytConnected
                      ? <p className="text-xs text-green-600">Connected ✅ — loading stats...</p>
                      : <p className="text-xs text-gray-400">Channel stats + Auto Clip upload (one-time setup)</p>}
                </div>
              </div>
              {ytConnected ? (
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✅ Connected</span>
                  <button onClick={handleDisconnectYouTube}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold hover:bg-red-200 transition-colors">Disconnect</button>
                </div>
              ) : (
                <button onClick={handleConnectYouTube} disabled={ytConnecting}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2">
                  {ytConnecting
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Connecting...</>
                    : 'Connect YouTube'}
                </button>
              )}
            </div>

            {/* Connected badges */}
            {ytConnected && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] px-2 py-1 bg-red-100 text-red-600 rounded-full font-bold border border-red-200">📤 Upload Permission</span>
                <span className="text-[10px] px-2 py-1 bg-green-100 text-green-600 rounded-full font-bold border border-green-200">🔒 Secure OAuth</span>
                <span className="text-[10px] text-gray-400">Auto Clipping → YouTube Shorts upload ready</span>
              </div>
            )}

            {/* Info box when not connected */}
            {!ytConnected && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-xs text-yellow-700">
                  <span className="font-bold">⚠️ Setup required:</span> Sirf ek baar connect karo.
                  <br />Google Cloud Console mein <code className="bg-yellow-100 px-1 rounded">http://localhost:8000/api/clipping/oauth-callback</code> as redirect URI add karo, phir yahan Connect dabao.
                </p>
              </div>
            )}

            {ytConnected && youtubeStats && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[{ label:'Subscribers', value: Number(youtubeStats.subscribers || youtubeStats.channel_name && 0).toLocaleString() },
                  { label:'Total Views', value: Number(youtubeStats.total_views  || 0).toLocaleString() },
                  { label:'Videos',     value: Number(youtubeStats.total_videos  || 0).toLocaleString() }].map((s, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 text-center border border-red-100">
                    <p className="text-lg font-bold text-gray-800">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            {ytConnected && loadingStats && (
              <div className="mt-3 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/>
                <p className="text-xs text-gray-400">Loading stats...</p>
              </div>
            )}
          </div>

          {/* LinkedIn */}
          <div className={"rounded-xl border p-5 shadow-sm " + (linkedinConnected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl font-bold">in</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">LinkedIn</p>
                  {linkedinConnected && linkedinStats
                    ? <p className="text-xs text-blue-700">{linkedinStats.name} • {linkedinStats.email}</p>
                    : <p className="text-xs text-gray-400">Post updates + fetch profile</p>}
                </div>
              </div>
              {linkedinConnected ? (
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✅ Connected</span>
                  <button onClick={() => handleDisconnect('linkedin')}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold hover:bg-red-200 transition-colors">Disconnect</button>
                </div>
              ) : (
                <button onClick={handleConnectLinkedIn}
                  className="px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors">Connect</button>
              )}
            </div>
            {linkedinConnected && linkedinStats && (
              <div className="mt-4 bg-white rounded-lg p-3 border border-blue-100 flex items-center gap-3">
                {linkedinStats.picture && <img src={linkedinStats.picture} alt="Profile" className="w-10 h-10 rounded-full" />}
                <div>
                  <p className="font-semibold text-gray-800">{linkedinStats.name}</p>
                  <p className="text-xs text-gray-400">{linkedinStats.email}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-700 mb-1">💡 How it works</p>
            <p className="text-sm text-blue-600">YouTube sirf ek baar connect karo yahan se — phir Auto Clipping page par directly Upload YT button se clips YouTube Shorts par upload hogi!</p>
          </div>
        </div>
      )}

      {/* ── ACCOUNT TAB ── */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Account Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Plan</span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">Solo $19</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Member since</span>
                <span className="text-sm font-medium text-gray-800">March 2025</span>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-5">
            <h3 className="font-semibold text-red-700 mb-2">⚠️ Danger Zone</h3>
            <p className="text-sm text-red-500 mb-3">Ye actions reversible nahi hain!</p>
            <button onClick={async () => {
              if (window.confirm('Logout karna chahte ho?')) {
                await supabase.auth.signOut()
                window.location.href = '/'
              }
            }} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}