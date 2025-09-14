import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Brain, User, MoreHorizontal } from 'lucide-react'
import { useAppStore } from '../store'
import { sendChatMessage } from '../lib/api'

export function Chat() {
  const {
    chatMessages,
    isTyping,
    groundedMode,
    addChatMessage,
    setIsTyping,
    setGroundedMode,
    setSelectedCitation,
    setActiveTab,
    setEvidence
  } = useAppStore()

  const [message, setMessage] = useState('')
  const [isReasoning, setIsReasoning] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isTyping) return

    const userMessage = message.trim()
    setMessage('')
    addChatMessage({ role: 'user', content: userMessage })
    setIsTyping(true)
    setIsReasoning(true)

    try {
      // Simulate reasoning delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsReasoning(false)

      const response = await sendChatMessage(userMessage, [], groundedMode)

      addChatMessage({
        role: 'assistant',
        content: response.answer,
        citations: response.citations
      })

      // Update evidence for the Evidence tab
      setEvidence(response.evidence)
    } catch (error) {
      addChatMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.'
      })
    } finally {
      setIsTyping(false)
      setIsReasoning(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleCitationClick = (citationId: string) => {
    setSelectedCitation(citationId)
    setActiveTab('evidence')
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [message])

  const renderMessage = (msg: typeof chatMessages[0]) => {
    const isUser = msg.role === 'user'

    return (
      <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-periwinkle)] to-[var(--accent-lilac)] flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
        )}

        <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
          <div
            className={`p-3 rounded-lg ${
              isUser
                ? 'bg-[var(--accent-periwinkle)] text-white'
                : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)]'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </p>

            {/* Render citation chips for assistant messages */}
            {!isUser && msg.citations && msg.citations.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[var(--border-primary)]">
                {msg.citations.map((citationId, index) => (
                  <button
                    key={citationId}
                    onClick={() => handleCitationClick(citationId)}
                    className="inline-flex items-center px-2 py-1 text-xs bg-[var(--accent-periwinkle)] text-white rounded hover:bg-opacity-90 transition-colors focus-ring"
                  >
                    [{index + 1}]
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`text-xs text-[var(--text-tertiary)] mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {chatMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--accent-periwinkle)] to-[var(--accent-lilac)] flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-medium text-lg mb-2">Research Assistant</h3>
              <p className="text-[var(--text-secondary)] text-sm max-w-md">
                Ask questions about your research, request help with citations, or get suggestions for your paper.
              </p>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map(renderMessage)}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-periwinkle)] to-[var(--accent-lilac)] flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-3 rounded-lg">
                  {isReasoning ? (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[var(--accent-periwinkle)] rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-[var(--accent-periwinkle)] rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-[var(--accent-periwinkle)] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      Reasoning...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <MoreHorizontal className="w-4 h-4 animate-pulse" />
                      Typing...
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Progress bar for reasoning */}
      {isReasoning && (
        <div className="h-1 bg-[var(--bg-secondary)] relative overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--accent-periwinkle)] to-[var(--accent-lilac)] animate-pulse"></div>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={groundedMode}
                  onChange={(e) => setGroundedMode(e.target.checked)}
                  className="rounded border-[var(--border-primary)] text-[var(--accent-periwinkle)] focus:ring-[var(--accent-periwinkle)]"
                />
                Grounded Mode
              </label>

              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors focus-ring opacity-50 cursor-not-allowed"
                disabled
                title="Attach PDF (Coming Soon)"
              >
                <Paperclip className="w-4 h-4" />
                Attach PDF
              </button>
            </div>

            <div className="text-xs text-[var(--text-tertiary)]">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-xs">Cmd</kbd>
              {' + '}
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-xs">Enter</kbd>
              {' to send'}
            </div>
          </div>

          {/* Message input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or describe what you need help with..."
              className="w-full resize-none border border-[var(--border-primary)] rounded-lg px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent min-h-[44px]"
              rows={1}
            />
            <button
              type="submit"
              disabled={!message.trim() || isTyping}
              className="absolute right-2 top-2 p-2 rounded-md bg-[var(--accent-periwinkle)] text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-ring"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}