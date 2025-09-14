import { FileText, MessageSquare, BookOpen } from 'lucide-react'
import { useAppStore } from '../store'

export function CenterTabs() {
  const { activeTab, setActiveTab } = useAppStore()

  const tabs = [
    { id: 'editor' as const, label: 'Editor', icon: FileText },
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { id: 'evidence' as const, label: 'Evidence', icon: BookOpen }
  ]

  return (
    <div className="flex items-center border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <div className="flex">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all focus-ring ${
                isActive
                  ? 'border-[var(--accent-periwinkle)] text-[var(--text-accent)] bg-[var(--bg-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}