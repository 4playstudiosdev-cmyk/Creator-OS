import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

// ─── Icons ────────────────────────────────────────────────────────────────────
const IC = {
  kit:      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  user:     "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  globe:    "M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20",
  link:     "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  check:    "M20 6L9 17l-5-5",
  camera:   "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z",
  copy:     "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  save:     "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
  toggle:   "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",
  yt:       "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58a2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  twitter:  "M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 8v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
  insta:    "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z",
  tiktok:   "M9 12a4 4 0 104 4V4a5 5 0 005 5",
  info:     "M12 22a10 10 0 100-20 10 10 0 000 20zM12 8h.01M11 12h1v4h1",
  upload:   "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  trash:    "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
}

const Ico = ({ d, s = 15, c = 'currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const CARD = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18 }
const INP  = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 13px', color: '#f0f0f5', fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }

const SOCIAL_PLATFORMS = [
  { key: 'youtube',   label: 'YouTube',   icon: IC.yt,      color: '#ef4444', ph: 'https://youtube.com/@handle'   },
  { key: 'instagram', label: 'Instagram', icon: IC.insta,   color: '#e1306c', ph: 'https://instagram.com/handle'  },
  { key: 'twitter',   label: 'Twitter / X', icon: IC.twitter, color: '#1d9bf0', ph: 'https://twitter.com/handle'  },
  { key: 'tiktok',    label: 'TikTok',    icon: IC.tiktok,  color: '#69c9d0', ph: 'https://tiktok.com/@handle'    },
  { key: 'website',   label: 'Website',   icon: IC.globe,   color: '#6366f1', ph: 'https://yourwebsite.com'       },
]

export default function MediaKitPage() {
  const fileRef = useRef(null)

  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [copied,    setCopied]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [session,   setSession]   = useState(null)
  const [activeTab, setActiveTab] = useState('profile')

  const [form, setForm] = useState({
    username:     '',
    full_name:    '',
    bio:          '',
    avatar_url:   '',
    niche:        '',
    location:     '',
    collab_rate:  '',
    social_links: { youtube: '', instagram: '', twitter: '', tiktok: '', website: '' },
    is_public:    false,
  })

  const publicUrl = form.username ? `creatoros.com/u/${form.username}` : 'creatoros.com/u/your-username'

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) fetchProfile(data.session.user.id)
      else setLoading(false)
    })
  }, [])

  const fetchProfile = async (uid) => {
    setLoading(true)
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
      if (data) {
        setForm({
          username:     data.username     || '',
          full_name:    data.full_name    || '',
          bio:          data.bio          || '',
          avatar_url:   data.avatar_url   || '',
          niche:        data.niche        || '',
          location:     data.location     || '',
          collab_rate:  data.collab_rate  || '',
          social_links: data.social_links || { youtube: '', instagram: '', twitter: '', tiktok: '', website: '' },
          is_public:    data.is_public    || false,
        })
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!session) return
    setSaving(true); setSaved(false)
    try {
      const { error } = await supabase.from('profiles').upsert({
        id:           session.user.id,
        username:     form.username.trim().toLowerCase().replace(/\s+/g, '_'),
        full_name:    form.full_name,
        bio:          form.bio,
        avatar_url:   form.avatar_url,
        niche:        form.niche,
        location:     form.location,
        collab_rate:  form.collab_rate,
        social_links: form.social_links,
        is_public:    form.is_public,
        updated_at:   new Date().toISOString(),
      })
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { alert('Save failed: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleAvatarUpload = async (file) => {
    if (!file || !session) return
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `avatars/${session.user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setForm(p => ({ ...p, avatar_url: publicUrl }))
    } catch (e) { alert('Upload failed: ' + e.message) }
    finally { setUploading(false) }
  }

  const copyPublicUrl = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const setField    = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setSocial   = (k, v) => setForm(p => ({ ...p, social_links: { ...p.social_links, [k]: v } }))

  const TABS = [
    { id: 'profile',  label: 'Profile' },
    { id: 'socials',  label: 'Social Links' },
    { id: 'preview',  label: 'Preview' },
  ]

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 360, background: '#0a0a0f' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>Loading media kit…</p>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', paddingBottom: 48 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .mk-btn { cursor:pointer; border:none; transition:all .15s; font-family:'DM Sans',sans-serif; }
        .mk-btn:hover { filter:brightness(1.15); }
        .mk-btn:disabled { opacity:.4; cursor:not-allowed; filter:none; }
        .mk-inp:focus { border-color:rgba(99,102,241,0.5)!important; }
        .mk-inp::placeholder { color:#374151; }
        .mk-toggle { width:40px; height:22px; border-radius:99px; border:none; cursor:pointer; transition:all .25s; position:relative; flex-shrink:0; }
        .mk-toggle::after { content:''; position:absolute; top:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:left .25s; }
      `}</style>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
            <Ico d={IC.kit} s={20} c="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, color: '#f0f0f5', lineHeight: 1 }}>Media Kit</h1>
            <p style={{ color: '#4b5563', fontSize: 13, marginTop: 3 }}>Your public creator profile for brand partnerships</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Public URL pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
            <Ico d={IC.globe} s={12} c="#4b5563" />
            <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>{publicUrl}</span>
            <button className="mk-btn" onClick={copyPublicUrl}
              style={{ padding: '2px 8px', background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, color: copied ? '#6ee7b7' : '#9ca3af', fontSize: 11 }}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Save button */}
          <button className="mk-btn" onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: saved ? '1px solid rgba(16,185,129,0.3)' : 'none', color: saved ? '#6ee7b7' : '#fff', borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: 'Syne', boxShadow: saved ? 'none' : '0 4px 14px rgba(99,102,241,0.35)' }}>
            {saving
              ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Saving…</>
              : saved
              ? <><Ico d={IC.check} s={14} c="#6ee7b7" />Saved!</>
              : <><Ico d={IC.save} s={14} c="#fff" />Save Profile</>}
          </button>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} className="mk-btn" onClick={() => setActiveTab(t.id)}
            style={{ padding: '7px 20px', borderRadius: 9, fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400, background: activeTab === t.id ? 'rgba(99,102,241,0.2)' : 'transparent', color: activeTab === t.id ? '#a5b4fc' : '#6b7280', border: `1px solid ${activeTab === t.id ? 'rgba(99,102,241,0.35)' : 'transparent'}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          PROFILE TAB
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

          {/* LEFT — Avatar + visibility */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Avatar */}
            <div style={{ ...CARD, padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.3)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {form.avatar_url
                    ? <img src={form.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Ico d={IC.user} s={36} c="#4b5563" />}
                </div>
                <button className="mk-btn" onClick={() => fileRef.current?.click()}
                  style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, background: '#6366f1', border: '2px solid #0a0a0f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>
                  {uploading
                    ? <div style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                    : <Ico d={IC.camera} s={13} c="#fff" />}
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={e => handleAvatarUpload(e.target.files[0])} style={{ display: 'none' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: '#f0f0f5' }}>{form.full_name || 'Your Name'}</p>
                {form.username && <p style={{ fontSize: 12, color: '#6366f1', marginTop: 2 }}>@{form.username}</p>}
              </div>
              <button className="mk-btn" onClick={() => fileRef.current?.click()}
                style={{ width: '100%', padding: '8px 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9ca3af', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ico d={IC.upload} s={12} c="#6b7280" /> Upload Photo
              </button>
              {form.avatar_url && (
                <button className="mk-btn" onClick={() => setField('avatar_url', '')}
                  style={{ width: '100%', padding: '7px 0', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Ico d={IC.trash} s={12} c="#f87171" /> Remove Photo
                </button>
              )}
            </div>

            {/* Visibility toggle */}
            <div style={{ ...CARD, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#f0f0f5', marginBottom: 3 }}>Public Profile</p>
                  <p style={{ fontSize: 11, color: '#4b5563' }}>Visible to brands & sponsors</p>
                </div>
                <button className="mk-toggle"
                  style={{ background: form.is_public ? '#6366f1' : 'rgba(255,255,255,0.08)' }}
                  onClick={() => setField('is_public', !form.is_public)}>
                  <div style={{ position: 'absolute', top: 3, left: form.is_public ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .25s' }} />
                </button>
              </div>
              <div style={{ padding: '8px 10px', background: form.is_public ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${form.is_public ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 9 }}>
                <p style={{ fontSize: 11, color: form.is_public ? '#6ee7b7' : '#374151' }}>
                  {form.is_public ? '🟢 Live at ' + publicUrl : '🔒 Only you can see this'}
                </p>
              </div>
            </div>

            {/* Public link */}
            {form.is_public && (
              <div style={{ ...CARD, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Share Your Kit</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`https://${publicUrl}`} target="_blank" rel="noreferrer"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#9ca3af', fontSize: 12, textDecoration: 'none' }}>
                    <Ico d={IC.eye} s={12} c="#6b7280" /> Preview
                  </a>
                  <button className="mk-btn" onClick={copyPublicUrl}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`, borderRadius: 9, color: copied ? '#6ee7b7' : '#a5b4fc', fontSize: 12 }}>
                    <Ico d={copied ? IC.check : IC.copy} s={12} c={copied ? '#6ee7b7' : '#a5b4fc'} />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Basic info */}
            <div style={{ ...CARD, padding: 22 }}>
              <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ico d={IC.user} s={15} c="#6366f1" /> Basic Info
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Full Name',   key: 'full_name',  ph: 'Your display name',          type: 'text' },
                  { label: 'Username',    key: 'username',   ph: 'yourhandle (no spaces)',      type: 'text' },
                  { label: 'Niche',       key: 'niche',      ph: 'Tech, Lifestyle, Gaming…',   type: 'text' },
                  { label: 'Location',    key: 'location',   ph: 'City, Country',               type: 'text' },
                  { label: 'Collab Rate', key: 'collab_rate', ph: 'e.g. $500/video',            type: 'text' },
                ].map(f => (
                  <div key={f.key} style={f.key === 'username' ? {} : {}}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input className="mk-inp" type={f.type} value={form[f.key]} placeholder={f.ph}
                      onChange={e => setField(f.key, e.target.value)} style={INP} />
                  </div>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div style={{ ...CARD, padding: 22 }}>
              <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ico d={IC.info} s={15} c="#6366f1" /> Bio
              </p>
              <p style={{ color: '#4b5563', fontSize: 12, marginBottom: 14 }}>Introduce yourself to brands — keep it sharp and focused</p>
              <textarea className="mk-inp" value={form.bio} placeholder="I create tech review videos for 18–35 year olds. Partnered with brands like Apple, Samsung, and Logitech. My audience trusts my honest opinions."
                onChange={e => setField('bio', e.target.value)} rows={5}
                style={{ ...INP, resize: 'vertical', lineHeight: 1.65 }} />
              <p style={{ textAlign: 'right', fontSize: 11, color: form.bio.length > 500 ? '#f87171' : '#374151', marginTop: 6 }}>{form.bio.length} / 500</p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SOCIALS TAB
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'socials' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {SOCIAL_PLATFORMS.map(p => (
            <div key={p.key} style={{ ...CARD, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${p.color}18`, border: `1px solid ${p.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ico d={p.icon} s={16} c={p.color} />
                </div>
                <div>
                  <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: '#f0f0f5' }}>{p.label}</p>
                  {form.social_links[p.key] && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                      <p style={{ fontSize: 10, color: '#6ee7b7' }}>Connected</p>
                    </div>
                  )}
                </div>
              </div>
              <input className="mk-inp" type="url" value={form.social_links[p.key]} placeholder={p.ph}
                onChange={e => setSocial(p.key, e.target.value)} style={INP} />
              {form.social_links[p.key] && (
                <a href={form.social_links[p.key]} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 11, color: p.color, textDecoration: 'none' }}>
                  <Ico d={IC.toggle} s={11} c={p.color} /> Open profile
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          PREVIEW TAB
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'preview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>

          {/* Preview card */}
          <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 24, padding: 32 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '2px solid rgba(99,102,241,0.4)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {form.avatar_url
                  ? <img src={form.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Ico d={IC.user} s={32} c="#4b5563" />}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 22, color: '#f0f0f5', marginBottom: 4 }}>{form.full_name || 'Your Name'}</h2>
                {form.username && <p style={{ fontSize: 13, color: '#6366f1', marginBottom: 6 }}>@{form.username}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.niche && <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 100, color: '#a5b4fc' }}>{form.niche}</span>}
                  {form.location && <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, color: '#9ca3af' }}>📍 {form.location}</span>}
                  {form.collab_rate && <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 100, color: '#6ee7b7' }}>💰 {form.collab_rate}</span>}
                </div>
              </div>
            </div>

            {/* Bio */}
            {form.bio && (
              <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7 }}>{form.bio}</p>
              </div>
            )}

            {/* Social links */}
            {SOCIAL_PLATFORMS.some(p => form.social_links[p.key]) && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>Connect</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SOCIAL_PLATFORMS.filter(p => form.social_links[p.key]).map(p => (
                    <a key={p.key} href={form.social_links[p.key]} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', background: `${p.color}12`, border: `1px solid ${p.color}35`, borderRadius: 100, color: p.color, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                      <Ico d={p.icon} s={13} c={p.color} /> {p.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!form.full_name && !form.bio && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#374151', fontSize: 13 }}>
                Fill in your profile details to see the preview
              </div>
            )}
          </div>

          {/* Right side info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ ...CARD, padding: 20 }}>
              <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Profile Completeness</p>
              {(() => {
                const checks = [
                  { label: 'Full name',    done: !!form.full_name },
                  { label: 'Username',     done: !!form.username },
                  { label: 'Bio',          done: form.bio.length > 20 },
                  { label: 'Avatar photo', done: !!form.avatar_url },
                  { label: 'Niche',        done: !!form.niche },
                  { label: 'Social link',  done: SOCIAL_PLATFORMS.some(p => form.social_links[p.key]) },
                  { label: 'Public',       done: form.is_public },
                ]
                const pct = Math.round((checks.filter(c => c.done).length / checks.length) * 100)
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10b981' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 99, transition: 'width .5s ease' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'Syne', color: pct === 100 ? '#6ee7b7' : '#a5b4fc', flexShrink: 0 }}>{pct}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {checks.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: c.done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${c.done ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {c.done && <Ico d={IC.check} s={9} c="#6ee7b7" />}
                          </div>
                          <p style={{ fontSize: 12, color: c.done ? '#9ca3af' : '#374151' }}>{c.label}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>

            <div style={{ ...CARD, padding: 18 }}>
              <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#f0f0f5' }}>Public URL</p>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontFamily: 'monospace', fontSize: 12, color: '#6366f1', marginBottom: 10, wordBreak: 'break-all' }}>
                https://{publicUrl}
              </div>
              <button className="mk-btn" onClick={copyPublicUrl}
                style={{ width: '100%', padding: '8px 0', background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.25)'}`, borderRadius: 9, color: copied ? '#6ee7b7' : '#a5b4fc', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ico d={copied ? IC.check : IC.copy} s={13} c={copied ? '#6ee7b7' : '#a5b4fc'} />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            <div style={{ padding: '14px 16px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 14 }}>
              <p style={{ fontSize: 12, color: '#818cf8', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700, color: '#a5b4fc' }}>💡 Tip:</span> Share this link with brands in your pitch emails — it shows your profile, bio, niche, and social reach all in one place.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Save bottom bar ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button className="mk-btn" onClick={handleSave} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 28px', background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: saved ? '1px solid rgba(16,185,129,0.3)' : 'none', color: saved ? '#6ee7b7' : '#fff', borderRadius: 14, fontSize: 14, fontWeight: 700, fontFamily: 'Syne', boxShadow: saved ? 'none' : '0 4px 16px rgba(99,102,241,0.35)' }}>
          {saving
            ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Saving…</>
            : saved ? <><Ico d={IC.check} s={15} c="#6ee7b7" />Saved!</>
            : <><Ico d={IC.save} s={15} c="#fff" />Save Profile</>}
        </button>
      </div>
    </div>
  )
}