import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import axios from 'axios'

export default function RepurposePage() {
  const [mode, setMode] = useState('text') // 'text' ya 'youtube'
  const [sourceText, setSourceText] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [savingPlatform, setSavingPlatform] = useState(null)
  const [savedPlatforms, setSavedPlatforms] = useState([])

  const handleGenerate = async () => {
    if (mode === 'text' && !sourceText.trim()) return
    if (mode === 'youtube' && !youtubeUrl.trim()) return

    setLoading(true)
    setResults(null)
    setSavedPlatforms([])

    try {
      const payload = mode === 'youtube'
        ? { youtube_url: youtubeUrl, source_text: "" }
        : { source_text: sourceText, youtube_url: "" }

      const response = await axios.post(
        'http://localhost:8000/api/ai/repurpose',
        payload
      )
      setResults(response.data)
    } catch (error) {
      alert("Error: " + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async (platform, content) => {
    setSavingPlatform(platform)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) throw new Error("Login karein!")

      const userId = sessionData.session.user.id
      const accessToken = sessionData.session.access_token

      await axios.post(
        'http://localhost:8000/api/posts/create',
        {
          user_id: userId,
          content: content,
          platforms: [platform === 'newsletter' ? 'twitter' : platform],
          scheduled_for: new Date().toISOString()
        },
        {
          headers: {
            'Authorization': "Bearer " + accessToken,
            'Content-Type': 'application/json'
          }
        }
      )
      setSavedPlatforms(prev => [...prev, platform])
    } catch (error) {
      alert("Save nahi hua: " + error.message)
    } finally {
      setSavingPlatform(null)
    }
  }

  const platforms = results ? [
    {
      key: 'twitter',
      label: 'Twitter Thread',
      emoji: '🐦',
      content: results.twitter,
      color: 'border-blue-200 bg-blue-50',
      btnColor: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      key: 'linkedin',
      label: 'LinkedIn Post',
      emoji: '💼',
      content: results.linkedin,
      color: 'border-blue-300 bg-blue-50',
      btnColor: 'bg-blue-700 hover:bg-blue-800',
    },
    {
      key: 'newsletter',
      label: 'Newsletter Intro',
      emoji: '📧',
      content: results.newsletter,
      color: 'border-purple-200 bg-purple-50',
      btnColor: 'bg-purple-600 hover:bg-purple-700',
    },
  ] : []

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">✨ Repurpose Router</h1>
        <p className="text-gray-500 mt-1">Text ya YouTube URL dalo — AI 3 platforms ke liye instantly convert karega!</p>
      </header>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">

        {/* Mode Selector */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMode('text')}
            className={"px-4 py-2 rounded-lg text-sm font-semibold transition-all " + (mode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          >
            📝 Text Paste Karo
          </button>
          <button
            onClick={() => setMode('youtube')}
            className={"px-4 py-2 rounded-lg text-sm font-semibold transition-all " + (mode === 'youtube' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          >
            🎥 YouTube URL
          </button>
        </div>

        {/* Text Mode */}
        {mode === 'text' && (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Original Content (Blog, Script, ya koi bhi text)
            </label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Yahan apna lamba article, YouTube script, ya blog post paste karein..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm"
            />
            <p className="text-xs text-gray-400 mt-2">{sourceText.length} characters</p>
          </>
        )}

        {/* YouTube Mode */}
        {mode === 'youtube' && (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              YouTube Video URL
            </label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 text-sm"
            />
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                ⚠️ Video mein English/Urdu/Hindi captions honi chahiye. Private videos kaam nahi karein gi.
              </p>
            </div>
          </>
        )}

        {/* Generate Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleGenerate}
            disabled={loading || (mode === 'text' ? !sourceText.trim() : !youtubeUrl.trim())}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {mode === 'youtube' ? 'Transcript fetch ho raha hai...' : 'Generating...'}
              </>
            ) : (
              <>✨ Generate Content</>
            )}
          </button>
        </div>
      </div>

      {/* Results Grid */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {platforms.map(p => (
            <div key={p.key} className={"rounded-xl border p-5 " + p.color}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{p.emoji}</span>
                <h3 className="font-bold text-gray-800">{p.label}</h3>
                <span className="ml-auto text-xs text-gray-400">{p.content.length} chars</span>
              </div>

              <textarea
                defaultValue={p.content}
                rows={8}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100"
              />

              <button
                onClick={() => handleSaveDraft(p.key, p.content)}
                disabled={savingPlatform === p.key || savedPlatforms.includes(p.key)}
                className={"mt-3 w-full py-2 rounded-lg text-white text-sm font-semibold transition-all " + p.btnColor + " disabled:opacity-50"}
              >
                {savingPlatform === p.key
                  ? '⏳ Saving...'
                  : savedPlatforms.includes(p.key)
                  ? '✅ Saved to Scheduler!'
                  : 'Save as Draft'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">{mode === 'youtube' ? '🎥' : '✨'}</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {mode === 'youtube' ? 'YouTube URL paste karo!' : 'Ready to Repurpose!'}
          </h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            {mode === 'youtube'
              ? 'AI video ka transcript fetch karke 3 platforms ke liye content banayega'
              : 'Upar apna content paste karo aur Generate button dabao'}
          </p>
        </div>
      )}
    </div>
  )
}