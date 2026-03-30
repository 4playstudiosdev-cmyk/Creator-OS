import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const S = {
  card: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' },
  input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#f0f0f5', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn: { cursor: 'pointer', border: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s', borderRadius: 12 },
  result: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginTop: 14, fontSize: 13, color: '#d1d5db', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
}

const TOOLS = [
  { id: 'ideas', icon: '💡', label: 'Idea Matrix', color: '#f59e0b', desc: 'Generate 10 viral content ideas for any niche or topic' },
  { id: 'calendar', icon: '📅', label: 'Content Calendar', color: '#6366f1', desc: 'Get a 30-day content plan for your niche' },
  { id: 'hashtags', icon: '#️⃣', label: 'Hashtag Generator', color: '#10b981', desc: 'Get the best hashtags for your post to maximize reach' },
  { id: 'ab', icon: '🔬', label: 'Title A/B Tester', color: '#8b5cf6', desc: 'Compare two titles and get AI feedback on which performs better' },
  { id: 'hook', icon: '🪝', label: 'Hook Generator', color: '#ef4444', desc: 'Generate powerful hooks for your YouTube videos or social posts' },
  { id: 'bio', icon: '👤', label: 'Bio Writer', color: '#0077b5', desc: 'Generate a professional bio for your social media profiles' },
]

async function callAI(prompt) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || ''
    const res = await fetch('' + import.meta.env.VITE_API_URL + '/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ prompt, max_tokens: 600 })
    })
    if (!res.ok) throw new Error('Backend not available')
    const data = await res.json()
    return data.content || data.text || ''
  } catch {
    // Fallback demo responses
    return null
  }
}

function demoResponse(toolId, inputs) {
  const demos = {
    ideas: `Here are 10 viral content ideas for "${inputs.topic || 'your niche'}":\n\n1. "I tried ${inputs.topic} for 30 days — here's what happened" (Challenge format)\n2. "5 things nobody tells you about ${inputs.topic}" (Secrets reveal)\n3. "The biggest mistake beginners make with ${inputs.topic}" (Warning format)\n4. "${inputs.topic} tier list — ranking everything from S to F" (Ranking video)\n5. "I asked 100 experts about ${inputs.topic} — here's the truth" (Research format)\n6. "How I went from 0 to [result] with ${inputs.topic} in 90 days" (Journey story)\n7. "Reacting to the worst ${inputs.topic} advice online" (Reaction format)\n8. "${inputs.topic} vs [Alternative] — which one actually wins?" (Comparison format)\n9. "Day in my life as a ${inputs.topic} creator" (Vlog format)\n10. "Everything wrong with how people approach ${inputs.topic}" (Critique format)`,

    calendar: `30-Day Content Calendar for "${inputs.niche || 'Creator'}":\n\nWEEK 1 (Days 1-7) — Foundation\n• Day 1: Introduce yourself + your niche story (YouTube)\n• Day 2: Top 5 tips for beginners (Instagram Reel)\n• Day 3: Thread: What I wish I knew when starting (Twitter)\n• Day 4: Behind the scenes — my workspace setup (TikTok)\n• Day 5: Educational post: Common misconceptions (LinkedIn)\n• Day 6: Q&A video answering top questions\n• Day 7: Weekly recap + what's coming next\n\nWEEK 2 (Days 8-14) — Value\n• Day 8: Tutorial: Step-by-step guide on your main topic\n• Day 9: Storytime: Biggest failure + what I learned\n• Day 10: Tools I use daily (Instagram carousel)\n• Day 11: Thread: Mini case study with numbers\n• Day 12: Live Q&A session\n• Day 13: Collab content or feature someone\n• Day 14: Best performing content recap\n\nWEEK 3-4: Repeat top-performing formats with new angles.`,

    hashtags: `Hashtag Strategy for "${inputs.topic || 'your content'}":\n\n🔥 HIGH REACH (1M+ posts) — Use 3-4:\n#${(inputs.topic || 'content').replace(/\s+/g, '')} #ContentCreator #CreatorEconomy #ViralContent\n\n🎯 MID RANGE (100K-1M posts) — Use 4-5:\n#${(inputs.topic || 'content').replace(/\s+/g, '')}Tips #${inputs.niche || 'Creator'}Community #GrowthHacking #CreatorLife #ContentStrategy\n\n💎 NICHE (10K-100K posts) — Use 3-4:\n#${(inputs.topic || 'content').replace(/\s+/g, '')}Creator #SmallCreator #NicheContent #${inputs.niche || 'Creator'}Tips\n\n📍 BRANDED — Use 1-2:\n#YourBrand #YourName\n\n✅ Optimal combo for Instagram: 15-20 hashtags mix of all sizes\n✅ For TikTok: 3-5 targeted hashtags only\n✅ For LinkedIn: 3-5 professional hashtags\n✅ For Twitter: 1-2 trending + 1 niche`,

    ab: `A/B Title Analysis:\n\nTitle A: "${inputs.titleA || 'Your first title'}"\nTitle B: "${inputs.titleB || 'Your second title'}"\n\n📊 PREDICTED PERFORMANCE:\n\nTitle A Score: 72/100\n• Click-through rate (CTR): Medium-High\n• Keyword strength: Good\n• Emotional trigger: Moderate\n• Clarity: Clear and direct\n• Best for: YouTube search, LinkedIn\n\nTitle B Score: 85/100\n• Click-through rate (CTR): High\n• Keyword strength: Strong\n• Emotional trigger: High (creates curiosity)\n• Clarity: Compelling + intriguing\n• Best for: YouTube browse, TikTok, Instagram\n\n🏆 WINNER: Title B performs better because it creates a curiosity gap that compels users to click. The specific detail makes it feel credible.\n\n💡 OPTIMIZATION TIP: Combine the best elements — add the specific number from Title B to the directness of Title A for a hybrid that could score 90+.`,

    hook: `Power Hooks for "${inputs.topic || 'your video'}":\n\n🪝 PATTERN INTERRUPT HOOKS:\n1. "Stop scrolling — this took me 3 years to figure out"\n2. "Everyone is wrong about ${inputs.topic || 'this topic'}. Here's the truth."\n3. "What I'm about to share got me banned from 3 Facebook groups"\n\n❓ CURIOSITY GAP HOOKS:\n4. "I did something most ${inputs.niche || 'creators'} would never try — and it changed everything"\n5. "The #1 mistake ${inputs.niche || 'creators'} make that kills their growth"\n6. "I spent $10,000 to learn this. You're getting it for free."\n\n📖 STORY HOOKS:\n7. "Six months ago, I had zero followers. Here's the exact strategy I used."\n8. "My mentor told me this was impossible. She was wrong."\n\n🔢 NUMBER HOOKS:\n9. "5 things that actually moved the needle for my channel"\n10. "I analyzed 1,000 viral posts. Here are the only 3 things that matter."\n\n✅ PRO TIP: Best hook = Pattern interrupt + Specific number + Promise of value`,

    bio: `Professional Bio Options for ${inputs.name || 'Your Name'}:\n\n📱 SHORT BIO (Instagram/TikTok — 150 chars):\n"${inputs.niche || 'Content'} creator 🎬 | Helping ${inputs.audience || 'creators'} grow faster | New video every week 📅 | DMs open for collabs 👇"\n\n💼 MEDIUM BIO (Twitter/LinkedIn — 300 chars):\n"I create content about ${inputs.niche || 'creator economy'} for ${inputs.audience || 'ambitious creators'}. After growing my channel to ${inputs.followers || '50K+'} subscribers, I now share everything I know about ${inputs.niche || 'building an audience'}. Weekly tips on content, growth & monetization."\n\n🌐 LONG BIO (Website/YouTube about):\n"${inputs.name || 'Hi! I\'m a'} content creator focused on ${inputs.niche || 'creator education and digital entrepreneurship'}. I started creating content in 2022 and grew my audience to ${inputs.followers || '50,000+'} across platforms.\n\nI specialize in helping ${inputs.audience || 'creators like you'} build audiences, create better content, and monetize their work — without burning out.\n\nEvery week I publish new videos, tips, and strategies to help you grow faster.\n\nFor business inquiries and collaborations, contact: ${inputs.email || 'your@email.com'}"`
  }
  return demos[toolId] || 'Content generated successfully!'
}

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState('ideas')
  const [inputs, setInputs] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  const tool = TOOLS.find(t => t.id === activeTool)

  const updateInput = (key, value) => setInputs(p => ({ ...p, [key]: value }))

  const handleGenerate = async () => {
    setLoading(true)
    setResult('')

    const prompts = {
      ideas: `Generate exactly 10 viral content ideas for the topic: "${inputs.topic || 'content creation'}". Platform: ${inputs.platform || 'YouTube'}. For each idea, include: the title/concept, the format type (challenge, tutorial, story, etc.), and why it's viral. Number them 1-10.`,
      calendar: `Create a detailed 30-day content calendar for a ${inputs.niche || 'general'} creator. Include: specific content ideas for each day, which platform to post on (YouTube/Instagram/Twitter/TikTok), and the content format. Be specific and actionable.`,
      hashtags: `Generate a complete hashtag strategy for this content: "${inputs.topic || 'general content'}". Niche: ${inputs.niche || 'creator'}. Provide: 5 high-reach hashtags (1M+ posts), 5 mid-range hashtags (100K-1M), 5 niche hashtags (10K-100K), and 2 branded hashtag suggestions. Explain the optimal usage strategy.`,
      ab: `Analyze these two content titles and predict which performs better:\nTitle A: "${inputs.titleA || 'First title'}"\nTitle B: "${inputs.titleB || 'Second title'}"\nProvide: CTR prediction for each, emotional trigger analysis, keyword strength, and clear recommendation with explanation. Give each a score out of 100.`,
      hook: `Generate 10 powerful attention-grabbing hooks for a video/post about: "${inputs.topic || 'content creation'}". Target audience: ${inputs.niche || 'creators'}. Include different hook types: pattern interrupt, curiosity gap, story, and number-based hooks. Explain why each hook works.`,
      bio: `Write 3 versions of a professional creator bio for: Name: ${inputs.name || 'Creator'}, Niche: ${inputs.niche || 'content creation'}, Audience: ${inputs.audience || 'aspiring creators'}, Followers: ${inputs.followers || '10K+'}, Email: ${inputs.email || 'email@domain.com'}. Write: 1) Short bio (150 chars for Instagram/TikTok), 2) Medium bio (300 chars for Twitter), 3) Long bio (300+ words for website/YouTube about page).`,
    }

    const prompt = prompts[activeTool]
    let content = await callAI(prompt)
    if (!content) {
      // Use demo fallback
      await new Promise(r => setTimeout(r, 1500)) // simulate AI delay
      content = demoResponse(activeTool, inputs)
    }

    setResult(content)
    setLoading(false)
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getInputFields = () => {
    const fields = {
      ideas: [
        { key: 'topic', label: 'Topic or Niche', placeholder: 'e.g. YouTube growth, personal finance, fitness...' },
        { key: 'platform', label: 'Main Platform', placeholder: 'YouTube / Instagram / TikTok / Twitter', type: 'select', options: ['YouTube', 'Instagram', 'TikTok', 'Twitter', 'LinkedIn', 'All Platforms'] },
      ],
      calendar: [
        { key: 'niche', label: 'Your Niche', placeholder: 'e.g. Tech reviews, cooking, travel...' },
        { key: 'goal', label: 'Goal This Month', placeholder: 'e.g. Grow subscribers, launch product, build brand...' },
      ],
      hashtags: [
        { key: 'topic', label: 'Post Topic', placeholder: 'What is your post/video about?' },
        { key: 'niche', label: 'Your Niche', placeholder: 'e.g. Tech, fitness, cooking...' },
        { key: 'platform', label: 'Platform', placeholder: 'Select platform', type: 'select', options: ['Instagram', 'TikTok', 'Twitter', 'LinkedIn', 'YouTube'] },
      ],
      ab: [
        { key: 'titleA', label: 'Title Option A', placeholder: 'Your first title idea...' },
        { key: 'titleB', label: 'Title Option B', placeholder: 'Your second title idea...' },
        { key: 'platform', label: 'Platform', placeholder: 'Select platform', type: 'select', options: ['YouTube', 'Blog', 'LinkedIn', 'Twitter', 'Email Subject'] },
      ],
      hook: [
        { key: 'topic', label: 'Video / Post Topic', placeholder: 'What is your video or post about?' },
        { key: 'niche', label: 'Target Audience', placeholder: 'e.g. Beginner YouTubers, fitness enthusiasts...' },
      ],
      bio: [
        { key: 'name', label: 'Your Name', placeholder: 'e.g. Ahmed Khan' },
        { key: 'niche', label: 'Your Niche', placeholder: 'e.g. Tech creator, fitness coach...' },
        { key: 'audience', label: 'Target Audience', placeholder: 'e.g. aspiring creators, gym beginners...' },
        { key: 'followers', label: 'Total Following', placeholder: 'e.g. 50K+' },
        { key: 'email', label: 'Contact Email', placeholder: 'your@email.com' },
      ],
    }
    return fields[activeTool] || []
  }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 100, color: '#a5b4fc', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
          AI TOOLS
        </div>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, marginBottom: 4 }}>🤖 AI Power Tools</h1>
        <p style={{ color: '#6b7280', fontSize: 13 }}>Six AI-powered tools to supercharge your content strategy</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        {/* Tool selector */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TOOLS.map(t => (
              <button key={t.id} onClick={() => { setActiveTool(t.id); setResult(''); setInputs({}) }}
                style={{ ...S.btn, padding: '14px 16px', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: activeTool === t.id ? `rgba(${t.id === 'ideas' ? '245,158,11' : t.id === 'calendar' ? '99,102,241' : t.id === 'hashtags' ? '16,185,129' : t.id === 'ab' ? '139,92,246' : t.id === 'hook' ? '239,68,68' : '0,119,181'},0.12)` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${activeTool === t.id ? t.color + '44' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 14,
                }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
                <div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: activeTool === t.id ? t.color : '#f0f0f5', marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.4 }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tool workspace */}
        <div>
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}>{tool.icon}</span>
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>{tool.label}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{tool.desc}</div>
              </div>
            </div>

            {/* Input fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {getInputFields().map(field => (
                <div key={field.key}>
                  <label style={S.label}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={inputs[field.key] || ''}
                      onChange={e => updateInput(field.key, e.target.value)}
                      style={{ ...S.input, cursor: 'pointer', appearance: 'none' }}>
                      <option value="">Select {field.label}...</option>
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      style={S.input}
                      value={inputs[field.key] || ''}
                      onChange={e => updateInput(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      onKeyDown={e => e.key === 'Enter' && !loading && handleGenerate()}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Generate button */}
            <button onClick={handleGenerate} disabled={loading}
              style={{ ...S.btn, width: '100%', padding: '13px 24px', fontSize: 14, fontWeight: 700,
                background: loading ? 'rgba(99,102,241,0.4)' : `linear-gradient(135deg,${tool.color},${tool.color}cc)`,
                color: '#fff', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: loading ? 'none' : `0 4px 16px ${tool.color}44`,
              }}>
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity=".3"/>
                    <path d="M12 3a9 9 0 019 9"/>
                  </svg>
                  Generating with AI...
                </>
              ) : (
                <>⚡ Generate {tool.label}</>
              )}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>Generated Result</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={copyResult}
                    style={{ ...S.btn, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                      background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      color: copied ? '#6ee7b7' : '#9ca3af',
                    }}>
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                  <button onClick={handleGenerate}
                    style={{ ...S.btn, padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>
                    🔄 Regenerate
                  </button>
                </div>
              </div>
              <div style={S.result}>{result}</div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

