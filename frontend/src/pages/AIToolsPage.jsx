import { useState } from 'react'

const NICHES = [
  'Tech & AI', 'Personal Finance', 'Fitness & Health', 'Content Creation',
  'Entrepreneurship', 'Digital Marketing', 'Travel', 'Food & Cooking',
  'Fashion & Style', 'Mental Health', 'Crypto & Web3', 'Education'
]

const PLATFORMS = ['Twitter', 'LinkedIn', 'YouTube', 'Instagram']

export default function AIToolsPage() {
  const [activeTab, setActiveTab] = useState('idea-matrix')

  const [selectedNiche, setSelectedNiche] = useState('')
  const [customNiche, setCustomNiche] = useState('')
  const [ideaLoading, setIdeaLoading] = useState(false)
  const [ideas, setIdeas] = useState([])

  const [calendarNiche, setCalendarNiche] = useState('')
  const [calendarPlatform, setCalendarPlatform] = useState('Twitter')
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarPlan, setCalendarPlan] = useState([])

  const [postA, setPostA] = useState('')
  const [postB, setPostB] = useState('')
  const [abPlatform, setAbPlatform] = useState('Twitter')
  const [abLoading, setAbLoading] = useState(false)
  const [abResult, setAbResult] = useState(null)

  const [hashtagTopic, setHashtagTopic] = useState('')
  const [hashtagPlatform, setHashtagPlatform] = useState('Instagram')
  const [hashtagLoading, setHashtagLoading] = useState(false)
  const [hashtagResult, setHashtagResult] = useState(null)

  const handleGenerateIdeas = async () => {
    const niche = customNiche || selectedNiche
    if (!niche) return
    setIdeaLoading(true)
    setIdeas([])
    try {
      const response = await fetch("http://localhost:8000/api/ai/idea-matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche })
      })
      const data = await response.json()
      setIdeas(data.ideas || [])
    } catch (e) {
      alert("Error: " + e.message)
    } finally {
      setIdeaLoading(false)
    }
  }

  const handleCalendarFill = async () => {
    if (!calendarNiche) return
    setCalendarLoading(true)
    setCalendarPlan([])
    try {
      const response = await fetch("http://localhost:8000/api/ai/calendar-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: calendarNiche, platform: calendarPlatform })
      })
      const data = await response.json()
      setCalendarPlan(data.plan || [])
    } catch (e) {
      alert("Error: " + e.message)
    } finally {
      setCalendarLoading(false)
    }
  }

  const handleAbTest = async () => {
    if (!postA.trim() || !postB.trim()) return
    setAbLoading(true)
    setAbResult(null)
    try {
      const response = await fetch("http://localhost:8000/api/ai/ab-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_a: postA, post_b: postB, platform: abPlatform })
      })
      const data = await response.json()
      setAbResult(data)
    } catch (e) {
      alert("Error: " + e.message)
    } finally {
      setAbLoading(false)
    }
  }

  const handleHashtags = async () => {
    if (!hashtagTopic.trim()) return
    setHashtagLoading(true)
    setHashtagResult(null)
    try {
      const response = await fetch("http://localhost:8000/api/ai/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: hashtagTopic, platform: hashtagPlatform })
      })
      const data = await response.json()
      setHashtagResult(data)
    } catch (e) {
      alert("Error: " + e.message)
    } finally {
      setHashtagLoading(false)
    }
  }

  const tabs = [
    { id: 'idea-matrix', label: '🧠 Idea Matrix', desc: 'Trending topics' },
    { id: 'calendar', label: '📅 Calendar Fill', desc: 'Auto schedule' },
    { id: 'ab-test', label: '🔬 A/B Testing', desc: 'Best post' },
    { id: 'hashtags', label: '#️⃣ Hashtags', desc: 'Viral score' },
  ]

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Power Tools 🤖</h1>
        <p className="text-gray-500 mt-1">AI se apni content strategy supercharge karein</p>
      </header>

      {/* Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={"p-4 rounded-xl border-2 text-left transition-all " + (activeTab === tab.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300')}
          >
            <p className={"font-semibold text-sm " + (activeTab === tab.id ? 'text-blue-700' : 'text-gray-700')}>{tab.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Tab 1: Idea Matrix */}
      {activeTab === 'idea-matrix' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">🧠 AI Idea Matrix</h2>
          <p className="text-gray-400 text-sm mb-5">Apna niche chunein — AI 10 trending content ideas dega</p>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Select:</p>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => (
                <button
                  key={n}
                  onClick={() => { setSelectedNiche(n); setCustomNiche('') }}
                  className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-all border " + (selectedNiche === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300')}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mb-5">
            <input
              type="text"
              value={customNiche}
              onChange={(e) => { setCustomNiche(e.target.value); setSelectedNiche('') }}
              placeholder="Ya apna custom niche likhein..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
            <button
              onClick={handleGenerateIdeas}
              disabled={ideaLoading || (!selectedNiche && !customNiche)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {ideaLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </div>
              ) : '✨ Generate Ideas'}
            </button>
          </div>

          {ideas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ideas.map((idea, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{idea.title}</p>
                    {idea.hook && <p className="text-xs text-gray-400 mt-0.5">{idea.hook}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!ideaLoading && ideas.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">🧠</div>
              <p className="text-gray-400 text-sm">Niche chunein aur Generate dabao!</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Calendar Auto-fill */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">📅 Content Calendar Auto-fill</h2>
          <p className="text-gray-400 text-sm mb-5">AI ek hafte ka content plan banayega — din, waqt, aur topic ke saath</p>

          <div className="flex gap-3 mb-5">
            <input
              type="text"
              value={calendarNiche}
              onChange={(e) => setCalendarNiche(e.target.value)}
              placeholder="Apna niche likhein (e.g. AI tools, Fitness)"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
            <select
              value={calendarPlatform}
              onChange={(e) => setCalendarPlatform(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
            >
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
            <button
              onClick={handleCalendarFill}
              disabled={calendarLoading || !calendarNiche.trim()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {calendarLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Planning...
                </div>
              ) : '📅 Generate Plan'}
            </button>
          </div>

          {calendarPlan.length > 0 && (
            <div className="space-y-3">
              {calendarPlan.map((day, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-center flex-shrink-0">
                    <p className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">{day.day}</p>
                    <p className="text-xs text-gray-400 mt-1">{day.time}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{day.topic}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{day.format}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                    {day.platform}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!calendarLoading && calendarPlan.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-gray-400 text-sm">Niche aur platform chunein — AI 7 din ka plan banayega!</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: A/B Testing */}
      {activeTab === 'ab-test' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">🔬 A/B Post Testing</h2>
          <p className="text-gray-400 text-sm mb-5">2 versions likhein — AI batayega konsa better perform karega aur kyun</p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <div className="flex gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => setAbPlatform(p)}
                  className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition-all " + (abPlatform === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version A {abResult?.winner === 'A' && <span className="text-green-600">🏆 Winner!</span>}
              </label>
              <textarea
                value={postA}
                onChange={(e) => setPostA(e.target.value)}
                placeholder="Pehla version likhein..."
                rows={6}
                className={"w-full px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 text-sm " + (abResult?.winner === 'A' ? 'border-green-400 focus:ring-green-100' : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version B {abResult?.winner === 'B' && <span className="text-green-600">🏆 Winner!</span>}
              </label>
              <textarea
                value={postB}
                onChange={(e) => setPostB(e.target.value)}
                placeholder="Doosra version likhein..."
                rows={6}
                className={"w-full px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 text-sm " + (abResult?.winner === 'B' ? 'border-green-400 focus:ring-green-100' : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400')}
              />
            </div>
          </div>

          <button
            onClick={handleAbTest}
            disabled={abLoading || !postA.trim() || !postB.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {abLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing...
              </div>
            ) : '🔬 Analyze Both Versions'}
          </button>

          {abResult && (
            <div className="mt-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏆</span>
                <h3 className="font-bold text-gray-900">Version {abResult.winner} Better Hai!</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{abResult.reason}</p>
              {abResult.tips && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">💡 Improvement Tips:</p>
                  <p className="text-xs text-blue-600">{abResult.tips}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Hashtags + Best Time */}
      {activeTab === 'hashtags' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">#️⃣ Auto-Hashtag + Best Time</h2>
          <p className="text-gray-400 text-sm mb-5">Topic dein — AI best hashtags, viral score aur posting time suggest karega</p>

          <div className="flex gap-3 mb-5">
            <input
              type="text"
              value={hashtagTopic}
              onChange={(e) => setHashtagTopic(e.target.value)}
              placeholder="Post ka topic likhein (e.g. AI tools for creators)"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
            <select
              value={hashtagPlatform}
              onChange={(e) => setHashtagPlatform(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
            >
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
            <button
              onClick={handleHashtags}
              disabled={hashtagLoading || !hashtagTopic.trim()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {hashtagLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </div>
              ) : '✨ Generate'}
            </button>
          </div>

          {hashtagResult && (
            <div className="space-y-4">

              {/* Viral Score */}
              {hashtagResult.viral_score && (
                <div className="p-5 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-orange-700">🔥 Content Potential Score</p>
                    <div className="text-3xl font-bold text-orange-600">
                      {hashtagResult.viral_score.score}
                      <span className="text-lg text-orange-400">/100</span>
                    </div>
                  </div>
                  <div className="w-full bg-orange-100 rounded-full h-2.5 mb-3">
                    <div
                      className={"h-2.5 rounded-full " + (hashtagResult.viral_score.score >= 70 ? 'bg-green-500' : hashtagResult.viral_score.score >= 50 ? 'bg-yellow-500' : 'bg-red-500')}
                      style={{ width: hashtagResult.viral_score.score + "%" }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Demand</p>
                      <p className={"text-sm font-bold " + (hashtagResult.viral_score.demand === 'High' ? 'text-green-600' : hashtagResult.viral_score.demand === 'Medium' ? 'text-yellow-600' : 'text-red-600')}>
                        {hashtagResult.viral_score.demand}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Competition</p>
                      <p className={"text-sm font-bold " + (hashtagResult.viral_score.competition === 'Low' ? 'text-green-600' : hashtagResult.viral_score.competition === 'Medium' ? 'text-yellow-600' : 'text-red-600')}>
                        {hashtagResult.viral_score.competition}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Trend</p>
                      <p className={"text-sm font-bold " + (hashtagResult.viral_score.trend === 'Rising' ? 'text-green-600' : hashtagResult.viral_score.trend === 'Stable' ? 'text-blue-600' : 'text-red-600')}>
                        {hashtagResult.viral_score.trend === 'Rising' ? '📈' : hashtagResult.viral_score.trend === 'Stable' ? '➡️' : '📉'} {hashtagResult.viral_score.trend}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-orange-700">{hashtagResult.viral_score.reason}</p>
                </div>
              )}

              {/* Grouped Hashtags */}
              {hashtagResult.hashtags && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-3">📌 Hashtags by Reach:</p>
                  <div className="space-y-3">
                    {hashtagResult.hashtags.high_reach && (
                      <div>
                        <p className="text-xs font-semibold text-red-500 mb-1.5">🔴 High Reach</p>
                        <div className="flex flex-wrap gap-2">
                          {hashtagResult.hashtags.high_reach.map((tag, i) => (
                            <span key={i} onClick={() => navigator.clipboard.writeText(tag)}
                              className="bg-red-50 text-red-600 border border-red-200 text-sm px-3 py-1 rounded-full font-medium cursor-pointer hover:bg-red-100 transition-colors"
                              title="Click to copy">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {hashtagResult.hashtags.medium_reach && (
                      <div>
                        <p className="text-xs font-semibold text-yellow-600 mb-1.5">🟡 Medium Reach</p>
                        <div className="flex flex-wrap gap-2">
                          {hashtagResult.hashtags.medium_reach.map((tag, i) => (
                            <span key={i} onClick={() => navigator.clipboard.writeText(tag)}
                              className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-sm px-3 py-1 rounded-full font-medium cursor-pointer hover:bg-yellow-100 transition-colors"
                              title="Click to copy">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {hashtagResult.hashtags.niche && (
                      <div>
                        <p className="text-xs font-semibold text-blue-500 mb-1.5">🔵 Niche</p>
                        <div className="flex flex-wrap gap-2">
                          {hashtagResult.hashtags.niche.map((tag, i) => (
                            <span key={i} onClick={() => navigator.clipboard.writeText(tag)}
                              className="bg-blue-50 text-blue-600 border border-blue-200 text-sm px-3 py-1 rounded-full font-medium cursor-pointer hover:bg-blue-100 transition-colors"
                              title="Click to copy">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">💡 Hashtag par click karein copy karne ke liye</p>
                </div>
              )}

              {/* Best Times */}
              {hashtagResult.best_times && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm font-semibold text-green-700 mb-3">
                    ⏰ Best Posting Times — {hashtagPlatform}
                  </p>
                  <div className="space-y-2">
                    {hashtagResult.best_times.map((t, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2">
                        <span className="text-xs font-bold text-green-600 w-4">{i + 1}</span>
                        <span className="text-sm font-semibold text-gray-800 w-24">{t.day}</span>
                        <span className="text-sm text-green-700 font-bold">{t.range}</span>
                        {t.reason && <span className="text-xs text-gray-400 ml-auto">{t.reason}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategy Tip */}
              {hashtagResult.strategy && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-sm font-semibold text-purple-700 mb-1">🎯 Strategy Tip:</p>
                  <p className="text-sm text-purple-600 leading-relaxed">{hashtagResult.strategy}</p>
                </div>
              )}
            </div>
          )}

          {!hashtagLoading && !hashtagResult && (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">#️⃣</div>
              <p className="text-gray-400 text-sm">Topic aur platform chunein — AI best hashtags, viral score aur time batayega!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}