import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function YouTubeStudioPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('views');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('google_token');

  const fetchVideos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `http://localhost:8000/api/social/youtube/videos?access_token=${token}`
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Fetch failed');
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const getSortedVideos = () => {
    if (!data?.videos) return [];
    let videos = [...data.videos];

    if (searchQuery) {
      videos = videos.filter((v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    videos.sort((a, b) => {
      if (sortBy === 'views') return b.views - a.views;
      if (sortBy === 'likes') return b.likes - a.likes;
      if (sortBy === 'comments') return b.comments - a.comments;
      if (sortBy === 'date') return new Date(b.published_at) - new Date(a.published_at);
      return 0;
    });

    return videos;
  };

  const handleWriteScript = (video) => {
    localStorage.setItem('script_topic', video.title);
    navigate('/script-studio');
  };

  const sortedVideos = getSortedVideos();
  const topVideo = data?.videos?.[0];

  // UI: Not Connected State
  if (!token) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">YouTube Studio 📺</h1>
          <p className="text-gray-500 mt-1">Apni YouTube videos ka analytics dekho</p>
        </header>
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">YouTube Connected Nahi</h3>
          <p className="text-gray-400 mb-6">Settings mein YouTube connect karo apni videos dekhne ke liye</p>
          <button
            onClick={() => navigate('/settings')}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
          >
            ⚙️ Settings mein jao
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">YouTube Studio 📺</h1>
          <p className="text-gray-500 mt-1">Apni videos ka analytics aur performance dekho</p>
        </div>
        <button
          onClick={fetchVideos}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🔄'}
          Refresh
        </button>
      </header>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm font-medium">❌ {error}</p>
          <button onClick={() => navigate('/settings')} className="text-red-400 text-xs mt-1 underline">
            Token expired? Settings mein reconnect karo
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">YouTube se videos fetch ho rahi hain...</p>
        </div>
      ) : data && (
        <>
          {/* Channel Info Card */}
          <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-4">
              {data.channel?.thumbnail && (
                <img src={data.channel.thumbnail} alt="channel" className="w-16 h-16 rounded-full border-2 border-white/30" />
              )}
              <div>
                <h2 className="text-2xl font-bold">{data.channel?.name}</h2>
                <p className="text-red-100 text-sm">Your YouTube Channel</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-5">
              {[
                { label: 'Subscribers', value: formatNumber(data.channel?.subscribers), icon: '👥' },
                { label: 'Total Views', value: formatNumber(data.channel?.total_views), icon: '👁️' },
                { label: 'Total Videos', value: formatNumber(data.channel?.total_videos), icon: '🎬' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-red-100 text-[10px] uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Top Video */}
          {topVideo && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3 font-bold text-yellow-800">
                <span>🏆 Best Performing Video</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                {topVideo.thumbnail && (
                  <img src={topVideo.thumbnail} alt="" className="w-full sm:w-40 h-24 object-cover rounded-xl" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-gray-800 line-clamp-2 mb-2">{topVideo.title}</p>
                  <div className="flex gap-4 text-xs text-gray-500 mb-4">
                    <span>👁️ {formatNumber(topVideo.views)}</span>
                    <span>❤️ {formatNumber(topVideo.likes)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleWriteScript(topVideo)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold shadow-sm">
                      ✍️ Write Similar Script
                    </button>
                    <a href={topVideo.url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-yellow-200 text-yellow-800 rounded-lg text-xs font-bold">
                      ▶️ Watch
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex gap-3 flex-wrap items-center">
            <input
              type="text"
              placeholder="🔍 Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none"
            />
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {['views', 'likes', 'date'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    sortBy === s ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedVideos.map((video) => (
              <div key={video.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
                <div className="relative aspect-video">
                  <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                    {formatDate(video.published_at)}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-gray-800 text-sm line-clamp-2 mb-4 h-10">{video.title}</h4>
                  <div className="flex justify-between items-center mb-4">
                     <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Views</p>
                        <p className="font-bold text-gray-700">{formatNumber(video.views)}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Engagement</p>
                        <p className="font-bold text-green-600">
                          {video.views > 0 ? (((video.likes + video.comments) / video.views) * 100).toFixed(1) : 0}%
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleWriteScript(video)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                      ✍️ Script
                    </button>
                    <a href={video.url} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold border border-gray-100 text-center">
                      ▶️ Watch
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}