import { useState, useEffect } from 'react'
import axios from 'axios'
import { supabase } from '../../lib/supabaseClient'
import PlatformSelector from './PlatformSelector'
import { Zap, Clock, Save } from 'lucide-react'

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

  const saveTokensToSupabase = async (userId, platforms) => {
    for (const platform of platforms) {
      let token = null
      let personId = null
      if (platform === 'Twitter') token = localStorage.getItem('twitter_token')
      if (platform === 'LinkedIn') {
        token = localStorage.getItem('linkedin_token')
        personId = localStorage.getItem('linkedin_person_id')
      }
      if (token) {
        await supabase.from('social_tokens').upsert({
          user_id: userId,
          platform: platform.toLowerCase(),
          access_token: token,
          person_id: personId,
        })
      }
    }
  }

  const handlePostNow = async () => {
    if (!content || selectedPlatforms.length === 0) return
    setIsPosting(true)
    setPostResult(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session.user.id
      const accessToken = sessionData.session.access_token

      await saveTokensToSupabase(userId, selectedPlatforms)

      let successPlatforms = []
      let failedPlatforms = []

      // Twitter
      if (selectedPlatforms.includes('Twitter')) {
        const twitterToken = localStorage.getItem('twitter_token')
        if (!twitterToken) {
          failedPlatforms.push('Twitter (not connected)')
        } else {
          try {
            await axios.post('http://localhost:8000/api/social/twitter/post', {
              access_token: twitterToken,
              text: content,
            })
            successPlatforms.push('Twitter')
          } catch (e) {
            const detail = e.response?.data?.detail || ''
            if (detail.includes('402') || detail.includes('Payment')) {
              failedPlatforms.push('Twitter (Paid API required)')
            } else {
              failedPlatforms.push('Twitter')
            }
          }
        }
      }

      // LinkedIn
      if (selectedPlatforms.includes('LinkedIn')) {
        const linkedinToken = localStorage.getItem('linkedin_token')
        const personId = localStorage.getItem('linkedin_person_id')
        if (!linkedinToken) {
          failedPlatforms.push('LinkedIn (not connected)')
        } else {
          try {
            await axios.post('http://localhost:8000/api/social/linkedin/post', {
              access_token: linkedinToken,
              text: content,
              person_id: personId,
            })
            successPlatforms.push('LinkedIn')
          } catch (e) {
            console.error('LinkedIn error:', e.response?.data)
            failedPlatforms.push('LinkedIn')
          }
        }
      }

      // Save to Supabase
      await axios.post(
        'http://localhost:8000/api/posts/create',
        {
          user_id: userId,
          content,
          platforms: selectedPlatforms,
          scheduled_for: new Date().toISOString(),
          status: successPlatforms.length > 0 ? 'published' : 'failed',
          post_now: true,
          published_platforms: successPlatforms,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      setPostResult({ success: successPlatforms, failed: failedPlatforms })
      if (successPlatforms.length > 0) setContent('')
      if (onPostSaved) onPostSaved()

    } catch (e) {
      setPostResult({ success: [], failed: ['Error: ' + e.message] })
    } finally {
      setIsPosting(false)
    }
  }

  const handleSchedule = async () => {
    if (!content || selectedPlatforms.length === 0 || !scheduledDate || !scheduledTime) return
    setIsSaving(true)
    setPostResult(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session.user.id
      const accessToken = sessionData.session.access_token

      await saveTokensToSupabase(userId, selectedPlatforms)

      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()

      await axios.post(
        'http://localhost:8000/api/posts/create',
        {
          user_id: userId,
          content,
          platforms: selectedPlatforms,
          scheduled_for: scheduledFor,
          status: 'scheduled',
          post_now: false,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      const displayTime = new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()
      setPostResult({ scheduled: true, time: displayTime })
      setContent('')
      if (onPostSaved) onPostSaved()

    } catch (e) {
      setPostResult({ success: [], failed: ['Error: ' + e.message] })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!content || selectedPlatforms.length === 0) return
    setIsSaving(true)
    setPostResult(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session.user.id
      const accessToken = sessionData.session.access_token

      await axios.post(
        'http://localhost:8000/api/posts/create',
        {
          user_id: userId,
          content,
          platforms: selectedPlatforms,
          scheduled_for: new Date().toISOString(),
          status: 'draft',
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      setPostResult({ draft: true })
      setContent('')
      if (onPostSaved) onPostSaved()

    } catch (e) {
      setPostResult({ success: [], failed: ['Error: ' + e.message] })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 mb-5">Create New Post ✍️</h2>

      {/* Platform Selector */}
      <PlatformSelector
        selectedPlatforms={selectedPlatforms}
        togglePlatform={togglePlatform}
        connectedPlatforms={connectedPlatforms}
      />

      {/* Not connected warning */}
      {connectedPlatforms.length === 0 && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-xs text-yellow-700 font-medium">
            ⚠️ Koi platform connected nahi —{' '}
            <a href="/settings" className="underline font-bold">Settings</a>
            {' '}mein connect karo!
          </p>
        </div>
      )}

      {/* Twitter paid warning */}
      {selectedPlatforms.includes('Twitter') && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs text-blue-700 font-medium">
            ℹ️ Twitter posting requires paid API plan. Schedule & Draft still work!
          </p>
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What do you want to share with your audience?"
          className={"w-full h-44 p-4 border rounded-xl resize-none focus:ring-2 focus:outline-none transition-all " +
            (isOverLimit
              ? 'border-red-300 focus:ring-red-100'
              : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
            )}
        />
        <div className={"absolute bottom-3 right-3 text-xs font-semibold " +
          (isOverLimit ? 'text-red-500' : 'text-gray-400')}>
          {content.length} / {charLimit}
        </div>
      </div>

      {/* Post Mode Selector */}
      <div className="mt-4 flex gap-2 flex-wrap">
        {[
          { id: 'now', label: 'Post Now', icon: Zap, active: 'bg-green-500 text-white border-green-500' },
          { id: 'schedule', label: 'Schedule', icon: Clock, active: 'bg-blue-500 text-white border-blue-500' },
          { id: 'draft', label: 'Draft', icon: Save, active: 'bg-gray-600 text-white border-gray-600' },
        ].map(mode => {
          const Icon = mode.icon
          return (
            <button
              key={mode.id}
              onClick={() => { setPostMode(mode.id); setPostResult(null) }}
              className={"flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all " +
                (postMode === mode.id ? mode.active : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')}
            >
              <Icon size={15} />
              {mode.label}
            </button>
          )
        })}
      </div>

      {/* Schedule Time Picker */}
      {postMode === 'schedule' && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm font-semibold text-blue-700 mb-3">⏰ Schedule Time</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-blue-600 font-medium mb-1 block">Date</label>
              <input
                type="date"
                value={scheduledDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-blue-600 font-medium mb-1 block">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              />
            </div>
          </div>
          {scheduledDate && scheduledTime && (
            <p className="text-xs text-blue-500 mt-2 font-medium">
              📅 Will post at: {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Result Banner */}
      {postResult && (
        <div className="mt-4">
          {postResult.scheduled && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-medium">
              ⏰ Scheduled! Post will automatically publish at {postResult.time}
            </div>
          )}
          {postResult.draft && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium">
              📝 Draft saved successfully!
            </div>
          )}
          {postResult.success !== undefined && (
            <div className={"p-3 rounded-xl border text-sm font-medium " +
              (postResult.success.length > 0
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700')}>
              {postResult.success.length > 0 && (
                <p>✅ Posted on: {postResult.success.join(', ')}</p>
              )}
              {postResult.failed.length > 0 && (
                <p className="mt-1">❌ Failed: {postResult.failed.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4">
        {postMode === 'now' && (
          <button
            onClick={handlePostNow}
            disabled={!content || isOverLimit || selectedPlatforms.length === 0 || isPosting}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            {isPosting ? 'Posting...' : 'Post Now!'}
          </button>
        )}
        {postMode === 'schedule' && (
          <button
            onClick={handleSchedule}
            disabled={!content || isOverLimit || selectedPlatforms.length === 0 || !scheduledDate || !scheduledTime || isSaving}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Clock size={18} />
            {isSaving ? 'Scheduling...' : 'Schedule Post!'}
          </button>
        )}
        {postMode === 'draft' && (
          <button
            onClick={handleSaveDraft}
            disabled={!content || isOverLimit || selectedPlatforms.length === 0 || isSaving}
            className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save as Draft'}
          </button>
        )}
      </div>
    </div>
  )
}