// src/pages/VideoEditorPage.jsx
// Video Editor for Nexora OS — Timeline + Trim + Cut + AI Captions
// Backend: FFmpeg via clipping.py

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Film, Upload, Scissors, Download, Play, Pause,
  Plus, Trash2, CheckCircle, AlertCircle, Loader,
  RefreshCw, ChevronLeft, ChevronRight, Type,
  ZapIcon, SkipBack, SkipForward, Volume2
} from 'lucide-react'

const API = 'https://creator-os-production-0bf8.up.railway.app'

const card  = { background: 'rgba(15,26,20,0.8)', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 14, padding: 20 }
const lbl   = { fontSize: 12, fontWeight: 700, color: '#9DC4B0', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }
const inp   = { padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 8, color: '#D8EEE5', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
const acBtn = (c='#00E5A0', dis=false) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 16px', background: dis ? 'rgba(255,255,255,0.04)' : `rgba(${c==='#00E5A0'?'0,229,160':c==='#F87171'?'248,113,113':'96,165,250'},0.12)`, border: `1px solid rgba(${c==='#00E5A0'?'0,229,160':c==='#F87171'?'248,113,113':'96,165,250'},${dis?'0.06':'0.3'})`, borderRadius: 9, color: dis ? '#4A6357' : c, fontSize: 13, fontWeight: 700, cursor: dis ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all .15s' })

const toTime = (s) => {
  if (!s && s !== 0) return '0:00'
  const m = Math.floor(s / 60), sc = Math.floor(s % 60)
  return `${m}:${sc.toString().padStart(2,'0')}`
}

const toTimeMs = (s) => {
  const m = Math.floor(s / 60), sc = Math.floor(s % 60), ms = Math.floor((s % 1) * 10)
  return `${m}:${sc.toString().padStart(2,'0')}.${ms}`
}

export default function VideoEditorPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [fileInfo,    setFileInfo]    = useState(null)
  const [uploading,   setUploading]   = useState(false)
  const [uploadErr,   setUploadErr]   = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [playing,     setPlaying]     = useState(false)
  const [volume,      setVolume]      = useState(1)
  const [mode,        setMode]        = useState('trim') // trim | cut | caption
  const [trimStart,   setTrimStart]   = useState(0)
  const [trimEnd,     setTrimEnd]     = useState(0)
  const [segments,    setSegments]    = useState([])
  const [exporting,   setExporting]   = useState(false)
  const [exportRes,   setExportRes]   = useState(null)
  const [exportErr,   setExportErr]   = useState('')
  const [captionRes,  setCaptionRes]  = useState(null)
  const [captioning,  setCaptioning]  = useState(false)
  const [captionErr,  setCaptionErr]  = useState('')
  const [localSrc,    setLocalSrc]    = useState(null)
  const [isDragging,  setIsDragging]  = useState(null) // 'start' | 'end' | segId
  const videoRef   = useRef()
  const fileRef    = useRef()
  const timelineRef= useRef()

  // ── Video events ───────────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime   = () => setCurrentTime(v.currentTime)
    const onEnded  = () => setPlaying(false)
    const onLoaded = () => {
      setDuration(v.duration)
      setTrimEnd(v.duration)
      setSegments([{ id: 1, start: 0, end: Math.min(30, v.duration) }])
    }
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('ended', onEnded)
    v.addEventListener('loadedmetadata', onLoaded)
    return () => { v.removeEventListener('timeupdate', onTime); v.removeEventListener('ended', onEnded); v.removeEventListener('loadedmetadata', onLoaded) }
  }, [localSrc])

  const seekTo = (t) => { if (videoRef.current) { videoRef.current.currentTime = Math.max(0, Math.min(t, duration)); setCurrentTime(videoRef.current.currentTime) } }
  const togglePlay = () => { if (!videoRef.current) return; playing ? videoRef.current.pause() : videoRef.current.play(); setPlaying(!playing) }
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setUploading(true); setUploadErr(''); setFileInfo(null); setExportRes(null); setCaptionRes(null)
    setLocalSrc(URL.createObjectURL(f))

    const form = new FormData()
    form.append('file', f)
    try {
      const r = await fetch(`${API}/api/clipping/editor/upload`, { method: 'POST', body: form })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Upload failed.')
      setFileInfo(d)
    } catch (e) { setUploadErr(e.message) }
    setUploading(false)
  }

  // ── Timeline click ─────────────────────────────────────────────────────────
  const onTimelineClick = (e) => {
    const rect = timelineRef.current.getBoundingClientRect()
    const t    = ((e.clientX - rect.left) / rect.width) * duration
    seekTo(t)
  }

  // ── Set markers at current time ────────────────────────────────────────────
  const setTrimStartHere = () => setTrimStart(parseFloat(currentTime.toFixed(2)))
  const setTrimEndHere   = () => setTrimEnd(parseFloat(currentTime.toFixed(2)))
  const setSegStartHere  = (id) => setSegments(s => s.map(sg => sg.id===id ? {...sg, start: parseFloat(currentTime.toFixed(2))} : sg))
  const setSegEndHere    = (id) => setSegments(s => s.map(sg => sg.id===id ? {...sg, end: parseFloat(currentTime.toFixed(2))} : sg))

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!fileInfo) return
    setExporting(true); setExportErr(''); setExportRes(null)

    try {
      if (mode === 'trim') {
        const form = new FormData()
        form.append('file_id', fileInfo.file_id)
        form.append('start_time', String(trimStart))
        form.append('end_time', String(trimEnd))
        const r = await fetch(`${API}/api/clipping/editor/trim`, { method: 'POST', body: form })
        const d = await r.json()
        if (!r.ok) throw new Error(d.detail || 'Trim failed.')
        setExportRes(d)
      } else if (mode === 'cut') {
        const valid = segments.filter(s => s.end > s.start)
        if (!valid.length) throw new Error('Add valid segments first.')
        const form = new FormData()
        form.append('file_id', fileInfo.file_id)
        form.append('cuts', JSON.stringify(valid.map(s => ({ start: s.start, end: s.end }))))
        const r = await fetch(`${API}/api/clipping/editor/cut`, { method: 'POST', body: form })
        const d = await r.json()
        if (!r.ok) throw new Error(d.detail || 'Cut failed.')
        setExportRes(d)
      }
    } catch (e) { setExportErr(e.message) }
    setExporting(false)
  }

  // ── AI Captions ────────────────────────────────────────────────────────────
  const handleCaption = async () => {
    if (!fileInfo) return
    setCaptioning(true); setCaptionErr(''); setCaptionRes(null)
    try {
      const form = new FormData()
      form.append('file_id', fileInfo.file_id)
      const r = await fetch(`${API}/api/clipping/editor/caption`, { method: 'POST', body: form })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Caption failed.')
      setCaptionRes(d)
    } catch (e) { setCaptionErr(e.message) }
    setCaptioning(false)
  }

  const addSeg = () => {
    const last = segments[segments.length - 1]
    const s    = last ? Math.min(last.end + 2, duration) : 0
    setSegments([...segments, { id: Date.now(), start: s, end: Math.min(s + 30, duration) }])
  }

  const totalDur = mode === 'trim'
    ? Math.max(0, trimEnd - trimStart)
    : segments.reduce((a,s) => a + Math.max(0, s.end - s.start), 0)

  if (!fileInfo && !localSrc) return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", color: '#D8EEE5' }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Film size={22} color="#00E5A0" />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Video Editor</h1>
          <p style={{ fontSize: 13, color: '#7A9E8E', margin: 0 }}>Trim • Cut • AI Captions — powered by FFmpeg</p>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleUpload} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div style={card}>
          <div onClick={() => fileRef.current?.click()}
            style={{ border: '2px dashed rgba(0,229,160,0.2)', borderRadius: 12, padding: '52px', textAlign: 'center', cursor: 'pointer', transition: 'border-color .2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.2)'}>
            {uploading
              ? <><Loader size={32} color="#00E5A0" style={{ display: 'block', margin: '0 auto 12px', animation: 'sp .8s linear infinite' }} /><p style={{ color: '#9DC4B0', fontSize: 14, margin: 0 }}>Uploading to server...</p></>
              : <><Upload size={36} color="#4A6357" style={{ display: 'block', margin: '0 auto 14px' }} /><p style={{ color: '#9DC4B0', fontSize: 15, fontWeight: 600, margin: 0 }}>Click to upload video</p><p style={{ color: '#4A6357', fontSize: 12, margin: '6px 0 0' }}>MP4, MOV, AVI, MKV • Any size</p></>}
          </div>
          {uploadErr && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, color: '#F87171', fontSize: 13 }}>{uploadErr}</div>}
        </div>
        <div style={card}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 14px' }}>🎬 Features</h4>
          {[['✂️ Trim','Cut start/end, exact timestamps'],['🔪 Multi-cut','Keep multiple segments, join them'],['📝 AI Captions','Whisper transcribe + burn into video'],['⬇️ Export','Download as MP4 (H.264)'],['🎵 Audio','AAC stereo output'],['⚡ FFmpeg','High quality, no watermark']].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#D8EEE5', minWidth: 90 }}>{k}</span>
              <span style={{ fontSize: 12, color: '#7A9E8E' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", color: '#D8EEE5' }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}} @keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Film size={20} color="#00E5A0" />
          <span style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 800, fontSize: 17, color: '#fff' }}>Video Editor</span>
          {fileInfo && <span style={{ fontSize: 12, color: '#7A9E8E' }}>• {fileInfo.filename?.split('/').pop()} • {toTime(duration)} • {fileInfo.size_mb}MB</span>}
        </div>
        <button onClick={() => { setFileInfo(null); setLocalSrc(null); setExportRes(null); setCaptionRes(null); setPlaying(false) }}
          style={{ ...acBtn(), padding: '7px 14px', fontSize: 12 }}>
          <RefreshCw size={12} /> New Video
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>
        {/* Left — Preview + Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Video player */}
          <div style={{ ...card, padding: 14 }}>
            <video ref={videoRef} src={localSrc} style={{ width: '100%', borderRadius: 10, background: '#000', maxHeight: 300, objectFit: 'contain', display: 'block' }}
              onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />

            {/* Transport controls */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => seekTo(0)} style={{ background: 'none', border: 'none', color: '#9DC4B0', cursor: 'pointer', padding: 4 }}><SkipBack size={16} /></button>
              <button onClick={() => seekTo(currentTime - 5)} style={{ background: 'none', border: 'none', color: '#9DC4B0', cursor: 'pointer', padding: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}><ChevronLeft size={14} />5s</button>
              <button onClick={togglePlay}
                style={{ width: 38, height: 38, borderRadius: '50%', background: '#00E5A0', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {playing ? <Pause size={16} color="#070D0A" /> : <Play size={16} color="#070D0A" style={{ marginLeft: 2 }} />}
              </button>
              <button onClick={() => seekTo(currentTime + 5)} style={{ background: 'none', border: 'none', color: '#9DC4B0', cursor: 'pointer', padding: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>5s<ChevronRight size={14} /></button>
              <button onClick={() => seekTo(duration)} style={{ background: 'none', border: 'none', color: '#9DC4B0', cursor: 'pointer', padding: 4 }}><SkipForward size={16} /></button>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                <Volume2 size={14} color="#7A9E8E" />
                <input type="range" min={0} max={1} step={0.05} value={volume}
                  onChange={e => { setVolume(e.target.value); if (videoRef.current) videoRef.current.volume = e.target.value }}
                  style={{ flex: 1, accentColor: '#00E5A0', height: 3 }} />
              </div>

              <span style={{ fontSize: 12, color: '#00E5A0', fontFamily: 'monospace', minWidth: 90, textAlign: 'right' }}>
                {toTimeMs(currentTime)} / {toTime(duration)}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ ...card, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9DC4B0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>Timeline</div>

            {/* Main scrubber */}
            <div ref={timelineRef}
              style={{ position: 'relative', height: 48, background: 'rgba(255,255,255,0.04)', borderRadius: 8, cursor: 'pointer', overflow: 'hidden', marginBottom: 6 }}
              onClick={onTimelineClick}>

              {/* Playhead */}
              <div style={{ position: 'absolute', left: `${pct}%`, top: 0, bottom: 0, width: 2, background: '#00E5A0', zIndex: 10, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: -4, left: -4, width: 10, height: 10, borderRadius: '50%', background: '#00E5A0' }} />
              </div>

              {/* Trim region */}
              {mode === 'trim' && (
                <div style={{
                  position: 'absolute',
                  left: `${(trimStart/duration)*100}%`,
                  width: `${((trimEnd-trimStart)/duration)*100}%`,
                  top: 0, bottom: 0,
                  background: 'rgba(0,229,160,0.2)',
                  border: '1px solid rgba(0,229,160,0.5)',
                }}>
                  {/* Start handle */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: '#FBBF24', cursor: 'ew-resize', borderRadius: '4px 0 0 4px' }} />
                  {/* End handle */}
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, background: '#F87171', cursor: 'ew-resize', borderRadius: '0 4px 4px 0' }} />
                </div>
              )}

              {/* Segments */}
              {mode === 'cut' && segments.map((seg, i) => (
                <div key={seg.id} style={{
                  position: 'absolute',
                  left: `${(seg.start/duration)*100}%`,
                  width: `${Math.max((seg.end-seg.start)/duration*100, 0.5)}%`,
                  top: 4, bottom: 4,
                  background: `rgba(${i%3===0?'0,229,160':i%3===1?'96,165,250':'251,191,36'},0.3)`,
                  border: `1px solid rgba(${i%3===0?'0,229,160':i%3===1?'96,165,250':'251,191,36'},0.6)`,
                  borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#fff', fontWeight: 700,
                }}>
                  {i+1}
                </div>
              ))}
            </div>

            {/* Time markers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4A6357', marginBottom: 10 }}>
              {[0, 0.25, 0.5, 0.75, 1].map(f => (
                <span key={f}>{toTime(f * duration)}</span>
              ))}
            </div>

            {/* Mode-specific controls */}
            {mode === 'trim' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#FBBF24', fontWeight: 700, marginBottom: 3 }}>START</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input style={{ ...inp, padding: '5px 8px', fontSize: 12, flex: 1 }} type="number" value={trimStart} min={0} max={trimEnd-0.1} step={0.1}
                      onChange={e => setTrimStart(Math.max(0, parseFloat(e.target.value)))} />
                    <button onClick={setTrimStartHere} style={{ padding: '5px 8px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 6, color: '#FBBF24', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      📍 Here
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: '#7A9E8E', marginTop: 3 }}>{toTimeMs(trimStart)}</div>
                </div>
                <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#F87171', fontWeight: 700, marginBottom: 3 }}>END</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input style={{ ...inp, padding: '5px 8px', fontSize: 12, flex: 1 }} type="number" value={trimEnd} min={trimStart+0.1} max={duration} step={0.1}
                      onChange={e => setTrimEnd(Math.min(duration, parseFloat(e.target.value)))} />
                    <button onClick={setTrimEndHere} style={{ padding: '5px 8px', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, color: '#F87171', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      📍 Here
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: '#7A9E8E', marginTop: 3 }}>{toTimeMs(trimEnd)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 10, color: '#9DC4B0' }}>Output</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#00E5A0', fontFamily: "'Cabinet Grotesk',sans-serif" }}>{toTime(totalDur)}</div>
                </div>
              </div>
            )}

            {mode === 'cut' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#9DC4B0', fontWeight: 700 }}>Segments — Output: {toTime(totalDur)}</span>
                  <button onClick={addSeg} style={{ ...acBtn(), padding: '5px 10px', fontSize: 11 }}><Plus size={12} /> Add Segment</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                  {segments.map((seg, i) => (
                    <div key={seg.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(0,229,160,0.08)' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#00E5A0', minWidth: 20 }}>{i+1}</span>
                      <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: '#7A9E8E', marginBottom: 2 }}>Start</div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <input style={{ ...inp, padding: '4px 6px', fontSize: 11 }} type="number" value={seg.start} min={0} max={seg.end-0.1} step={0.1}
                              onChange={e => setSegments(s => s.map(sg => sg.id===seg.id ? {...sg, start: parseFloat(e.target.value)} : sg))} />
                            <button onClick={() => setSegStartHere(seg.id)} style={{ padding: '4px 6px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 5, color: '#FBBF24', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>📍</button>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: '#7A9E8E', marginBottom: 2 }}>End</div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <input style={{ ...inp, padding: '4px 6px', fontSize: 11 }} type="number" value={seg.end} min={seg.start+0.1} max={duration} step={0.1}
                              onChange={e => setSegments(s => s.map(sg => sg.id===seg.id ? {...sg, end: parseFloat(e.target.value)} : sg))} />
                            <button onClick={() => setSegEndHere(seg.id)} style={{ padding: '4px 6px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 5, color: '#F87171', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>📍</button>
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#4A6357', minWidth: 35 }}>{toTime(seg.end-seg.start)}</span>
                      <button onClick={() => setSegments(s => s.filter(sg => sg.id !== seg.id))} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: 2 }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — Tools panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Mode selector */}
          <div style={card}>
            <div style={lbl}>Edit Mode</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['trim','✂️ Trim','Cut start & end'],['cut','🔪 Multi-Cut','Keep segments'],['caption','📝 AI Captions','Auto-transcribe & burn']].map(([v,l,d]) => (
                <div key={v} onClick={() => { setMode(v); setExportRes(null); setExportErr('') }}
                  style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${mode===v ? 'rgba(0,229,160,0.4)' : 'rgba(0,229,160,0.08)'}`, background: mode===v ? 'rgba(0,229,160,0.06)' : 'transparent', transition: 'all .15s' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: mode===v ? '#00E5A0' : '#D8EEE5' }}>{l}</div>
                  <div style={{ fontSize: 11, color: '#7A9E8E' }}>{d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Export / Caption */}
          <div style={card}>
            <div style={lbl}>Export</div>

            {exportErr && <div style={{ padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#F87171', fontSize: 12, marginBottom: 10 }}>{exportErr}</div>}
            {captionErr && <div style={{ padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#F87171', fontSize: 12, marginBottom: 10 }}>{captionErr}</div>}

            {mode === 'caption' ? (
              captionRes ? (
                <div style={{ textAlign: 'center' }}>
                  <CheckCircle size={32} color="#00E5A0" style={{ display: 'block', margin: '0 auto 10px' }} />
                  <p style={{ color: '#00E5A0', fontWeight: 700, fontSize: 14, margin: '0 0 6px' }}>Captions Ready! ✅</p>
                  {captionRes.transcript && <p style={{ fontSize: 11, color: '#7A9E8E', margin: '0 0 12px', lineHeight: 1.5 }}>{captionRes.transcript.slice(0, 150)}...</p>}
                  <a href={`${API}${captionRes.download_url}`} download
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#00E5A0', color: '#070D0A', borderRadius: 9, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                    <Download size={14} /> Download
                  </a>
                  <button onClick={() => setCaptionRes(null)} style={{ display: 'block', margin: '8px auto 0', background: 'none', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 7, color: '#9DC4B0', fontSize: 11, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Process Again</button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: '#7A9E8E', marginBottom: 12, lineHeight: 1.6 }}>
                    Whisper AI will transcribe your video and burn captions into it.
                  </p>
                  <button style={{ ...acBtn('#60A5FA', captioning), width: '100%', padding: '12px' }}
                    onClick={handleCaption} disabled={captioning}>
                    {captioning ? <><Loader size={14} style={{ animation: 'sp .7s linear infinite' }} /> Transcribing...</> : <><Type size={14} /> Generate AI Captions</>}
                  </button>
                  {captioning && <p style={{ fontSize: 11, color: '#4A6357', textAlign: 'center', marginTop: 6 }}>This may take 1-3 minutes...</p>}
                </>
              )
            ) : exportRes ? (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle size={32} color="#00E5A0" style={{ display: 'block', margin: '0 auto 10px' }} />
                <p style={{ color: '#00E5A0', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>Export Done! 🎉</p>
                <p style={{ fontSize: 12, color: '#7A9E8E', margin: '0 0 14px' }}>{toTime(exportRes.duration)} • {exportRes.size_mb}MB{exportRes.segments ? ` • ${exportRes.segments} segments` : ''}</p>
                <a href={`${API}${exportRes.download_url}`} download
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#00E5A0', color: '#070D0A', borderRadius: 9, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                  <Download size={14} /> Download MP4
                </a>
                <button onClick={() => setExportRes(null)} style={{ display: 'block', margin: '8px auto 0', background: 'none', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 7, color: '#9DC4B0', fontSize: 11, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Edit Again</button>
              </div>
            ) : (
              <>
                <div style={{ padding: '8px 12px', background: 'rgba(0,229,160,0.05)', borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#9DC4B0' }}>Output duration</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#00E5A0', fontFamily: "'Cabinet Grotesk',sans-serif" }}>{toTime(totalDur)}</div>
                </div>
                {exporting && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ height: 4, background: 'rgba(0,229,160,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}>
                      <div style={{ height: '100%', width: '60%', background: '#00E5A0', borderRadius: 2, animation: 'slide 1.5s ease infinite' }} />
                    </div>
                    <p style={{ fontSize: 11, color: '#4A6357', textAlign: 'center' }}>FFmpeg processing... 30-120s</p>
                  </div>
                )}
                <button style={{ ...acBtn('#00E5A0', exporting), width: '100%', padding: '12px' }}
                  onClick={handleExport} disabled={exporting}>
                  {exporting ? <><Loader size={14} style={{ animation: 'sp .7s linear infinite' }} /> Processing...</> : mode === 'trim' ? <><Scissors size={14} /> Trim & Export</> : <><Scissors size={14} /> Cut & Join</>}
                </button>
              </>
            )}
          </div>

          {/* Tips */}
          <div style={card}>
            <div style={lbl}>Tips</div>
            {(mode === 'trim' ? [
              'Play → pause at exact point → 📍 Here',
              'Use number inputs for precision',
              'Output re-encoded in H.264',
            ] : mode === 'cut' ? [
              'Add segments you want to KEEP',
              'Segments joined in order',
              '📍 buttons set from current time',
            ] : [
              'Whisper base model used',
              'Works best with speech/dialogue',
              'Captions burned directly into video',
              'Download SRT if burn fails',
            ]).map(t => <p key={t} style={{ fontSize: 12, color: '#7A9E8E', margin: '0 0 6px', paddingLeft: 10, borderLeft: '2px solid rgba(0,229,160,0.2)', lineHeight: 1.5 }}>{t}</p>)}
          </div>
        </div>
      </div>
    </div>
  )
}