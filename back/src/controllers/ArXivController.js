const ArXivService = require('../services/ArXivService');
const DatabaseService = require('../services/SimpleDatabaseService');

class ArXivController {

  /**
   * Fetch papers from ArXiv and populate the database
   */
  static async populateDatabase(req, res) {
    try {
      const { topics = ['machine learning', 'quantum computing', 'climate change'], papersPerTopic = 20 } = req.body;

      console.log('Starting ArXiv database population...');
      console.log(`Topics: ${topics.join(', ')}`);
      console.log(`Papers per topic: ${papersPerTopic}`);

      const arxivService = new ArXivService();
      const papers = await arxivService.fetchPapersForAllTopics(topics, papersPerTopic);

      console.log(`Fetched ${papers.length} papers, saving to database...`);

      // Save papers to database one by one using SimpleDatabaseService
      const paperIds = [];
      for (const paper of papers) {
        const paperId = await DatabaseService.addPaper({
          title: paper.title,
          authors: paper.authors,
          abstract: paper.abstract,
          year: paper.year,
          venue: paper.venue || 'arXiv',
          topic: paper.topic,
          arxiv_id: paper.id
        });
        paperIds.push(paperId);
      }

      console.log(`Successfully saved ${paperIds.length} papers to database`);

      res.json({
        success: true,
        message: `Successfully populated database with ${paperIds.length} papers`,
        topics: topics,
        papersAdded: paperIds.length,
        papers: papers.map(paper => ({
          id: paper.id,
          title: paper.title,
          authors: paper.authors,
          topic: paper.topic,
          year: paper.year
        }))
      });

    } catch (error) {
      console.error('Error populating database from ArXiv:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to populate database from ArXiv',
        error: error.message
      });
    }
  }

  /**
   * Search ArXiv directly (without saving)
   */
  static async searchArXiv(req, res) {
    try {
      const { query, maxResults = 10 } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query is required'
        });
      }

      const arxivService = new ArXivService();
      const papers = await arxivService.searchPapers(query, maxResults);

      res.json({
        success: true,
        query: query,
        results: papers.length,
        papers: papers
      });

    } catch (error) {
      console.error('Error searching ArXiv:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to search ArXiv',
        error: error.message
      });
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(req, res) {
    try {
      const allPapers = await DatabaseService.getAllPapers();

      const stats = {
        totalPapers: allPapers.length,
        selectedPapers: allPapers.filter(p => p.is_selected).length,
        topics: {}
      };

      // Count papers by topic
      allPapers.forEach(paper => {
        if (paper.topic) {
          stats.topics[paper.topic] = (stats.topics[paper.topic] || 0) + 1;
        }
      });

      // Get year distribution
      const yearDistribution = {};
      allPapers.forEach(paper => {
        if (paper.year) {
          yearDistribution[paper.year] = (yearDistribution[paper.year] || 0) + 1;
        }
      });

      stats.yearDistribution = yearDistribution;

      res.json({
        success: true,
        stats: stats
      });

    } catch (error) {
      console.error('Error getting database stats:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get database statistics',
        error: error.message
      });
    }
  }

  /**
   * Get papers by topic from database
   */
  static async getPapersByTopic(req, res) {
    try {
      const { topic } = req.params;

      if (!topic) {
        return res.status(400).json({
          success: false,
          message: 'Topic is required'
        });
      }

      const papers = await DatabaseService.getPapersByTopic(topic);

      res.json({
        success: true,
        topic: topic,
        count: papers.length,
        papers: papers
      });

    } catch (error) {
      console.error('Error getting papers by topic:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get papers by topic',
        error: error.message
      });
    }
  }

  /**
   * Get recommended papers based on keywords
   */
  static async getRecommendations(req, res) {
    try {
      const { keywords, prompt, limit = 10 } = req.body;

      let recommendedPapers = [];

      // If keywords provided, search by keywords
      if (keywords && keywords.length > 0) {
        recommendedPapers = await DatabaseService.getPapersByKeywords(keywords);
      }

      // If prompt provided, extract keywords from prompt
      if (prompt && recommendedPapers.length < limit) {
        const extractedKeywords = this.extractKeywordsFromPrompt(prompt);
        if (extractedKeywords.length > 0) {
          const additionalPapers = await DatabaseService.getPapersByKeywords(extractedKeywords);
          recommendedPapers = [...recommendedPapers, ...additionalPapers];
        }
      }

      // Remove duplicates and limit results
      const uniquePapers = recommendedPapers.filter((paper, index, self) =>
        index === self.findIndex(p => p.id === paper.id)
      ).slice(0, limit);

      res.json({
        success: true,
        recommendedPapers: uniquePapers,
        totalFound: uniquePapers.length,
        searchCriteria: {
          keywords: keywords,
          extractedKeywords: prompt ? this.extractKeywordsFromPrompt(prompt) : [],
          prompt: prompt
        }
      });

    } catch (error) {
      console.error('Error getting recommendations:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get recommendations',
        error: error.message
      });
    }
  }

  /**
   * Extract keywords from user prompt
   */
  extractKeywordsFromPrompt(prompt) {
    const academicKeywords = [
      'machine learning', 'neural network', 'deep learning', 'algorithm', 'model',
      'quantum computing', 'quantum', 'qubit', 'entanglement', 'superposition',
      'climate change', 'global warming', 'carbon', 'emission', 'greenhouse',
      'artificial intelligence', 'AI', 'computer vision', 'natural language processing',
      'nlp', 'reinforcement learning', 'supervised learning', 'unsupervised learning',
      'classification', 'regression', 'clustering', 'optimization', 'data mining',
      'big data', 'statistics', 'probability', 'bayesian', 'neural', 'network'
    ];

    const promptLower = prompt.toLowerCase();
    const foundKeywords = academicKeywords.filter(keyword =>
      promptLower.includes(keyword.toLowerCase())
    );

    return [...new Set(foundKeywords)]; // Remove duplicates
  }

  /**
   * Clear database (for testing purposes)
   */
  static async clearDatabase(req, res) {
    try {
      const { confirm } = req.body;

      if (!confirm || confirm !== 'yes') {
        return res.status(400).json({
          success: false,
          message: 'Please confirm database clearing by sending { "confirm": "yes" }'
        });
      }

      // Delete all papers
      await DatabaseService.db.exec('DELETE FROM papers');
      await DatabaseService.db.exec('DELETE FROM citations');
      await DatabaseService.db.exec('DELETE FROM chat_history');

      res.json({
        success: true,
        message: 'Database cleared successfully'
      });

    } catch (error) {
      console.error('Error clearing database:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to clear database',
        error: error.message
      });
    }
  }
}

module.exports = ArXivController;