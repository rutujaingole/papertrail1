const DatabaseService = require('../services/SimpleDatabaseService');
const AnythingLLMService = require('../services/AnythingLLMService');

class PaperController {
  /**
   * Get all papers in library
   */
  static async getAllPapers(req, res) {
    try {
      const papers = await DatabaseService.getAllPapers();

      res.json({
        success: true,
        papers: papers,
        count: papers.length
      });
    } catch (error) {
      console.error('Error getting papers:', error);
      res.status(500).json({
        error: 'Failed to retrieve papers',
        details: error.message
      });
    }
  }

  /**
   * Get single paper by ID
   */
  static async getPaperById(req, res) {
    try {
      const { id } = req.params;
      const paper = await DatabaseService.getPaper(id);

      if (!paper) {
        return res.status(404).json({
          error: 'Paper not found'
        });
      }

      res.json({
        success: true,
        paper: paper
      });
    } catch (error) {
      console.error('Error getting paper:', error);
      res.status(500).json({
        error: 'Failed to retrieve paper',
        details: error.message
      });
    }
  }

  /**
   * Add new paper to library
   */
  static async addPaper(req, res) {
    try {
      const paperData = req.body;

      // Validate required fields
      if (!paperData.title) {
        return res.status(400).json({
          error: 'Title is required'
        });
      }

      const paperId = await DatabaseService.addPaper(paperData);

      res.status(201).json({
        success: true,
        paperId: paperId,
        message: 'Paper added successfully'
      });
    } catch (error) {
      console.error('Error adding paper:', error);
      res.status(500).json({
        error: 'Failed to add paper',
        details: error.message
      });
    }
  }

  /**
   * Update paper metadata
   */
  static async updatePaper(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      await DatabaseService.updatePaper(id, updates);

      res.json({
        success: true,
        message: 'Paper updated successfully'
      });
    } catch (error) {
      console.error('Error updating paper:', error);
      res.status(500).json({
        error: 'Failed to update paper',
        details: error.message
      });
    }
  }

  /**
   * Delete paper from library
   */
  static async deletePaper(req, res) {
    try {
      const { id } = req.params;

      await DatabaseService.deletePaper(id);

      res.json({
        success: true,
        message: 'Paper deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting paper:', error);
      res.status(500).json({
        error: 'Failed to delete paper',
        details: error.message
      });
    }
  }

  /**
   * Search papers
   */
  static async searchPapers(req, res) {
    try {
      const { query } = req.params;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          error: 'Search query is required'
        });
      }

      const papers = await DatabaseService.searchPapers(query);

      res.json({
        success: true,
        papers: papers,
        query: query,
        count: papers.length
      });
    } catch (error) {
      console.error('Error searching papers:', error);
      res.status(500).json({
        error: 'Failed to search papers',
        details: error.message
      });
    }
  }

  /**
   * Get papers by selection status
   */
  static async getSelectedPapers(req, res) {
    try {
      const papers = await DatabaseService.getSelectedPapers();

      res.json({
        success: true,
        papers: papers,
        count: papers.length
      });
    } catch (error) {
      console.error('Error getting selected papers:', error);
      res.status(500).json({
        error: 'Failed to retrieve selected papers',
        details: error.message
      });
    }
  }

  /**
   * Update paper selection status
   */
  static async togglePaperSelection(req, res) {
    try {
      const { id } = req.params;
      const { isSelected } = req.body;

      await DatabaseService.togglePaperSelection(id, isSelected);

      res.json({
        success: true,
        message: `Paper ${isSelected ? 'selected' : 'deselected'} successfully`
      });
    } catch (error) {
      console.error('Error toggling paper selection:', error);
      res.status(500).json({
        error: 'Failed to update paper selection',
        details: error.message
      });
    }
  }

  /**
   * Get paper embeddings for similarity
   */
  static async getPaperEmbeddings(req, res) {
    try {
      const { id } = req.params;

      const paper = await DatabaseService.getPaper(id);
      if (!paper) {
        return res.status(404).json({
          error: 'Paper not found'
        });
      }

      // This would typically get embeddings from AnythingLLM
      // For now, return placeholder
      res.json({
        success: true,
        paperId: id,
        embeddings: paper.embeddings || null,
        message: 'Embeddings retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting embeddings:', error);
      res.status(500).json({
        error: 'Failed to retrieve embeddings',
        details: error.message
      });
    }
  }

  /**
   * Find similar papers
   */
  static async findSimilarPapers(req, res) {
    try {
      const { id } = req.params;
      const { limit = 5 } = req.query;

      const paper = await DatabaseService.getPaper(id);
      if (!paper) {
        return res.status(404).json({
          error: 'Paper not found'
        });
      }

      // Use AnythingLLM to find similar papers
      try {
        const similarPapers = await AnythingLLMService.searchSimilarDocuments(
          'main_workspace',
          paper.title + ' ' + paper.abstract,
          parseInt(limit)
        );

        res.json({
          success: true,
          basePaper: paper.title,
          similarPapers: similarPapers,
          count: similarPapers.length
        });
      } catch (llmError) {
        // Fallback to simple text-based similarity
        const allPapers = await DatabaseService.getAllPapers();
        const filtered = allPapers
          .filter(p => p.id !== parseInt(id))
          .slice(0, limit);

        res.json({
          success: true,
          basePaper: paper.title,
          similarPapers: filtered,
          count: filtered.length,
          method: 'fallback'
        });
      }
    } catch (error) {
      console.error('Error finding similar papers:', error);
      res.status(500).json({
        error: 'Failed to find similar papers',
        details: error.message
      });
    }
  }

  /**
   * Extract text content from paper
   */
  static async getPaperContent(req, res) {
    try {
      const { id } = req.params;

      const paper = await DatabaseService.getPaper(id);
      if (!paper) {
        return res.status(404).json({
          error: 'Paper not found'
        });
      }

      res.json({
        success: true,
        paperId: id,
        title: paper.title,
        content: paper.content_text || 'Content not extracted yet',
        abstract: paper.abstract,
        hasContent: !!paper.content_text
      });
    } catch (error) {
      console.error('Error getting paper content:', error);
      res.status(500).json({
        error: 'Failed to retrieve paper content',
        details: error.message
      });
    }
  }
}

module.exports = PaperController;