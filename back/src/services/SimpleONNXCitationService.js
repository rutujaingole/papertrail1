const path = require('path');

class SimpleONNXCitationService {
  constructor() {
    this.modelsPath = process.env.ONNX_MODELS_PATH || path.join(__dirname, '../../../models');
    this.initialized = false;
  }

  /**
   * Initialize service (no ONNX for now, just rule-based)
   */
  async initialize() {
    try {
      this.initialized = true;
      console.log('Simple Citation Service initialized (rule-based extraction)');
    } catch (error) {
      console.warn('Citation service initialization warning:', error.message);
      this.initialized = true;
    }
  }

  /**
   * Extract citations from text using pattern matching
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
        {
          pattern: /\[(\d+)\]/g,
          type: 'ieee-numeric'
        },
        // Author-year: (Smith, 2023), (Jones et al., 2022)
        {
          pattern: /\(([A-Z][a-z]+(?:\s+et\s+al\.)?),?\s+(\d{4})\)/g,
          type: 'author-year'
        },
        // Nature style: ¹, ², ³
        {
          pattern: /[¹²³⁴⁵⁶⁷⁸⁹⁰]/g,
          type: 'superscript'
        }
      ];

      // Extract citations using patterns
      citationPatterns.forEach((patternObj) => {
        let match;
        while ((match = patternObj.pattern.exec(text)) !== null) {
          citations.push({
            type: patternObj.type,
            match: match[0],
            position: match.index,
            reference: match[1] || match[0]
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
        required: ['authors', 'title', 'year']
      },
      apa: {
        required: ['authors', 'title', 'year']
      },
      mla: {
        required: ['authors', 'title']
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
   * Auto-complete citation information
   */
  async autocompleteCitation(partialCitation) {
    try {
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

  deduplicateAndSort(citations) {
    const uniqueCitations = citations.filter((citation, index, self) =>
      index === self.findIndex(c => c.match === citation.match && c.position === citation.position)
    );

    return uniqueCitations.sort((a, b) => a.position - b.position);
  }

  formatIEEECitation(paper) {
    const authors = this.formatAuthorsIEEE(paper.authors || 'Unknown Author');
    const title = `"${paper.title || 'Untitled'}"`;
    const venue = paper.venue || paper.journal || paper.conference || 'Unknown Venue';
    const year = paper.year || 'Unknown Year';
    const pages = paper.pages ? `, pp. ${paper.pages}` : '';
    const doi = paper.doi ? `, doi: ${paper.doi}` : '';

    return `${authors}, ${title}, ${venue}, ${year}${pages}${doi}.`;
  }

  formatAPACitation(paper) {
    const authors = this.formatAuthorsAPA(paper.authors || 'Unknown Author');
    const year = paper.year ? `(${paper.year})` : '(n.d.)';
    const title = paper.title || 'Untitled';
    const venue = paper.venue || paper.journal || paper.conference || 'Unknown Venue';

    return `${authors} ${year}. ${title}. ${venue}.`;
  }

  formatMLACitation(paper) {
    const authors = this.formatAuthorsMLA(paper.authors || 'Unknown Author');
    const title = `"${paper.title || 'Untitled'}"`;
    const venue = paper.venue || paper.journal || paper.conference || 'Unknown Venue';
    const year = paper.year || 'n.d.';

    return `${authors}. ${title} ${venue}, ${year}.`;
  }

  formatChicagoCitation(paper) {
    const authors = this.formatAuthorsChicago(paper.authors || 'Unknown Author');
    const title = `"${paper.title || 'Untitled'}"`;
    const venue = paper.venue || paper.journal || paper.conference || 'Unknown Venue';
    const year = paper.year || 'n.d.';

    return `${authors}. ${title} ${venue} (${year}).`;
  }

  formatAuthorsIEEE(authors) {
    const authorList = authors.split(',').map(a => a.trim());
    if (authorList.length <= 3) {
      return authorList.join(', ');
    }
    return `${authorList[0]} et al.`;
  }

  formatAuthorsAPA(authors) {
    return authors.split(',')[0].trim();
  }

  formatAuthorsMLA(authors) {
    return authors.split(',')[0].trim();
  }

  formatAuthorsChicago(authors) {
    return authors.split(',')[0].trim();
  }

  extractFirstAuthor(authors) {
    if (!authors) return 'Unknown';
    return authors.split(',')[0].trim().split(' ').pop(); // Get last name
  }
}

module.exports = new SimpleONNXCitationService();