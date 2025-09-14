import { useState, useEffect, useRef } from 'react'
import { Search, FileText, MessageSquare, BookOpen, FolderPlus, Upload, Moon, Sun, Settings, HelpCircle } from 'lucide-react'
import { useAppStore } from '../store'
import * as Dialog from '@radix-ui/react-dialog'

interface Command {
  id: string
  title: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: () => void
  category: 'navigation' | 'actions' | 'settings'
}

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    theme,
    toggleTheme,
    setActiveTab,
    activeTab
  } = useAppStore()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: Command[] = [
    // Navigation
    {
      id: 'go-editor',
      title: 'Go to Editor',
      icon: FileText,
      action: () => {
        setActiveTab('editor')
        setCommandPaletteOpen(false)
      },
      category: 'navigation'
    },
    {
      id: 'go-chat',
      title: 'Go to Chat',
      icon: MessageSquare,
      action: () => {
        setActiveTab('chat')
        setCommandPaletteOpen(false)
      },
      category: 'navigation'
    },
    {
      id: 'go-evidence',
      title: 'Go to Evidence',
      icon: BookOpen,
      action: () => {
        setActiveTab('evidence')
        setCommandPaletteOpen(false)
      },
      category: 'navigation'
    },

    // Actions
    {
      id: 'new-project',
      title: 'New Project',
      subtitle: 'Create a new research project',
      icon: FolderPlus,
      action: () => {
        setCommandPaletteOpen(false)
        // In real app, open new project modal
        console.log('Open new project modal')
      },
      category: 'actions'
    },
    {
      id: 'import-pdfs',
      title: 'Import PDFs',
      subtitle: 'Add papers to your library',
      icon: Upload,
      action: () => {
        setCommandPaletteOpen(false)
        // In real app, open file picker
        console.log('Open file picker')
      },
      category: 'actions'
    },

    // Settings
    {
      id: 'toggle-theme',
      title: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
      icon: theme === 'light' ? Moon : Sun,
      action: () => {
        toggleTheme()
        setCommandPaletteOpen(false)
      },
      category: 'settings'
    },
    {
      id: 'open-settings',
      title: 'Open Settings',
      icon: Settings,
      action: () => {
        setCommandPaletteOpen(false)
        console.log('Open settings')
      },
      category: 'settings'
    },
    {
      id: 'open-help',
      title: 'Open Help',
      icon: HelpCircle,
      action: () => {
        setCommandPaletteOpen(false)
        console.log('Open help')
      },
      category: 'settings'
    }
  ]

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase()) ||
    (command.subtitle && command.subtitle.toLowerCase().includes(query.toLowerCase()))
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (commandPaletteOpen) {
      inputRef.current?.focus()
      setQuery('')
    }
  }, [commandPaletteOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action()
      }
    }
  }

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = []
    }
    acc[command.category].push(command)
    return acc
  }, {} as Record<string, Command[]>)

  const categoryLabels = {
    navigation: 'Navigation',
    actions: 'Actions',
    settings: 'Settings'
  }

  return (
    <Dialog.Root open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in" />
        <Dialog.Content className="fixed top-[20%] left-1/2 transform -translate-x-1/2 w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl shadow-lg animate-in">
          <div className="p-4 border-b border-[var(--border-primary)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search..."
                className="w-full pl-12 pr-4 py-3 bg-transparent text-lg border-none outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
                <p className="text-[var(--text-secondary)]">No commands found</p>
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <div key={category}>
                    <div className="px-4 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </div>
                    {categoryCommands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command)
                      const isSelected = globalIndex === selectedIndex
                      const Icon = command.icon

                      return (
                        <button
                          key={command.id}
                          onClick={() => command.action()}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors focus:outline-none ${
                            isSelected
                              ? 'bg-[var(--accent-periwinkle)] text-white'
                              : 'hover:bg-[var(--bg-secondary)]'
                          }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{command.title}</div>
                            {command.subtitle && (
                              <div className={`text-sm ${
                                isSelected ? 'text-white/80' : 'text-[var(--text-secondary)]'
                              }`}>
                                {command.subtitle}
                              </div>
                            )}
                          </div>
                          {command.shortcut && (
                            <div className={`text-xs font-mono px-2 py-1 rounded ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                            }`}>
                              {command.shortcut}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[var(--border-primary)] text-xs text-[var(--text-tertiary)] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded">↑↓</kbd>
                <span>navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded">↵</kbd>
                <span>select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded">esc</kbd>
              <span>close</span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}