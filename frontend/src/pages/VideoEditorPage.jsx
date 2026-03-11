import { useState, useRef, useEffect, useCallback } from 'react'

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icons = {
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
  zoom:    "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35M11 8v6M8 11h6",
  mic:     "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8",
}

const FONTS   = ['Impact', 'Arial Black', 'Georgia', 'Courier New', 'Trebuchet MS', 'Comic Sans MS']
const COLORS  = ['#FFFFFF','#000000','#FF3B30','#FF9500','#FFCC00','#34C759','#007AFF','#AF52DE']
const FILTERS = [
  { name:'None',  css:'',                                              emoji:'⬜' },
  { name:'Vivid', css:'saturate(1.8) contrast(1.1)',                  emoji:'🌈' },
  { name:'Matte', css:'saturate(0.8) brightness(1.05)',               emoji:'🟤' },
  { name:'B&W',   css:'grayscale(1)',                                  emoji:'⬛' },
  { name:'Warm',  css:'sepia(0.4) saturate(1.3)',                     emoji:'🟠' },
  { name:'Cool',  css:'hue-rotate(30deg) saturate(1.2)',              emoji:'🔵' },
  { name:'Drama', css:'contrast(1.4) saturate(1.2) brightness(0.9)', emoji:'🎭' },
  { name:'Fade',  css:'brightness(1.1) contrast(0.85) saturate(0.9)',emoji:'🌫️' },
]
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]
const TOOLS  = [
  { id:'trim',    label:'Trim',    icon:'cut'     },
  { id:'text',    label:'Text',    icon:'text'    },
  { id:'filter',  label:'Filter',  icon:'filter'  },
  { id:'adjust',  label:'Adjust',  icon:'zoom'    },
  { id:'caption', label:'Caption', icon:'caption' },
  { id:'speed',   label:'Speed',   icon:'speed'   },
  { id:'audio',   label:'Audio',   icon:'vol'     },
]

const fmt = (s) => {
  if (!s && s !== 0) return '0:00.0'
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}.${Math.floor((s%1)*10)}`
}

// ═════════════════════════════════════════════════════════════════════════════
export default function VideoEditorPage() {
  const videoRef     = useRef(null)
  const canvasRef    = useRef(null)
  const fileInputRef = useRef(null)
  const tlRef        = useRef(null)
  const rafRef       = useRef(null)
  const trimEndRef   = useRef(0)
  const stateRef     = useRef({})

  const [videoFile,  setVideoFile]  = useState(null)
  const [videoUrl,   setVideoUrl]   = useState(null)
  const [isPlaying,  setIsPlaying]  = useState(false)
  const [curTime,    setCurTime]    = useState(0)
  const [duration,   setDuration]   = useState(0)
  const [volume,     setVolume]     = useState(1)
  const [trimStart,  setTrimStart]  = useState(0)
  const [trimEnd,    setTrimEnd]    = useState(0)
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
  const [dragOff,      setDragOff]      = useState({ x:0, y:0 })
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

  // keep stateRef live
  useEffect(() => {
    stateRef.current = { overlays, captions, activeFilter, brightness, contrast, saturation, selOverlay }
  }, [overlays, captions, activeFilter, brightness, contrast, saturation, selOverlay])

  useEffect(() => { trimEndRef.current = trimEnd }, [trimEnd])

  // ─── LOAD ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setIsPlaying(false); setCurTime(0); setOverlays([]); setCaptions([])
    setExportDone(false); setActiveFilter('None')
    setBrightness(100); setContrast(100); setSaturation(100)
    setSpeed(1); setAutoError(''); setAutoSuccess('')
  }

  const loadFile = (file) => {
    if (!file || !file.type.startsWith('video/')) return
    reset(); setVideoFile(file); setVideoUrl(URL.createObjectURL(file))
  }

  useEffect(() => {
    const v = videoRef.current
    if (!v || !videoUrl) return
    v.src = videoUrl
    v.load()
  }, [videoUrl])

  const onLoadedMetadata = () => {
    const v = videoRef.current; if (!v) return
    const d = v.duration || 0
    setDuration(d); setTrimStart(0); setTrimEnd(d)
    trimEndRef.current = d
    setCapEnd(Math.min(3, d))
    // CRITICAL: seek to first frame so canvas paints
    v.currentTime = 0.01
  }

  // ─── CANVAS DRAW ───────────────────────────────────────────────────────────
  const drawFrame = useCallback((t) => {
    const canvas = canvasRef.current
    const video  = videoRef.current
    if (!canvas || !video || video.readyState < 2) return
    const { overlays, captions, activeFilter, brightness, contrast, saturation, selOverlay } = stateRef.current
    const ctx = canvas.getContext('2d')
    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720

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
      const px = 20, py = 10
      ctx.fillStyle = 'rgba(0,0,0,0.65)'
      ctx.fillRect((canvas.width - mw)/2 - px, canvas.height*0.82 - fs, mw + px*2, fs + py*2)
      ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'
      ctx.fillText(cap.text, canvas.width/2, canvas.height*0.82 + py)
    }

    ;(overlays || []).forEach((ov, idx) => {
      const fs = ov.size || 36
      ctx.font = `bold ${fs}px ${ov.font || 'Impact'}`
      if (ov.bg) {
        const mw = ctx.measureText(ov.text).width
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(ov.x-8, ov.y-fs, mw+16, fs+12)
      }
      ctx.fillStyle = ov.color || '#FFFFFF'; ctx.textAlign = 'left'
      ctx.fillText(ov.text, ov.x, ov.y)
      if (selOverlay === idx) {
        const mw = ctx.measureText(ov.text).width
        ctx.strokeStyle = '#007AFF'; ctx.lineWidth = 2; ctx.setLineDash([6,3])
        ctx.strokeRect(ov.x-6, ov.y-fs-4, mw+12, fs+16); ctx.setLineDash([])
      }
    })
  }, [])

  // Draw on seeked event (this fires after currentTime changes)
  const onSeeked = useCallback(() => {
    if (videoRef.current) drawFrame(videoRef.current.currentTime)
  }, [drawFrame])

  useEffect(() => {
    const v = videoRef.current; if (!v) return
    v.addEventListener('seeked', onSeeked)
    return () => v.removeEventListener('seeked', onSeeked)
  }, [onSeeked])

  // Redraw when visual state changes while paused
  useEffect(() => {
    if (!isPlaying && videoRef.current && videoRef.current.readyState >= 2)
      drawFrame(videoRef.current.currentTime)
  }, [overlays, captions, activeFilter, brightness, contrast, saturation, selOverlay, drawFrame])

  // ─── rAF LOOP ──────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const v = videoRef.current; if (!v) return
    const t = v.currentTime
    setCurTime(t); drawFrame(t)
    if (t >= trimEndRef.current) { v.pause(); setIsPlaying(false); return }
    rafRef.current = requestAnimationFrame(tick)
  }, [drawFrame])

  useEffect(() => {
    if (isPlaying) { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(tick) }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, tick])

  // ─── PLAYBACK ──────────────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current; if (!v) return
    if (isPlaying) { v.pause(); setIsPlaying(false); cancelAnimationFrame(rafRef.current) }
    else { if (v.currentTime >= trimEndRef.current) v.currentTime = trimStart; v.play(); setIsPlaying(true) }
  }

  // ─── TIMELINE SEEK ─────────────────────────────────────────────────────────
  const seekTo = (e) => {
    if (!tlRef.current || !duration) return
    const r = tlRef.current.getBoundingClientRect()
    const t = Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration))
    if (videoRef.current) videoRef.current.currentTime = t
    setCurTime(t)
  }

  // ─── TRIM DRAG ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      if (!draggingTrim || !tlRef.current) return
      const r = tlRef.current.getBoundingClientRect()
      const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration
      if (draggingTrim === 'start') setTrimStart(Math.min(t, trimEnd - 0.5))
      if (draggingTrim === 'end')   setTrimEnd(Math.max(t, trimStart + 0.5))
    }
    const onUp = () => setDraggingTrim(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [draggingTrim, duration, trimStart, trimEnd])

  // ─── CANVAS TEXT DRAG ──────────────────────────────────────────────────────
  const canvasPos = (e) => {
    const c = canvasRef.current, r = c.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }
  }
  const onCanvasDown = (e) => {
    const pos = canvasPos(e), ctx = canvasRef.current.getContext('2d')
    for (let i = overlays.length - 1; i >= 0; i--) {
      const ov = overlays[i]
      ctx.font = `bold ${ov.size||36}px ${ov.font||'Impact'}`
      const mw = ctx.measureText(ov.text).width
      if (pos.x >= ov.x-8 && pos.x <= ov.x+mw+8 && pos.y >= ov.y-(ov.size||36)-4 && pos.y <= ov.y+12) {
        setSelOverlay(i); setDraggingTxt(true); setDragOff({ x: pos.x-ov.x, y: pos.y-ov.y }); return
      }
    }
    setSelOverlay(null)
  }
  const onCanvasMove = (e) => {
    if (!draggingTxt || selOverlay === null) return
    const pos = canvasPos(e)
    setOverlays(prev => prev.map((ov,i) => i === selOverlay ? { ...ov, x: pos.x-dragOff.x, y: pos.y-dragOff.y } : ov))
  }

  // ─── ADD TEXT / CAPTION ────────────────────────────────────────────────────
  const addText = () => {
    if (!txtContent.trim()) return
    setOverlays(prev => [...prev, { text:txtContent, x:100, y:150, color:txtColor, font:txtFont, size:txtSize, bg:txtBg }])
    setTxtContent('')
  }
  const addCaption = () => {
    if (!capText.trim()) return
    setCaptions(prev => [...prev, { text:capText, start:capStart, end:capEnd }])
    setCapText('')
  }

  // ─── AUTO CAPTION ──────────────────────────────────────────────────────────
  const handleAutoCaption = async () => {
    if (!videoFile) return
    setAutoLoading(true); setAutoError(''); setAutoSuccess('')
    try {
      const fd = new FormData(); fd.append('file', videoFile)
      const res = await fetch('http://localhost:8000/api/captions/auto-caption', { method:'POST', body:fd })
      let data
      try { data = JSON.parse(await res.text()) } catch { throw new Error('Server response parse nahi hua') }
      if (!res.ok) throw new Error(data.detail || `Server error ${res.status}`)
      if (!data.captions?.length) throw new Error('Koi captions nahi aaye — video mein speech hai?')
      setCaptions(data.captions)
      setAutoSuccess(`✅ ${data.total_segments} captions generated!`)
    } catch(e) {
      console.error('[AutoCaption]', e); setAutoError(e.message)
    } finally { setAutoLoading(false) }
  }

  // ─── SPEED / VOL / EXPORT ──────────────────────────────────────────────────
  const changeSpeed  = (s) => { setSpeed(s);  if (videoRef.current) videoRef.current.playbackRate = s }
  const changeVolume = (v) => { setVolume(v); if (videoRef.current) videoRef.current.volume = v }
  const handleExport = () => {
    setExporting(true); setExportPct(0); setExportDone(false)
    let p = 0
    const iv = setInterval(() => {
      p += Math.random()*12+3; setExportPct(Math.min(p,99))
      if (p >= 99) {
        clearInterval(iv)
        setTimeout(() => {
          setExportPct(100); setExporting(false); setExportDone(true)
          if (videoUrl) { const a=document.createElement('a'); a.href=videoUrl; a.download=`edited_${videoFile?.name||'video.mp4'}`; a.click() }
        }, 600)
      }
    }, 200)
  }

  // ═══════════════════════ UPLOAD SCREEN ════════════════════════════════════
  if (!videoUrl) return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-6 gap-3">
        <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-black">CE</span>
        </div>
        <span className="text-white font-bold text-sm">Creator OS — Video Editor</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div onDrop={e=>{e.preventDefault();loadFile(e.dataTransfer.files[0])}}
          onDragOver={e=>e.preventDefault()}
          onClick={()=>fileInputRef.current?.click()}
          className="w-full max-w-xl cursor-pointer group">
          <div className="border-2 border-dashed border-gray-700 group-hover:border-red-500 rounded-3xl p-16 flex flex-col items-center gap-6 transition-all duration-300 group-hover:bg-red-500/5">
            <div className="w-20 h-20 bg-gray-800 group-hover:bg-red-500/20 rounded-2xl flex items-center justify-center transition-all">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500 group-hover:text-red-400 transition-colors"><path d={Icons.upload}/></svg>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-xl mb-2">Drop your video here</p>
              <p className="text-gray-500 text-sm">MP4, MOV, AVI, WebM supported</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {['✂️ Trim','📝 Text','🎨 Filters','🎙️ Auto Captions','⚡ Speed','🎚️ Adjust'].map(f=>(
                <span key={f} className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full">{f}</span>
              ))}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="video/*" onChange={e=>loadFile(e.target.files[0])} className="hidden"/>
        </div>
      </div>
    </div>
  )

  // ═══════════════════════ EDITOR ═══════════════════════════════════════════
  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden select-none">

      {/* TOP BAR */}
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-3 flex-shrink-0">
        <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-black">CE</span>
        </div>
        <span className="text-white font-bold text-sm">Video Editor</span>
        <div className="w-px h-6 bg-gray-700 mx-1"/>
        <span className="text-gray-400 text-xs truncate max-w-xs">{videoFile?.name}</span>
        <div className="flex-1"/>
        {[Icons.undo, Icons.redo].map((ic,i)=>(
          <button key={i} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={ic}/></svg>
          </button>
        ))}
        <div className="w-px h-6 bg-gray-700 mx-1"/>
        <button onClick={()=>{setVideoUrl(null);setVideoFile(null)}}
          className="px-3 py-1.5 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg text-xs font-medium transition-colors">
          New Video
        </button>
        <button onClick={handleExport} disabled={exporting}
          className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-60 flex items-center gap-2 shadow-lg shadow-red-500/20">
          {exporting ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>{Math.round(exportPct)}%</>
          : exportDone ? '✅ Downloaded!'
          : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={Icons.dl}/></svg>Export</>}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* LEFT TOOLBAR */}
        <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-1 flex-shrink-0">
          {TOOLS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTool(t.id)}
              className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${activeTool===t.id?'bg-red-500/20 text-red-400 border border-red-500/30':'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={Icons[t.icon]}/>
              </svg>
              <span className="text-[9px] font-medium leading-none">{t.label}</span>
            </button>
          ))}
        </div>

        {/* CANVAS COLUMN */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Video + Canvas */}
          <div className="flex-1 flex items-center justify-center p-4 bg-black overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Hidden video — needed for drawImage */}
              <video
                ref={videoRef}
                className="hidden"
                onLoadedMetadata={onLoadedMetadata}
                onEnded={()=>setIsPlaying(false)}
                playsInline
                preload="auto"
                crossOrigin="anonymous"
              />
              {/* Canvas — always visible, shows video frames */}
              <canvas
                ref={canvasRef}
                className="rounded-xl shadow-2xl"
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 260px)',
                  display: 'block',
                  cursor: 'default',
                  background: '#000',
                }}
                onMouseDown={onCanvasDown}
                onMouseMove={onCanvasMove}
                onMouseUp={()=>setDraggingTxt(false)}
              />
              {/* Play button overlay */}
              {!isPlaying && (
                <button onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center group">
                  <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 group-hover:bg-black/70 transition-all shadow-xl">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M5 3l14 9-14 9V3z"/></svg>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* PLAYBACK CONTROLS */}
          <div className="bg-gray-900 border-t border-gray-800 px-5 py-3 flex-shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={togglePlay}
                className="w-9 h-9 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d={isPlaying?Icons.pause:Icons.play}/></svg>
              </button>
              <span className="text-gray-400 text-xs font-mono w-24 flex-shrink-0">{fmt(curTime)} / {fmt(duration)}</span>
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><path d={Icons.vol}/></svg>
                <input type="range" min="0" max="1" step="0.05" value={volume}
                  onChange={e=>changeVolume(Number(e.target.value))} className="w-20 accent-red-500"/>
              </div>
              <div className="flex-1"/>
              <span className="text-gray-500 text-xs">Clip: {fmt(trimStart)} — {fmt(trimEnd)} ({fmt(trimEnd-trimStart)})</span>
            </div>

            {/* TIMELINE */}
            <div ref={tlRef} className="relative h-10 bg-gray-800 rounded-lg cursor-pointer overflow-visible" onClick={seekTo}>
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-gray-700/60 to-gray-600/60"/>
              </div>

              {duration > 0 && <>
                {/* Trim region */}
                <div className="absolute top-0 bottom-0 bg-red-500/15 border-t-2 border-b-2 border-red-500/40 pointer-events-none"
                  style={{ left:`${(trimStart/duration)*100}%`, width:`${((trimEnd-trimStart)/duration)*100}%` }}/>

                {/* Caption markers */}
                {captions.map((c,i)=>(
                  <div key={i} className="absolute top-0 h-1.5 bg-yellow-400/80 rounded pointer-events-none"
                    style={{ left:`${(c.start/duration)*100}%`, width:`${Math.max(0.5,((c.end-c.start)/duration)*100)}%` }} title={c.text}/>
                ))}

                {/* Trim handles */}
                <div className="absolute top-0 bottom-0 w-3 bg-red-500 cursor-ew-resize flex items-center justify-center z-10 rounded-l hover:bg-red-400"
                  style={{ left:`calc(${(trimStart/duration)*100}% - 6px)` }}
                  onMouseDown={e=>{e.stopPropagation();setDraggingTrim('start')}}>
                  <div className="w-0.5 h-4 bg-white rounded"/>
                </div>
                <div className="absolute top-0 bottom-0 w-3 bg-red-500 cursor-ew-resize flex items-center justify-center z-10 rounded-r hover:bg-red-400"
                  style={{ left:`calc(${(trimEnd/duration)*100}% - 6px)` }}
                  onMouseDown={e=>{e.stopPropagation();setDraggingTrim('end')}}>
                  <div className="w-0.5 h-4 bg-white rounded"/>
                </div>

                {/* Playhead */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
                  style={{ left:`${(curTime/duration)*100}%` }}>
                  <div className="w-3 h-3 bg-white rounded-full -ml-1 -mt-0.5 shadow"/>
                </div>

                {/* Tick labels */}
                {Array.from({ length: Math.min(Math.floor(duration), 20) + 1 }).map((_,i)=>{
                  const t = i * (duration / Math.min(Math.floor(duration), 20))
                  return (
                    <div key={i} className="absolute bottom-0 flex flex-col items-center pointer-events-none" style={{ left:`${(t/duration)*100}%` }}>
                      <div className="w-px h-2 bg-gray-600"/>
                      <span className="text-gray-600 text-[8px]">{Math.floor(t)}s</span>
                    </div>
                  )
                })}
              </>}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex-1 overflow-y-auto">

            {/* TRIM */}
            {activeTool==='trim' && (
              <div className="p-4 space-y-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={Icons.cut}/></svg>Trim & Cut
                </h3>
                <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                  {[{label:'Start',val:trimStart,set:v=>setTrimStart(Math.min(v,trimEnd-0.5))},{label:'End',val:trimEnd,set:v=>setTrimEnd(Math.max(v,trimStart+0.5))}].map(it=>(
                    <div key={it.label}>
                      <label className="text-gray-400 text-xs mb-1 block">{it.label} Point</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max={duration||1} step="0.1" value={it.val}
                          onChange={e=>it.set(Number(e.target.value))} className="flex-1 accent-red-500"/>
                        <span className="text-red-400 text-xs font-mono w-14 text-right">{fmt(it.val)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-700 space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Clip Duration</span><span className="text-white font-mono font-bold">{fmt(trimEnd-trimStart)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Trimmed Out</span><span className="text-red-400 font-mono">{fmt(duration-(trimEnd-trimStart))}</span></div>
                  </div>
                </div>
                <button onClick={()=>{setTrimStart(0);setTrimEnd(duration)}} className="w-full py-2 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg text-xs font-medium transition-colors">Reset Trim</button>
                <p className="text-gray-600 text-xs bg-gray-800/50 rounded-xl p-3">💡 Drag the <span className="text-red-400">red handles</span> on the timeline or use sliders.</p>
              </div>
            )}

            {/* TEXT */}
            {activeTool==='text' && (
              <div className="p-4 space-y-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={Icons.text}/></svg>Text Overlay
                </h3>
                <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                  <textarea value={txtContent} onChange={e=>setTxtContent(e.target.value)} placeholder="Enter text..." rows={2}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 resize-none placeholder-gray-500"/>
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block">Font</label>
                    <select value={txtFont} onChange={e=>setTxtFont(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-red-500">
                      {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Size: {txtSize}px</label>
                    <input type="range" min="16" max="120" value={txtSize} onChange={e=>setTxtSize(Number(e.target.value))} className="w-full accent-red-500"/>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block">Color</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {COLORS.map(c=>(
                        <button key={c} onClick={()=>setTxtColor(c)}
                          className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${txtColor===c?'border-white scale-110':'border-transparent'}`}
                          style={{ backgroundColor:c }}/>
                      ))}
                      <input type="color" value={txtColor} onChange={e=>setTxtColor(e.target.value)} className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"/>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={()=>setTxtBg(!txtBg)} className={`w-9 h-5 rounded-full transition-colors ${txtBg?'bg-red-500':'bg-gray-600'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full m-0.5 transition-transform ${txtBg?'translate-x-4':''}`}/>
                    </div>
                    <span className="text-gray-300 text-xs">Background box</span>
                  </label>
                  <button onClick={addText} disabled={!txtContent.trim()} className="w-full py-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors">+ Add to Video</button>
                </div>
                {overlays.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-gray-500 text-xs font-medium">ADDED ({overlays.length})</p>
                    {overlays.map((ov,i)=>(
                      <div key={i} onClick={()=>setSelOverlay(i)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${selOverlay===i?'border-red-500 bg-red-500/10':'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
                        <div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor:ov.color }}/>
                        <span className="text-white text-xs flex-1 truncate">{ov.text}</span>
                        <button onClick={e=>{e.stopPropagation();setOverlays(p=>p.filter((_,j)=>j!==i));setSelOverlay(null)}} className="text-gray-600 hover:text-red-400">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={Icons.close}/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-gray-600 text-xs bg-gray-800/50 rounded-xl p-3">💡 Add text then drag anywhere on canvas.</p>
              </div>
            )}

            {/* FILTER */}
            {activeTool==='filter' && (
              <div className="p-4 space-y-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={Icons.filter}/></svg>Video Filters
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {FILTERS.map(f=>(
                    <button key={f.name} onClick={()=>setActiveFilter(f.name)}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${activeFilter===f.name?'border-red-500 bg-red-500/20 text-red-400':'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'}`}>
                      <div className="text-lg mb-1">{f.emoji}</div>{f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ADJUST */}
            {activeTool==='adjust' && (
              <div className="p-4 space-y-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={Icons.zoom}/></svg>Adjustments
                </h3>
                <div className="bg-gray-800 rounded-xl p-4 space-y-4">
                  {[{label:'Brightness',val:brightness,set:setBrightness,min:50,max:150},{label:'Contrast',val:contrast,set:setContrast,min:50,max:200},{label:'Saturation',val:saturation,set:setSaturation,min:0,max:200}].map(a=>(
                    <div key={a.label}>
                      <div className="flex justify-between mb-1.5"><label className="text-gray-400 text-xs">{a.label}</label><span className="text-red-400 text-xs font-mono">{a.val}%</span></div>
                      <input type="range" min={a.min} max={a.max} value={a.val} onChange={e=>a.set(Number(e.target.value))} className="w-full accent-red-500"/>
                    </div>
                  ))}
                  <button onClick={()=>{setBrightness(100);setContrast(100);setSaturation(100)}} className="w-full py-2 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg text-xs font-medium transition-colors">Reset All</button>
                </div>
              </div>
            )}

            {/* CAPTION */}
            {activeTool==='caption' && (
              <div className="p-4 space-y-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={Icons.caption}/></svg>Captions
                </h3>

                {/* AUTO CAPTION CARD */}
                <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-violet-900/40 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white text-xs font-bold flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={Icons.mic}/></svg>
                        AI Auto Captions
                      </p>
                      <p className="text-purple-300/80 text-[10px] mt-0.5 leading-relaxed">Groq Whisper — video sun ke auto captions</p>
                    </div>
                    <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold flex-shrink-0">FREE</span>
                  </div>
                  {autoError && <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg"><p className="text-red-400 text-[10px] leading-relaxed">⚠️ {autoError}</p></div>}
                  {autoSuccess && <div className="p-2.5 bg-green-500/10 border border-green-500/30 rounded-lg"><p className="text-green-400 text-[10px] font-medium">{autoSuccess}</p></div>}
                  <button onClick={handleAutoCaption} disabled={autoLoading||!videoFile}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                    {autoLoading
                      ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>Analyzing audio...</>
                      : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={Icons.mic}/></svg>Generate Auto Captions</>}
                  </button>
                  {autoLoading && <div className="space-y-1.5"><div className="w-full bg-gray-700/50 rounded-full h-1 overflow-hidden"><div className="h-1 bg-gradient-to-r from-purple-400 to-violet-400 rounded-full animate-pulse w-3/5"/></div><p className="text-purple-400/70 text-[10px] text-center">Whisper AI processing...</p></div>}
                </div>

                <div className="flex items-center gap-2"><div className="flex-1 h-px bg-gray-700"/><span className="text-gray-600 text-[10px] font-medium">OR MANUAL</span><div className="flex-1 h-px bg-gray-700"/></div>

                <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                  <textarea value={capText} onChange={e=>setCapText(e.target.value)} placeholder="Caption text..." rows={2}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 resize-none placeholder-gray-500"/>
                  <div className="grid grid-cols-2 gap-2">
                    {[{label:'Start (s)',val:capStart,set:setCapStart},{label:'End (s)',val:capEnd,set:setCapEnd}].map(f=>(
                      <div key={f.label}>
                        <label className="text-gray-400 text-xs mb-1 block">{f.label}</label>
                        <input type="number" min="0" max={duration} step="0.1" value={f.val} onChange={e=>f.set(Number(e.target.value))}
                          className="w-full bg-gray-700 border border-gray-600 text-white text-xs rounded-lg px-2 py-2 focus:outline-none focus:border-red-500"/>
                      </div>
                    ))}
                  </div>
                  <button onClick={addCaption} disabled={!capText.trim()} className="w-full py-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors">+ Add Caption</button>
                </div>

                {captions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-xs font-medium">CAPTIONS <span className="text-gray-600">({captions.length})</span></p>
                      <button onClick={()=>setCaptions([])} className="text-gray-600 hover:text-red-400 text-[10px] transition-colors">Clear All</button>
                    </div>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {captions.map((c,i)=>(
                        <div key={i} className="flex items-start gap-2 p-2.5 bg-gray-800 rounded-lg border border-gray-700 group hover:border-gray-600 transition-colors">
                          <div className="flex-1 min-w-0"><p className="text-white text-xs leading-relaxed">{c.text}</p><p className="text-gray-500 text-[10px] mt-0.5 font-mono">{fmt(c.start)} → {fmt(c.end)}</p></div>
                          <button onClick={()=>setCaptions(p=>p.filter((_,j)=>j!==i))} className="text-gray-700 group-hover:text-red-400 transition-colors flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={Icons.close}/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {captions.length===0&&!autoLoading&&<div className="bg-gray-800/40 rounded-xl p-3 text-center border border-gray-700/50"><p className="text-gray-600 text-xs">No captions yet — use AI or add manually</p></div>}
              </div>
            )}

            {/* SPEED */}
            {activeTool==='speed' && (
              <div className="p-4 space-y-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={Icons.speed}/></svg>Playback Speed
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {SPEEDS.map(s=>(
                    <button key={s} onClick={()=>changeSpeed(s)}
                      className={`py-3 rounded-xl border text-sm font-bold transition-all ${speed===s?'border-red-500 bg-red-500/20 text-red-400':'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'}`}>
                      {s}x{s===1?' ✓':''}
                    </button>
                  ))}
                </div>
                <p className="text-gray-600 text-xs bg-gray-800/50 rounded-xl p-3">💡 <span className="text-red-400">0.5x</span> slow motion · <span className="text-red-400">2x</span> double speed</p>
              </div>
            )}

            {/* AUDIO */}
            {activeTool==='audio' && (
              <div className="p-4 space-y-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={Icons.vol}/></svg>Audio
                </h3>
                <div className="bg-gray-800 rounded-xl p-4 space-y-4">
                  <div>
                    <div className="flex justify-between mb-1.5"><label className="text-gray-400 text-xs">Original Volume</label><span className="text-red-400 text-xs font-mono">{Math.round(volume*100)}%</span></div>
                    <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>changeVolume(Number(e.target.value))} className="w-full accent-red-500"/>
                  </div>
                  <div className="pt-3 border-t border-gray-700">
                    <label className="text-gray-400 text-xs mb-2 block">Background Music</label>
                    <div className="space-y-1.5">
                      {['No Music','Upbeat Pop','Chill Lo-fi','Epic Cinematic','Corporate'].map(name=>(
                        <button key={name} className="w-full flex items-center gap-2 p-2 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white text-xs transition-all text-left">
                          <span>{name==='No Music'?'🔇':'🎵'}</span>{name}
                          {name!=='No Music'&&<span className="ml-auto text-gray-600 text-[10px]">Coming Soon</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* EXPORT BOTTOM */}
          <div className="p-4 border-t border-gray-800 flex-shrink-0">
            {exporting && (
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Exporting...</span><span className="text-red-400 font-mono">{Math.round(exportPct)}%</span></div>
                <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="h-1.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all" style={{ width:`${exportPct}%` }}/></div>
              </div>
            )}
            {exportDone && <div className="mb-3 p-2.5 bg-green-500/10 border border-green-500/30 rounded-lg"><p className="text-green-400 text-xs font-medium">✅ Video exported & downloaded!</p></div>}
            <button onClick={handleExport} disabled={exporting}
              className="w-full py-2.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-60 shadow-lg shadow-red-500/20">
              {exporting?`Exporting ${Math.round(exportPct)}%`:'⬇️ Export Video'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}