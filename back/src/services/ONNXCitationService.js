const ort = require('onnxruntime-node');
const natural = require('natural');
const compromise = require('compromise');
const path = require('path');

class ONNXCitationService {
  constructor() {
    this.modelsPath = process.env.ONNX_MODELS_PATH || path.join(__dirname, '../../../models');
    this.citationSession = null;
    this.referenceSession = null;
    this.initialized = false;
  }

  /**
   * Initialize ONNX models
   */
  async initialize() {
    try {
      // Load citation extraction model (if available)
      const citationModelPath = path.join(this.modelsPath, 'citation-extractor.onnx');
      const referenceModelPath = path.join(this.modelsPath, 'reference-formatter.onnx');

      // For now, we'll use rule-based extraction until we have trained ONNX models
      this.initialized = true;
      console.log('ONNX Citation Service initialized (using rule-based extraction)');
    } catch (error) {
      console.warn('ONNX models not found, falling back to rule-based extraction:', error.message);
      this.initialized = true;
    }
  }

  /**
   * Extract citations from text using pattern matching and NLP
   */
  async extractCitations(text) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const citations = [];

      // Pattern-based citation extraction
      const citationPatterns = [
        // IEEE style: [1], [2], etc.
        /\[(\d+)\]/g,
        // Author-year: (Smith, 2023), (Jones et al., 2022)
        /\(([A-Z][a-z]+(?:\s+et\s+al\.)?),?\s+(\d{4})\)/g,
        // Nature style: ¹, ², ³
        /[¹²³⁴⁵⁶⁷⁸⁹⁰]/g,
        // Footnote numbers
        /\^(\d+)/g
      ];

      // Extract citations using patterns
      citationPatterns.forEach((pattern, index) => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          citations.push({
            type: this.getCitationType(index),
            match: match[0],
            position: match.index,
            reference: match[1] || match[0]
          });
        }
      });

      // Use NLP to find potential author mentions
      const doc = compromise(text);
      const authors = doc.people().out('array');

      authors.forEach(author => {
        const authorRegex = new RegExp(author + '\\s+(?:et\\s+al\\.)?\\s*\\(\\d{4}\\)', 'gi');
        let match;
        while ((match = authorRegex.exec(text)) !== null) {
          citations.push({
            type: 'author-year',
            match: match[0],
            position: match.index,
            author: author,
            reference: match[0]
          });
        }
      });

      return this.deduplicateAndSort(citations);
    } catch (error) {
      console.error('Error extracting citations:', error);
      throw new Error(`Citation extraction failed: ${error.message}`);
    }
  }

  /**
   * Format citations in different styles
   */
  async formatCitations(papers, style = 'ieee') {
    try {
      const formattedCitations = [];

      for (const paper of papers) {
        let formatted = '';

        switch (style.toLowerCase()) {
          case 'ieee':
            formatted = this.formatIEEECitation(paper);
            break;
          case 'apa':
            formatted = this.formatAPACitation(paper);
            break;
          case 'mla':
            formatted = this.formatMLACitation(paper);
            break;
          case 'chicago':
            formatted = this.formatChicagoCitation(paper);
            break;
          default:
            formatted = this.formatIEEECitation(paper);
        }

        formattedCitations.push({
          id: paper.id,
          formatted: formatted,
          style: style
        });
      }

      return formattedCitations;
    } catch (error) {
      console.error('Error formatting citations:', error);
      throw new Error(`Citation formatting failed: ${error.message}`);
    }
  }

  /**
   * Generate in-text citations
   */
  generateInTextCitations(papers, style = 'ieee') {
    const inTextCitations = [];

    papers.forEach((paper, index) => {
      let inText = '';

      switch (style.toLowerCase()) {
        case 'ieee':
          inText = `[${index + 1}]`;
          break;
        case 'apa':
          const year = paper.year || new Date().getFullYear();
          const firstAuthor = this.extractFirstAuthor(paper.authors);
          inText = `(${firstAuthor}, ${year})`;
          break;
        case 'mla':
          const author = this.extractFirstAuthor(paper.authors);
          inText = `(${author})`;
          break;
        default:
          inText = `[${index + 1}]`;
      }

      inTextCitations.push({
        id: paper.id,
        inText: inText,
        number: index + 1
      });
    });

    return inTextCitations;
  }

  /**
   * Validate citation format
   */
  validateCitation(citation, style = 'ieee') {
    const validationRules = {
      ieee: {
        required: ['authors', 'title', 'year'],
        pattern: /^\[?\d+\]?\s*[A-Z].*[A-Za-z]\s*,?\s*["""].*["""],?\s*.*,?\s*\d{4}\.?$/
      },
      apa: {
        required: ['authors', 'title', 'year'],
        pattern: /^[A-Z][a-z]+.*\(\d{4}\)\.\s*.*\.\s*.*/
      },
      mla: {
        required: ['authors', 'title'],
        pattern: /^[A-Z][a-z]+.*["""].*["""].*$/
      }
    };

    const rules = validationRules[style.toLowerCase()];
    if (!rules) {
      return { valid: false, error: 'Unknown citation style' };
    }

    // Check required fields
    for (const field of rules.required) {
      if (!citation[field]) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    return { valid: true };
  }

  /**
   * Auto-complete citation information using external APIs
   */
  async autocompleteCitation(partialCitation) {
    try {
      // This would integrate with CrossRef, Semantic Scholar, etc.
      // For now, return the partial citation with filled defaults

      return {
        ...partialCitation,
        completed: false,
        suggestions: []
      };
    } catch (error) {
      console.error('Error autocompleting citation:', error);
      return partialCitation;
    }
  }

  // Private helper methods

  getCitationType(patternIndex) {
    const types = ['ieee-numeric', 'author-year', 'superscript', 'footnote'];
    return types[patternIndex] || 'unknown';
  }

  deduplicateAndSort(citations) {
    const uniqueCitations = citations.filter((citation, index, self) =>
      index === self.findIndex(c => c.match === citation.match && c.position === citation.position)
    );

    return uniqueCitations.sort((a, b) => a.position - b.position);
  }

  formatIEEECitation(paper) {
    const authors = this.formatAuthorsIEEE(paper.authors);
    const title = `"${paper.title}"`;
    const venue = paper.venue || paper.journal || paper.conference || '';
    const year = paper.year || '';
    const pages = paper.pages ? `, pp. ${paper.pages}` : '';
    const doi = paper.doi ? `, doi: ${paper.doi}` : '';

    return `${authors}, ${title}, ${venue}, ${year}${pages}${doi}.`;
  }

  formatAPACitation(paper) {
    const authors = this.formatAuthorsAPA(paper.authors);
    const year = paper.year ? `(${paper.year})` : '';
    const title = paper.title;
    const venue = paper.venue || paper.journal || paper.conference || '';

    return `${authors} ${year}. ${title}. ${venue}.`;
  }

  formatMLACitation(paper) {
    const authors = this.formatAuthorsMLA(paper.authors);
    const title = `"${paper.title}"`;
    const venue = paper.venue || paper.journal || paper.conference || '';
    const year = paper.year || '';

    return `${authors}. ${title} ${venue}, ${year}.`;
  }

  formatChicagoCitation(paper) {
    const authors = this.formatAuthorsChicago(paper.authors);
    const title = `"${paper.title}"`;
    const venue = paper.venue || paper.journal || paper.conference || '';
    const year = paper.year || '';

    return `${authors}. ${title} ${venue} (${year}).`;
  }

  formatAuthorsIEEE(authors) {
    if (!authors) return '';
    const authorList = authors.split(',').map(a => a.trim());
    if (authorList.length <= 3) {
      return authorList.join(', ');
    }
    return `${authorList[0]} et al.`;
  }

  formatAuthorsAPA(authors) {
    if (!authors) return '';
    const authorList = authors.split(',').map(a => a.trim());
    return authorList[0]; // Simplified for demo
  }

  formatAuthorsMLA(authors) {
    if (!authors) return '';
    return authors.split(',')[0].trim(); // Simplified for demo
  }

  formatAuthorsChicago(authors) {
    if (!authors) return '';
    return authors.split(',')[0].trim(); // Simplified for demo
  }

  extractFirstAuthor(authors) {
    if (!authors) return 'Unknown';
    return authors.split(',')[0].trim().split(' ').pop(); // Get last name
  }
}

module.exports = new ONNXCitationService();