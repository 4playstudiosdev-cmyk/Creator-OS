import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'


export default function MediaKitPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: '',
    social_links: {
      twitter: '',
      linkedin: '',
      youtube: '',
      instagram: ''
    },
    is_public: true
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return

      const userId = sessionData.session.user.id
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        setProfile({
          ...data,
          social_links: data.social_links || {
            twitter: '',
            linkedin: '',
            youtube: '',
            instagram: ''
          }
        })
      }
    } catch (error) {
      console.log("Profile nahi mili — naya banayenge")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return

      const userId = sessionData.session.user.id

      const profileData = {
        id: userId,
        username: profile.username.toLowerCase().trim(),
        full_name: profile.full_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        social_links: profile.social_links,
        is_public: profile.is_public,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData)

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)

    } catch (error) {
      alert("Error: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  const updateSocialLink = (platform, value) => {
    setProfile(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: value }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Media Kit</h1>
        <p className="text-gray-500 mt-1">Apna public profile setup karein jo brands dekh sakein.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Edit Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
                  <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">creatoros.com/u/</span>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="yourname"
                    className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Aapka poora naam"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Apne baare mein batayein..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
                <input
                  type="text"
                  value={profile.avatar_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Social Links</h2>
            <div className="space-y-3">
              {[
                { key: 'twitter', label: 'Twitter', placeholder: '@username', color: 'text-blue-500' },
                { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/username', color: 'text-blue-700' },
                { key: 'youtube', label: 'YouTube', placeholder: 'youtube.com/@channel', color: 'text-red-500' },
                { key: 'instagram', label: 'Instagram', placeholder: '@username', color: 'text-pink-500' },
              ].map(platform => (
                <div key={platform.key} className="flex items-center gap-3">
                  <span className={`text-sm font-semibold w-20 ${platform.color}`}>{platform.label}</span>
                  <input
                    type="text"
                    value={profile.social_links[platform.key] || ''}
                    onChange={(e) => updateSocialLink(platform.key, e.target.value)}
                    placeholder={platform.placeholder}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.is_public}
                onChange={(e) => setProfile(prev => ({ ...prev, is_public: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Profile publicly visible</span>
            </label>

            <button
              onClick={handleSave}
              disabled={saving || !profile.username}
              className={`px-6 py-2.5 rounded-xl font-semibold text-white transition-all shadow-md ${
                saved
                  ? 'bg-green-500'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Live Preview</h3>

            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {profile.full_name?.charAt(0) || profile.username?.charAt(0) || '?'}
                </div>
              )}
              <h3 className="font-bold text-gray-900">{profile.full_name || 'Aapka Naam'}</h3>
              <p className="text-sm text-blue-500">@{profile.username || 'username'}</p>
              <p className="text-xs text-gray-500 mt-2">{profile.bio || 'Aapki bio yahan dikhegi...'}</p>
            </div>

            {/* Social Links Preview */}
            <div className="space-y-2">
              {Object.entries(profile.social_links).map(([platform, value]) =>
                value ? (
                  <div key={platform} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="font-semibold capitalize">{platform}:</span>
                    <span className="truncate">{value}</span>
                  </div>
                ) : null
              )}
            </div>

            {/* Public Link */}
            {profile.username && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Public Link:</p>
                <p className="text-xs font-semibold text-blue-600 truncate">
                  creatoros.com/u/{profile.username}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`creatoros.com/u/${profile.username}`)
                    alert('Link copied! 📋')
                  }}
                  className="mt-2 w-full text-xs bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy Public Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}