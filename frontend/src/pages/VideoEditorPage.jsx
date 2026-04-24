// src/pages/VideoEditorPage.jsx
// Basic Video Editor for Nexora OS
// Features: Upload → Trim / Multi-cut → Export
// Backend: FFmpeg via clipping.py

import { useState, useRef, useEffect } from 'react'
import {
  Film, Upload, Scissors, Download, Play, Pause,
  Plus, Trash2, CheckCircle, AlertCircle, Loader,
  RefreshCw, Clock, ChevronLeft, ChevronRight
} from 'lucide-react'

const API = 'https://creator-os-production-0bf8.up.railway.app'

const card    = { background: 'rgba(15,26,20,0.6)', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 14, padding: 22 }
const lbl     = { fontSize: 13, fontWeight: 600, color: '#9DC4B0', display: 'block', marginBottom: 6 }
const inp     = { width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 10, color: '#D8EEE5', fontSize: 14, outline: 'none', fontFamily: 'inherit' }
const btn     = (color='#00E5A0', dis=false) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 18px', background: dis ? 'rgba(255,255,255,0.05)' : `rgba(${color==='#00E5A0'?'0,229,160':color==='#FF0000'?'255,0,0':'96,165,250'},0.12)`, border: `1px solid ${dis ? 'rgba(255,255,255,0.08)' : color==='#00E5A0' ? 'rgba(0,229,160,0.3)' : color==='#FF0000' ? 'rgba(255,0,0,0.3)' : 'rgba(96,165,250,0.3)'}`, borderRadius: 10, color: dis ? '#4A6357' : color, fontSize: 13, fontWeight: 700, cursor: dis ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all .15s' })

const toTime = (s) => {
  if (!s && s !== 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2,'0')}`
}

export default function VideoEditorPage() {
  const [mode,        setMode]        = useState('trim') // trim | cut
  const [fileInfo,    setFileInfo]    = useState(null)   // {file_id, duration, filename, ...}
  const [uploading,   setUploading]   = useState(false)
  const [uploadErr,   setUploadErr]   = useState('')

  // Trim mode
  const [trimStart,   setTrimStart]   = useState(0)
  const [trimEnd,     setTrimEnd]     = useState(0)

  // Cut mode — multiple segments
  const [segments,    setSegments]    = useState([])     // [{id, start, end}]

  // Preview
  const [currentTime, setCurrentTime] = useState(0)
  const [playing,     setPlaying]     = useState(false)
  const videoRef = useRef()
  const fileRef  = useRef()

  // Export
  const [exporting,   setExporting]   = useState(false)
  const [result,      setResult]      = useState(null)
  const [exportErr,   setExportErr]   = useState('')

  // Sync video time
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => setCurrentTime(v.currentTime)
    v.addEventListener('timeupdate', onTime)
    return () => v.removeEventListener('timeupdate', onTime)
  }, [fileInfo])

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setUploading(true); setUploadErr(''); setFileInfo(null); setResult(null)

    const form = new FormData()
    form.append('file', f)

    try {
      const r = await fetch(`${API}/api/clipping/editor/upload`, { method: 'POST', body: form })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Upload failed.')
      setFileInfo(d)
      setTrimStart(0)
      setTrimEnd(d.duration)
      setSegments([{ id: Date.now(), start: 0, end: Math.min(d.duration, 30) }])

      // Set video src for preview
      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(f)
        videoRef.current.load()
      }
    } catch (e) { setUploadErr(e.message) }
    setUploading(false)
  }

  // ── Trim Export ────────────────────────────────────────────────────────────
  const handleTrim = async () => {
    if (!fileInfo) return
    setExporting(true); setExportErr(''); setResult(null)

    const form = new FormData()
    form.append('file_id',    fileInfo.file_id)
    form.append('start_time', String(trimStart))
    form.append('end_time',   String(trimEnd))

    try {
      const r = await fetch(`${API}/api/clipping/editor/trim`, { method: 'POST', body: form })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Trim failed.')
      setResult(d)
    } catch (e) { setExportErr(e.message) }
    setExporting(false)
  }

  // ── Cut Export ─────────────────────────────────────────────────────────────
  const handleCut = async () => {
    if (!fileInfo || segments.length === 0) return
    setExporting(true); setExportErr(''); setResult(null)

    const validSegs = segments.filter(s => s.end > s.start)
    if (!validSegs.length) { setExportErr('Add valid segments first.'); setExporting(false); return }

    const form = new FormData()
    form.append('file_id', fileInfo.file_id)
    form.append('cuts',    JSON.stringify(validSegs.map(s => ({ start: s.start, end: s.end }))))

    try {
      const r = await fetch(`${API}/api/clipping/editor/cut`, { method: 'POST', body: form })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Cut failed.')
      setResult(d)
    } catch (e) { setExportErr(e.message) }
    setExporting(false)
  }

  const addSegment = () => {
    if (!fileInfo) return
    const last = segments[segments.length - 1]
    const start = last ? Math.min(last.end + 1, fileInfo.duration) : 0
    const end   = Math.min(start + 30, fileInfo.duration)
    setSegments([...segments, { id: Date.now(), start, end }])
  }

  const removeSegment  = (id) => setSegments(segments.filter(s => s.id !== id))
  const updateSegment  = (id, key, val) => setSegments(segments.map(s => s.id === id ? { ...s, [key]: Number(val) } : s))

  const seekTo = (t) => { if (videoRef.current) videoRef.current.currentTime = t }
  const togglePlay = () => {
    if (!videoRef.current) return
    playing ? videoRef.current.pause() : videoRef.current.play()
    setPlaying(!playing)
  }

  const totalDuration = fileInfo?.duration || 0
  const pct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", color: '#D8EEE5' }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Film size={22} color="#00E5A0" />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Video Editor</h1>
          <p style={{ fontSize: 13, color: '#7A9E8E', margin: 0 }}>Trim, cut, and export your videos — powered by FFmpeg</p>
        </div>
      </div>

      {/* Upload zone */}
      {!fileInfo ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 18px' }}>Upload Video</h3>
            <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleUpload} />
            <div onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed rgba(0,229,160,0.2)', borderRadius: 12, padding: '48px 32px', textAlign: 'center', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.2)'}>
              {uploading ? (
                <>
                  <Loader size={32} color="#00E5A0" style={{ display: 'block', margin: '0 auto 12px', animation: 'sp .8s linear infinite' }} />
                  <p style={{ color: '#9DC4B0', fontSize: 14, margin: 0 }}>Uploading to server...</p>
                </>
              ) : (
                <>
                  <Upload size={36} color="#4A6357" style={{ display: 'block', margin: '0 auto 14px' }} />
                  <p style={{ color: '#9DC4B0', fontSize: 15, fontWeight: 600, margin: 0 }}>Click to upload video</p>
                  <p style={{ color: '#4A6357', fontSize: 12, margin: '6px 0 0' }}>MP4, MOV, AVI, MKV • Any length</p>
                </>
              )}
            </div>
            {uploadErr && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', marginTop: 14 }}>
                <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#F87171' }}>{uploadErr}</span>
              </div>
            )}
          </div>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>✂️ Editor Features</h4>
            {[
              ['Trim', 'Cut start and end of video'],
              ['Multi-cut', 'Keep only specific segments'],
              ['Export', 'Download as MP4'],
              ['FFmpeg', 'High quality encoding'],
              ['No watermark', 'Clean output'],
            ].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <CheckCircle size={14} color="#00E5A0" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#D8EEE5' }}>{k}</span>
                  <span style={{ fontSize: 12, color: '#7A9E8E' }}> — {v}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Video info bar */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Film size={18} color="#00E5A0" />
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{fileInfo.filename?.split('/').pop() || 'Video'}</div>
                <div style={{ fontSize: 12, color: '#7A9E8E' }}>
                  Duration: {toTime(fileInfo.duration)} • {fileInfo.width}×{fileInfo.height} • {fileInfo.size_mb}MB
                </div>
              </div>
            </div>
            <button onClick={() => { setFileInfo(null); setResult(null); setExportErr('') }}
              style={{ ...btn(), padding: '7px 14px' }}>
              <RefreshCw size={13} /> New Video
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Left — Preview + Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Video preview */}
              <div style={card}>
                <video ref={videoRef} style={{ width: '100%', borderRadius: 10, background: '#000', maxHeight: 240, objectFit: 'contain' }}
                  onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
                  onEnded={() => setPlaying(false)} />

                {/* Controls */}
                <div style={{ marginTop: 12 }}>
                  {/* Timeline scrubber */}
                  <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, cursor: 'pointer', marginBottom: 8 }}
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const pct  = (e.clientX - rect.left) / rect.width
                      seekTo(pct * totalDuration)
                    }}>
                    <div style={{ position: 'absolute', height: '100%', width: `${pct}%`, background: '#00E5A0', borderRadius: 3 }} />

                    {/* Trim handles */}
                    {mode === 'trim' && (
                      <>
                        <div style={{ position: 'absolute', left: `${(trimStart/totalDuration)*100}%`, top: -4, width: 3, height: 14, background: '#FBBF24', borderRadius: 2 }} />
                        <div style={{ position: 'absolute', left: `${(trimEnd/totalDuration)*100}%`, top: -4, width: 3, height: 14, background: '#F87171', borderRadius: 2 }} />
                      </>
                    )}

                    {/* Segment highlights */}
                    {mode === 'cut' && segments.map(seg => (
                      <div key={seg.id} style={{ position: 'absolute', left: `${(seg.start/totalDuration)*100}%`, width: `${((seg.end-seg.start)/totalDuration)*100}%`, height: '100%', background: 'rgba(0,229,160,0.4)', borderRadius: 3 }} />
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4A6357', marginBottom: 10 }}>
                    <span>{toTime(currentTime)}</span>
                    <span>{toTime(totalDuration)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                    <button onClick={() => seekTo(Math.max(0, currentTime - 5))} style={{ ...btn(), padding: '7px 12px' }}>
                      <ChevronLeft size={14} /> 5s
                    </button>
                    <button onClick={togglePlay} style={{ ...btn('#00E5A0'), padding: '7px 16px', minWidth: 90 }}>
                      {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
                    </button>
                    <button onClick={() => seekTo(Math.min(totalDuration, currentTime + 5))} style={{ ...btn(), padding: '7px 12px' }}>
                      5s <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Current time marker */}
              <div style={card}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Clock size={14} color="#9DC4B0" />
                  <span style={{ fontSize: 13, color: '#9DC4B0' }}>Current position:</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#00E5A0', fontFamily: 'monospace' }}>{toTime(currentTime)} ({currentTime.toFixed(1)}s)</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {mode === 'trim' && (
                    <>
                      <button onClick={() => setTrimStart(parseFloat(currentTime.toFixed(1)))} style={{ ...btn('#FBBF24'), flex: 1, padding: '8px' }}>
                        📍 Set Start ({toTime(trimStart)})
                      </button>
                      <button onClick={() => setTrimEnd(parseFloat(currentTime.toFixed(1)))} style={{ ...btn('#F87171'), flex: 1, padding: '8px' }}>
                        📍 Set End ({toTime(trimEnd)})
                      </button>
                    </>
                  )}
                  {mode === 'cut' && segments.length > 0 && (
                    <>
                      <button onClick={() => {
                        const last = segments[segments.length-1]
                        updateSegment(last.id, 'start', parseFloat(currentTime.toFixed(1)))
                      }} style={{ ...btn('#FBBF24'), flex: 1, padding: '8px', fontSize: 12 }}>
                        📍 Mark Seg Start
                      </button>
                      <button onClick={() => {
                        const last = segments[segments.length-1]
                        updateSegment(last.id, 'end', parseFloat(currentTime.toFixed(1)))
                      }} style={{ ...btn('#F87171'), flex: 1, padding: '8px', fontSize: 12 }}>
                        📍 Mark Seg End
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right — Edit controls + Export */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Mode selector */}
              <div style={card}>
                <label style={lbl}>Edit Mode</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                  {[['trim','✂️ Trim'],['cut','🔪 Multi-cut']].map(([v,l]) => (
                    <div key={v} onClick={() => { setMode(v); setResult(null); setExportErr('') }}
                      style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600,
                        border: `1px solid ${mode===v ? 'rgba(0,229,160,0.4)' : 'rgba(0,229,160,0.1)'}`,
                        background: mode===v ? 'rgba(0,229,160,0.08)' : 'transparent',
                        color: mode===v ? '#00E5A0' : '#7A9E8E' }}>{l}</div>
                  ))}
                </div>

                {/* TRIM controls */}
                {mode === 'trim' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={lbl}>Start Time (s)</label>
                        <input style={inp} type="number" value={trimStart} min={0} max={trimEnd-1} step={0.1}
                          onChange={e => setTrimStart(Math.max(0, Number(e.target.value)))} />
                        <p style={{ fontSize: 11, color: '#4A6357', marginTop: 4 }}>{toTime(trimStart)}</p>
                      </div>
                      <div>
                        <label style={lbl}>End Time (s)</label>
                        <input style={inp} type="number" value={trimEnd} min={trimStart+1} max={totalDuration} step={0.1}
                          onChange={e => setTrimEnd(Math.min(totalDuration, Number(e.target.value)))} />
                        <p style={{ fontSize: 11, color: '#4A6357', marginTop: 4 }}>{toTime(trimEnd)}</p>
                      </div>
                    </div>
                    <div style={{ padding: '10px 14px', background: 'rgba(0,229,160,0.05)', borderRadius: 8, marginBottom: 14, fontSize: 12, color: '#7A9E8E' }}>
                      Output duration: <strong style={{ color: '#00E5A0' }}>{toTime(trimEnd - trimStart)}</strong>
                    </div>
                  </div>
                )}

                {/* CUT controls */}
                {mode === 'cut' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: '#9DC4B0', fontWeight: 600 }}>Segments ({segments.length})</span>
                      <button onClick={addSegment} style={{ ...btn(), padding: '6px 12px', fontSize: 12 }}>
                        <Plus size={13} /> Add Segment
                      </button>
                    </div>

                    <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {segments.map((seg, i) => (
                        <div key={seg.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(0,229,160,0.08)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#00E5A0' }}>Segment {i+1}</span>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: '#4A6357' }}>{toTime(seg.end - seg.start)}</span>
                              <button onClick={() => removeSegment(seg.id)}
                                style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: 2 }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                              <label style={{ ...lbl, marginBottom: 3 }}>Start (s)</label>
                              <input style={{ ...inp, padding: '6px 10px' }} type="number" value={seg.start} min={0} max={seg.end-1} step={0.1}
                                onChange={e => updateSegment(seg.id, 'start', e.target.value)} />
                            </div>
                            <div>
                              <label style={{ ...lbl, marginBottom: 3 }}>End (s)</label>
                              <input style={{ ...inp, padding: '6px 10px' }} type="number" value={seg.end} min={seg.start+1} max={totalDuration} step={0.1}
                                onChange={e => updateSegment(seg.id, 'end', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {segments.length > 0 && (
                      <div style={{ padding: '8px 12px', background: 'rgba(0,229,160,0.05)', borderRadius: 8, marginTop: 10, fontSize: 12, color: '#7A9E8E' }}>
                        Total output: <strong style={{ color: '#00E5A0' }}>{toTime(segments.reduce((a,s) => a + (s.end - s.start), 0))}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Export */}
              <div style={card}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 14px' }}>Export</h4>

                {exportErr && (
                  <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', marginBottom: 12 }}>
                    <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13, color: '#F87171' }}>{exportErr}</span>
                  </div>
                )}

                {result ? (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <CheckCircle size={36} color="#00E5A0" style={{ display: 'block', margin: '0 auto 10px' }} />
                    <p style={{ color: '#00E5A0', fontWeight: 700, fontSize: 14, margin: '0 0 6px' }}>Export Done! 🎉</p>
                    <p style={{ fontSize: 12, color: '#7A9E8E', margin: '0 0 14px' }}>
                      {toTime(result.duration)} • {result.size_mb}MB
                      {result.segments && ` • ${result.segments} segments joined`}
                    </p>
                    <a href={`${API}${result.download_url}`} download
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: '#00E5A0', color: '#070D0A', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                      <Download size={15} /> Download MP4
                    </a>
                    <button onClick={() => { setResult(null); setExportErr('') }}
                      style={{ display: 'block', margin: '10px auto 0', background: 'none', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, color: '#9DC4B0', fontSize: 12, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Edit Again
                    </button>
                  </div>
                ) : (
                  <button
                    style={{ ...btn('#00E5A0', exporting), width: '100%', padding: '13px' }}
                    onClick={mode === 'trim' ? handleTrim : handleCut}
                    disabled={exporting}>
                    {exporting
                      ? <><Loader size={15} style={{ animation: 'sp .7s linear infinite' }} /> Processing with FFmpeg...</>
                      : mode === 'trim'
                        ? <><Scissors size={15} /> Trim & Export</>
                        : <><Scissors size={15} /> Cut & Join Segments</>}
                  </button>
                )}

                {exporting && (
                  <p style={{ fontSize: 12, color: '#4A6357', textAlign: 'center', marginTop: 8 }}>
                    FFmpeg processing... This may take 30-120 seconds depending on video length.
                  </p>
                )}
              </div>

              {/* Tips */}
              <div style={card}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#9DC4B0', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {mode === 'trim' ? '✂️ Trim Tips' : '🔪 Cut Tips'}
                </h4>
                {(mode === 'trim' ? [
                  'Play video to find exact timestamps',
                  'Use "Set Start/End" buttons at current time',
                  'Or type exact seconds manually',
                  'Output is re-encoded in H.264',
                ] : [
                  'Add multiple segments to keep',
                  'Segments will be joined in order',
                  'Use "Mark Seg Start/End" while playing',
                  'Unwanted parts are automatically removed',
                ]).map(t => (
                  <p key={t} style={{ fontSize: 11, color: '#7A9E8E', margin: '0 0 6px', paddingLeft: 10, borderLeft: '2px solid rgba(0,229,160,0.2)', lineHeight: 1.5 }}>{t}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}