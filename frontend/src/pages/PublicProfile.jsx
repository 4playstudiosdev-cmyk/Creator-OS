import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function PublicProfile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [username])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('is_public', true)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setProfile(data)
      }
    } catch (error) {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="text-6xl mb-6">😕</div>
          <h1 className="text-2xl font-bold text-white mb-2">Profile nahi mili</h1>
          <p className="text-gray-500">@{username} exist nahi karta ya private hai</p>
        </div>
      </div>
    )
  }

  const socialLinks = profile.social_links || {}
  const twitterHandle = socialLinks.twitter ? socialLinks.twitter.replace("@", "") : ""
  const instagramHandle = socialLinks.instagram ? socialLinks.instagram.replace("@", "") : ""

  const platforms = [
    twitterHandle && {
      label: "Twitter",
      handle: "@" + twitterHandle,
      href: "https://twitter.com/" + twitterHandle,
      bg: "bg-blue-500",
      emoji: "🐦"
    },
    socialLinks.linkedin && {
      label: "LinkedIn",
      handle: "LinkedIn",
      href: "https://" + socialLinks.linkedin,
      bg: "bg-blue-700",
      emoji: "💼"
    },
    socialLinks.youtube && {
      label: "YouTube",
      handle: "YouTube",
      href: "https://" + socialLinks.youtube,
      bg: "bg-red-600",
      emoji: "▶️"
    },
    instagramHandle && {
      label: "Instagram",
      handle: "@" + instagramHandle,
      href: "https://instagram.com/" + instagramHandle,
      bg: "bg-pink-600",
      emoji: "📸"
    },
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Top Nav */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gray-950 bg-opacity-80 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-bold text-blue-400">Creator OS</span>
        <button
          onClick={handleCopyLink}
          className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          {copied ? "✅ Copied!" : "🔗 Share Profile"}
        </button>
      </div>

      {/* Hero */}
      <div className="pt-16">
        <div className="relative">
          {/* Background gradient */}
          <div className="h-48 bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900"></div>

          {/* Profile Content */}
          <div className="max-w-2xl mx-auto px-4">
            <div className="relative -mt-16 mb-6 flex flex-col items-center text-center">

              {/* Avatar */}
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-gray-950 shadow-2xl mb-4"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-4xl font-bold border-4 border-gray-950 shadow-2xl mb-4">
                  {profile.full_name ? profile.full_name.charAt(0) : username.charAt(0)}
                </div>
              )}

              <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
              <p className="text-blue-400 font-medium mt-1 text-sm">@{profile.username}</p>

              {profile.bio && (
                <p className="text-gray-400 mt-3 max-w-sm leading-relaxed text-sm">
                  {profile.bio}
                </p>
              )}

              {/* Social Buttons */}
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {platforms.map(p => (
                  <a
                    key={p.label}
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={"flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-80 " + p.bg}
                  >
                    {p.emoji} {p.handle}
                  </a>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Total Reach', value: profile.stats_cache?.total_reach || '—', icon: '👥' },
                { label: 'Avg Engagement', value: profile.stats_cache?.avg_engagement || '—', icon: '📊' },
                { label: 'Posts / Month', value: profile.stats_cache?.posts_per_month || '—', icon: '📝' },
              ].map(stat => (
                <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xl mb-1">{stat.icon}</div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Contact CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-center mb-6">
              <h2 className="text-lg font-bold mb-2">Brand Collaboration? 🤝</h2>
              <p className="text-blue-200 mb-5 text-sm">
                {profile.full_name} ke saath kaam karne ke liye reach out karein
              </p>
              {twitterHandle && (
                <a
                  href={"https://twitter.com/" + twitterHandle}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white text-blue-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shadow-md text-sm"
                >
                  🐦 Twitter par Contact Karein
                </a>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pb-12">
              <p className="text-xs text-gray-600">
                Powered by <span className="text-blue-500 font-semibold">Creator OS</span>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}