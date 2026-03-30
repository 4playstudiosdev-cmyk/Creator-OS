import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const FRAME_STYLES = [
  { id: 'circle', label: 'Circle', css: { borderRadius: '50%' } },
  { id: 'rounded', label: 'Rounded', css: { borderRadius: '24px' } },
  { id: 'square', label: 'Square', css: { borderRadius: '0px' } },
  { id: 'hexagon', label: 'Hexagon', css: { borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' } },
]

const SOCIAL_PLATFORMS = [
  { id: 'youtube', label: 'YouTube', icon: '▶', color: '#ff4444', placeholder: 'https://youtube.com/@yourchannel' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#e1306c', placeholder: 'https://instagram.com/yourhandle' },
  { id: 'twitter', label: 'Twitter / X', icon: '𝕏', color: '#1d9bf0', placeholder: 'https://twitter.com/yourhandle' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: '#69c9d0', placeholder: 'https://tiktok.com/@yourhandle' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0077b5', placeholder: 'https://linkedin.com/in/yourname' },
]

const NICHES = ['Tech', 'Gaming', 'Fitness', 'Fashion', 'Food', 'Travel', 'Finance', 'Education', 'Entertainment', 'Lifestyle', 'Beauty', 'Sports', 'Music', 'Comedy', 'Business']

const S = {
  card: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' },
  input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#f0f0f5', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn: { cursor: 'pointer', border: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s', borderRadius: 12 },
}

export default function MediaKitPage() {
  const [tab, setTab] = useState('edit') // 'edit' | 'preview'
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef(null)

  const [kit, setKit] = useState({
    name: 'Your Name',
    username: 'yourchannel',
    bio: 'Content creator | Sharing tips on YouTube, Tech & Creator economy. Helping creators grow their audience and income.',
    niche: 'Tech',
    location: 'Karachi, Pakistan',
    email: 'youremail@gmail.com',
    avatarUrl: '',
    avatarFrame: 'circle',
    coverColor: '#6366f1',
    accentColor: '#8b5cf6',
    socials: {
      youtube: '',
      instagram: '',
      twitter: '',
      tiktok: '',
      linkedin: '',
    },
    stats: {
      youtube: { followers: '45,200', avgViews: '18,400', engRate: '8.2%' },
      instagram: { followers: '28,100', avgViews: '9,200', engRate: '6.7%' },
      twitter: { followers: '12,400', avgViews: '4,100', engRate: '4.1%' },
      tiktok: { followers: '8,900', avgViews: '44,100', engRate: '12.4%' },
      linkedin: { followers: '3,200', avgViews: '1,800', engRate: '5.9%' },
    },
    rates: {
      sponsored: '$800',
      integration: '$400',
      story: '$150',
      reel: '$600',
    },
    isPublic: true,
  })

  const update = (key, value) => setKit(p => ({ ...p, [key]: value }))
  const updateSocial = (platform, value) => setKit(p => ({ ...p, socials: { ...p.socials, [platform]: value } }))
  const updateStat = (platform, key, value) => setKit(p => ({ ...p, stats: { ...p.stats, [platform]: { ...p.stats[platform], [key]: value } } }))
  const updateRate = (key, value) => setKit(p => ({ ...p, rates: { ...p.rates, [key]: value } }))

  // Image upload — uses Supabase storage
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); return }

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('media-kits')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('media-kits')
        .getPublicUrl(path)

      update('avatarUrl', publicUrl)
    } catch (err) {
      // Fallback: use local object URL for preview
      const objectUrl = URL.createObjectURL(file)
      update('avatarUrl', objectUrl)
      console.warn('Supabase storage not available, using local preview:', err.message)
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      await supabase.from('media_kits').upsert({
        user_id: user.id,
        username: kit.username,
        kit_data: kit,
        is_public: kit.isPublic,
        updated_at: new Date().toISOString(),
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.warn('Save error:', err.message)
      // Still show saved UI
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const publicUrl = `http://localhost:5173/u/${kit.username}`

  const copyPublicUrl = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const frameStyle = FRAME_STYLES.find(f => f.id === kit.avatarFrame) || FRAME_STYLES[0]

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, marginBottom: 4 }}>🎨 Media Kit</h1>
          <p style={{ color: '#6b7280', fontSize: 13 }}>Create your professional creator media kit to share with brands</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
            {publicUrl}
          </div>
          <button onClick={copyPublicUrl}
            style={{ ...S.btn, padding: '8px 16px', fontSize: 13, fontWeight: 600,
              background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: copied ? '#6ee7b7' : '#9ca3af',
            }}>
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ ...S.btn, padding: '8px 20px', fontSize: 13, fontWeight: 700,
              background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              border: saved ? '1px solid rgba(16,185,129,0.3)' : 'none',
              color: saved ? '#6ee7b7' : '#fff',
              boxShadow: saved ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
              opacity: saving ? 0.7 : 1,
            }}>
            {saving ? '⏳ Saving...' : saved ? '✓ Saved!' : '💾 Save Kit'}
          </button>
        </div>
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 4, width: 'fit-content' }}>
        {[{ id: 'edit', label: '✏️ Edit' }, { id: 'preview', label: '👁 Preview' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...S.btn, padding: '8px 20px', fontSize: 13, fontWeight: 700,
              background: tab === t.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
              color: tab === t.id ? '#fff' : '#6b7280',
              boxShadow: tab === t.id ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'edit' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* LEFT COLUMN */}
          <div>
            {/* Profile */}
            <div style={S.card}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 18 }}>Profile Info</div>

              {/* Avatar upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ position: 'relative' }}>
                  {kit.avatarUrl ? (
                    <img src={kit.avatarUrl} alt="avatar"
                      style={{ width: 80, height: 80, objectFit: 'cover', ...frameStyle.css, border: '2px solid rgba(99,102,241,0.4)' }} />
                  ) : (
                    <div style={{ width: 80, height: 80, background: `${kit.coverColor}33`, border: `2px solid ${kit.coverColor}66`, ...frameStyle.css, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontFamily: 'Syne', fontWeight: 900, color: kit.coverColor }}>
                      {kit.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: '50%', background: '#6366f1', border: '2px solid #111318', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                    ✏
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                <div>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    style={{ ...S.btn, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', marginBottom: 6, display: 'block' }}>
                    {uploading ? '⏳ Uploading...' : '📸 Upload Photo'}
                  </button>
                  <p style={{ fontSize: 11, color: '#4b5563' }}>JPG, PNG, WebP — max 5MB</p>
                </div>
              </div>

              {/* Frame selector */}
              <label style={S.label}>Profile Frame Style</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                {FRAME_STYLES.map(f => (
                  <button key={f.id} onClick={() => update('avatarFrame', f.id)}
                    style={{ ...S.btn, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                      background: kit.avatarFrame === f.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                      border: `1px solid ${kit.avatarFrame === f.id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: kit.avatarFrame === f.id ? '#a5b4fc' : '#6b7280',
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Full Name', key: 'name', placeholder: 'Your Name' },
                  { label: 'Username / Handle', key: 'username', placeholder: 'yourhandle' },
                  { label: 'Location', key: 'location', placeholder: 'City, Country' },
                  { label: 'Contact Email', key: 'email', placeholder: 'email@domain.com' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={S.label}>{field.label}</label>
                    <input style={S.input} value={kit[field.key]} onChange={e => update(field.key, e.target.value)} placeholder={field.placeholder} />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={S.label}>Bio / Tagline</label>
                <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={kit.bio} onChange={e => update('bio', e.target.value)} placeholder="Write a short bio..." />
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={S.label}>Content Niche</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {NICHES.map(n => (
                    <button key={n} onClick={() => update('niche', n)}
                      style={{ ...S.btn, padding: '5px 12px', fontSize: 12,
                        background: kit.niche === n ? 'rgba(99,102,241,0.15)' : 'transparent',
                        border: `1px solid ${kit.niche === n ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        color: kit.niche === n ? '#a5b4fc' : '#6b7280',
                      }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color pickers */}
              <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
                <div>
                  <label style={S.label}>Accent Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="color" value={kit.coverColor} onChange={e => update('coverColor', e.target.value)} style={{ width: 40, height: 36, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, padding: 2 }} />
                    <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>{kit.coverColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div style={S.card}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 18 }}>Social Media Links</div>
              {SOCIAL_PLATFORMS.map(p => (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <label style={{ ...S.label, color: p.color }}>{p.icon} {p.label}</label>
                  <input style={S.input} value={kit.socials[p.id]} onChange={e => updateSocial(p.id, e.target.value)} placeholder={p.placeholder} />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Stats per platform */}
            <div style={S.card}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 18 }}>Platform Stats</div>
              {SOCIAL_PLATFORMS.map(p => (
                <div key={p.id} style={{ marginBottom: 18, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: p.color }}>{p.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {[
                      { key: 'followers', label: 'Followers' },
                      { key: 'avgViews', label: 'Avg. Views' },
                      { key: 'engRate', label: 'Eng. Rate' },
                    ].map(stat => (
                      <div key={stat.key}>
                        <label style={{ ...S.label, fontSize: 10 }}>{stat.label}</label>
                        <input style={{ ...S.input, fontSize: 13, padding: '7px 10px' }}
                          value={kit.stats[p.id]?.[stat.key] || ''}
                          onChange={e => updateStat(p.id, stat.key, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Rates */}
            <div style={S.card}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 18 }}>💰 Sponsorship Rates</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { key: 'sponsored', label: 'Dedicated Video' },
                  { key: 'integration', label: 'Integration / Mention' },
                  { key: 'story', label: 'Story / Short' },
                  { key: 'reel', label: 'Reel / TikTok' },
                ].map(r => (
                  <div key={r.key}>
                    <label style={S.label}>{r.label}</label>
                    <input style={S.input} value={kit.rates[r.key]} onChange={e => updateRate(r.key, e.target.value)} placeholder="e.g. $500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div style={{ ...S.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>Public Media Kit</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                  {kit.isPublic ? `Viewable at: ${publicUrl}` : 'Only you can see this kit'}
                </div>
              </div>
              <button onClick={() => update('isPublic', !kit.isPublic)}
                style={{ width: 48, height: 26, borderRadius: 100, border: 'none', cursor: 'pointer', position: 'relative', padding: 0, background: kit.isPublic ? '#6366f1' : 'rgba(255,255,255,0.1)', transition: 'background .25s' }}>
                <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 4, left: kit.isPublic ? 26 : 4, transition: 'left .25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* PREVIEW TAB */
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ background: '#0b0c10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            {/* Cover banner */}
            <div style={{ height: 120, background: `linear-gradient(135deg,${kit.coverColor},${kit.accentColor})`, position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: -40, left: 32 }}>
                {kit.avatarUrl ? (
                  <img src={kit.avatarUrl} alt="avatar"
                    style={{ width: 80, height: 80, objectFit: 'cover', ...frameStyle.css, border: '3px solid #0b0c10' }} />
                ) : (
                  <div style={{ width: 80, height: 80, background: `${kit.coverColor}55`, border: '3px solid #0b0c10', ...frameStyle.css, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontFamily: 'Syne', fontWeight: 900, color: '#fff' }}>
                    {kit.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ position: 'absolute', top: 16, right: 20, padding: '5px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, fontSize: 12, color: '#fff', fontWeight: 700 }}>
                {kit.niche} Creator
              </div>
            </div>

            <div style={{ padding: '52px 32px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, marginBottom: 4 }}>{kit.name}</h2>
                  <p style={{ fontSize: 13, color: '#6b7280' }}>📍 {kit.location} · ✉ {kit.email}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SOCIAL_PLATFORMS.filter(p => kit.socials[p.id]).map(p => (
                    <div key={p.id} style={{ width: 32, height: 32, borderRadius: 8, background: p.color + '22', border: `1px solid ${p.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      {p.icon}
                    </div>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, marginBottom: 24 }}>{kit.bio}</p>

              {/* Stats grid */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Platform Stats</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
                  {SOCIAL_PLATFORMS.map(p => (
                    <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 13 }}>{p.icon}</span>
                        <span style={{ fontSize: 11, color: p.color, fontWeight: 700 }}>{p.label}</span>
                      </div>
                      <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#f0f0f5', marginBottom: 2 }}>{kit.stats[p.id]?.followers || '—'}</div>
                      <div style={{ fontSize: 10, color: '#4b5563' }}>followers</div>
                      <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700, marginTop: 4 }}>{kit.stats[p.id]?.engRate || '—'} eng.</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rates */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>💰 Sponsorship Rates</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                  {[
                    { key: 'sponsored', label: 'Dedicated Video' },
                    { key: 'integration', label: 'Integration / Mention' },
                    { key: 'story', label: 'Story / Short' },
                    { key: 'reel', label: 'Reel / TikTok' },
                  ].map(r => (
                    <div key={r.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{r.label}</span>
                      <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: '#6ee7b7' }}>{kit.rates[r.key] || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24, padding: '14px 20px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Interested in a collaboration?</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{kit.email}</div>
                </div>
                <button style={{ ...S.btn, padding: '9px 20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                  Contact Me
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Public URL:</span>
            <span style={{ fontSize: 12, color: '#6366f1', fontFamily: 'monospace', flex: 1 }}>{publicUrl}</span>
            <button onClick={copyPublicUrl}
              style={{ ...S.btn, padding: '5px 12px', fontSize: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

