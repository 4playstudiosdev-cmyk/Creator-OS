// AutoClippingPage.jsx - Has "Coming Soon" banner as requested

export default function AutoClippingPage() {
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, marginBottom: 4 }}>✂️ Auto Clipping</h1>
        <p style={{ color: '#6b7280', fontSize: 13 }}>AI finds the best viral moments from your long-form videos</p>
      </div>

      {/* COMING SOON BANNER */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(139,92,246,0.12),rgba(99,102,241,0.08))',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: 20,
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}>
        <div style={{ fontSize: 40, flexShrink: 0 }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 18, marginBottom: 6, color: '#c4b5fd' }}>
            Auto Clipping — Coming in Next Update
          </div>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
            Upload any long-form video and our Whisper AI will automatically find the most viral moments, cut them into clips, add captions, and let you publish directly to YouTube Shorts, TikTok, and Instagram Reels.
          </p>
        </div>
        <div style={{ padding: '8px 18px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#c4b5fd', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Coming Soon
        </div>
      </div>

      {/* How it will work */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28, marginBottom: 20 }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, marginBottom: 20 }}>How It Will Work</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { step: '1', icon: '⬆️', title: 'Upload Your Video', desc: 'Upload any long-form video (up to 3 hours) — YouTube videos, podcasts, interviews, or any MP4.' },
            { step: '2', icon: '🎤', title: 'AI Transcription', desc: 'Whisper AI transcribes every word with timestamps. Supports English, Urdu, Arabic, and Hindi.' },
            { step: '3', icon: '🔥', title: 'Viral Moment Detection', desc: 'Our AI scores every moment by emotional impact, pacing, and engagement potential. Only the best clips surface.' },
            { step: '4', icon: '✂️', title: 'Auto-Cut & Caption', desc: 'Clips are automatically cut with your branding, animated captions, and 9:16 format for mobile.' },
            { step: '5', icon: '🚀', title: 'Publish Everywhere', desc: 'One click to publish directly to YouTube Shorts, TikTok, Instagram Reels, and Twitter.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: 0.8 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Syne', fontWeight: 900, fontSize: 15, color: '#c4b5fd' }}>
                {item.step}
              </div>
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, marginBottom: 5 }}>
                  {item.icon} {item.title}
                </div>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '📊', title: 'Viral Score', desc: 'Each clip gets a 0-100 viral potential score based on engagement signals.' },
          { icon: '🌍', title: 'Multi-language', desc: 'Works with English, Urdu, Arabic, Hindi, and 50+ other languages.' },
          { icon: '📱', title: '9:16 Auto-format', desc: 'Automatically converts horizontal videos to vertical for short-form platforms.' },
          { icon: '🎨', title: 'Auto Captions', desc: 'Animated captions in your brand colors with one click.' },
          { icon: '📤', title: 'Direct Publish', desc: 'Push clips directly to YouTube Shorts, TikTok, Instagram Reels.' },
          { icon: '⚡', title: 'Fast Processing', desc: 'Most videos processed in under 5 minutes regardless of length.' },
        ].map((f, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 16px', opacity: 0.7 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{f.title}</div>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '20px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Auto Clipping is in development ✂️</div>
        <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
          You'll be notified as soon as this feature launches. It's going to save you hours every week!
        </p>
      </div>
    </div>
  )
}
