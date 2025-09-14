import { useState } from 'react'
import { ChevronDown, ChevronRight, Book, FolderPlus, Search, Filter, X, Calendar, Tag } from 'lucide-react'
import { useAppStore } from '../store'
import { fetchPapers } from '../lib/api'

export function LeftSidebar() {
  const {
    leftSidebarCollapsed,
    papers,
    libraryFilters,
    projects,
    setPapers,
    setLibraryFilters,
    clearLibraryFilters
  } = useAppStore()

  const [libraryExpanded, setLibraryExpanded] = useState(true)
  const [projectsExpanded, setProjectsExpanded] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  const handleLibrarySearch = async (query: string) => {
    setIsSearching(true)
    try {
      const results = await fetchPapers({ search: query })
      setPapers(results)
      setLibraryFilters({ search: query })
    } finally {
      setIsSearching(false)
    }
  }

  const handleFilterToggle = (type: 'year' | 'venue', value: string | number) => {
    if (type === 'year') {
      setLibraryFilters({
        year: libraryFilters.year === value ? undefined : value as number
      })
    } else if (type === 'venue') {
      setLibraryFilters({
        venue: libraryFilters.venue === value ? undefined : value as string
      })
    }
  }

  const handleTagToggle = (tag: string) => {
    const currentTags = libraryFilters.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    setLibraryFilters({ tags: newTags })
  }

  if (leftSidebarCollapsed) {
    return (
      <aside className="w-12 border-r border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="flex flex-col items-center gap-4 p-2">
          <button
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Library"
          >
            <Book className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Projects"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </aside>
    )
  }

  // Get unique years and venues for filters
  const availableYears = Array.from(new Set(papers.map(p => p.year))).sort((a, b) => b - a)
  const availableVenues = Array.from(new Set(papers.map(p => p.venue).filter(Boolean))).sort()
  const availableTags = Array.from(new Set(papers.flatMap(p => p.tags))).sort()

  return (
    <aside className="w-80 border-r border-[var(--border-primary)] bg-[var(--bg-secondary)] flex flex-col">
      {/* Library Section */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4 border-b border-[var(--border-primary)]">
          <button
            onClick={() => setLibraryExpanded(!libraryExpanded)}
            className="flex items-center justify-between w-full text-left focus-ring rounded-md p-1"
          >
            <div className="flex items-center gap-2">
              <Book className="w-4 h-4" />
              <span className="font-medium">Library</span>
              <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
                {papers.length}
              </span>
            </div>
            {libraryExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {libraryExpanded && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-[var(--border-primary)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search papers..."
                  className="w-full pl-10 pr-4 py-2 text-sm"
                  value={libraryFilters.search}
                  onChange={(e) => handleLibrarySearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-[var(--border-primary)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h3>
                {(libraryFilters.year || libraryFilters.venue || libraryFilters.tags.length > 0) && (
                  <button
                    onClick={clearLibraryFilters}
                    className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Year filters */}
              {availableYears.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Year
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {availableYears.slice(0, 5).map(year => (
                      <button
                        key={year}
                        onClick={() => handleFilterToggle('year', year)}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          libraryFilters.year === year
                            ? 'bg-[var(--accent-periwinkle)] text-white border-transparent'
                            : 'bg-[var(--bg-primary)] border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Venue filters */}
              {availableVenues.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-2">Venue</h4>
                  <div className="flex flex-wrap gap-1">
                    {availableVenues.slice(0, 4).map(venue => (
                      <button
                        key={venue}
                        onClick={() => handleFilterToggle('venue', venue)}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          libraryFilters.venue === venue
                            ? 'bg-[var(--accent-mint)] text-white border-transparent'
                            : 'bg-[var(--bg-primary)] border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {venue}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag filters */}
              {availableTags.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.slice(0, 6).map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          libraryFilters.tags.includes(tag)
                            ? 'bg-[var(--accent-lilac)] text-white border-transparent'
                            : 'bg-[var(--bg-primary)] border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Papers List */}
            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                <div className="p-4">
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-[var(--bg-tertiary)] rounded-lg"></div>
                    ))}
                  </div>
                </div>
              ) : papers.length === 0 ? (
                <div className="p-4">
                  <div className="text-center py-8 gradient-accent rounded-lg border border-[var(--border-primary)]">
                    <Book className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
                    <h3 className="font-medium mb-1">No papers found</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      Import PDFs to get started
                    </p>
                    <button className="px-4 py-2 bg-[var(--accent-periwinkle)] text-white rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors">
                      Import PDFs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {papers.map(paper => (
                    <div
                      key={paper.id}
                      className="p-3 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors group"
                    >
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {paper.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] mb-2">
                        {paper.authors.slice(0, 2).join(', ')}
                        {paper.authors.length > 2 && ' et al.'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                          <span>{paper.year}</span>
                          {paper.venue && (
                            <>
                              <span>•</span>
                              <span>{paper.venue}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 hover:bg-[var(--bg-secondary)] rounded text-xs">
                            Open
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Projects Section */}
      <div className="border-t border-[var(--border-primary)]">
        <div className="p-4 border-b border-[var(--border-primary)]">
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex items-center justify-between w-full text-left focus-ring rounded-md p-1"
          >
            <div className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4" />
              <span className="font-medium">Projects</span>
              <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
                {projects.length}
              </span>
            </div>
            {projectsExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {projectsExpanded && (
          <div className="p-2 space-y-1">
            <button className="w-full p-3 text-left rounded-lg gradient-accent hover:gradient-accent-hover border border-[var(--border-accent)] transition-colors">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[var(--accent-periwinkle)]" />
                <span className="font-medium text-sm">New Project</span>
              </div>
            </button>

            {projects.map(project => (
              <div
                key={project.id}
                className="p-3 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
              >
                <h4 className="font-medium text-sm mb-1">{project.name}</h4>
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>{project.template === 'ieee-latex' ? 'IEEE LaTeX' : 'Word'}</span>
                  <span>{project.lastOpened.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}