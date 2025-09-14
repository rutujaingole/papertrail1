import { Search, Command, Moon, Sun, Settings, HelpCircle, Zap } from 'lucide-react'
import { useAppStore } from '../store'

export function CommandBar() {
  const { theme, toggleTheme, setCommandPaletteOpen } = useAppStore()

  const handleGlobalSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCommandPaletteOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setCommandPaletteOpen(true)
    }
  }

  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-solid border-[var(--border-primary)] bg-[var(--bg-elevated)] glass">
      {/* Left: Logo & App Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-periwinkle)] to-[var(--accent-lilac)]">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-lg font-semibold text-gradient">Research Copilot</h1>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-md mx-8">
        <form onSubmit={handleGlobalSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search papers, citations, or ask a question..."
              className="w-full pl-10 pr-20 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--accent-periwinkle)] focus:border-transparent transition-all"
              onKeyDown={handleKeyDown}
              readOnly
              onClick={() => setCommandPaletteOpen(true)}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
        </form>
      </div>

      {/* Right: Theme & Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors focus-ring"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>

        <button
          className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors focus-ring"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors focus-ring"
          title="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}