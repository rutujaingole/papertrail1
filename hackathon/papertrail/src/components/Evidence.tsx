import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, ExternalLink, BookOpen, Quote as QuoteIcon } from 'lucide-react'
import { useAppStore } from '../store'
import * as Accordion from '@radix-ui/react-accordion'

export function Evidence() {
  const { evidence, citations, selectedCitation } = useAppStore()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // In a real app, show a toast notification here
      console.log('Copied to clipboard')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Group evidence by citation
  const evidenceByCitation = evidence.reduce((acc, item) => {
    if (!acc[item.citationId]) {
      acc[item.citationId] = []
    }
    acc[item.citationId].push(item)
    return acc
  }, {} as Record<string, typeof evidence>)

  // Get citation details for each evidence group
  const evidenceWithCitations = Object.entries(evidenceByCitation).map(([citationId, evidenceItems]) => {
    const citation = citations.find(c => c.id === citationId)
    return {
      citation,
      evidence: evidenceItems
    }
  }).filter(item => item.citation) // Only include items with valid citations

  if (evidenceWithCitations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)] p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-accent flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-[var(--accent-periwinkle)]" />
          </div>
          <h3 className="font-medium text-lg mb-2">No Evidence Yet</h3>
          <p className="text-[var(--text-secondary)] text-sm">
            Evidence from cited papers will appear here after you chat with the research assistant.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[var(--bg-primary)] overflow-y-auto">
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-1">Evidence</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Supporting quotes and references from your research
          </p>
        </div>

        <Accordion.Root type="multiple" className="space-y-3">
          {evidenceWithCitations.map(({ citation, evidence: evidenceItems }) => (
            <Accordion.Item
              key={citation!.id}
              value={citation!.id}
              className={`border border-[var(--border-primary)] rounded-lg overflow-hidden ${
                selectedCitation === citation!.id ? 'ring-2 ring-[var(--accent-periwinkle)] ring-opacity-50' : ''
              }`}
            >
              <Accordion.Trigger className="flex items-center justify-between w-full p-4 text-left hover:bg-[var(--bg-secondary)] transition-colors focus-ring">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-0.5 rounded text-[var(--text-accent)] font-mono">
                      {citation!.key}
                    </code>
                    <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
                      {evidenceItems.length} {evidenceItems.length === 1 ? 'quote' : 'quotes'}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">
                    {citation!.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {citation!.authors.slice(0, 2).join(', ')}
                    {citation!.authors.length > 2 && ' et al.'} • {citation!.year}
                    {citation!.venue && ` • ${citation!.venue}`}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)] transition-transform data-[state=open]:rotate-180" />
              </Accordion.Trigger>

              <Accordion.Content className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                <div className="px-4 pb-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                  {/* Citation Actions */}
                  <div className="flex items-center justify-between py-3 border-b border-[var(--border-primary)] mb-3">
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[var(--border-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors focus-ring">
                        <BookOpen className="w-3 h-3" />
                        Open in Library
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[var(--border-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors focus-ring">
                        <ExternalLink className="w-3 h-3" />
                        Jump to Page
                      </button>
                    </div>
                  </div>

                  {/* Evidence Quotes */}
                  <div className="space-y-3">
                    {evidenceItems.map((item, index) => (
                      <div
                        key={index}
                        className="relative p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg"
                      >
                        <div className="flex items-start gap-2">
                          <QuoteIcon className="w-4 h-4 mt-0.5 text-[var(--text-tertiary)] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <blockquote className="text-sm leading-relaxed font-mono text-[var(--text-primary)] mb-2">
                              "{item.quote}"
                            </blockquote>
                            {item.page && (
                              <p className="text-xs text-[var(--text-tertiary)]">
                                Page {item.page}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => copyToClipboard(item.quote)}
                            className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] transition-colors focus-ring"
                            title="Copy quote"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </div>
  )
}