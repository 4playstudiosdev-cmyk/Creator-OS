import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import axios from 'axios'

const PLATFORMS = [
  {
    key: 'twitter',
    label: 'Twitter Thread',
    icon: '𝕏',
    accent: '#1d9bf0',
    bg: 'rgba(29,155,240,0.08)',
    border: 'rgba(29,155,240,0.25)',
    btnBg: 'rgba(29,155,240,0.2)',
    btnHover: 'rgba(29,155,240,0.35)',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn Post',
    icon: 'in',
    accent: '#0077b5',
    bg: 'rgba(0,119,181,0.08)',
    border: 'rgba(0,119,181,0.25)',
    btnBg: 'rgba(0,119,181,0.2)',
    btnHover: 'rgba(0,119,181,0.35)',
  },
  {
    key: 'newsletter',
    label: 'Newsletter Intro',
    icon: '✉',
    accent: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
    btnBg: 'rgba(139,92,246,0.2)',
    btnHover: 'rgba(139,92,246,0.35)',
  },
]

export default function RepurposePage() {
  const [mode, setMode]                 = useState('text')
  const [sourceText, setSourceText]     = useState('')
  const [youtubeUrl, setYoutubeUrl]     = useState('')
  const [loading, setLoading]           = useState(false)
  const [results, setResults]           = useState(null)
  const [savingPlatform, setSavingPlatform] = useState(null)
  const [savedPlatforms, setSavedPlatforms] = useState([])
  const [editedContent, setEditedContent]   = useState({})

  const handleGenerate = async () => {
    if (mode === 'text' && !sourceText.trim()) return
    if (mode === 'youtube' && !youtubeUrl.trim()) return
    setLoading(true); setResults(null); setSavedPlatforms([]); setEditedContent({})
    try {
      const payload = mode === 'youtube'
        ? { youtube_url: youtubeUrl, source_text: '' }
        : { source_text: sourceText, youtube_url: '' }
      const res = await axios.post('http://localhost:8000/api/ai/repurpose', payload)
      setResults(res.data)
      setEditedContent({ twitter: res.data.twitter, linkedin: res.data.linkedin, newsletter: res.data.newsletter })
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    } finally { setLoading(false) }
  }

  const handleSaveDraft = async (platform) => {
    setSavingPlatform(platform)
    try {
      const { data: sd } = await supabase.auth.getSession()
      if (!sd.session) throw new Error('Login karein!')
      await axios.post('http://localhost:8000/api/posts/create', {
        user_id: sd.session.user.id,
        content: editedContent[platform],
        platforms: [platform === 'newsletter' ? 'twitter' : platform],
        scheduled_for: new Date().toISOString(),
      }, { headers: { Authorization: `Bearer ${sd.session.access_token}`, 'Content-Type': 'application/json' } })
      setSavedPlatforms(p => [...p, platform])
    } catch (e) { alert('Save nahi hua: ' + e.message) }
    finally { setSavingPlatform(null) }
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer {
          0%   { background-position: -400px 0 }
          100% { background-position: 400px 0 }
        }
        .repurpose-textarea {
          width: 100%; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
          padding: 14px; color: #f0f0f5; font-family: 'DM Sans',sans-serif;
          font-size: 13px; resize: vertical; outline: none;
          transition: border-color 0.2s; color-scheme: dark;
        }
        .repurpose-textarea:focus { border-color: rgba(99,102,241,0.5); }
        .repurpose-textarea::placeholder { color: #374151; }
        .result-card { animation: fadeUp 0.4s ease both; }
        .save-btn { transition: all 0.2s; cursor: pointer; border: none; }
        .save-btn:hover { filter: brightness(1.2); transform: translateY(-1px); }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; filter: none; }
        .mode-btn { cursor: pointer; border: none; transition: all 0.2s; font-family: 'Syne', sans-serif; font-weight: 700; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
          AI Tools
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne', letterSpacing: '-0.5px', marginBottom: 6 }}>
          ✨ Repurpose Router
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Text ya YouTube URL dalo — AI 3 platforms ke liye instantly convert karega!
        </p>
      </div>

      {/* ── Input Card ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20, padding: 24, marginBottom: 20,
      }}>
        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'text',    label: '📝 Text Paste Karo',  active: 'rgba(99,102,241,0.2)', activeBorder: 'rgba(99,102,241,0.5)', activeColor: '#a5b4fc' },
            { id: 'youtube', label: '🎥 YouTube URL',       active: 'rgba(255,0,0,0.15)',   activeBorder: 'rgba(255,80,80,0.4)',  activeColor: '#f87171' },
          ].map(m => (
            <button key={m.id} className="mode-btn" onClick={() => setMode(m.id)} style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 13,
              background: mode === m.id ? m.active : 'rgba(255,255,255,0.04)',
              border: `1px solid ${mode === m.id ? m.activeBorder : 'rgba(255,255,255,0.08)'}`,
              color: mode === m.id ? m.activeColor : '#6b7280',
            }}>{m.label}</button>
          ))}
        </div>

        {/* Text Mode */}
        {mode === 'text' && (
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Original Content
            </label>
            <textarea
              className="repurpose-textarea"
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              placeholder="Yahan apna lamba article, YouTube script, ya blog post paste karein..."
              rows={8}
            />
            <p style={{ fontSize: 11, color: '#374151', marginTop: 6 }}>{sourceText.length} characters</p>
          </div>
        )}

        {/* YouTube Mode */}
        {mode === 'youtube' && (
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              YouTube Video URL
            </label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              style={{
                width: '100%', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                padding: '12px 14px', color: '#f0f0f5',
                fontFamily: 'DM Sans', fontSize: 13, outline: 'none',
                boxSizing: 'border-box', colorScheme: 'dark',
              }}
            />
            <div style={{
              marginTop: 10, padding: '10px 14px',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 10, fontSize: 12, color: '#fbbf24',
            }}>
              ⚠️ Video mein English/Urdu/Hindi captions honi chahiye. Private videos kaam nahi karein gi.
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={handleGenerate}
            disabled={loading || (mode === 'text' ? !sourceText.trim() : !youtubeUrl.trim())}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 24px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontFamily: 'Syne', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                {mode === 'youtube' ? 'Transcript fetch ho raha hai...' : 'Generating...'}
              </>
            ) : '✨ Generate Content'}
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {PLATFORMS.map((p, i) => (
            <div key={p.key} className="result-card" style={{
              background: p.bg, border: `1px solid ${p.border}`,
              borderRadius: 18, padding: 20,
              animationDelay: `${i * 0.08}s`,
            }}>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: `rgba(${p.accent.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')},0.2)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: p.accent, fontFamily: 'Syne',
                }}>{p.icon}</div>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#f0f0f5' }}>{p.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4b5563' }}>
                  {(editedContent[p.key] || '').length} chars
                </span>
              </div>

              {/* Editable Textarea */}
              <textarea
                className="repurpose-textarea"
                rows={9}
                value={editedContent[p.key] || ''}
                onChange={e => setEditedContent(prev => ({ ...prev, [p.key]: e.target.value }))}
                style={{ marginBottom: 12, fontSize: 12, lineHeight: 1.6 }}
              />

              {/* Save Button */}
              <button
                className="save-btn"
                onClick={() => handleSaveDraft(p.key)}
                disabled={savingPlatform === p.key || savedPlatforms.includes(p.key)}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  background: savedPlatforms.includes(p.key) ? 'rgba(16,185,129,0.15)' : p.btnBg,
                  border: `1px solid ${savedPlatforms.includes(p.key) ? 'rgba(16,185,129,0.4)' : p.border}`,
                  color: savedPlatforms.includes(p.key) ? '#6ee7b7' : '#f0f0f5',
                  fontSize: 12, fontFamily: 'Syne', fontWeight: 700,
                }}
              >
                {savingPlatform === p.key ? '⏳ Saving...'
                  : savedPlatforms.includes(p.key) ? '✅ Saved to Scheduler!'
                  : '💾 Save as Draft'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!results && !loading && (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.06)',
          borderRadius: 20, padding: '60px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{mode === 'youtube' ? '🎥' : '✨'}</div>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
            {mode === 'youtube' ? 'YouTube URL paste karo!' : 'Ready to Repurpose!'}
          </h3>
          <p style={{ fontSize: 13, color: '#4b5563', maxWidth: 320, margin: '0 auto' }}>
            {mode === 'youtube'
              ? 'AI video ka transcript fetch karke 3 platforms ke liye content banayega'
              : 'Upar apna content paste karo aur Generate button dabao'}
          </p>
        </div>
      )}
    </div>
  )
}