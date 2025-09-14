import type { Paper, Citation, Project, Evidence, ChatMessage } from '../store'

// Mock data
const MOCK_PAPERS: Paper[] = [
  {
    id: '1',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
    year: 2017,
    venue: 'NeurIPS',
    tags: ['transformer', 'attention', 'nlp']
  },
  {
    id: '2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee'],
    year: 2018,
    venue: 'NAACL',
    tags: ['transformer', 'pretraining', 'nlp']
  },
  {
    id: '3',
    title: 'Language Models are Few-Shot Learners',
    authors: ['Tom Brown', 'Benjamin Mann', 'Nick Ryder'],
    year: 2020,
    venue: 'NeurIPS',
    tags: ['gpt', 'few-shot', 'large-model']
  }
]

const MOCK_CITATIONS: Citation[] = [
  {
    id: 'vaswani2017attention',
    key: 'vaswani2017attention',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
    year: 2017,
    venue: 'NeurIPS',
    bibtex: '@inproceedings{vaswani2017attention,\n  title={Attention Is All You Need},\n  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki},\n  booktitle={Advances in Neural Information Processing Systems},\n  year={2017}\n}',
    isFavorite: false
  },
  {
    id: 'devlin2018bert',
    key: 'devlin2018bert',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee'],
    year: 2018,
    venue: 'NAACL',
    bibtex: '@inproceedings{devlin2018bert,\n  title={BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding},\n  author={Devlin, Jacob and Chang, Ming-Wei and Lee, Kenton},\n  booktitle={NAACL},\n  year={2018}\n}',
    isFavorite: true
  }
]

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Neural Machine Translation Survey',
    template: 'ieee-latex',
    lastOpened: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Attention Mechanisms Paper',
    template: 'word',
    lastOpened: new Date('2024-01-10')
  }
]

// Utility function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock API functions
export async function fetchPapers(filters?: { year?: number; venue?: string; tags?: string[]; search?: string }): Promise<Paper[]> {
  await delay(300)

  let filtered = MOCK_PAPERS

  if (filters) {
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(paper =>
        paper.title.toLowerCase().includes(search) ||
        paper.authors.some(author => author.toLowerCase().includes(search))
      )
    }

    if (filters.year) {
      filtered = filtered.filter(paper => paper.year === filters.year)
    }

    if (filters.venue) {
      filtered = filtered.filter(paper => paper.venue?.toLowerCase().includes(filters.venue!.toLowerCase()))
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(paper =>
        filters.tags!.some(tag => paper.tags.includes(tag))
      )
    }
  }

  return filtered
}

export async function fetchCitations(search?: string): Promise<Citation[]> {
  await delay(200)

  if (search) {
    const searchLower = search.toLowerCase()
    return MOCK_CITATIONS.filter(citation =>
      citation.title.toLowerCase().includes(searchLower) ||
      citation.authors.some(author => author.toLowerCase().includes(searchLower)) ||
      citation.key.toLowerCase().includes(searchLower)
    )
  }

  return MOCK_CITATIONS
}

export async function fetchProjects(): Promise<Project[]> {
  await delay(150)
  return MOCK_PROJECTS
}

export async function createProject(data: { name: string; template: 'ieee-latex' | 'word' }): Promise<Project> {
  await delay(400)

  const project: Project = {
    id: Math.random().toString(36).substring(7),
    name: data.name,
    template: data.template,
    lastOpened: new Date()
  }

  return project
}

export async function searchLibrary(query: string): Promise<Paper[]> {
  await delay(250)
  return fetchPapers({ search: query })
}

export async function searchRelated(paperId: string): Promise<Paper[]> {
  await delay(300)
  // Mock related papers (in real implementation, this would use similarity search)
  return MOCK_PAPERS.filter(paper => paper.id !== paperId).slice(0, 3)
}

export async function sendChatMessage(
  message: string,
  contextIds?: string[],
  groundedMode?: boolean
): Promise<{ answer: string; citations: string[]; evidence: Evidence[] }> {
  await delay(800)

  // Mock assistant response with citations
  const mockResponse = {
    answer: `Based on the current research in transformer architectures, there have been significant advances in attention mechanisms. The seminal work by Vaswani et al. introduced the concept of self-attention [1], which was later improved upon by models like BERT [2]. These approaches have shown remarkable success in various NLP tasks.`,
    citations: ['vaswani2017attention', 'devlin2018bert'],
    evidence: [
      {
        citationId: 'vaswani2017attention',
        quote: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
        page: 1
      },
      {
        citationId: 'devlin2018bert',
        quote: 'We introduce BERT, which stands for Bidirectional Encoder Representations from Transformers.',
        page: 1
      }
    ]
  }

  return mockResponse
}

export async function exportBib(citationIds: string[]): Promise<string> {
  await delay(200)

  const citations = MOCK_CITATIONS.filter(c => citationIds.includes(c.id))
  return citations.map(c => c.bibtex).join('\n\n')
}

export async function validateCitations(citationIds: string[]): Promise<{ valid: string[]; invalid: string[] }> {
  await delay(300)

  // Mock validation - assume all are valid
  return {
    valid: citationIds,
    invalid: []
  }
}

// Integration points for future backend
export const agent = {
  ask: sendChatMessage
}

export const db = {
  library: {
    search: searchLibrary,
    getAll: fetchPapers
  },
  citations: {
    getByIds: async (ids: string[]) => {
      await delay(100)
      return MOCK_CITATIONS.filter(c => ids.includes(c.id))
    },
    search: fetchCitations
  },
  projects: {
    getAll: fetchProjects,
    create: createProject
  }
}

export const project = {
  create: createProject
}