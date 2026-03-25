const platforms = [
  {
    id: 'Twitter',
    name: 'Twitter',
    icon: '𝕏',
    activeStyle: { background: 'rgba(29,155,240,0.15)', border: '1px solid rgba(29,155,240,0.5)', color: '#60b8f5' },
    connectedKey: 'twitter',
  },
  {
    id: 'LinkedIn',
    name: 'LinkedIn',
    icon: 'in',
    activeStyle: { background: 'rgba(0,119,181,0.15)', border: '1px solid rgba(0,119,181,0.5)', color: '#5ba8d4' },
    connectedKey: 'linkedin',
  },
  {
    id: 'YouTube',
    name: 'YouTube',
    icon: '▶',
    activeStyle: { background: 'rgba(255,0,0,0.12)', border: '1px solid rgba(255,0,0,0.4)', color: '#f87171' },
    connectedKey: 'youtube',
  },
]

export default function PlatformSelector({ selectedPlatforms, togglePlatform, connectedPlatforms = [] }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
      {platforms.map((p) => {
        const isSelected = selectedPlatforms.includes(p.id)
        const isConnected = connectedPlatforms.includes(p.connectedKey)
        return (
          <button
            key={p.id}
            onClick={() => togglePlatform(p.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px',
              borderRadius: 100,
              fontSize: 12, fontWeight: 600,
              fontFamily: "'Syne', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.18s',
              ...(isSelected
                ? p.activeStyle
                : {
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#6b7280',
                  }),
            }}
          >
            <span style={{ fontSize: 13 }}>{p.icon}</span>
            {p.name}
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isConnected ? '#10b981' : '#374151',
              flexShrink: 0,
            }} />
          </button>
        )
      })}
    </div>
  )
}