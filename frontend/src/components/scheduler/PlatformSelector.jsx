import { Twitter, Linkedin } from 'lucide-react'

const platforms = [
  {
    id: 'Twitter',
    name: 'Twitter',
    icon: Twitter,
    activeColor: 'text-blue-500 bg-blue-50 border-blue-500',
    inactiveColor: 'text-gray-400 bg-white border-gray-200 hover:border-blue-200',
    connectedKey: 'twitter'
  },
  {
    id: 'LinkedIn',
    name: 'LinkedIn',
    icon: Linkedin,
    activeColor: 'text-blue-700 bg-blue-50 border-blue-700',
    inactiveColor: 'text-gray-400 bg-white border-gray-200 hover:border-blue-200',
    connectedKey: 'linkedin'
  },
]

export default function PlatformSelector({ selectedPlatforms, togglePlatform, connectedPlatforms = [] }) {
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {platforms.map((p) => {
        const Icon = p.icon
        const isSelected = selectedPlatforms.includes(p.id)
        const isConnected = connectedPlatforms.includes(p.connectedKey)
        return (
          <button
            key={p.id}
            onClick={() => togglePlatform(p.id)}
            className={"flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium transition-all " +
              (isSelected ? p.activeColor : p.inactiveColor)}
          >
            <Icon size={16} />
            {p.name}
            <span className={"w-2 h-2 rounded-full " + (isConnected ? 'bg-green-400' : 'bg-gray-300')}></span>
          </button>
        )
      })}
    </div>
  )
}