import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const SOCIAL_PLATFORMS = [
  { id: 'youtube',   label: 'YouTube',    icon: '▶',  color: '#ff4444' },
  { id: 'instagram', label: 'Instagram',  icon: '📸', color: '#e1306c' },
  { id: 'twitter',   label: 'Twitter / X',icon: '𝕏',  color: '#1d9bf0' },
  { id: 'tiktok',    label: 'TikTok',     icon: '🎵', color: '#69c9d0' },
  { id: 'linkedin',  label: 'LinkedIn',   icon: '💼', color: '#0077b5' },
]

const FRAME_STYLES = {
  circle:  { borderRadius: '50%' },
  rounded: { borderRadius: '24px' },
  square:  { borderRadius: '0px' },
  hexagon: { borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' },
}

export default function PublicProfile() {
  const { username } = useParams()
  const [kit, setKit]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadKit()
  }, [username])

  async function loadKit() {
    try {
      const { data, error } = await supabase
        .from('media_kits')
        .select('kit_data, is_public')
        .eq('username', username)
        .single()

      if (error || !data) {
        // Show demo kit for local testing
        setKit(getDemoKit(username))
        return
      }

      if (!data.is_public) {
        setNotFound(true)
        return
      }

      setKit(data.kit_data)
    } catch {
      setKit(getDemoKit(username))
    } finally {
      setLoading(false)
    }
  }

  function getDemoKit(username) {
    return {
      name: username || 'Creator',
      username: username,
      bio: 'Content creator sharing tips on YouTube, Tech & Creator economy. Helping creators grow their audience and income.',
      niche: 'Tech',
      location: 'Karachi, Pakistan',
      email: 'creator@email.com',
      avatarUrl: '',
      avatarFrame: 'circle',
      coverColor: '#6366f1',
      socials: { youtube: '', instagram: '', twitter: '', tiktok: '', linkedin: '' },
      stats: {
        youtube:   { followers: '45,200', avgViews: '18,400', engRate: '8.2%' },
        instagram: { followers: '28,100', avgViews: '9,200',  engRate: '6.7%' },
        twitter:   { followers: '12,400', avgViews: '4,100',  engRate: '4.1%' },
        tiktok:    { followers: '8,900',  avgViews: '44,100', engRate: '12.4%' },
        linkedin:  { followers: '3,200',  avgViews: '1,800',  engRate: '5.9%' },
      },
      rates: {
        sponsored: '$800',
        integration: '$400',
        story: '$150',
        reel: '$600',
      },
      isPublic: true,
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#374151', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>Loading media kit...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#f0f0f5' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, marginBottom: 12 }}>Media Kit Not Public</h2>
          <p style={{ color: '#6b7280', fontSize: 15 }}>This creator hasn't made their media kit public yet.</p>
        </div>
      </div>
    )
  }

  if (!kit) return null

  const frameStyle = FRAME_STYLES[kit.avatarFrame] || FRAME_STYLES.circle
  const connectedSocials = SOCIAL_PLATFORMS.filter(p => kit.socials?.[p.id])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Card */}
        <div style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

          {/* Cover */}
          <div style={{ height: 140, background: `linear-gradient(135deg,${kit.coverColor},${kit.coverColor}99)`, position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: -44, left: 36 }}>
              {kit.avatarUrl ? (
                <img src={kit.avatarUrl} alt="avatar"
                  style={{ width: 88, height: 88, objectFit: 'cover', ...frameStyle, border: '3px solid #111318' }} />
              ) : (
                <div style={{ width: 88, height: 88, background: `${kit.coverColor}55`, border: '3px solid #111318', ...frameStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontFamily: 'Syne, sans-serif', fontWeight: 900, color: '#fff' }}>
                  {(kit.name || 'C').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div style={{ position: 'absolute', top: 16, right: 20 }}>
              <span style={{ padding: '5px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, fontSize: 12, color: '#fff', fontWeight: 700 }}>
                {kit.niche} Creator
              </span>
            </div>
          </div>

          <div style={{ padding: '56px 36px 36px' }}>

            {/* Name + socials */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 28, marginBottom: 4 }}>{kit.name}</h1>
                <p style={{ fontSize: 13, color: '#6b7280' }}>📍 {kit.location} · ✉ {kit.email}</p>
              </div>
              {connectedSocials.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {connectedSocials.map(p => (
                    <a key={p.id} href={kit.socials[p.id]} target="_blank" rel="noopener noreferrer"
                      style={{ width: 36, height: 36, borderRadius: 9, background: p.color + '22', border: `1px solid ${p.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, textDecoration: 'none', transition: 'transform .15s' }}>
                      {p.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.75, marginBottom: 28 }}>{kit.bio}</p>

            {/* Stats */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Platform Statistics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
                {SOCIAL_PLATFORMS.map(p => (
                  <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 13 }}>{p.icon}</span>
                      <span style={{ fontSize: 11, color: p.color, fontWeight: 700 }}>{p.label}</span>
                    </div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 20, color: '#f0f0f5', marginBottom: 2 }}>
                      {kit.stats?.[p.id]?.followers || '—'}
                    </div>
                    <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 4 }}>followers</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>
                        {kit.stats?.[p.id]?.engRate || '—'} eng.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rates */}
            {kit.rates && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>💰 Sponsorship Rates</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                  {[
                    { key: 'sponsored',   label: 'Dedicated Video' },
                    { key: 'integration', label: 'Brand Integration' },
                    { key: 'story',       label: 'Story / Short' },
                    { key: 'reel',        label: 'Reel / TikTok' },
                  ].map(r => (
                    <div key={r.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>{r.label}</span>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#6ee7b7' }}>{kit.rates[r.key] || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ padding: '20px 24px', background: `${kit.coverColor}15`, border: `1px solid ${kit.coverColor}33`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Interested in a collaboration?</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{kit.email}</div>
              </div>
              <a href={`mailto:${kit.email}`}
                style={{ padding: '10px 22px', background: `linear-gradient(135deg,${kit.coverColor},${kit.coverColor}cc)`, color: '#fff', borderRadius: 12, textDecoration: 'none', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>
                Contact Me →
              </a>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#374151' }}>
          Powered by <span style={{ color: '#6366f1', fontWeight: 700 }}>Nexora OS</span>
        </div>
      </div>
    </div>
  )
}

