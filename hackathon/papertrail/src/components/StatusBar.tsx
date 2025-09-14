import { Activity, FileText, Quote, Brain } from 'lucide-react'
import { useAppStore } from '../store'

export function StatusBar() {
  const { activeProject, citations, papers } = useAppStore()

  const modelStatus = 'Ready' // In real app, this would come from backend connection

  return (
    <footer className="h-6 px-4 bg-[var(--bg-elevated)] border-t border-[var(--border-primary)] flex items-center justify-between text-xs text-[var(--text-tertiary)]">
      {/* Left: Path hints */}
      <div className="flex items-center gap-4">
        {activeProject && (
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>{activeProject.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Quote className="w-3 h-3" />
          <span>{citations.length} citations</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          <span>{papers.length} papers</span>
        </div>
      </div>

      {/* Right: Model status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            <span>Models:</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              modelStatus === 'Ready'
                ? 'bg-[var(--accent-mint)]'
                : modelStatus === 'Busy'
                ? 'bg-[var(--text-warning)] animate-pulse'
                : 'bg-[var(--text-tertiary)]'
            }`}></div>
            <span className={modelStatus === 'Ready' ? 'text-[var(--text-success)]' : ''}>
              {modelStatus}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}