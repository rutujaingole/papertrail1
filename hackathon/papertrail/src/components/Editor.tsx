import { useState } from 'react'
import { Image, Table, Calculator, Quote, Plus, Bold, Italic, Underline, AlignLeft } from 'lucide-react'
import { useAppStore } from '../store'

export function Editor() {
  const { selectedCitation, setSelectedCitation } = useAppStore()
  const [document, setDocument] = useState({
    title: 'Research Paper Title',
    abstract: 'This is the abstract section. It provides a brief overview of the research, methodology, key findings, and conclusions. The abstract should be concise and informative, typically 150-250 words for most academic papers.',
    introduction: 'The introduction provides background context for the research problem, establishes the significance of the study, and presents the research questions or hypotheses. It should engage the reader and clearly articulate the contribution of this work to the field.',
    relatedWork: 'This section reviews relevant prior work in the field, identifying gaps in current knowledge that this research addresses. Related work should be synthesized thematically rather than simply listed chronologically.',
    method: 'The methodology section describes the experimental design, data collection procedures, and analytical techniques used in the study. This section should provide sufficient detail for reproducibility.',
    experiments: 'This section presents the experimental setup, datasets used, evaluation metrics, and detailed results. Results should be presented objectively with appropriate statistical analysis.',
    conclusion: 'The conclusion summarizes the key findings, discusses their implications, acknowledges limitations, and suggests directions for future work. It should tie back to the research questions posed in the introduction.'
  })

  const sections = [
    { key: 'abstract', title: 'Abstract', content: document.abstract },
    { key: 'introduction', title: 'Introduction', content: document.introduction },
    { key: 'relatedWork', title: 'Related Work', content: document.relatedWork },
    { key: 'method', title: 'Method', content: document.method },
    { key: 'experiments', title: 'Experiments', content: document.experiments },
    { key: 'conclusion', title: 'Conclusion', content: document.conclusion }
  ]

  const handleContentChange = (sectionKey: string, newContent: string) => {
    setDocument(prev => ({
      ...prev,
      [sectionKey]: newContent
    }))
  }

  const insertCitation = (citationKey: string) => {
    // In a real implementation, this would insert at cursor position
    console.log('Insert citation:', citationKey)
  }

  const renderCitationToken = (citationId: string) => {
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs bg-[var(--accent-periwinkle)] text-white rounded cursor-pointer hover:bg-opacity-90 transition-colors"
        onClick={() => setSelectedCitation(citationId)}
      >
        @{citationId}
      </span>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">
      {/* Toolbar */}
      <div className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Formatting tools */}
            <div className="flex items-center gap-1 border-r border-[var(--border-primary)] pr-2 mr-2">
              <button className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors focus-ring" title="Bold">
                <Bold className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors focus-ring" title="Italic">
                <Italic className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors focus-ring" title="Underline">
                <Underline className="w-4 h-4" />
              </button>
            </div>

            {/* Insert tools */}
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-[var(--bg-tertiary)] transition-colors focus-ring" title="Insert Figure">
                <Image className="w-4 h-4" />
                Figure
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-[var(--bg-tertiary)] transition-colors focus-ring" title="Insert Table">
                <Table className="w-4 h-4" />
                Table
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-[var(--bg-tertiary)] transition-colors focus-ring" title="Insert Equation">
                <Calculator className="w-4 h-4" />
                Equation
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-[var(--bg-tertiary)] transition-colors focus-ring" title="Insert Citation">
                <Quote className="w-4 h-4" />
                Citation
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)]">Last saved: 2 minutes ago</span>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Title */}
          <div className="mb-8">
            <input
              type="text"
              value={document.title}
              onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))}
              className="w-full text-2xl font-bold text-center border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] rounded-md p-2"
            />
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={section.key} className="section">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-[var(--text-tertiary)]">{index + 1}.</span>
                  {section.title}
                </h2>

                <div className="prose max-w-none">
                  <textarea
                    value={section.content}
                    onChange={(e) => handleContentChange(section.key, e.target.value)}
                    className="w-full min-h-[120px] p-4 border border-[var(--border-primary)] rounded-lg resize-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent bg-[var(--bg-secondary)]"
                    placeholder={`Write your ${section.title.toLowerCase()} here...`}
                  />
                </div>

                {/* Sample citations in related work */}
                {section.key === 'relatedWork' && (
                  <div className="mt-4 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                    <p className="text-sm text-[var(--text-secondary)] mb-2">Sample content with citations:</p>
                    <p className="text-sm leading-relaxed">
                      The transformer architecture introduced by {renderCitationToken('vaswani2017attention')} has revolutionized
                      natural language processing. Building on this foundation, BERT {renderCitationToken('devlin2018bert')}
                      demonstrated the effectiveness of bidirectional encoding for language understanding tasks.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Section Button */}
          <div className="mt-12 text-center">
            <button className="flex items-center gap-2 mx-auto px-4 py-2 gradient-accent border border-[var(--border-accent)] rounded-lg hover:gradient-accent-hover transition-all focus-ring">
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}