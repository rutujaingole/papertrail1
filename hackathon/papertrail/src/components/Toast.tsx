import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useAppStore } from '../store'
import * as Toast from '@radix-ui/react-toast'

export interface ToastData {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider swipeDirection="right" duration={3000}>
      {children}
      <ToastViewport />
    </Toast.Provider>
  )
}

function ToastViewport() {
  const { toasts, removeToast } = useAppStore()

  return (
    <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-80 z-50" />
  )
}

export function ToastItem({ toast }: { toast: ToastData }) {
  const { removeToast } = useAppStore()

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
  }

  const Icon = icons[toast.type]

  const colors = {
    success: 'border-[var(--accent-mint)] bg-[var(--bg-elevated)]',
    error: 'border-red-300 bg-[var(--bg-elevated)]',
    info: 'border-[var(--accent-periwinkle)] bg-[var(--bg-elevated)]'
  }

  const iconColors = {
    success: 'text-[var(--accent-mint)]',
    error: 'text-red-500',
    info: 'text-[var(--accent-periwinkle)]'
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id)
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, removeToast])

  return (
    <Toast.Root
      className={`animate-in slide-in-from-right-full p-4 rounded-lg border shadow-lg ${colors[toast.type]} glass`}
      duration={toast.duration}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[toast.type]}`} />
        <div className="flex-1 min-w-0">
          <Toast.Title className="font-medium text-[var(--text-primary)]">
            {toast.title}
          </Toast.Title>
          {toast.description && (
            <Toast.Description className="text-sm text-[var(--text-secondary)] mt-1">
              {toast.description}
            </Toast.Description>
          )}
        </div>
        <Toast.Close
          className="p-1 rounded-md hover:bg-[var(--bg-secondary)] transition-colors"
          onClick={() => removeToast(toast.id)}
        >
          <X className="w-4 h-4" />
        </Toast.Close>
      </div>
    </Toast.Root>
  )
}