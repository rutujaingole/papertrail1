import { Quote, List, Share2, Search, Star, Copy, ExternalLink } from 'lucide-react'
import { useAppStore } from '../store'
import { useState } from 'react'

export function RightInspector() {
  const {
    rightInspectorTab,
    setRightInspectorTab,
    citations,
    outline,
    selectedCitation,
    setSelectedCitation,
    toggleCitationFavorite
  } = useAppStore()

  const [citationSearch, setCitationSearch] = useState('')

  const tabs = [
    { id: 'citations' as const, label: 'Citations', icon: Quote },
    { id: 'outline' as const, label: 'Outline', icon: List },
    { id: 'related' as const, label: 'Related', icon: Share2 }
  ]

  const filteredCitations = citations.filter(citation =>
    citation.title.toLowerCase().includes(citationSearch.toLowerCase()) ||
    citation.authors.some(author => author.toLowerCase().includes(citationSearch.toLowerCase())) ||
    citation.key.toLowerCase().includes(citationSearch.toLowerCase())
  )

  const mockOutline = [
    { level: 1, title: 'Abstract', id: 'abstract' },
    { level: 1, title: 'Introduction', id: 'introduction' },
    { level: 1, title: 'Related Work', id: 'related-work' },
    { level: 2, title: 'Attention Mechanisms', id: 'attention' },
    { level: 2, title: 'Transformer Architectures', id: 'transformers' },
    { level: 1, title: 'Method', id: 'method' },
    { level: 2, title: 'Model Architecture', id: 'architecture' },
    { level: 2, title: 'Training Procedure', id: 'training' },
    { level: 1, title: 'Experiments', id: 'experiments' },
    { level: 2, title: 'Datasets', id: 'datasets' },
    { level: 2, title: 'Results', id: 'results' },
    { level: 1, title: 'Conclusion', id: 'conclusion' }
  ]

  const mockRelated = [
    {
      id: '1',
      title: 'GPT-3: Language Models are Few-Shot Learners',
      authors: ['Tom Brown', 'Benjamin Mann'],
      similarity: 0.89,
      reason: 'Similar transformer architecture'
    },
    {
      id: '2',
      title: 'RoBERTa: A Robustly Optimized BERT Pretraining Approach',
      authors: ['Yinhan Liu', 'Myle Ott'],
      similarity: 0.82,
      reason: 'Related pretraining methodology'
    },
    {
      id: '3',
      title: 'T5: Exploring the Limits of Transfer Learning',
      authors: ['Colin Raffel', 'Noam Shazeer'],
      similarity: 0.78,
      reason: 'Text-to-text transfer transformer'
    }
  ]

  const handleCitationClick = (citationId: string) => {
    setSelectedCitation(citationId === selectedCitation ? undefined : citationId)
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // In a real app, show a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <aside className="w-80 border-l border-[var(--border-primary)] bg-[var(--bg-secondary)] flex flex-col">
      {/* Tab Headers */}
      <div className="flex border-b border-[var(--border-primary)]">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = rightInspectorTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setRightInspectorTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-all focus-ring ${
                isActive
                  ? 'border-[var(--accent-periwinkle)] text-[var(--text-accent)] bg-[var(--bg-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {rightInspectorTab === 'citations' && (
          <div className="h-full flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-[var(--border-primary)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search citations..."
                  className="w-full pl-10 pr-4 py-2 text-sm"
                  value={citationSearch}
                  onChange={(e) => setCitationSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-b border-[var(--border-primary)]">
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-xs font-medium bg-[var(--accent-periwinkle)] text-white rounded-md hover:bg-opacity-90 transition-colors">
                  Export .bib
                </button>
                <button className="flex-1 px-3 py-2 text-xs font-medium border border-[var(--border-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors">
                  Validate
                </button>
              </div>
            </div>

            {/* Citations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredCitations.length === 0 ? (
                <div className="p-4 text-center">
                  <Quote className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">No citations found</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredCitations.map(citation => (
                    <div
                      key={citation.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedCitation === citation.id
                          ? 'bg-[var(--bg-accent)] border-[var(--border-accent)]'
                          : 'hover:bg-[var(--bg-tertiary)] border-transparent'
                      }`}
                      onClick={() => handleCitationClick(citation.id)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-0.5 rounded text-[var(--text-accent)] font-mono">
                              {citation.key}
                            </code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCitationFavorite(citation.id)
                              }}
                              className={`p-1 rounded transition-colors ${
                                citation.isFavorite
                                  ? 'text-[var(--accent-periwinkle)]'
                                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <Star className={`w-3 h-3 ${citation.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">
                            {citation.title}
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)] mb-1">
                            {citation.authors.slice(0, 2).join(', ')}
                            {citation.authors.length > 2 && ' et al.'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                            <span>{citation.year}</span>
                            {citation.venue && (
                              <>
                                <span>•</span>
                                <span>{citation.venue}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(citation.key, 'key')
                          }}
                          className="px-2 py-1 hover:bg-[var(--bg-secondary)] rounded transition-colors flex items-center gap-1"
                          title="Copy key"
                        >
                          <Copy className="w-3 h-3" />
                          Copy key
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(citation.bibtex || '', 'bibtex')
                          }}
                          className="px-2 py-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
                          title="Copy BibTeX"
                        >
                          BibTeX
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {rightInspectorTab === 'outline' && (
          <div className="h-full overflow-y-auto">
            <div className="p-2 space-y-1">
              {mockOutline.map(item => (
                <button
                  key={item.id}
                  className="w-full text-left p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors focus-ring"
                  style={{ paddingLeft: `${0.5 + item.level * 0.75}rem` }}
                >
                  <span className="text-sm">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {rightInspectorTab === 'related' && (
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium text-sm mb-3">You might also cite...</h3>
              <div className="space-y-3">
                {mockRelated.map(paper => (
                  <div key={paper.id} className="p-3 rounded-lg border border-[var(--border-primary)] gradient-accent">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 mb-1">
                          {paper.title}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] mb-2">
                          {paper.authors.join(', ')}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-[var(--accent-mint)] rounded-full"></div>
                            <span className="text-xs text-[var(--text-tertiary)]">
                              {Math.round(paper.similarity * 100)}% similarity
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {paper.reason}
                        </p>
                      </div>
                    </div>
                    <button className="w-full px-3 py-1.5 text-xs font-medium bg-[var(--accent-periwinkle)] text-white rounded-md hover:bg-opacity-90 transition-colors">
                      Insert citation
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {mockRelated.length === 0 && (
              <div className="p-4 text-center">
                <div className="gradient-accent rounded-lg p-8 border border-[var(--border-accent)]">
                  <Share2 className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    No related papers found
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}