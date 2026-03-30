import { useState, useEffect } from 'react'
import axios from 'axios'
import { supabase } from '../../lib/supabaseClient'
import PlatformSelector from './PlatformSelector'

export default function PostComposer({ onPostSaved }) {
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState(['Twitter'])
  const [isSaving, setIsSaving] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [postMode, setPostMode] = useState('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [connectedPlatforms, setConnectedPlatforms] = useState([])
  const [postResult, setPostResult] = useState(null)

  useEffect(() => {
    const connected = []
    if (localStorage.getItem('twitter_token')) connected.push('twitter')
    if (localStorage.getItem('google_token')) connected.push('google')
    if (localStorage.getItem('linkedin_token')) connected.push('linkedin')
    setConnectedPlatforms(connected)
    const now = new Date()
    now.setHours(now.getHours() + 1)
    setScheduledDate(now.toISOString().split('T')[0])
    setScheduledTime(now.toTimeString().slice(0, 5))
  }, [])

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const isTwitterSelected = selectedPlatforms.includes('Twitter')
  const charLimit = isTwitterSelected ? 280 : 3000
  const isOverLimit = content.length > charLimit
  const charPct = Math.min((content.length / charLimit) * 100, 100)

  const saveTokensToSupabase = async (userId, platforms) => {
    for (const platform of platforms) {
      let token = null, personId = null
      if (platform === 'Twitter') token = localStorage.getItem('twitter_token')
      if (platform === 'LinkedIn') {
        token = localStorage.getItem('linkedin_token')
        personId = localStorage.getItem('linkedin_person_id')
      }
      if (token) {
        await supabase.from('social_tokens').upsert({
          user_id: userId, platform: platform.toLowerCase(),
          access_token: token, person_id: personId,
        })
      }
    }
  }

  const handlePostNow = async () => {
    if (!content || selectedPlatforms.length === 0) return
    setIsPosting(true); setPostResult(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session.user.id
      const accessToken = sessionData.session.access_token
      await saveTokensToSupabase(userId, selectedPlatforms)
      let successPlatforms = [], failedPlatforms = []

      if (selectedPlatforms.includes('Twitter')) {
        const twitterToken = localStorage.getItem('twitter_token')
        if (!twitterToken) { failedPlatforms.push('Twitter (not connected)') }
        else {
          try {
            await axios.post('' + import.meta.env.VITE_API_URL + '/api/social/twitter/post', { access_token: twitterToken, text: content })
            successPlatforms.push('Twitter')
          } catch (e) {
            const detail = e.response?.data?.detail || ''
            failedPlatforms.push(detail.includes('402') ? 'Twitter (Paid API required)' : 'Twitter')
          }
        }
      }

      if (selectedPlatforms.includes('LinkedIn')) {
        const linkedinToken = localStorage.getItem('linkedin_token')
        const personId = localStorage.getItem('linkedin_person_id')
        if (!linkedinToken) { failedPlatforms.push('LinkedIn (not connected)') }
        else {
          try {
            await axios.post('' + import.meta.env.VITE_API_URL + '/api/social/linkedin/post', { access_token: linkedinToken, text: content, person_id: personId })
            successPlatforms.push('LinkedIn')
          } catch (e) { failedPlatforms.push('LinkedIn') }
        }
      }

      await axios.post('' + import.meta.env.VITE_API_URL + '/api/posts/create',
        { user_id: userId, content, platforms: selectedPlatforms, scheduled_for: new Date().toISOString(), status: successPlatforms.length > 0 ? 'published' : 'failed', post_now: true, published_platforms: successPlatforms },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      setPostResult({ success: successPlatforms, failed: failedPlatforms })
      if (successPlatforms.length > 0) setContent('')
      if (onPostSaved) onPostSaved()
    } catch (e) {
      setPostResult({ success: [], failed: ['Error: ' + e.message] })
    } finally { setIsPosting(false) }
  }

  const handleSchedule = async () => {
    if (!content || selectedPlatforms.length === 0 || !scheduledDate || !scheduledTime) return
    setIsSaving(true); setPostResult(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session.user.id
      const accessToken = sessionData.session.access_token
      await saveTokensToSupabase(userId, selectedPlatforms)
      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
      await axios.post('' + import.meta.env.VITE_API_URL + '/api/posts/create',
        { user_id: userId, content, platforms: selectedPlatforms, scheduled_for: scheduledFor, status: 'scheduled', post_now: false },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      setPostResult({ scheduled: true, time: new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString() })
      setContent('')
      if (onPostSaved) onPostSaved()
    } catch (e) {
      setPostResult({ success: [], failed: ['Error: ' + e.message] })
    } finally { setIsSaving(false) }
  }

  const handleSaveDraft = async () => {
    if (!content || selectedPlatforms.length === 0) return
    setIsSaving(true); setPostResult(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session.user.id
      const accessToken = sessionData.session.access_token
      await axios.post('' + import.meta.env.VITE_API_URL + '/api/posts/create',
        { user_id: userId, content, platforms: selectedPlatforms, scheduled_for: new Date().toISOString(), status: 'draft' },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      setPostResult({ draft: true })
      setContent('')
      if (onPostSaved) onPostSaved()
    } catch (e) {
      setPostResult({ success: [], failed: ['Error: ' + e.message] })
    } finally { setIsSaving(false) }
  }

  const modes = [
    { id: 'now',      label: 'Post Now',  icon: '⚡', accent: '#10b981' },
    { id: 'schedule', label: 'Schedule',  icon: '🕐', accent: '#6366f1' },
    { id: 'draft',    label: 'Draft',     icon: '📝', accent: '#6b7280' },
  ]

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20, padding: 24,
      fontFamily: "'Syne', 'DM Sans', sans-serif",
    }}>
      <style>{`
        .composer-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 14px 16px;
          color: #e5e7eb;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
          line-height: 1.6;
        }
        .composer-input:focus { border-color: rgba(99,102,241,0.5); }
        .composer-input::placeholder { color: #4b5563; }

        .mode-btn {
          flex: 1;
          padding: 9px 8px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
          color: #6b7280;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        .mode-btn:hover { background: rgba(255,255,255,0.05); color: #d1d5db; }

        .action-btn {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border: none;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .action-btn:not(:disabled):hover { transform: translateY(-1px); opacity: 0.9; }

        .date-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 12px;
          color: #e5e7eb;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          color-scheme: dark;
        }
        .date-input:focus { border-color: rgba(99,102,241,0.5); }
      `}</style>

      {/* Title */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f5', fontFamily: 'Syne' }}>
          Create New Post ✍️
        </h2>
      </div>

      {/* Platform Selector */}
      <PlatformSelector
        selectedPlatforms={selectedPlatforms}
        togglePlatform={togglePlatform}
        connectedPlatforms={connectedPlatforms}
      />

      {/* Warnings */}
      {connectedPlatforms.length === 0 && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
          <p style={{ fontSize: 12, color: '#fbbf24', fontFamily: 'DM Sans' }}>
            ⚠️ No platform connected —{' '}
            <a href="/settings" style={{ color: '#fbbf24', fontWeight: 700 }}>connect in Settings</a>
          </p>
        </div>
      )}

      {selectedPlatforms.includes('Twitter') && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10 }}>
          <p style={{ fontSize: 12, color: '#a5b4fc', fontFamily: 'DM Sans' }}>
            ℹ️ Twitter posting requires paid API plan. Schedule & Draft still work!
          </p>
        </div>
      )}

      {/* Textarea */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <textarea
          className="composer-input"
          rows={7}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What do you want to share with your audience?"
          style={{ borderColor: isOverLimit ? 'rgba(239,68,68,0.5)' : undefined }}
        />
        {/* Char counter */}
        <div style={{ position: 'absolute', bottom: 12, right: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="22" height="22" viewBox="0 0 22 22">
            <circle cx="11" cy="11" r="9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
            <circle cx="11" cy="11" r="9" fill="none"
              stroke={isOverLimit ? '#ef4444' : charPct > 80 ? '#f59e0b' : '#6366f1'}
              strokeWidth="2.5"
              strokeDasharray={`${2 * Math.PI * 9}`}
              strokeDashoffset={`${2 * Math.PI * 9 * (1 - charPct / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 11 11)"
              style={{ transition: 'stroke-dashoffset 0.2s' }}
            />
          </svg>
          <span style={{ fontSize: 11, color: isOverLimit ? '#ef4444' : '#4b5563', fontFamily: 'DM Sans', fontWeight: 600 }}>
            {charLimit - content.length}
          </span>
        </div>
      </div>

      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {modes.map(m => (
          <button
            key={m.id}
            className="mode-btn"
            onClick={() => { setPostMode(m.id); setPostResult(null) }}
            style={postMode === m.id ? {
              background: m.accent + '18',
              borderColor: m.accent + '40',
              color: m.accent === '#6b7280' ? '#d1d5db' : m.accent,
            } : {}}
          >
            <span>{m.icon}</span> {m.label}
          </button>
        ))}
      </div>

      {/* Schedule Picker */}
      {postMode === 'schedule' && (
        <div style={{ marginBottom: 16, padding: '14px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', marginBottom: 10, fontFamily: 'Syne' }}>⏰ Schedule Time</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 5, fontFamily: 'DM Sans' }}>Date</label>
              <input type="date" className="date-input" value={scheduledDate} min={new Date().toISOString().split('T')[0]} onChange={e => setScheduledDate(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 5, fontFamily: 'DM Sans' }}>Time</label>
              <input type="time" className="date-input" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
            </div>
          </div>
          {scheduledDate && scheduledTime && (
            <p style={{ fontSize: 11, color: '#818cf8', marginTop: 8, fontFamily: 'DM Sans' }}>
              📅 Will post at: {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Result */}
      {postResult && (
        <div style={{ marginBottom: 14 }}>
          {postResult.scheduled && (
            <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 12, color: '#a5b4fc', fontFamily: 'DM Sans' }}>
              ⏰ Scheduled! Will publish at {postResult.time}
            </div>
          )}
          {postResult.draft && (
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12, color: '#9ca3af', fontFamily: 'DM Sans' }}>
              📝 Draft saved successfully!
            </div>
          )}
          {postResult.success !== undefined && (
            <div style={{ padding: '10px 14px', background: postResult.success.length > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${postResult.success.length > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 10, fontSize: 12, fontFamily: 'DM Sans', color: postResult.success.length > 0 ? '#6ee7b7' : '#fca5a5' }}>
              {postResult.success.length > 0 && <p>✅ Posted: {postResult.success.join(', ')}</p>}
              {postResult.failed.length > 0 && <p style={{ marginTop: 4 }}>❌ Failed: {postResult.failed.join(', ')}</p>}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      {postMode === 'now' && (
        <button className="action-btn" onClick={handlePostNow}
          disabled={!content || isOverLimit || selectedPlatforms.length === 0 || isPosting}
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white' }}>
          ⚡ {isPosting ? 'Posting...' : 'Post Now!'}
        </button>
      )}
      {postMode === 'schedule' && (
        <button className="action-btn" onClick={handleSchedule}
          disabled={!content || isOverLimit || selectedPlatforms.length === 0 || !scheduledDate || !scheduledTime || isSaving}
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>
          🕐 {isSaving ? 'Scheduling...' : 'Schedule Post!'}
        </button>
      )}
      {postMode === 'draft' && (
        <button className="action-btn" onClick={handleSaveDraft}
          disabled={!content || isOverLimit || selectedPlatforms.length === 0 || isSaving}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#d1d5db' }}>
          📝 {isSaving ? 'Saving...' : 'Save as Draft'}
        </button>
      )}
    </div>
  )
}

