const DatabaseService = require('../services/DatabaseService');

class CitationController {

  /**
   * Generate citation for a paper
   */
  async generateCitation(req, res) {
    try {
      const { paperId } = req.params;
      const { style = 'ieee' } = req.body;

      if (!paperId) {
        return res.status(400).json({
          success: false,
          message: 'Paper ID is required'
        });
      }

      const citation = await DatabaseService.generateCitation(paperId, style);

      if (!citation) {
        return res.status(404).json({
          success: false,
          message: 'Paper not found'
        });
      }

      res.json({
        success: true,
        paperId: paperId,
        style: style,
        citation: citation
      });

    } catch (error) {
      console.error('Error generating citation:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to generate citation',
        error: error.message
      });
    }
  }

  /**
   * Generate citations for selected papers
   */
  async generateSelectedCitations(req, res) {
    try {
      const { style = 'ieee' } = req.body;

      const selectedPapers = await DatabaseService.getSelectedPapers();

      if (selectedPapers.length === 0) {
        return res.json({
          success: true,
          message: 'No papers selected',
          citations: []
        });
      }

      const citations = [];

      for (const paper of selectedPapers) {
        try {
          const citation = await DatabaseService.generateCitation(paper.id, style);
          citations.push({
            paperId: paper.id,
            title: paper.title,
            citation: citation
          });
        } catch (error) {
          console.error(`Error generating citation for paper ${paper.id}:`, error);
          citations.push({
            paperId: paper.id,
            title: paper.title,
            citation: null,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        style: style,
        totalPapers: selectedPapers.length,
        citations: citations
      });

    } catch (error) {
      console.error('Error generating citations for selected papers:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to generate citations for selected papers',
        error: error.message
      });
    }
  }

  /**
   * Get all citations by style
   */
  async getCitationsByStyle(req, res) {
    try {
      const { style = 'ieee' } = req.params;

      const citations = await DatabaseService.getCitationsByStyle(style);

      res.json({
        success: true,
        style: style,
        count: citations.length,
        citations: citations
      });

    } catch (error) {
      console.error('Error getting citations by style:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get citations',
        error: error.message
      });
    }
  }

  /**
   * Generate bibliography for selected papers
   */
  async generateBibliography(req, res) {
    try {
      const { style = 'ieee', format = 'text' } = req.body;

      const citations = await DatabaseService.getCitationsByStyle(style);

      if (citations.length === 0) {
        return res.json({
          success: true,
          message: 'No citations found',
          bibliography: format === 'json' ? [] : ''
        });
      }

      let bibliography;

      if (format === 'json') {
        bibliography = citations.map((citation, index) => ({
          number: index + 1,
          citation: citation.citation_text,
          title: citation.title,
          authors: citation.authors,
          year: citation.year
        }));
      } else {
        // Text format
        bibliography = citations
          .map((citation, index) => `[${index + 1}] ${citation.citation_text}`)
          .join('\n\n');
      }

      res.json({
        success: true,
        style: style,
        format: format,
        count: citations.length,
        bibliography: bibliography
      });

    } catch (error) {
      console.error('Error generating bibliography:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to generate bibliography',
        error: error.message
      });
    }
  }
}

module.exports = new CitationController();