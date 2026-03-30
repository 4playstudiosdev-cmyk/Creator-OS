import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSearchParams } from 'react-router-dom'

const IC = {
  user:     "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  link:     "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  gear:     "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  save:     "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
  check:    "M20 6L9 17l-5-5",
  warn:     "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  logout:   "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  info:     "M12 22a10 10 0 100-20 10 10 0 000 20zM12 8h.01M11 12h1v4h1",
  spin:     "M12 2a10 10 0 0110 10",
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

  useEffect(() => {
    fetchProfile()
    checkConnections()
    const connected = searchParams.get('connected')
    const ytConn    = searchParams.get('yt_connected')
    const error     = searchParams.get('error')
    const ytErr     = searchParams.get('yt_error')
    if (connected) { setMessage({ type: 'success', text: `${connected} connected successfully!` }); setActiveTab('social') }
    if (ytConn)    { setYtConnected(true); setMessage({ type: 'success', text: 'YouTube connected! Auto Clipping uploads are now enabled.' }); setActiveTab('social'); window.history.replaceState({}, '', '/settings') }
    if (error)     { setMessage({ type: 'error', text: `Connection failed: ${error}` }); setActiveTab('social') }
    if (ytErr)     { setMessage({ type: 'error', text: `YouTube connect failed: ${ytErr}` }); setActiveTab('social'); window.history.replaceState({}, '', '/settings') }
  }, [])

  const checkConnections = async () => {
    setTwitterConnected(!!localStorage.getItem('twitter_token'))
    setLinkedinConnected(!!localStorage.getItem('linkedin_token'))
    try {
      const r = await fetch('' + import.meta.env.VITE_API_URL + '/api/clipping/youtube-status')
      const d = await r.json()
      setYtConnected(d.connected)
    } catch { setYtConnected(false) }
  }

  const loadStats = async () => {
    setLoadingStats(true)
    const tToken = localStorage.getItem('twitter_token')
    const lToken = localStorage.getItem('linkedin_token')
    try {
      if (tToken) {
        const r = await fetch(`' + import.meta.env.VITE_API_URL + '/api/social/twitter/stats?access_token=${tToken}`)
        const d = await r.json()
        if (!d.error) setTwitterStats(d)
      }
      const ytR = await fetch('' + import.meta.env.VITE_API_URL + '/api/social/youtube/stats')
      const ytD = await ytR.json()
      if (!ytD.error) setYoutubeStats(ytD)
      if (lToken) {
        const r = await fetch(`' + import.meta.env.VITE_API_URL + '/api/social/linkedin/stats?access_token=${lToken}`)
        const d = await r.json()
        if (!d.error) setLinkedinStats(d)
      }
    } catch (e) { console.error(e) }
    setLoadingStats(false)
  }

  const fetchProfile = async () => {
    setLoading(true)
    const { data: sd } = await supabase.auth.getSession()
    if (!sd.session) { setLoading(false); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', sd.session.user.id).single()
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

  const handleConnectTwitter  = async () => { const r = await fetch('' + import.meta.env.VITE_API_URL + '/api/social/twitter/auth'); const d = await r.json(); window.location.href = d.url }
  const handleConnectLinkedIn = async () => { const r = await fetch('' + import.meta.env.VITE_API_URL + '/api/social/linkedin/auth'); const d = await r.json(); window.location.href = d.url }

  const handleConnectYouTube = async () => {
    setYtConnecting(true)
    try {
      const r = await fetch('' + import.meta.env.VITE_API_URL + '/api/clipping/connect-youtube', { method: 'POST' })
      const d = await r.json()
      if (d.auth_url) window.location.href = d.auth_url
      else setMessage({ type: 'error', text: d.detail || 'Auth URL not received' })
    } catch (e) { setMessage({ type: 'error', text: 'Connect error: ' + e.message }) }
    setYtConnecting(false)
  }

  const handleDisconnectYouTube = async () => {
    if (window.confirm('Disconnecting YouTube requires a backend restart. Continue?')) {
      setYtConnected(false); setYoutubeStats(null)
      setMessage({ type: 'success', text: 'YouTube disconnected. Restart backend and reconnect.' })
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

      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
          <Ico d={IC.gear} s={20} c="#fff" />
        </div>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, color: '#f0f0f5', lineHeight: 1 }}>Settings</h1>
          <p style={{ color: '#4b5563', fontSize: 13, marginTop: 3 }}>Manage your profile and connected accounts</p>
        </div>
      </div>

      {/* ── TOAST MESSAGE ───────────────────────────────────────────── */}
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

      {/* ── TABS ────────────────────────────────────────────────────── */}
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

      {/* ════════════════════════════════════════════════════════════
          PROFILE TAB
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Basic info */}
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ico d={IC.user} s={15} c="#6366f1" /> Basic Info
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {[
                { key: 'full_name', label: 'Full Name', ph: 'Your display name', type: 'text' },
                { key: 'username',  label: 'Username',  ph: '@yourhandle',       type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input className="st-inp" type={f.type} value={profile[f.key] || ''} placeholder={f.ph}
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

          {/* Social handles */}
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ico d={IC.link} s={15} c="#6366f1" /> Social Handles
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { key: 'twitter',   label: 'Twitter / X', ph: '@username'                  },
                { key: 'linkedin',  label: 'LinkedIn',    ph: 'linkedin.com/in/username'   },
                { key: 'youtube',   label: 'YouTube',     ph: 'youtube.com/@channel'       },
                { key: 'instagram', label: 'Instagram',   ph: '@username'                  },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input className="st-inp" type="text" value={profile[f.key] || ''} placeholder={f.ph}
                    onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} style={INP} />
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
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
                : saved
                ? <><Ico d={IC.check} s={14} c="#6ee7b7" />Saved!</>
                : <><Ico d={IC.save} s={14} c="#fff" />Save Profile</>}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          SOCIAL ACCOUNTS TAB
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'social' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Twitter */}
          <PlatformCard
            name="Twitter / X"
            description="Post tweets and fetch analytics"
            icon={<span style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>𝕏</span>}
            iconBg="#000"
            accent="#1d9bf0"
            accentRgb="29,155,240"
            connected={twitterConnected}
            connectedLabel={twitterStats ? `@${twitterStats.username} · ${Number(twitterStats.followers).toLocaleString()} followers` : 'Connected'}
            onConnect={handleConnectTwitter}
            onDisconnect={() => handleDisconnect('twitter')}
          >
            {twitterConnected && twitterStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
                {[{ label: 'Followers', value: Number(twitterStats.followers).toLocaleString() },
                  { label: 'Following', value: Number(twitterStats.following).toLocaleString() },
                  { label: 'Tweets',   value: Number(twitterStats.tweets).toLocaleString()    }].map((s, i) => (
                  <StatBox key={i} label={s.label} value={s.value} />
                ))}
              </div>
            )}
          </PlatformCard>

          {/* YouTube */}
          <PlatformCard
            name="YouTube"
            description="Channel stats + Auto Clip upload (one-time setup)"
            icon={<span style={{ color: '#fff', fontSize: 18 }}>▶</span>}
            iconBg="#ef4444"
            accent="#ef4444"
            accentRgb="239,68,68"
            connected={ytConnected}
            connectedLabel={youtubeStats ? `${youtubeStats.channel_name} · ${Number(youtubeStats.subscribers || 0).toLocaleString()} subscribers` : 'Connected — loading stats…'}
            onConnect={handleConnectYouTube}
            onDisconnect={handleDisconnectYouTube}
            connectLabel={ytConnecting ? 'Connecting…' : 'Connect YouTube'}
            connectDisabled={ytConnecting}
            connectLoading={ytConnecting}
          >
            {ytConnected && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
                <span style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 100, fontWeight: 700 }}>📤 Upload Permission</span>
                <span style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', borderRadius: 100, fontWeight: 700 }}>🔒 Secure OAuth</span>
                <span style={{ fontSize: 10, color: '#374151', alignSelf: 'center' }}>Auto Clipping → YouTube Shorts upload ready</span>
              </div>
            )}
            {ytConnected && youtubeStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
                {[{ label: 'Subscribers', value: Number(youtubeStats.subscribers || 0).toLocaleString() },
                  { label: 'Total Views', value: Number(youtubeStats.total_views  || 0).toLocaleString() },
                  { label: 'Videos',     value: Number(youtubeStats.total_videos  || 0).toLocaleString() }].map((s, i) => (
                  <StatBox key={i} label={s.label} value={s.value} accent="#ef4444" />
                ))}
              </div>
            )}
            {ytConnected && loadingStats && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(239,68,68,0.2)', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                <span style={{ fontSize: 12, color: '#374151' }}>Loading stats…</span>
              </div>
            )}
            {!ytConnected && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12 }}>
                <p style={{ fontSize: 12, color: '#fbbf24', lineHeight: 1.7 }}>
                  <span style={{ fontWeight: 700 }}>⚠️ One-time setup:</span> Add{' '}
                  <code style={{ background: 'rgba(245,158,11,0.12)', padding: '1px 6px', borderRadius: 5, fontFamily: 'monospace', fontSize: 11 }}>
                    
                  </code>{' '}
                  
                </p>
              </div>
            )}
          </PlatformCard>

          {/* LinkedIn */}
          <PlatformCard
            name="LinkedIn"
            description="Post updates and fetch profile"
            icon={<span style={{ color: '#fff', fontSize: 15, fontWeight: 900 }}>in</span>}
            iconBg="#0a66c2"
            accent="#0a66c2"
            accentRgb="10,102,194"
            connected={linkedinConnected}
            connectedLabel={linkedinStats ? `${linkedinStats.name} · ${linkedinStats.email}` : 'Connected'}
            onConnect={handleConnectLinkedIn}
            onDisconnect={() => handleDisconnect('linkedin')}
          >
            {linkedinConnected && linkedinStats && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                {linkedinStats.picture && <img src={linkedinStats.picture} alt="Profile" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />}
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#f0f0f5' }}>{linkedinStats.name}</p>
                  <p style={{ fontSize: 11, color: '#4b5563' }}>{linkedinStats.email}</p>
                </div>
              </div>
            )}
          </PlatformCard>

          {/* Info box */}
          <div style={{ padding: '14px 18px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 14 }}>
            <p style={{ fontSize: 12, color: '#818cf8', lineHeight: 1.7 }}>
              <span style={{ fontWeight: 700, color: '#a5b4fc' }}>💡 How it works:</span> Connect YouTube once here — then use the Upload YT button on the Auto Clipping page to send clips directly to YouTube Shorts.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          ACCOUNT TAB
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 18 }}>Account Info</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Plan',         value: <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', borderRadius: 100 }}>Solo $19</span> },
                { label: 'Member since', value: <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>March 2025</span> },
              ].map((row, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{row.label}</span>
                  {row.value}
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 24, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 18 }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: '#f87171', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ico d={IC.warn} s={15} c="#f87171" /> Danger Zone
            </p>
            <p style={{ fontSize: 12, color: '#374151', marginBottom: 16 }}>These actions cannot be undone.</p>
            <button className="st-btn"
              onClick={async () => { if (window.confirm('Are you sure you want to sign out?')) { await supabase.auth.signOut(); window.location.href = '/' } }}
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
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: `rgba(${accentRgb},0.15)`, border: `1px solid rgba(${accentRgb},0.35)`, color: accent, borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
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

