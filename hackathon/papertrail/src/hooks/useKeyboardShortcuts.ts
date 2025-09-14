import { useEffect } from 'react'
import { useAppStore } from '../store'

export function useKeyboardShortcuts() {
  const { setCommandPaletteOpen, toggleLeftSidebar, setActiveTab } = useAppStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }

      // Command/Ctrl + B for toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggleLeftSidebar()
      }

      // Tab navigation shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '3') {
        e.preventDefault()
        const tabMap = {
          '1': 'editor' as const,
          '2': 'chat' as const,
          '3': 'evidence' as const
        }
        setActiveTab(tabMap[e.key as keyof typeof tabMap])
      }

      // Escape key to close command palette
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setCommandPaletteOpen, toggleLeftSidebar, setActiveTab])
}