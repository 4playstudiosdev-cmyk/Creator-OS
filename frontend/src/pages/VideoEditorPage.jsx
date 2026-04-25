import { useState, useRef, useEffect, useCallback } from 'react'

const API = 'https://creator-os-production-0bf8.up.railway.app'

const IC = {
  upload:  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  play:    "M5 3l14 9-14 9V3z",
  pause:   "M6 4h4v16H6zM14 4h4v16h-4z",
  cut:     "M6 9l6 6M6 15l6-6M20 4l-8.5 8.5M20 20l-8.5-8.5",
  text:    "M4 7V4h16v3M9 20h6M12 4v16",
  dl:      "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  undo:    "M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 000-11H11",
  redo:    "M15 14l5-5-5-5M19 9H8.5a5.5 5.5 0 000 11H13",
  filter:  "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  caption: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  speed:   "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  vol:     "M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07",
  close:   "M18 6L6 18M6 6l12 12",
  adjust:  "M11 5H3M21 5h-4M15 3v4M7 11H3M21 11h-8M11 9v4M13 17H3M21 17h-2M17 15v4",
  cloud:   "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z",
  check:   "M20 6L9 17l-5-5",
}

const Ico = ({ d, s = 15, c = 'currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const FONTS   = ['Impact', 'Arial Black', 'Georgia', 'Courier New', 'Trebuchet MS', 'Verdana']
const COLORS  = ['#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE']
const FILTERS = [
  { name: 'None',  css: '' },
  { name: 'Vivid', css: 'saturate(1.8) contrast(1.1)' },
  { name: 'Matte', css: 'saturate(0.8) brightness(1.05)' },
  { name: 'B&W',   css: 'grayscale(1)' },
  { name: 'Warm',  css: 'sepia(0.4) saturate(1.3)' },
  { name: 'Cool',  css: 'hue-rotate(30deg) saturate(1.2)' },
  { name: 'Drama', css: 'contrast(1.4) saturate(1.2) brightness(0.9)' },
  { name: 'Fade',  css: 'brightness(1.1) contrast(0.85) saturate(0.9)' },
]
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]
const TOOLS  = [
  { id: 'trim',    label: 'Trim',    icon: 'cut'     },
  { id: 'text',    label: 'Text',    icon: 'text'    },
  { id: 'filter',  label: 'Filter',  icon: 'filter'  },
  { id: 'adjust',  label: 'Adjust',  icon: 'adjust'  },
  { id: 'caption', label: 'Caption', icon: 'caption' },
  { id: 'speed',   label: 'Speed',   icon: 'speed'   },
  { id: 'audio',   label: 'Audio',   icon: 'vol'     },
]

const fmt = s => {
  if (!s && s !== 0) return '0:00.0'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`
}

const INP  = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '8px 11px', color: '#f0f0f5', fontFamily: "'DM Sans',sans-serif", fontSize: 12, outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }
const CARD = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }

export default function VideoEditorPage() {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const fileInputRef = useRef(null)
  const tlRef      = useRef(null)
  const rafRef     = useRef(null)
  const trimEndRef = useRef(0)
  const stateRef   = useRef({})
  const recorderRef   = useRef(null)
  const recChunksRef  = useRef([])

  const [videoFile,    setVideoFile]    = useState(null)
  const [videoUrl,     setVideoUrl]     = useState(null)
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [curTime,      setCurTime]      = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [volume,       setVolume]       = useState(1)
  const [trimStart,    setTrimStart]    = useState(0)
  const [trimEnd,      setTrimEnd]      = useState(0)
  const [draggingTrim, setDraggingTrim] = useState(null)
  const [activeTool,   setActiveTool]   = useState('trim')
  const [activeFilter, setActiveFilter] = useState('None')
  const [speed,        setSpeed]        = useState(1)
  const [brightness,   setBrightness]   = useState(100)
  const [contrast,     setContrast]     = useState(100)
  const [saturation,   setSaturation]   = useState(100)
  const [overlays,     setOverlays]     = useState([])
  const [selOverlay,   setSelOverlay]   = useState(null)
  const [txtContent,   setTxtContent]   = useState('')
  const [txtColor,     setTxtColor]     = useState('#FFFFFF')
  const [txtFont,      setTxtFont]      = useState('Impact')
  const [txtSize,      setTxtSize]      = useState(36)
  const [txtBg,        setTxtBg]        = useState(false)
  const [draggingTxt,  setDraggingTxt]  = useState(false)
  const [dragOff,      setDragOff]      = useState({ x: 0, y: 0 })
  const [captions,     setCaptions]     = useState([])
  const [capText,      setCapText]      = useState('')
  const [capStart,     setCapStart]     = useState(0)
  const [capEnd,       setCapEnd]       = useState(3)
  const [autoLoading,  setAutoLoading]  = useState(false)
  const [autoError,    setAutoError]    = useState('')
  const [autoSuccess,  setAutoSuccess]  = useState('')
  const [exporting,    setExporting]    = useState(false)
  const [exportPct,    setExportPct]    = useState(0)
  const [exportDone,   setExportDone]   = useState(false)
  const [exportMode,   setExportMode]   = useState('browser') // browser | server
  const [serverExportRes, setServerExportRes] = useState(null)
  const [fileInfo,     setFileInfo]     = useState(null)
  const [uploading,    setUploading]    = useState(false)

  useEffect(() => {
    stateRef.current = { overlays, captions, activeFilter, brightness, contrast, saturation, selOverlay }
  }, [overlays, captions, activeFilter, brightness, contrast, saturation, selOverlay])
  useEffect(() => { trimEndRef.current = trimEnd }, [trimEnd])

  const reset = () => {
    setIsPlaying(false); setCurTime(0); setOverlays([]); setCaptions([])
    setExportDone(false); setActiveFilter('None'); setBrightness(100)
    setContrast(100); setSaturation(100); setSpeed(1)
    setAutoError(''); setAutoSuccess(''); setServerExportRes(null); setFileInfo(null)
  }

  const loadFile = async file => {
    if (!file || !file.type.startsWith('video/')) return
    reset()
    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))

    // Also upload to server for FFmpeg export
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const r = await fetch(`${API}/api/clipping/editor/upload`, { method: 'POST', body: form })
      const d = await r.json()
      if (r.ok) setFileInfo(d)
    } catch {}
    setUploading(false)
  }

  useEffect(() => {
    const v = videoRef.current; if (!v || !videoUrl) return
    v.src = videoUrl; v.load()
  }, [videoUrl])

  const onLoadedMetadata = () => {
    const v = videoRef.current; if (!v) return
    const d = v.duration || 0
    setDuration(d); setTrimStart(0); setTrimEnd(d)
    trimEndRef.current = d; setCapEnd(Math.min(3, d)); v.currentTime = 0.01
  }

  const drawFrame = useCallback(t => {
    const canvas = canvasRef.current, video = videoRef.current
    if (!canvas || !video || video.readyState < 2) return
    const { overlays, captions, activeFilter, brightness, contrast, saturation, selOverlay } = stateRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720
    const preset = FILTERS.find(f => f.name === activeFilter)
    const cf = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
    ctx.filter = preset?.css ? `${preset.css} ${cf}` : cf
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.filter = 'none'
    const cap = (captions || []).find(c => t >= c.start && t <= c.end)
    if (cap) {
      const fs = Math.round(canvas.height * 0.055)
      ctx.font = `bold ${fs}px Impact`
      const mw = ctx.measureText(cap.text).width
      ctx.fillStyle = 'rgba(0,0,0,0.65)'
      ctx.fillRect((canvas.width - mw) / 2 - 20, canvas.height * 0.82 - fs, mw + 40, fs + 20)
      ctx.fillStyle = '#FFF'; ctx.textAlign = 'center'
      ctx.fillText(cap.text, canvas.width / 2, canvas.height * 0.82 + 10)
    }
    ;(overlays || []).forEach((ov, idx) => {
      const fs = ov.size || 36
      ctx.font = `bold ${fs}px ${ov.font || 'Impact'}`
      if (ov.bg) {
        const mw = ctx.measureText(ov.text).width
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(ov.x - 8, ov.y - fs, mw + 16, fs + 12)
      }
      ctx.fillStyle = ov.color || '#FFF'; ctx.textAlign = 'left'
      ctx.fillText(ov.text, ov.x, ov.y)
      if (selOverlay === idx) {
        const mw = ctx.measureText(ov.text).width
        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2; ctx.setLineDash([5, 3])
        ctx.strokeRect(ov.x - 6, ov.y - fs - 4, mw + 12, fs + 16); ctx.setLineDash([])
      }
    })
  }, [])

  const onSeeked = useCallback(() => { if (videoRef.current) drawFrame(videoRef.current.currentTime) }, [drawFrame])
  useEffect(() => {
    const v = videoRef.current; if (!v) return
    v.addEventListener('seeked', onSeeked); return () => v.removeEventListener('seeked', onSeeked)
  }, [onSeeked])
  useEffect(() => {
    if (!isPlaying && videoRef.current?.readyState >= 2) drawFrame(videoRef.current.currentTime)
  }, [overlays, captions, activeFilter, brightness, contrast, saturation, selOverlay, drawFrame])

  const tick = useCallback(() => {
    const v = videoRef.current; if (!v) return
    const t = v.currentTime; setCurTime(t); drawFrame(t)
    if (t >= trimEndRef.current) { v.pause(); setIsPlaying(false); return }
    rafRef.current = requestAnimationFrame(tick)
  }, [drawFrame])
  useEffect(() => {
    if (isPlaying) { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(tick) }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, tick])

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return
    if (isPlaying) { v.pause(); setIsPlaying(false); cancelAnimationFrame(rafRef.current) }
    else { if (v.currentTime >= trimEndRef.current) v.currentTime = trimStart; v.play(); setIsPlaying(true) }
  }
  const seekTo = e => {
    if (!tlRef.current || !duration) return
    const r = tlRef.current.getBoundingClientRect()
    const t = Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration))
    if (videoRef.current) videoRef.current.currentTime = t; setCurTime(t)
  }
  useEffect(() => {
    const onMove = e => {
      if (!draggingTrim || !tlRef.current) return
      const r = tlRef.current.getBoundingClientRect()
      const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration
      if (draggingTrim === 'start') setTrimStart(Math.min(t, trimEnd - 0.5))
      if (draggingTrim === 'end')   setTrimEnd(Math.max(t, trimStart + 0.5))
    }
    const onUp = () => setDraggingTrim(null)
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [draggingTrim, duration, trimStart, trimEnd])

  const cPos = e => { const c = canvasRef.current, r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) } }
  const onCDown = e => {
    const pos = cPos(e), ctx = canvasRef.current.getContext('2d')
    for (let i = overlays.length - 1; i >= 0; i--) {
      const ov = overlays[i]; ctx.font = `bold ${ov.size || 36}px ${ov.font || 'Impact'}`
      const mw = ctx.measureText(ov.text).width
      if (pos.x >= ov.x - 8 && pos.x <= ov.x + mw + 8 && pos.y >= ov.y - (ov.size || 36) - 4 && pos.y <= ov.y + 12) {
        setSelOverlay(i); setDraggingTxt(true); setDragOff({ x: pos.x - ov.x, y: pos.y - ov.y }); return
      }
    }
    setSelOverlay(null)
  }
  const onCMove = e => {
    if (!draggingTxt || selOverlay === null) return
    const pos = cPos(e)
    setOverlays(p => p.map((ov, i) => i === selOverlay ? { ...ov, x: pos.x - dragOff.x, y: pos.y - dragOff.y } : ov))
  }
  const addText    = () => { if (!txtContent.trim()) return; setOverlays(p => [...p, { text: txtContent, x: 100, y: 150, color: txtColor, font: txtFont, size: txtSize, bg: txtBg }]); setTxtContent('') }
  const addCaption = () => { if (!capText.trim()) return; setCaptions(p => [...p, { text: capText, start: capStart, end: capEnd }]); setCapText('') }

  // ── EXPORT — Browser MediaRecorder (includes all canvas edits) ────────────
  const handleBrowserExport = async () => {
    const canvas = canvasRef.current, video = videoRef.current
    if (!canvas || !video) return
    setExporting(true); setExportPct(0); setExportDone(false)
    recChunksRef.current = []

    // Seek to trim start
    video.currentTime = trimStart
    await new Promise(r => { video.addEventListener('seeked', r, { once: true }) })

    // Capture canvas stream
    const canvasStream = canvas.captureStream(30)
    const audioCtx     = new AudioContext()
    const src          = audioCtx.createMediaElementSource(video)
    const dst          = audioCtx.createMediaStreamDestination()
    src.connect(dst); src.connect(audioCtx.destination)
    const audioTrack   = dst.stream.getAudioTracks()[0]
    if (audioTrack) canvasStream.addTrack(audioTrack)

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm'

    const recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: 5_000_000 })
    recorderRef.current = recorder
    recorder.ondataavailable = e => { if (e.data.size > 0) recChunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(recChunksRef.current, { type: mimeType })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `edited_${videoFile?.name?.replace(/\.[^.]+$/, '') || 'video'}.webm`
      a.click()
      URL.revokeObjectURL(url)
      setExporting(false); setExportDone(true)
      cancelAnimationFrame(rafRef.current)
    }

    recorder.start(100)
    video.playbackRate = speed
    video.play()
    setIsPlaying(true)

    const clipDur = trimEnd - trimStart
    const startMs = Date.now()
    const progIv  = setInterval(() => {
      const elapsed = (Date.now() - startMs) / 1000
      setExportPct(Math.min(99, (elapsed / (clipDur / speed)) * 100))
    }, 500)

    // Stop when trim end reached
    const checkEnd = () => {
      if (video.currentTime >= trimEnd) {
        clearInterval(progIv); video.pause()
        setIsPlaying(false); recorder.stop()
        return
      }
      setTimeout(checkEnd, 100)
    }
    checkEnd()

    // Draw frames during recording
    const recordTick = () => {
      if (!recorderRef.current || recorder.state !== 'recording') return
      drawFrame(video.currentTime)
      rafRef.current = requestAnimationFrame(recordTick)
    }
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(recordTick)
  }

  // ── EXPORT — Server FFmpeg (trim only, no filters) ────────────────────────
  const handleServerExport = async () => {
    if (!fileInfo) { alert('Video not uploaded to server yet. Wait a moment.'); return }
    setExporting(true); setExportPct(0); setServerExportRes(null)

    // Simulate progress
    const iv = setInterval(() => setExportPct(p => Math.min(p + 8, 92)), 800)

    try {
      const form = new FormData()
      form.append('file_id',    fileInfo.file_id)
      form.append('start_time', String(trimStart))
      form.append('end_time',   String(trimEnd))
      const r = await fetch(`${API}/api/clipping/editor/trim`, { method: 'POST', body: form })
      const d = await r.json()
      clearInterval(iv)
      if (!r.ok) throw new Error(d.detail || 'Trim failed.')
      setExportPct(100); setServerExportRes(d); setExportDone(true)
    } catch (e) { clearInterval(iv); alert('Export failed: ' + e.message) }
    setExporting(false)
  }

  const handleExport = () => {
    if (exportMode === 'server') handleServerExport()
    else handleBrowserExport()
  }

  const handleAutoCaption = async () => {
    if (!fileInfo) { setAutoError('Upload the video first (wait for upload indicator)'); return }
    setAutoLoading(true); setAutoError(''); setAutoSuccess('')
    try {
      const form = new FormData()
      form.append('file_id', fileInfo.file_id)
      const r = await fetch(`${API}/api/clipping/editor/caption`, { method: 'POST', body: form })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Caption failed.')
      if (d.transcript) {
        // Convert transcript to timed captions (split into ~4 second chunks)
        const words = d.transcript.split(' ')
        const chunkSize = 6
        const generated = []
        const secPerWord = (trimEnd - trimStart) / Math.max(words.length, 1)
        for (let i = 0; i < words.length; i += chunkSize) {
          const chunk = words.slice(i, i + chunkSize).join(' ')
          const start = trimStart + i * secPerWord
          const end   = Math.min(start + chunkSize * secPerWord, trimEnd)
          generated.push({ text: chunk, start: parseFloat(start.toFixed(1)), end: parseFloat(end.toFixed(1)) })
        }
        setCaptions(generated)
        setAutoSuccess(`✅ ${generated.length} captions generated!`)
      }
      // Also offer server-burned version
      if (d.download_url) {
        setServerExportRes(d)
        setAutoSuccess(`✅ Captions burned! Download below.`)
      }
    } catch (e) { setAutoError(e.message) }
    setAutoLoading(false)
  }

  const changeSpeed  = s => { setSpeed(s);  if (videoRef.current) videoRef.current.playbackRate = s }
  const changeVolume = v => { setVolume(v); if (videoRef.current) videoRef.current.volume = v }

  // ─── UPLOAD SCREEN ─────────────────────────────────────────────────────────
  if (!videoUrl) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans',sans-serif", padding: '36px' }}>
      <style>{`.ve-drop:hover{border-color:rgba(99,102,241,0.55)!important;background:rgba(99,102,241,0.04)!important;} @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
          <Ico d={IC.cut} s={17} c="#fff" />
        </div>
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 22, color: '#f0f0f5', lineHeight: 1 }}>Video Editor</h1>
          <p style={{ color: '#4b5563', fontSize: 12, marginTop: 2 }}>Trim · Text Overlays · Filters · Captions · Export with edits</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
        <div style={{ width: '100%', maxWidth: 680 }}>
          <div className="ve-drop"
            onDrop={e => { e.preventDefault(); loadFile(e.dataTransfer.files[0]) }}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 24, padding: '80px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, cursor: 'pointer', transition: 'all .25s', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={IC.upload} s={36} c="#6366f1" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24, color: '#f0f0f5', marginBottom: 8 }}>Drop your video here</p>
              <p style={{ color: '#4b5563', fontSize: 14 }}>or click to browse · MP4, MOV, AVI, WebM</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 }}>
              {['✂️ Trim & Cut', '📝 Text Overlay', '🎨 Filters', '🎙️ Auto Captions', '⚡ Speed Control', '🎚️ Color Grading', '📹 Export w/ Edits'].map(f => (
                <span key={f} style={{ padding: '5px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 100, color: '#818cf8', fontSize: 12 }}>{f}</span>
              ))}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="video/*" onChange={e => loadFile(e.target.files[0])} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  )

  // ─── EDITOR LAYOUT ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', overflow: 'hidden' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap'); .vb{cursor:pointer;border:none;transition:all .15s;font-family:'DM Sans',sans-serif;}.vb:hover{filter:brightness(1.18);}.vb:disabled{opacity:.4;cursor:not-allowed;filter:none;}.vtool{cursor:pointer;border:none;transition:all .15s;}.vtool:hover{background:rgba(99,102,241,0.1)!important;color:#a5b4fc!important;}.rp::-webkit-scrollbar{width:3px;}.rp::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:99px;}.vinp::placeholder{color:#374151;}.vinp:focus{border-color:rgba(99,102,241,0.5)!important;}input[type=range]{accent-color:#6366f1;}`}</style>

      {/* TOP BAR */}
      <div style={{ height: 50, background: '#0d0d14', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0, zIndex: 10 }}>
        <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ico d={IC.cut} s={13} c="#fff" />
        </div>
        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13 }}>Video Editor</span>
        <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 18 }}>│</span>
        <span style={{ color: '#4b5563', fontSize: 11, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{videoFile?.name}</span>
        {uploading && <span style={{ fontSize: 10, color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 6 }}>↑ uploading to server...</span>}
        {fileInfo && !uploading && <span style={{ fontSize: 10, color: '#6ee7b7', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 6 }}>✓ server ready</span>}
        <div style={{ flex: 1 }} />

        {/* Export mode toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {[['browser','🎨 With Edits'],['server','⚡ FFmpeg Trim']].map(([m,l]) => (
            <button key={m} className="vb" onClick={() => setExportMode(m)}
              style={{ padding: '5px 10px', fontSize: 10, fontWeight: 700, background: exportMode===m ? 'rgba(99,102,241,0.3)' : 'transparent', color: exportMode===m ? '#a5b4fc' : '#6b7280', borderRight: m==='browser' ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              {l}
            </button>
          ))}
        </div>

        <button className="vb" onClick={() => { setVideoUrl(null); setVideoFile(null); reset() }} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: 11 }}>New Video</button>
        <button className="vb" onClick={handleExport} disabled={exporting} style={{ padding: '6px 16px', borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 3px 12px rgba(99,102,241,0.35)' }}>
          {exporting ? <><div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />{Math.round(exportPct)}%</> : exportDone ? '✅ Done!' : <><Ico d={IC.dl} s={12} c="#fff" />Export</>}
        </button>
      </div>

      {/* BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT TOOLS */}
        <div style={{ width: 58, background: '#0d0d14', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: 2, flexShrink: 0 }}>
          {TOOLS.map(t => (
            <button key={t.id} className="vtool" onClick={() => setActiveTool(t.id)} style={{ width: 46, height: 50, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: activeTool === t.id ? 'rgba(99,102,241,0.15)' : 'transparent', color: activeTool === t.id ? '#a5b4fc' : '#4b5563', border: `1px solid ${activeTool === t.id ? 'rgba(99,102,241,0.35)' : 'transparent'}` }}>
              <Ico d={IC[t.icon]} s={14} c="currentColor" />
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* CANVAS COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          <div style={{ flex: 1, background: '#060608', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <video ref={videoRef} style={{ display: 'none' }} onLoadedMetadata={onLoadedMetadata} onEnded={() => setIsPlaying(false)} playsInline preload="auto" crossOrigin="anonymous" />
            <canvas ref={canvasRef}
              style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', cursor: activeTool === 'text' ? 'crosshair' : 'default', background: '#000' }}
              onMouseDown={onCDown} onMouseMove={onCMove} onMouseUp={() => setDraggingTxt(false)} />

            {!isPlaying && (
              <button onClick={togglePlay} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: 66, height: 66, background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(10px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.15)' }}>
                  <Ico d={IC.play} s={22} c="#fff" />
                </div>
              </button>
            )}

            <div style={{ position: 'absolute', bottom: 12, left: 14, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(6px)', borderRadius: 7, padding: '3px 10px', fontFamily: 'monospace', fontSize: 11, color: '#d1d5db', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.06)' }}>
              {fmt(curTime)} / {fmt(duration)}
            </div>
            {activeFilter !== 'None' && <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(99,102,241,0.85)', borderRadius: 7, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff', pointerEvents: 'none' }}>{activeFilter}</div>}
            {speed !== 1 && <div style={{ position: 'absolute', top: 12, left: 14, background: 'rgba(245,158,11,0.85)', borderRadius: 7, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff', pointerEvents: 'none' }}>{speed}×</div>}

            {/* Export mode notice */}
            {exportMode === 'browser' && (
              <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(99,102,241,0.85)', borderRadius: 7, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#fff', pointerEvents: 'none' }}>🎨 Export includes all edits</div>
            )}

            {/* Export in progress overlay */}
            {exporting && exportMode === 'browser' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <p style={{ color: '#a5b4fc', fontWeight: 700, fontSize: 15 }}>🎬 Recording with edits... {Math.round(exportPct)}%</p>
                <div style={{ width: 280, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99 }}>
                  <div style={{ height: 6, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 99, width: `${exportPct}%`, transition: 'width .5s' }} />
                </div>
                <p style={{ color: '#4b5563', fontSize: 11 }}>Don't close the window — video is being recorded</p>
              </div>
            )}
          </div>

          {/* PLAYBACK BAR */}
          <div style={{ background: '#0d0d14', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '11px 18px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
              <button onClick={togglePlay} style={{ width: 36, height: 36, background: '#6366f1', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}>
                <Ico d={isPlaying ? IC.pause : IC.play} s={14} c="#fff" />
              </button>
              <span style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'monospace', flexShrink: 0 }}>{fmt(curTime)} / {fmt(duration)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ico d={IC.vol} s={12} c="#4b5563" />
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => changeVolume(Number(e.target.value))} style={{ width: 75 }} />
              </div>
              <div style={{ flex: 1 }} />
              <span style={{ color: '#374151', fontSize: 10, fontFamily: 'monospace' }}>
                Clip: {fmt(trimStart)} — {fmt(trimEnd)} <span style={{ color: '#4b5563' }}>({fmt(trimEnd - trimStart)})</span>
              </span>
            </div>

            {/* TIMELINE */}
            <div ref={tlRef} onClick={seekTo} style={{ position: 'relative', height: 42, background: 'rgba(255,255,255,0.04)', borderRadius: 9, cursor: 'pointer', overflow: 'visible' }}>
              {duration > 0 && <>
                <div style={{ position: 'absolute', top: 0, bottom: 0, background: 'rgba(99,102,241,0.1)', borderTop: '2px solid rgba(99,102,241,0.4)', borderBottom: '2px solid rgba(99,102,241,0.4)', pointerEvents: 'none', left: `${(trimStart / duration) * 100}%`, width: `${((trimEnd - trimStart) / duration) * 100}%` }} />
                {captions.map((c, i) => (
                  <div key={i} style={{ position: 'absolute', top: 0, height: 5, background: 'rgba(251,191,36,0.65)', borderRadius: 2, pointerEvents: 'none', left: `${(c.start / duration) * 100}%`, width: `${Math.max(0.5, ((c.end - c.start) / duration) * 100)}%` }} />
                ))}
                {(['start', 'end']).map(side => (
                  <div key={side} onMouseDown={e => { e.stopPropagation(); setDraggingTrim(side) }}
                    style={{ position: 'absolute', top: 0, bottom: 0, width: 10, background: '#6366f1', cursor: 'ew-resize', zIndex: 10, borderRadius: side === 'start' ? '5px 0 0 5px' : '0 5px 5px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', left: `calc(${(side === 'start' ? trimStart : trimEnd) / duration * 100}% - 5px)` }}>
                    <div style={{ width: 2, height: 14, background: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
                  </div>
                ))}
                <div style={{ position: 'absolute', top: -3, bottom: -3, width: 2, background: '#fff', zIndex: 20, pointerEvents: 'none', left: `${(curTime / duration) * 100}%` }}>
                  <div style={{ width: 9, height: 9, background: '#fff', borderRadius: '50%', marginLeft: -3.5 }} />
                </div>
                {Array.from({ length: Math.min(Math.floor(duration), 24) + 1 }).map((_, i) => {
                  const t = i * (duration / Math.min(Math.floor(duration), 24))
                  return <div key={i} style={{ position: 'absolute', bottom: 0, left: `${(t / duration) * 100}%`, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}><div style={{ width: 1, height: 5, background: 'rgba(255,255,255,0.07)' }} /><span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 7, marginTop: 1 }}>{Math.floor(t)}s</span></div>
                })}
              </>}
            </div>
          </div>
        </div>

        {/* RIGHT PROPERTIES PANEL */}
        <div className="rp" style={{ width: 272, background: '#0d0d14', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 1 }}>{TOOLS.find(t => t.id === activeTool)?.label}</p>
          </div>

          <div className="rp" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>

            {/* TRIM */}
            {activeTool === 'trim' && <div>
              <div style={{ ...CARD, padding: 14, marginBottom: 10 }}>
                {[{ label: 'Start Point', val: trimStart, set: v => setTrimStart(Math.min(v, trimEnd - 0.5)) }, { label: 'End Point', val: trimEnd, set: v => setTrimEnd(Math.max(v, trimStart + 0.5)) }].map(it => (
                  <div key={it.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <label style={{ color: '#6b7280', fontSize: 11 }}>{it.label}</label>
                      <span style={{ color: '#a5b4fc', fontSize: 10, fontFamily: 'monospace' }}>{fmt(it.val)}</span>
                    </div>
                    <input type="range" min="0" max={duration || 1} step="0.1" value={it.val} onChange={e => it.set(Number(e.target.value))} style={{ width: '100%' }} />
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#6b7280' }}>Clip Duration</span><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmt(trimEnd - trimStart)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#6b7280' }}>Trimmed Out</span><span style={{ color: '#f87171', fontFamily: 'monospace' }}>{fmt(duration - (trimEnd - trimStart))}</span></div>
                </div>
              </div>
              <button className="vb" onClick={() => { setTrimStart(0); setTrimEnd(duration) }} style={{ width: '100%', padding: '8px 0', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: 12, marginBottom: 10 }}>Reset Trim</button>
              <div style={{ ...CARD, padding: 10 }}><p style={{ fontSize: 10, color: '#374151', lineHeight: 1.7 }}>💡 Drag the <span style={{ color: '#a5b4fc' }}>purple handles</span> on the timeline or use the sliders above.</p></div>
            </div>}

            {/* TEXT */}
            {activeTool === 'text' && <div>
              <div style={{ ...CARD, padding: 14, marginBottom: 10 }}>
                <textarea className="vinp" value={txtContent} onChange={e => setTxtContent(e.target.value)} placeholder="Enter overlay text..." rows={2} style={{ ...INP, resize: 'none', marginBottom: 10 }} />
                <label style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 5 }}>FONT</label>
                <select value={txtFont} onChange={e => setTxtFont(e.target.value)} style={{ ...INP, marginBottom: 10, cursor: 'pointer' }}>
                  {FONTS.map(f => <option key={f} value={f} style={{ background: '#0d0d14' }}>{f}</option>)}
                </select>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><label style={{ color: '#6b7280', fontSize: 10, fontWeight: 700 }}>SIZE</label><span style={{ color: '#a5b4fc', fontSize: 10 }}>{txtSize}px</span></div>
                  <input type="range" min="14" max="120" value={txtSize} onChange={e => setTxtSize(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <label style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 6 }}>COLOR</label>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                  {COLORS.map(c => <button key={c} onClick={() => setTxtColor(c)} style={{ width: 22, height: 22, borderRadius: 5, background: c, border: txtColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />)}
                  <input type="color" value={txtColor} onChange={e => setTxtColor(e.target.value)} style={{ width: 22, height: 22, borderRadius: 5, cursor: 'pointer', border: 0, background: 'transparent' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }} onClick={() => setTxtBg(!txtBg)}>
                  <div style={{ width: 34, height: 18, borderRadius: 100, background: txtBg ? '#6366f1' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background .2s' }}>
                    <div style={{ width: 12, height: 12, background: '#fff', borderRadius: '50%', position: 'absolute', top: 3, left: txtBg ? 19 : 3, transition: 'left .2s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>Background box</span>
                </div>
                <button className="vb" onClick={addText} disabled={!txtContent.trim()} style={{ width: '100%', padding: '9px 0', borderRadius: 10, background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 700 }}>+ Add to Canvas</button>
              </div>
              {overlays.length > 0 && <div>
                <p style={{ color: '#374151', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>OVERLAYS ({overlays.length})</p>
                {overlays.map((ov, i) => (
                  <div key={i} onClick={() => setSelOverlay(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 9, border: `1px solid ${selOverlay === i ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)'}`, background: selOverlay === i ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', marginBottom: 4 }}>
                    <div style={{ width: 13, height: 13, borderRadius: 3, background: ov.color, flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' }} />
                    <span style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ov.text}</span>
                    <button onClick={e => { e.stopPropagation(); setOverlays(p => p.filter((_, j) => j !== i)); setSelOverlay(null) }} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', padding: 0 }}><Ico d={IC.close} s={10} c="currentColor" /></button>
                  </div>
                ))}
              </div>}
            </div>}

            {/* FILTER */}
            {activeTool === 'filter' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {FILTERS.map(f => (
                <button key={f.name} className="vb" onClick={() => setActiveFilter(f.name)} style={{ padding: '13px 8px', borderRadius: 10, fontSize: 12, textAlign: 'center', fontFamily: "'DM Sans',sans-serif", background: activeFilter === f.name ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeFilter === f.name ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)'}`, color: activeFilter === f.name ? '#a5b4fc' : '#6b7280' }}>
                  {f.name}
                </button>
              ))}
            </div>}

            {/* ADJUST */}
            {activeTool === 'adjust' && <div style={{ ...CARD, padding: 14 }}>
              {[{ label: 'Brightness', val: brightness, set: setBrightness, min: 50, max: 150 }, { label: 'Contrast', val: contrast, set: setContrast, min: 50, max: 200 }, { label: 'Saturation', val: saturation, set: setSaturation, min: 0, max: 200 }].map(a => (
                <div key={a.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ color: '#6b7280', fontSize: 11 }}>{a.label}</label>
                    <span style={{ color: '#a5b4fc', fontSize: 10, fontFamily: 'monospace' }}>{a.val}%</span>
                  </div>
                  <input type="range" min={a.min} max={a.max} value={a.val} onChange={e => a.set(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
              ))}
              <button className="vb" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100) }} style={{ width: '100%', padding: '8px 0', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: 12 }}>Reset All</button>
            </div>}

            {/* CAPTION */}
            {activeTool === 'caption' && <div>
              <div style={{ borderRadius: 12, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.07)', padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div><p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Syne,sans-serif', marginBottom: 2 }}>🎙️ AI Auto Captions</p><p style={{ fontSize: 10, color: '#a78bfa' }}>Groq Whisper · speech-to-text</p></div>
                </div>
                {autoError && <div style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 8 }}><p style={{ color: '#f87171', fontSize: 11 }}>⚠️ {autoError}</p></div>}
                {autoSuccess && <div style={{ padding: '8px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, marginBottom: 8 }}><p style={{ color: '#6ee7b7', fontSize: 11 }}>{autoSuccess}</p></div>}
                <button className="vb" onClick={handleAutoCaption} disabled={autoLoading || !fileInfo} style={{ width: '100%', padding: '9px 0', background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', borderRadius: 9, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  {autoLoading ? <><div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Transcribing...</> : '🎙️ Generate Captions'}
                </button>
                {!fileInfo && <p style={{ fontSize: 9, color: '#4b5563', marginTop: 6, textAlign: 'center' }}>Waiting for server upload...</p>}
              </div>

              {/* Server-burned captions download */}
              {serverExportRes?.download_url && (
                <a href={`${API}${serverExportRes.download_url}`} download
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 9, color: '#6ee7b7', textDecoration: 'none', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                  <Ico d={IC.dl} s={13} c="#6ee7b7" /> Download Captioned Video
                </a>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ color: '#374151', fontSize: 9, fontWeight: 700 }}>OR ADD MANUAL</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <div style={{ ...CARD, padding: 12, marginBottom: 10 }}>
                <textarea className="vinp" value={capText} onChange={e => setCapText(e.target.value)} placeholder="Caption text..." rows={2} style={{ ...INP, resize: 'none', marginBottom: 8 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 8 }}>
                  {[{ label: 'Start (s)', val: capStart, set: setCapStart }, { label: 'End (s)', val: capEnd, set: setCapEnd }].map(f => (
                    <div key={f.label}><label style={{ color: '#6b7280', fontSize: 10, display: 'block', marginBottom: 4 }}>{f.label}</label><input type="number" min="0" max={duration} step="0.1" value={f.val} onChange={e => f.set(Number(e.target.value))} className="vinp" style={INP} /></div>
                  ))}
                </div>
                <button className="vb" onClick={addCaption} disabled={!capText.trim()} style={{ width: '100%', padding: '8px 0', background: '#8b5cf6', color: '#fff', borderRadius: 9, fontSize: 12, fontWeight: 700 }}>+ Add Caption</button>
              </div>

              {captions.length > 0 && <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 700 }}>CAPTIONS ({captions.length})</span>
                  <button onClick={() => setCaptions([])} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 11 }}>Clear All</button>
                </div>
                {captions.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 9px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: 11, lineHeight: 1.5 }}>{c.text}</p><p style={{ fontSize: 9, color: '#374151', fontFamily: 'monospace', marginTop: 2 }}>{fmt(c.start)} → {fmt(c.end)}</p></div>
                    <button onClick={() => setCaptions(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', padding: 0, flexShrink: 0 }}><Ico d={IC.close} s={10} c="currentColor" /></button>
                  </div>
                ))}
              </div>}
            </div>}

            {/* SPEED */}
            {activeTool === 'speed' && <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}>
                {SPEEDS.map(s => <button key={s} className="vb" onClick={() => changeSpeed(s)} style={{ padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 800, fontFamily: 'Syne,sans-serif', background: speed === s ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${speed === s ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, color: speed === s ? '#a5b4fc' : '#6b7280' }}>{s}×{s === 1 ? ' ✓' : ''}</button>)}
              </div>
              <div style={{ ...CARD, padding: 10 }}><p style={{ fontSize: 10, color: '#374151', lineHeight: 1.7 }}>💡 <span style={{ color: '#a5b4fc' }}>Speed affects export</span> — use "🎨 With Edits" mode to include speed changes in export.</p></div>
            </div>}

            {/* AUDIO */}
            {activeTool === 'audio' && <div style={{ ...CARD, padding: 14 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><label style={{ color: '#6b7280', fontSize: 11 }}>Volume</label><span style={{ color: '#a5b4fc', fontSize: 10, fontFamily: 'monospace' }}>{Math.round(volume * 100)}%</span></div>
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => changeVolume(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                <label style={{ color: '#6b7280', fontSize: 11, display: 'block', marginBottom: 8 }}>Background Music</label>
                {['No Music', 'Upbeat Pop', 'Chill Lo-fi', 'Epic Cinematic', 'Corporate'].map(name => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginBottom: 5 }}>
                    <span>{name === 'No Music' ? '🔇' : '🎵'}</span>
                    <span style={{ fontSize: 12, color: '#4b5563' }}>{name}</span>
                    {name !== 'No Music' && <span style={{ marginLeft: 'auto', fontSize: 9, color: '#1f2937', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 5 }}>Coming Soon</span>}
                  </div>
                ))}
              </div>
            </div>}
          </div>

          {/* Export footer */}
          <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            {/* Export mode info */}
            <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: exportMode === 'browser' ? 'rgba(99,102,241,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${exportMode === 'browser' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
              <p style={{ fontSize: 10, color: exportMode === 'browser' ? '#a5b4fc' : '#6ee7b7', lineHeight: 1.6 }}>
                {exportMode === 'browser'
                  ? '🎨 Includes: filters, text, captions, speed, brightness. Exports as WebM.'
                  : '⚡ FFmpeg trim only. Faster, MP4 output. No filters/text.'}
              </p>
            </div>

            {exporting && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}><span style={{ color: '#6b7280' }}>Exporting…</span><span style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>{Math.round(exportPct)}%</span></div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}><div style={{ height: 4, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 99, transition: 'width .3s', width: `${exportPct}%` }} /></div>
              </div>
            )}

            {exportDone && exportMode === 'server' && serverExportRes && (
              <a href={`${API}${serverExportRes.download_url}`} download
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 9, color: '#6ee7b7', textDecoration: 'none', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                <Ico d={IC.dl} s={13} c="#6ee7b7" /> Download MP4
              </a>
            )}
            {exportDone && exportMode === 'browser' && (
              <div style={{ marginBottom: 10, padding: '8px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10 }}>
                <p style={{ color: '#6ee7b7', fontSize: 12, fontWeight: 600 }}>✅ Exported with all edits!</p>
              </div>
            )}

            <button className="vb" onClick={handleExport} disabled={exporting} style={{ width: '100%', padding: '11px 0', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
              {exporting ? `Exporting ${Math.round(exportPct)}%` : exportMode === 'browser' ? '🎨 Export With Edits' : '⚡ Export MP4 (Trim)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}