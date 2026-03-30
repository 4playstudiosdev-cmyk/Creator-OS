import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// ROI Tracking page — when brands share this link, clicks are tracked here
// Shows a professional landing page instead of redirecting externally

const DEMO_LINKS = {
  'samsung-mar': { brand: 'Samsung', creator: 'Your Channel', deal: '$150', topic: 'Mobile Tech Review', description: 'Exclusive offer from our sponsored content collaboration.' },
  'nike-feb':    { brand: 'Nike',    creator: 'Your Channel', deal: '$300', topic: 'Fitness & Sports',  description: 'Special partnership content with Nike.' },
  'notion-mar':  { brand: 'Notion',  creator: 'Your Channel', deal: '$200', topic: 'Productivity Tools', description: 'Notion productivity tools review and partnership.' },
  'safeer-2':    { brand: 'Safeer',  creator: 'Your Channel', deal: '$500', topic: 'Creator Tools',     description: 'Creator tools and resources collaboration.' },
}

export default function ROIRedirect() {
  const { slug } = useParams()
  const [clicked, setClicked]   = useState(false)
  const [linkData, setLinkData] = useState(null)

  useEffect(() => {
    // Log the click (in production this would save to Supabase)
    console.log(`ROI Click tracked: /r/${slug} at ${new Date().toISOString()}`)
    const data = DEMO_LINKS[slug] || { brand: slug, creator: 'Creator', deal: '—', topic: 'Content', description: 'Sponsored content collaboration.' }
    setLinkData(data)
    setClicked(true)
  }, [slug])

  if (!linkData) return null

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');`}</style>

      {/* Tracked badge */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 100, fontSize: 12, color: '#6ee7b7', fontWeight: 700 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
        Click tracked · Sponsored content
      </div>

      <div style={{ maxWidth: 600, width: '100%', textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
          Partnership by <span style={{ color: '#a5b4fc', fontWeight: 700 }}>Nexora OS</span> · /r/{slug}
        </div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 42, lineHeight: 1.1, marginBottom: 16 }}>
          {linkData.brand} × {linkData.creator}
        </h1>
        <p style={{ fontSize: 16, color: '#9ca3af', lineHeight: 1.7 }}>
          {linkData.description}
        </p>
      </div>

      {/* Content card */}
      <div style={{ maxWidth: 600, width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', marginBottom: 24 }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))', padding: '28px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              🤝
            </div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20 }}>{linkData.brand} Partnership</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Topic: {linkData.topic}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Deal Value', value: linkData.deal, color: '#6ee7b7' },
              { label: 'Link Slug', value: `r/${slug}`, color: '#a5b4fc' },
              { label: 'Status', value: 'Active', color: '#fbbf24' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '14px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* About */}
          <div style={{ padding: '18px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>About This Partnership</div>
            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, margin: 0 }}>
              This link was shared as part of a sponsored content collaboration between {linkData.creator} and {linkData.brand}.
              The click has been tracked and logged to the creator's ROI analytics dashboard on Nexora OS.
            </p>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
              🚀 Explore Nexora OS
            </a>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#374151', textAlign: 'center' }}>
        ROI tracking powered by <span style={{ color: '#6366f1', fontWeight: 700 }}>Nexora OS</span> · Click logged at {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}

