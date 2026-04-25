// src/pages/VideoEditorPage.jsx
// Nexora OS Video Editor — Powered by Creatomate
// Features: Upload → Effects → Captions → Transitions → Export

import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  Film, Upload, Download, Play, Pause, Loader,
  CheckCircle, AlertCircle, RefreshCw, Zap,
  Type, Music, Sparkles, Monitor, Smartphone,
  Square, ArrowRight, Image, Volume2, ChevronDown
} from 'lucide-react'

const API = 'https://creator-os-production-0bf8.up.railway.app'

// ── Design ─────────────────────────────────────────────────────────────────
const BG   = '#070D0A'
const card = { background: 'rgba(15,26,20,0.9)', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 14, padding: 20 }
const lbl  = { fontSize: 11, fontWeight: 700, color: '#7A9E8E', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }
const inp  = { padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 8, color: '#D8EEE5', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const ta   = { ...inp, resize: 'vertical', minHeight: 70 }
const gBtn = (dis) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', background: dis ? 'rgba(0,229,160,0.1)' : 'linear-gradient(135deg,#00E5A0,#00B87A)', color: dis ? '#4A6357' : '#070D0A', border: 'none', borderRadius: 11, cursor: dis ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', width: '100%', transition: 'all .15s' })
const selBtn = (active) => ({ padding: '9px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, border: `1px solid ${active ? 'rgba(0,229,160,0.5)' : 'rgba(0,229,160,0.1)'}`, background: active ? 'rgba(0,229,160,0.1)' : 'transparent', color: active ? '#00E5A0' : '#7A9E8E', transition: 'all .15s', fontFamily: 'inherit' })

// ── Presets ────────────────────────────────────────────────────────────────
const PRESETS = [
  { id: 'shorts',    label: '📱 Shorts',    desc: '9:16 · TikTok style captions',   icon: <Smartphone size={14}/> },
  { id: 'youtube',   label: '▶️ YouTube',   desc: '16:9 · Clean white captions',     icon: <Monitor size={14}/> },
  { id: 'instagram', label: '📸 Instagram', desc: '1:1 · Bold center text',          icon: <Square size={14}/> },
  { id: 'tiktok',    label: '🎵 TikTok',    desc: '9:16 · Yellow zoom captions',     icon: <Zap size={14}/> },
  { id: 'cinematic', label: '🎬 Cinematic', desc: '16:9 · Fade transitions',         icon: <Film size={14}/> },
]

const TRANSITIONS = ['none','fade','slide','zoom','wipe','spin','flip']
const CAPTION_STYLES = [
  { id: 'bottom_white', label: '⬇ Bottom White',  desc: 'Semi-transparent bg' },
  { id: 'center_bold',  label: '⊕ Center Bold',   desc: 'White, centered' },
  { id: 'tiktok',       label: '🎵 TikTok Yellow', desc: 'Yellow, no bg' },
]
const ASPECT_RATIOS = [
  { id: '9:16',  label: '9:16',  icon: '📱', desc: 'Shorts/TikTok' },
  { id: '16:9',  label: '16:9',  icon: '🖥️', desc: 'YouTube' },
  { id: '1:1',   label: '1:1',   icon: '⬜', desc: 'Instagram' },
  { id: '4:5',   label: '4:5',   icon: '📷', desc: 'IG Portrait' },
]

export default function VideoEditorPage() {
  const [step,          setStep]          = useState(1) // 1=upload 2=edit 3=export
  const [userId,        setUserId]        = useState(null)
  const [localSrc,      setLocalSrc]      = useState(null)
  const [videoUrl,      setVideoUrl]      = useState(null)
  const [uploading,     setUploading]     = useState(false)
  const [uploadErr,     setUploadErr]     = useState('')
  const [playing,       setPlaying]       = useState(false)
  const [currentTime,   setCurrentTime]   = useState(0)
  const [duration,      setDuration]      = useState(0)

  // Editor settings
  const [mode,          setMode]          = useState('preset') // preset | custom
  const [selectedPreset,setSelectedPreset]= useState('shorts')
  const [aspectRatio,   setAspectRatio]   = useState('9:16')
  const [transition,    setTransition]    = useState('fade')
  const [captionText,   setCaptionText]   = useState('')
  const [captionStyle,  setCaptionStyle]  = useState('bottom_white')
  const [overlayText,   setOverlayText]   = useState('')
  const [overlayColor,  setOverlayColor]  = useState('#ffffff')
  const [bgMusicUrl,    setBgMusicUrl]    = useState('')
  const [bgMusicVol,    setBgMusicVol]    = useState(0.3)
  const [trimStart,     setTrimStart]     = useState(0)
  const [trimEnd,       setTrimEnd]       = useState(0)
  const [useTrim,       setUseTrim]       = useState(false)

  // Render state
  const [rendering,     setRendering]     = useState(false)
  const [renderId,      setRenderId]      = useState(null)
  const [renderStatus,  setRenderStatus]  = useState(null)
  const [renderResult,  setRenderResult]  = useState(null)
  const [renderErr,     setRenderErr]     = useState('')

  const fileRef  = useRef()
  const videoRef = useRef()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id)
    })
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime  = () => setCurrentTime(v.currentTime)
    const onMeta  = () => { setDuration(v.duration); setTrimEnd(v.duration) }
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onMeta)
    return () => { v.removeEventListener('timeupdate', onTime); v.removeEventListener('loadedmetadata', onMeta) }
  }, [localSrc])

  // Poll render status
  useEffect(() => {
    if (!renderId) return
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`${API}/api/editor/render/${renderId}`)
        const d = await r.json()
        setRenderStatus(d)
        if (d.status === 'succeeded') {
          setRenderResult(d); setRendering(false); clearInterval(poll); setStep(3)
        } else if (d.status === 'failed') {
          setRenderErr(d.error || 'Render failed.'); setRendering(false); clearInterval(poll)
        }
      } catch {}
    }, 2500)
    return () => clearInterval(poll)
  }, [renderId])

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const f = e.target.files[0]
    if (!f || !userId) return
    setUploading(true); setUploadErr(''); setLocalSrc(URL.createObjectURL(f))

    const form = new FormData()
    form.append('user_id', userId)
    form.append('file', f)

    try {
      const r = await fetch(`${API}/api/editor/upload-video`, { method: 'POST', body: form })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Upload failed.')
      setVideoUrl(d.url)
      setStep(2)
    } catch (e) { setUploadErr(e.message) }
    setUploading(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const handleRender = async () => {
    if (!videoUrl) return
    setRendering(true); setRenderErr(''); setRenderResult(null); setRenderId(null)

    try {
      let body
      if (mode === 'preset') {
        body = {
          user_id:   userId,
          video_url: videoUrl,
          preset:    selectedPreset,
          text:      captionText || undefined,
          music_url: bgMusicUrl  || undefined,
        }
        const r = await fetch(`${API}/api/editor/quick-preset`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.detail || 'Render failed.')
        setRenderId(d.render_id)
      } else {
        body = {
          user_id:      userId,
          video_url:    videoUrl,
          aspect_ratio: aspectRatio,
          transition,
          caption_text:  captionText  || undefined,
          caption_style: captionStyle,
          overlay_text:  overlayText  || undefined,
          overlay_color: overlayColor,
          bg_music_url:  bgMusicUrl   || undefined,
          bg_music_vol:  bgMusicVol,
          trim_start:    useTrim ? trimStart : undefined,
          trim_end:      useTrim ? trimEnd   : undefined,
        }
        const r = await fetch(`${API}/api/editor/render`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.detail || 'Render failed.')
        setRenderId(d.render_id)
      }
    } catch (e) { setRenderErr(e.message); setRendering(false) }
  }

  const reset = () => {
    setStep(1); setLocalSrc(null); setVideoUrl(null); setRenderResult(null)
    setRenderId(null); setRenderStatus(null); setRendering(false); setRenderErr('')
    setCaptionText(''); setOverlayText(''); setBgMusicUrl('')
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  // ── STEP 1 — Upload ───────────────────────────────────────────────────────
  if (step === 1) return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", color: '#D8EEE5' }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,rgba(0,229,160,0.15),rgba(0,229,160,0.05))', border: '1px solid rgba(0,229,160,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Film size={22} color="#00E5A0" />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Video Editor</h1>
          <p style={{ fontSize: 13, color: '#7A9E8E', margin: 0 }}>Powered by Creatomate — Effects • Captions • Transitions • Music</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div style={card}>
          <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleUpload} />
          <div onClick={() => !uploading && fileRef.current?.click()}
            style={{ border: '2px dashed rgba(0,229,160,0.2)', borderRadius: 14, padding: '52px 32px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer' }}
            onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor='rgba(0,229,160,0.5)' }}
            onMouseLeave={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.2)'}>
            {uploading ? (
              <>
                <Loader size={36} color="#00E5A0" style={{ display: 'block', margin: '0 auto 14px', animation: 'sp .8s linear infinite' }} />
                <p style={{ color: '#9DC4B0', fontSize: 15, fontWeight: 600, margin: 0 }}>Uploading to server...</p>
                <p style={{ color: '#4A6357', fontSize: 12, margin: '6px 0 0' }}>Please wait</p>
              </>
            ) : (
              <>
                <Upload size={40} color="#4A6357" style={{ display: 'block', margin: '0 auto 16px' }} />
                <p style={{ color: '#9DC4B0', fontSize: 16, fontWeight: 700, margin: 0 }}>Drop video or click to upload</p>
                <p style={{ color: '#4A6357', fontSize: 13, margin: '8px 0 0' }}>MP4, MOV, AVI, MKV • Any size</p>
              </>
            )}
          </div>
          {uploadErr && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, color: '#F87171', fontSize: 13 }}>{uploadErr}</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={card}>
            <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>✨ Features</div>
            {[
              ['🎨 Effects',     'Brightness, contrast, saturation filters'],
              ['📝 AI Captions', 'Auto-burn subtitles in multiple styles'],
              ['🔀 Transitions', 'Fade, slide, zoom, wipe, spin, flip'],
              ['🎵 Background Music', 'Add music with volume control'],
              ['📱 Presets',    'Shorts, YouTube, TikTok, Instagram'],
              ['✂️ Trim',       'Set start/end timestamps'],
              ['🖼️ Text Overlay','Custom title text with colors'],
              ['⬇️ Export',     'HD MP4 download, no watermark'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 10, marginBottom: 9 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#D8EEE5', minWidth: 120 }}>{k}</span>
                <span style={{ fontSize: 12, color: '#7A9E8E' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ── STEP 3 — Done ─────────────────────────────────────────────────────────
  if (step === 3 && renderResult) return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", color: '#D8EEE5', maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
      <div style={card}>
        <CheckCircle size={56} color="#00E5A0" style={{ display: 'block', margin: '0 auto 20px' }} />
        <h2 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Video Ready! 🎉</h2>
        <p style={{ fontSize: 14, color: '#7A9E8E', margin: '0 0 24px' }}>
          Your edited video has been rendered by Creatomate
        </p>
        <a href={renderResult.download_url} target="_blank" rel="noopener" download
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: 'linear-gradient(135deg,#00E5A0,#00B87A)', color: '#070D0A', borderRadius: 12, textDecoration: 'none', fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
          <Download size={18} /> Download MP4
        </a>
        <br />
        <button onClick={reset} style={{ background: 'none', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 9, color: '#9DC4B0', fontSize: 13, padding: '9px 20px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Edit Another Video
        </button>
      </div>
    </div>
  )

  // ── STEP 2 — Editor ───────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", color: '#D8EEE5' }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}} @keyframes progBar{0%{background-position:0 0}100%{background-position:60px 0}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Film size={20} color="#00E5A0" />
          <span style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 800, fontSize: 17, color: '#fff' }}>Video Editor</span>
          <span style={{ fontSize: 12, color: '#4A6357', padding: '3px 8px', background: 'rgba(0,229,160,0.06)', borderRadius: 6, border: '1px solid rgba(0,229,160,0.12)' }}>Creatomate</span>
        </div>
        <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 8, color: '#9DC4B0', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={12} /> New Video
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14 }}>

        {/* Left — Preview + Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Video preview */}
          <div style={{ ...card, padding: 12 }}>
            <video ref={videoRef} src={localSrc} style={{ width: '100%', borderRadius: 10, background: '#000', maxHeight: 280, objectFit: 'contain', display: 'block' }}
              onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} controls />
          </div>

          {/* Mode selector */}
          <div style={card}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button style={selBtn(mode === 'preset')} onClick={() => setMode('preset')}>⚡ Quick Presets</button>
              <button style={selBtn(mode === 'custom')} onClick={() => setMode('custom')}>🎨 Custom Settings</button>
            </div>

            {mode === 'preset' ? (
              <div>
                <label style={lbl}>Choose Preset</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {PRESETS.map(p => (
                    <div key={p.id} onClick={() => setSelectedPreset(p.id)}
                      style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${selectedPreset===p.id ? 'rgba(0,229,160,0.5)' : 'rgba(0,229,160,0.08)'}`, background: selectedPreset===p.id ? 'rgba(0,229,160,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all .15s' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: selectedPreset===p.id ? '#00E5A0' : '#D8EEE5', marginBottom: 3 }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: '#7A9E8E' }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Aspect Ratio */}
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Aspect Ratio</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {ASPECT_RATIOS.map(ar => (
                      <button key={ar.id} style={{ ...selBtn(aspectRatio===ar.id), flex: 1, padding: '8px 6px', textAlign: 'center' }} onClick={() => setAspectRatio(ar.id)}>
                        <div style={{ fontSize: 14 }}>{ar.icon}</div>
                        <div style={{ fontSize: 12 }}>{ar.label}</div>
                        <div style={{ fontSize: 10, color: '#7A9E8E' }}>{ar.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transition */}
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Transition Effect</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TRANSITIONS.map(t => (
                      <button key={t} style={{ ...selBtn(transition===t), padding: '6px 12px', fontSize: 12 }} onClick={() => setTransition(t)}>
                        {t === 'none' ? '⛔ None' : t === 'fade' ? '🌅 Fade' : t === 'slide' ? '➡️ Slide' : t === 'zoom' ? '🔍 Zoom' : t === 'wipe' ? '🧹 Wipe' : t === 'spin' ? '🌀 Spin' : '🔄 Flip'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trim */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={useTrim} onChange={e => setUseTrim(e.target.checked)} style={{ accentColor: '#00E5A0' }} />
                    Trim Video
                  </label>
                  {useTrim && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ ...lbl, fontSize: 10 }}>Start (s)</label>
                        <input style={inp} type="number" value={trimStart} min={0} max={trimEnd-0.1} step={0.5} onChange={e => setTrimStart(parseFloat(e.target.value))} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ ...lbl, fontSize: 10 }}>End (s)</label>
                        <input style={inp} type="number" value={trimEnd} min={trimStart+0.1} max={duration} step={0.5} onChange={e => setTrimEnd(parseFloat(e.target.value))} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — Text, Music, Export */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Captions */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Type size={14} color="#60A5FA" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Captions & Text</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Caption Text (subtitle burned in)</label>
              <textarea style={ta} value={captionText} onChange={e => setCaptionText(e.target.value)}
                placeholder="Your caption text here...&#10;Can be multi-line"
                onFocus={e => e.target.style.borderColor='rgba(0,229,160,0.4)'}
                onBlur={e => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Caption Style</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {CAPTION_STYLES.map(cs => (
                  <div key={cs.id} onClick={() => setCaptionStyle(cs.id)}
                    style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${captionStyle===cs.id ? 'rgba(0,229,160,0.4)' : 'rgba(0,229,160,0.08)'}`, background: captionStyle===cs.id ? 'rgba(0,229,160,0.06)' : 'transparent', transition: 'all .15s' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: captionStyle===cs.id ? '#00E5A0' : '#D8EEE5' }}>{cs.label}</span>
                    <span style={{ fontSize: 11, color: '#7A9E8E', marginLeft: 8 }}>{cs.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={lbl}>Title Overlay (optional)</label>
              <input style={{ ...inp, marginBottom: 8 }} value={overlayText} onChange={e => setOverlayText(e.target.value)}
                placeholder="Add title overlay text..."
                onFocus={e => e.target.style.borderColor='rgba(0,229,160,0.4)'}
                onBlur={e => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
              {overlayText && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ ...lbl, margin: 0 }}>Color</label>
                  <input type="color" value={overlayColor} onChange={e => setOverlayColor(e.target.value)}
                    style={{ width: 32, height: 28, borderRadius: 6, border: '1px solid rgba(0,229,160,0.2)', cursor: 'pointer', background: 'none' }} />
                  <span style={{ fontSize: 12, color: overlayColor }}>{overlayColor}</span>
                </div>
              )}
            </div>
          </div>

          {/* Music */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Music size={14} color="#A78BFA" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Background Music</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Music URL (MP3/public link)</label>
              <input style={inp} value={bgMusicUrl} onChange={e => setBgMusicUrl(e.target.value)}
                placeholder="https://example.com/music.mp3"
                onFocus={e => e.target.style.borderColor='rgba(0,229,160,0.4)'}
                onBlur={e => e.target.style.borderColor='rgba(0,229,160,0.12)'} />
            </div>
            {bgMusicUrl && (
              <div>
                <label style={lbl}>Volume — {Math.round(bgMusicVol * 100)}%</label>
                <input type="range" min={0} max={1} step={0.05} value={bgMusicVol}
                  onChange={e => setBgMusicVol(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#00E5A0', height: 4 }} />
              </div>
            )}
          </div>

          {/* Export */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sparkles size={14} color="#00E5A0" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Export with Creatomate</span>
            </div>

            {renderErr && (
              <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 9, color: '#F87171', fontSize: 13, marginBottom: 12 }}>
                {renderErr}
              </div>
            )}

            {rendering && renderStatus && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9DC4B0', marginBottom: 6 }}>
                  <span>🎬 {renderStatus.status === 'rendering' ? 'Rendering...' : renderStatus.status === 'planned' ? 'Queued...' : renderStatus.status}</span>
                  <span>{Math.round((renderStatus.progress || 0) * 100)}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,229,160,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(renderStatus.progress || 0) * 100}%`, background: 'linear-gradient(90deg,#00E5A0,#00B87A)', borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
                <p style={{ fontSize: 11, color: '#4A6357', marginTop: 6, textAlign: 'center' }}>
                  Creatomate rendering in cloud... usually 30-90s
                </p>
              </div>
            )}

            <button style={gBtn(rendering || !videoUrl)} onClick={handleRender} disabled={rendering || !videoUrl}>
              {rendering
                ? <><Loader size={15} style={{ animation: 'sp .7s linear infinite' }} /> Rendering...</>
                : <><Sparkles size={15} /> Render & Export</>}
            </button>

            <p style={{ fontSize: 11, color: '#4A6357', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
              Cloud render — HD quality, no watermark
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}