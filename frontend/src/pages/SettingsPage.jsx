import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSearchParams } from 'react-router-dom'

const BACKEND = 'https://creator-os-production-0bf8.up.railway.app'

const IC = {
  user:   "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  link:   "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  gear:   "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  save:   "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
  check:  "M20 6L9 17l-5-5",
  warn:   "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
}

const Ico = ({ d, s = 15, c = 'currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const CARD = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18 }
const INP  = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 13px', color: '#f0f0f5', fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    full_name: '', username: '', bio: '', website: '',
    twitter: '', linkedin: '', youtube: '', instagram: '',
  })
  const [loading,           setLoading]           = useState(true)
  const [saving,            setSaving]            = useState(false)
  const [saved,             setSaved]             = useState(false)
  const [message,           setMessage]           = useState(null)
  const [searchParams]                            = useSearchParams()
  const [activeTab,         setActiveTab]         = useState('profile')
  const [twitterConnected,  setTwitterConnected]  = useState(false)
  const [ytConnected,       setYtConnected]       = useState(false)
  const [linkedinConnected, setLinkedinConnected] = useState(false)
  const [twitterStats,      setTwitterStats]      = useState(null)
  const [youtubeStats,      setYoutubeStats]      = useState(null)
  const [linkedinStats,     setLinkedinStats]     = useState(null)
  const [loadingStats,      setLoadingStats]      = useState(false)
  const [ytConnecting,      setYtConnecting]      = useState(false)
  const [userId,            setUserId]            = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const uid = session.user.id
      setUserId(uid)
      fetchProfile(uid)
      checkConnections(uid)

      // Handle OAuth redirects
      const connected = searchParams.get('connected')
      const ytConn    = searchParams.get('yt_connected')
      const error     = searchParams.get('error')
      const ytErr     = searchParams.get('yt_error')

      if (connected) {
        setMessage({ type: 'success', text: `${connected} connected successfully!` })
        setActiveTab('social')
      }
      // YouTube connected via new /api/youtube/callback
      if (searchParams.get('youtube_connected') === 'true') {
        setYtConnected(true)
        setMessage({ type: 'success', text: 'YouTube connected successfully! ✅' })
        setActiveTab('social')
        window.history.replaceState({}, '', '/settings')
      }
      if (ytConn) {
        setYtConnected(true)
        setMessage({ type: 'success', text: 'YouTube connected! Auto Clipping uploads are now enabled.' })
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
    })
  }, [])

  // ── Check connections ─────────────────────────────────────────────────────
  const checkConnections = async (uid) => {
    setTwitterConnected(!!localStorage.getItem('twitter_token'))
    setLinkedinConnected(!!localStorage.getItem('linkedin_token'))

    // NEW — check YouTube via /api/youtube/status/:user_id
    try {
      const r = await fetch(`${BACKEND}/api/youtube/status/${uid}`)
      const d = await r.json()
      setYtConnected(d.connected === true)
      if (d.connected && d.channel_name) {
        setYoutubeStats({
          channel_name:  d.channel_name,
          subscribers:   d.subscribers || '0',
          total_views:   '—',
          total_videos:  '—',
        })
      }
    } catch {
      setYtConnected(false)
    }
  }

  // ── Load detailed stats ───────────────────────────────────────────────────
  const loadStats = async () => {
    if (!userId) return
    setLoadingStats(true)

    const tToken = localStorage.getItem('twitter_token')
    const lToken = localStorage.getItem('linkedin_token')

    try {
      // Twitter
      if (tToken) {
        const r = await fetch(`${BACKEND}/api/social/twitter/stats?access_token=${tToken}`)
        const d = await r.json()
        if (!d.error) setTwitterStats(d)
      }

      // YouTube — use new endpoint
      const ytR = await fetch(`${BACKEND}/api/youtube/analytics/${userId}`)
      const ytD = await ytR.json()
      if (ytD.channel) {
        setYoutubeStats({
          channel_name:  ytD.channel.name,
          subscribers:   ytD.channel.subscribers,
          total_views:   ytD.channel.total_views,
          total_videos:  ytD.channel.video_count,
        })
      }

      // LinkedIn
      if (lToken) {
        const r = await fetch(`${BACKEND}/api/social/linkedin/stats?access_token=${lToken}`)
        const d = await r.json()
        if (!d.error) setLinkedinStats(d)
      }
    } catch (e) {
      console.error('Stats load error:', e)
    }
    setLoadingStats(false)
  }

  const fetchProfile = async (uid) => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) setProfile(data)
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true); setSaved(false); setMessage(null)
    const { data: sd } = await supabase.auth.getSession()
    if (!sd.session) return
    const { error } = await supabase.from('profiles').upsert({ ...profile, id: sd.session.user.id })
    if (error) {
      setMessage({ type: 'error', text: 'Save failed: ' + error.message })
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  // ── Connect handlers ──────────────────────────────────────────────────────
  const handleConnectTwitter  = async () => {
    const r = await fetch(`${BACKEND}/api/social/twitter/auth`)
    const d = await r.json()
    if (d.url) window.location.href = d.url
    else setMessage({ type: 'error', text: 'Twitter: ' + (d.detail || 'Coming soon') })
  }

  const handleConnectLinkedIn = async () => {
   window.location.href = `${BACKEND}/api/linkedin/auth?user_id=${userId}`
  }

  // NEW — YouTube connect using /api/youtube/auth with user_id
  const handleConnectYouTube = () => {
    if (!userId) return
    setYtConnecting(true)
    // Direct redirect — PKCE handled by backend
    window.location.href = `${BACKEND}/api/youtube/auth?user_id=${userId}`
  }

  const handleDisconnectYouTube = async () => {
    if (!userId) return
    if (window.confirm('Disconnect YouTube?')) {
      await fetch(`${BACKEND}/api/youtube/disconnect/${userId}`, { method: 'DELETE' })
      setYtConnected(false)
      setYoutubeStats(null)
      setMessage({ type: 'success', text: 'YouTube disconnected.' })
    }
  }

  const handleDisconnect = (platform) => {
    localStorage.removeItem(`${platform}_token`)
    localStorage.removeItem(`${platform}_refresh_token`)
    if (platform === 'twitter')  { setTwitterConnected(false);  setTwitterStats(null)  }
    if (platform === 'linkedin') { setLinkedinConnected(false); setLinkedinStats(null) }
    setMessage({ type: 'success', text: `${platform} disconnected.` })
  }

  const TABS = [
    { id: 'profile', label: 'Profile',         icon: IC.user },
    { id: 'social',  label: 'Social Accounts', icon: IC.link },
    { id: 'account', label: 'Account',          icon: IC.gear },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 10px' }} />
        <p style={{ color: '#374151', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>Loading settings…</p>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', maxWidth: 760, paddingBottom: 48 }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .st-btn { cursor:pointer; border:none; transition:all .15s; font-family:'DM Sans',sans-serif; }
        .st-btn:hover { filter:brightness(1.12); }
        .st-btn:disabled { opacity:.4; cursor:not-allowed; filter:none; }
        .st-inp:focus { border-color:rgba(99,102,241,0.5)!important; }
        .st-inp::placeholder { color:#374151; }
        .plat-card { transition:all .2s; }
        .plat-card:hover { border-color:rgba(255,255,255,0.14)!important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
          <Ico d={IC.gear} s={20} c="#fff" />
        </div>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, color: '#f0f0f5', lineHeight: 1 }}>Settings</h1>
          <p style={{ color: '#4b5563', fontSize: 13, marginTop: 3 }}>Manage your profile and connected accounts</p>
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div style={{ padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
          background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: message.type === 'success' ? '#6ee7b7' : '#f87171',
        }}>
          <Ico d={message.type === 'success' ? IC.check : IC.warn} s={14} c={message.type === 'success' ? '#6ee7b7' : '#f87171'} />
          {message.text}
          <button className="st-btn" onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', color: 'inherit', fontSize: 16, padding: 0 }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} className="st-btn"
            onClick={() => { setActiveTab(t.id); if (t.id === 'social') loadStats() }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400,
              background: activeTab === t.id ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: activeTab === t.id ? '#a5b4fc' : '#6b7280',
              border: `1px solid ${activeTab === t.id ? 'rgba(99,102,241,0.35)' : 'transparent'}`,
            }}>
            <Ico d={t.icon} s={13} c={activeTab === t.id ? '#a5b4fc' : '#4b5563'} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ──────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ico d={IC.user} s={15} c="#6366f1" /> Basic Info
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {[
                { key: 'full_name', label: 'Full Name', ph: 'Your display name' },
                { key: 'username',  label: 'Username',  ph: '@yourhandle'       },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input className="st-inp" type="text" value={profile[f.key] || ''} placeholder={f.ph}
                    onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} style={INP} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', marginBottom: 6 }}>Bio</label>
              <textarea className="st-inp" value={profile.bio || ''} rows={3} placeholder="Tell brands about yourself..."
                onChange={e => setProfile({ ...profile, bio: e.target.value })} style={{ ...INP, resize: 'vertical', lineHeight: 1.65 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', marginBottom: 6 }}>Website</label>
              <input className="st-inp" type="url" value={profile.website || ''} placeholder="https://yourwebsite.com"
                onChange={e => setProfile({ ...profile, website: e.target.value })} style={INP} />
            </div>
          </div>

          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ico d={IC.link} s={15} c="#6366f1" /> Social Handles
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { key: 'twitter',   label: 'Twitter / X', ph: '@username'              },
                { key: 'linkedin',  label: 'LinkedIn',    ph: 'linkedin.com/in/handle' },
                { key: 'youtube',   label: 'YouTube',     ph: 'youtube.com/@channel'   },
                { key: 'instagram', label: 'Instagram',   ph: '@username'              },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input className="st-inp" type="text" value={profile[f.key] || ''} placeholder={f.ph}
                    onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} style={INP} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="st-btn" onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 28px', borderRadius: 14, fontSize: 14, fontWeight: 700, fontFamily: 'Syne',
                background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border: saved ? '1px solid rgba(16,185,129,0.3)' : 'none',
                color: saved ? '#6ee7b7' : '#fff',
                boxShadow: saved ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
              }}>
              {saving
                ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Saving…</>
                : saved ? <><Ico d={IC.check} s={14} c="#6ee7b7" />Saved!</>
                : <><Ico d={IC.save} s={14} c="#fff" />Save Profile</>}
            </button>
          </div>
        </div>
      )}

      {/* ── SOCIAL ACCOUNTS TAB ──────────────────────────────────────── */}
      {activeTab === 'social' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Twitter */}
          <PlatformCard
            name="Twitter / X" description="Post tweets and fetch analytics"
            icon={<span style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>𝕏</span>}
            iconBg="#000" accent="#1d9bf0" accentRgb="29,155,240"
            connected={twitterConnected}
            connectedLabel={twitterStats ? `@${twitterStats.username} · ${Number(twitterStats.followers).toLocaleString()} followers` : 'Connected'}
            onConnect={handleConnectTwitter}
            onDisconnect={() => handleDisconnect('twitter')}
            connectLabel="Coming Soon"
            connectDisabled={true}
          />

          {/* YouTube — NEW connect handler */}
          <PlatformCard
            name="YouTube" description="Upload videos, schedule, analytics & comments"
            icon={<span style={{ color: '#fff', fontSize: 18 }}>▶</span>}
            iconBg="#ef4444" accent="#ef4444" accentRgb="239,68,68"
            connected={ytConnected}
            connectedLabel={youtubeStats
              ? `${youtubeStats.channel_name} · ${Number(youtubeStats.subscribers || 0).toLocaleString()} subs`
              : 'YouTube Connected ✅'}
            onConnect={handleConnectYouTube}
            onDisconnect={handleDisconnectYouTube}
            connectLabel={ytConnecting ? 'Connecting…' : 'Connect YouTube'}
            connectDisabled={ytConnecting}
            connectLoading={ytConnecting}
          >
            {ytConnected && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
                <span style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 100, fontWeight: 700 }}>📤 Upload Ready</span>
                <span style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', borderRadius: 100, fontWeight: 700 }}>🔒 PKCE OAuth</span>
                <span style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60A5FA', borderRadius: 100, fontWeight: 700 }}>📅 Schedule Ready</span>
              </div>
            )}
            {ytConnected && youtubeStats && youtubeStats.total_videos !== '—' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
                {[
                  { label: 'Subscribers', value: Number(youtubeStats.subscribers || 0).toLocaleString() },
                  { label: 'Total Views',  value: Number(youtubeStats.total_views  || 0).toLocaleString() },
                  { label: 'Videos',       value: Number(youtubeStats.total_videos  || 0).toLocaleString() },
                ].map((s, i) => <StatBox key={i} label={s.label} value={s.value} accent="#ef4444" />)}
              </div>
            )}
            {ytConnected && loadingStats && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(239,68,68,0.2)', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                <span style={{ fontSize: 12, color: '#374151' }}>Loading stats…</span>
              </div>
            )}
          </PlatformCard>

          {/* LinkedIn */}
          <PlatformCard
            name="LinkedIn" description="Post updates and fetch profile"
            icon={<span style={{ color: '#fff', fontSize: 15, fontWeight: 900 }}>in</span>}
            iconBg="#0a66c2" accent="#0a66c2" accentRgb="10,102,194"
            connected={linkedinConnected}
            connectedLabel={linkedinStats ? `${linkedinStats.name} · ${linkedinStats.email}` : 'Connected'}
            onConnect={handleConnectLinkedIn}
            onDisconnect={() => handleDisconnect('linkedin')}
          >
            {linkedinConnected && linkedinStats && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                {linkedinStats.picture && <img src={linkedinStats.picture} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />}
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#f0f0f5' }}>{linkedinStats.name}</p>
                  <p style={{ fontSize: 11, color: '#4b5563' }}>{linkedinStats.email}</p>
                </div>
              </div>
            )}
          </PlatformCard>

          {/* Instagram — locked */}
          <PlatformCard
            name="Instagram" description="Posts, stories, analytics — coming soon"
            icon={<span style={{ color: '#fff', fontSize: 16 }}>📸</span>}
            iconBg="linear-gradient(135deg,#f09433,#dc2743,#bc1888)"
            accent="#E1306C" accentRgb="225,48,108"
            connected={false}
            connectedLabel=""
            onConnect={() => {}}
            connectLabel="Coming Soon"
            connectDisabled={true}
          />

          <div style={{ padding: '14px 18px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 14 }}>
            <p style={{ fontSize: 12, color: '#818cf8', lineHeight: 1.7 }}>
              <span style={{ fontWeight: 700, color: '#a5b4fc' }}>💡 YouTube Studio:</span> After connecting YouTube here, go to <strong style={{ color: '#a5b4fc' }}>YouTube Studio</strong> in the sidebar to upload videos, post to community, view analytics and manage comments.
            </p>
          </div>
        </div>
      )}

      {/* ── ACCOUNT TAB ──────────────────────────────────────────────── */}
      {activeTab === 'account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 18 }}>Account Info</p>
            {[
              { label: 'Plan',         value: <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', borderRadius: 100 }}>Beta</span> },
              { label: 'Member since', value: <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>2025</span> },
            ].map((row, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{row.label}</span>
                {row.value}
              </div>
            ))}
          </div>
          <div style={{ padding: 24, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 18 }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: '#f87171', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ico d={IC.warn} s={15} c="#f87171" /> Danger Zone
            </p>
            <p style={{ fontSize: 12, color: '#374151', marginBottom: 16 }}>These actions cannot be undone.</p>
            <button className="st-btn"
              onClick={async () => { if (window.confirm('Sign out?')) { await supabase.auth.signOut(); window.location.href = '/' } }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
              <Ico d={IC.logout} s={14} c="#f87171" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PlatformCard({ name, description, icon, iconBg, accent, accentRgb, connected, connectedLabel, onConnect, onDisconnect, connectLabel = 'Connect', connectDisabled = false, connectLoading = false, children }) {
  return (
    <div className="plat-card" style={{ background: connected ? `rgba(${accentRgb},0.05)` : 'rgba(255,255,255,0.02)', border: `1px solid ${connected ? `rgba(${accentRgb},0.25)` : 'rgba(255,255,255,0.07)'}`, borderRadius: 18, padding: 22, transition: 'all .2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, background: iconBg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
          </div>
          <div>
            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: '#f0f0f5', marginBottom: 3 }}>{name}</p>
            <p style={{ fontSize: 12, color: connected ? accent : '#374151' }}>{connected ? connectedLabel : description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {connected ? (
            <>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', borderRadius: 100 }}>✓ Connected</span>
              <button className="st-btn" onClick={onDisconnect}
                style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 100 }}>
                Disconnect
              </button>
            </>
          ) : (
            <button className="st-btn" onClick={onConnect} disabled={connectDisabled}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: connectDisabled ? 'rgba(255,255,255,0.04)' : `rgba(${accentRgb},0.15)`, border: `1px solid ${connectDisabled ? 'rgba(255,255,255,0.08)' : `rgba(${accentRgb},0.35)`}`, color: connectDisabled ? '#4b5563' : accent, borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
              {connectLoading && <div style={{ width: 12, height: 12, border: `2px solid rgba(${accentRgb},0.3)`, borderTopColor: accent, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />}
              {connectLabel}
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

function StatBox({ label, value, accent = '#6366f1' }) {
  return (
    <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textAlign: 'center' }}>
      <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#f0f0f5' }}>{value}</p>
      <p style={{ fontSize: 11, color: '#374151', marginTop: 3 }}>{label}</p>
    </div>
  )
}