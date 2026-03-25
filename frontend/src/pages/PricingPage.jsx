import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const TIERS = [
  {
    id: 'solo',
    name: 'Solo Creator',
    price: 19,
    accent: '#9ca3af',
    accentRgb: '156,163,175',
    badge: null,
    description: 'For new creators just getting started',
    features: [
      { text: 'Repurpose Router — 10x per month', included: true },
      { text: 'Content Scheduler — 30 posts/mo', included: true },
      { text: '1 Media Kit page', included: true },
      { text: 'Basic Analytics', included: true },
      { text: 'Brand Deals CRM — 5 deals', included: true },
      { text: 'Invoice Generator', included: true },
      { text: 'Unified Inbox', included: false },
      { text: 'YouTube URL Repurpose', included: false },
      { text: 'ROI Tracking Links', included: false },
      { text: 'AI Growth Insights', included: false },
      { text: 'Agency Dashboard', included: false },
      { text: 'Priority Support', included: false },
    ],
    cta: 'Start Solo',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 49,
    accent: '#6366f1',
    accentRgb: '99,102,241',
    badge: '🔥 Most Popular',
    description: 'For serious creators ready to scale',
    features: [
      { text: 'Repurpose Router — Unlimited', included: true },
      { text: 'Content Scheduler — Unlimited', included: true },
      { text: '3 Media Kit pages', included: true },
      { text: 'Advanced Analytics + Best Time AI', included: true },
      { text: 'Brand Deals CRM — Unlimited', included: true },
      { text: 'Invoice Generator + Auto Reminders', included: true },
      { text: 'Unified Inbox — All Platforms', included: true },
      { text: 'YouTube URL Repurpose', included: true },
      { text: 'ROI Tracking Links — 10', included: true },
      { text: 'AI Growth Insights', included: true },
      { text: 'Agency Dashboard', included: false },
      { text: 'Priority Support', included: false },
    ],
    cta: 'Start Growth',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    accent: '#8b5cf6',
    accentRgb: '139,92,246',
    badge: '👑 Best Value',
    description: 'For pro creators and agencies',
    features: [
      { text: 'Repurpose Router — Unlimited', included: true },
      { text: 'Content Scheduler — Unlimited', included: true },
      { text: 'Unlimited Media Kit pages', included: true },
      { text: 'Full Analytics Suite + Custom Reports', included: true },
      { text: 'Brand Deals CRM — Unlimited', included: true },
      { text: 'Invoice Generator + Auto Reminders', included: true },
      { text: 'Unified Inbox — All Platforms', included: true },
      { text: 'YouTube URL Repurpose', included: true },
      { text: 'ROI Tracking Links — Unlimited', included: true },
      { text: 'AI Growth Insights — Daily', included: true },
      { text: 'Agency Dashboard — 5 Creators', included: true },
      { text: 'Priority Support — 24h response', included: true },
    ],
    cta: 'Start Pro',
  },
]

const FAQS = [
  {
    q: 'Can I change my plan anytime?',
    a: 'Yes! You can upgrade or downgrade at any time. Changes take effect immediately.',
  },
  {
    q: 'Is there a free trial?',
    a: '7-day free trial — no credit card required. Decide later.',
  },
  {
    q: 'Which payment methods are accepted?',
    a: 'Visa, Mastercard, and local payment methods are supported.',
  },
  {
    q: 'Is it hard to cancel?',
    a: 'Not at all — cancel in one click. No hidden fees.',
  },
]

export default function PricingPage() {
  const [billing,     setBilling]     = useState('monthly')
  const [currentPlan, setCurrentPlan] = useState('growth')
  const [openFaq,     setOpenFaq]     = useState(null)
  const navigate = useNavigate()

  const getPrice = (price) => billing === 'yearly' ? Math.floor(price * 0.8) : price

  const handleSelectPlan = (tierId) => {
    if (tierId === currentPlan) return
    alert(`Plan change: ${tierId} — Stripe integration coming soon! 🚀`)
    setCurrentPlan(tierId)
  }

  const CARD = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20 }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', paddingBottom: 48 }}>
      <style>{`
        .pr-btn { cursor:pointer; border:none; transition:all .15s; font-family:'Syne',sans-serif; font-weight:700; }
        .pr-btn:hover { filter:brightness(1.12); transform:translateY(-1px); }
        .pr-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; filter:none; }
        .faq-btn:hover { background:rgba(255,255,255,0.04) !important; }
        .tier-card { transition:all .2s; }
        .tier-card:hover { transform:translateY(-3px); }
        .feat-row:hover { background:rgba(255,255,255,0.02); }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 100, color: '#a5b4fc', fontSize: 11, fontWeight: 700, marginBottom: 16 }}>
          💳 PLANS & PRICING
        </div>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 32, color: '#f0f0f5', marginBottom: 8 }}>
          Choose your plan
        </h1>
        <p style={{ color: '#4b5563', fontSize: 14 }}>Pick the plan that fits your growth stage</p>

        {/* Billing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: billing === 'monthly' ? '#f0f0f5' : '#4b5563' }}>Monthly</span>
          <button className="pr-btn"
            onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
            style={{ width: 44, height: 24, borderRadius: 100, background: billing === 'yearly' ? '#6366f1' : 'rgba(255,255,255,0.1)', position: 'relative', padding: 0 }}>
            <div style={{ width: 16, height: 16, background: '#fff', borderRadius: '50%', position: 'absolute', top: 4, left: billing === 'yearly' ? 24 : 4, transition: 'left .25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: billing === 'yearly' ? '#f0f0f5' : '#4b5563', display: 'flex', alignItems: 'center', gap: 7 }}>
            Yearly
            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', borderRadius: 100 }}>Save 20%</span>
          </span>
        </div>
      </div>

      {/* ── PRICING CARDS ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginBottom: 24 }}>
        {TIERS.map(tier => {
          const isActive  = currentPlan === tier.id
          const isGrowth  = tier.id === 'growth'
          const discounted = getPrice(tier.price)

          return (
            <div key={tier.id} className="tier-card" style={{
              position: 'relative',
              background: isGrowth
                ? 'linear-gradient(160deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))'
                : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isGrowth ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 22,
              padding: 28,
              boxShadow: isGrowth ? '0 8px 32px rgba(99,102,241,0.12)' : 'none',
            }}>

              {/* Badge */}
              {tier.badge && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 14px', background: `rgba(${tier.accentRgb},0.9)`, color: '#fff', borderRadius: 100, fontFamily: 'Syne', boxShadow: `0 4px 12px rgba(${tier.accentRgb},0.35)` }}>
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Current badge */}
              {isActive && (
                <div style={{ position: 'absolute', top: 18, right: 18 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', borderRadius: 100 }}>✓ Current</span>
                </div>
              )}

              {/* Plan name */}
              <p style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 18, color: '#f0f0f5', marginBottom: 4 }}>{tier.name}</p>
              <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 20 }}>{tier.description}</p>

              {/* Price */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 44, color: '#f0f0f5', lineHeight: 1 }}>${discounted}</span>
                  <span style={{ color: '#374151', fontSize: 13, marginBottom: 6 }}>/mo</span>
                </div>
                {billing === 'yearly' && (
                  <p style={{ fontSize: 11, color: '#6ee7b7', marginTop: 4 }}>
                    Billed ${discounted * 12}/yr — Save ${(tier.price - discounted) * 12}
                  </p>
                )}
              </div>

              {/* CTA */}
              <button className="pr-btn" onClick={() => handleSelectPlan(tier.id)} disabled={isActive}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 14, fontSize: 14, marginBottom: 24,
                  background: isActive
                    ? 'rgba(16,185,129,0.12)'
                    : tier.id === 'growth'
                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                    : tier.id === 'pro'
                    ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)'
                    : 'rgba(255,255,255,0.08)',
                  border: isActive ? '1px solid rgba(16,185,129,0.3)' : 'none',
                  color: isActive ? '#6ee7b7' : '#fff',
                  boxShadow: !isActive && isGrowth ? '0 4px 18px rgba(99,102,241,0.35)' : 'none',
                }}>
                {isActive ? '✓ Current Plan' : tier.cta}
              </button>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {tier.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: f.included ? `rgba(${tier.accentRgb},0.15)` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${f.included ? `rgba(${tier.accentRgb},0.4)` : 'rgba(255,255,255,0.06)'}`,
                    }}>
                      {f.included
                        ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={tier.accent} strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                        : <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>}
                    </div>
                    <span style={{ fontSize: 12, color: f.included ? '#9ca3af' : '#1f2937', lineHeight: 1.5 }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── INCLUDED IN ALL PLANS BANNER ────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '28px 32px', marginBottom: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, marginBottom: 20 }}>Included in every plan 🎁</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { emoji: '🔒', text: 'Secure & Private' },
            { emoji: '📱', text: 'Mobile Friendly' },
            { emoji: '🔄', text: 'Regular Updates' },
            { emoji: '💬', text: 'Community Access' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 10px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{item.emoji}</div>
              <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── USAGE LIMITS TABLE ──────────────────────────────────────────── */}
      <div style={{ ...CARD, padding: 28, marginBottom: 24 }}>
        <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, marginBottom: 22 }}>Detailed Usage Limits</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { label: 'Feature',     color: '#6b7280', align: 'left'   },
                  { label: 'Solo $19',    color: '#6b7280', align: 'center' },
                  { label: 'Growth $49',  color: '#a5b4fc', align: 'center' },
                  { label: 'Pro $99',     color: '#c4b5fd', align: 'center' },
                ].map((h, i) => (
                  <th key={i} style={{ textAlign: h.align, fontSize: 11, fontWeight: 700, color: h.color, textTransform: 'uppercase', letterSpacing: 0.6, paddingBottom: 14 }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'AI Repurpose',       solo: '10/mo',   growth: 'Unlimited', pro: 'Unlimited'  },
                { feature: 'Scheduled Posts',    solo: '30/mo',   growth: 'Unlimited', pro: 'Unlimited'  },
                { feature: 'Media Kit Pages',    solo: '1',       growth: '3',         pro: 'Unlimited'  },
                { feature: 'Brand Deals',        solo: '5',       growth: 'Unlimited', pro: 'Unlimited'  },
                { feature: 'ROI Tracking Links', solo: '—',       growth: '10',        pro: 'Unlimited'  },
                { feature: 'Unified Inbox',      solo: '—',       growth: '✓',         pro: '✓'          },
                { feature: 'YouTube Repurpose',  solo: '—',       growth: '✓',         pro: '✓'          },
                { feature: 'AI Growth Insights', solo: '—',       growth: 'Weekly',    pro: 'Daily'      },
                { feature: 'Agency Creators',    solo: '—',       growth: '—',         pro: '5'          },
                { feature: 'Support',            solo: 'Email',   growth: 'Chat',      pro: 'Priority 24h'},
              ].map((row, i) => (
                <tr key={i} className="feat-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background .15s' }}>
                  <td style={{ padding: '12px 0', fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{row.feature}</td>
                  <td style={{ padding: '12px 0', fontSize: 13, textAlign: 'center', color: '#374151' }}>{row.solo}</td>
                  <td style={{ padding: '12px 0', fontSize: 13, textAlign: 'center', color: '#a5b4fc', fontWeight: 600 }}>{row.growth}</td>
                  <td style={{ padding: '12px 0', fontSize: 13, textAlign: 'center', color: '#c4b5fd', fontWeight: 600 }}>{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <div style={{ ...CARD, padding: 28 }}>
        <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, marginBottom: 18 }}>Frequently Asked Questions ❓</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ border: `1px solid ${openFaq === i ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color .2s' }}>
              <button className="pr-btn faq-btn"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'transparent', textAlign: 'left', borderRadius: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: openFaq === i ? '#a5b4fc' : '#f0f0f5' }}>{faq.q}</span>
                <span style={{ color: openFaq === i ? '#6366f1' : '#374151', fontSize: 11, flexShrink: 0, marginLeft: 12, transition: 'transform .2s', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▼</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 18px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginTop: 12 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}