// VideoEditorPage.jsx - Has "Coming Soon" banner as requested

export default function VideoEditorPage() {
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, marginBottom: 4 }}>🎬 Video Editor</h1>
        <p style={{ color: '#6b7280', fontSize: 13 }}>Edit, trim, caption and export your videos</p>
      </div>

      {/* COMING SOON BANNER */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 20,
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}>
        <div style={{ fontSize: 40, flexShrink: 0 }}>🚀</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 18, marginBottom: 6, color: '#a5b4fc' }}>
            Video Editor — Coming in Next Update
          </div>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
            We're building a powerful in-browser video editor with timeline editing, captions, transitions, and export to MP4. This feature will be available in the next major update.
          </p>
        </div>
        <div style={{ padding: '8px 18px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#a5b4fc', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Coming Soon
        </div>
      </div>

      {/* Preview of what's coming */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '✂️', title: 'Timeline Editing', desc: 'Cut, trim, and arrange video clips on a multi-track timeline editor.' },
          { icon: '💬', title: 'Auto Captions', desc: 'AI-powered transcription generates accurate captions in seconds.' },
          { icon: '🎨', title: 'Text & Graphics', desc: 'Add animated text, lower thirds, and graphics overlays to your videos.' },
          { icon: '🎵', title: 'Background Music', desc: 'Add royalty-free music from our library to your videos.' },
          { icon: '📱', title: '9:16 Conversion', desc: 'Automatically reformat horizontal videos to vertical for Shorts and Reels.' },
          { icon: '⬇️', title: 'Export MP4', desc: 'Export in HD quality optimized for YouTube, Instagram, and TikTok.' },
        ].map((f, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 18px', opacity: 0.7 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{f.title}</div>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Notify me */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px 28px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Want to be notified when it launches?</div>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 0 }}>
          You'll automatically get access as soon as Video Editor goes live. Stay tuned! 🎬
        </p>
      </div>
    </div>
  )
}