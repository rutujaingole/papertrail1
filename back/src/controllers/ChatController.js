const AnythingLLMService = require('../services/AnythingLLMService');
const anythingLLM = new AnythingLLMService();
const DatabaseService = require('../services/SimpleDatabaseService');

class ChatController {
  /**
   * Send message to AI with context from selected papers
   */
  static async sendMessage(req, res) {
    try {
      const { message, selectedPapers = [], sessionId } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      let response;
      let recommendedPapers = [];

      // Get recommended papers based on the user's message
      try {
        const recommendations = await this.getRecommendationsForMessage(message);
        recommendedPapers = recommendations;
      } catch (error) {
        console.log('Could not get paper recommendations:', error.message);
      }

      if (selectedPapers.length === 0) {
        // Generic AI response without paper context
        response = await anythingLLM.generateContent([], 'general', message);
      } else {
        // Get paper details from database
        const papers = await Promise.all(
          selectedPapers.map(paperId => DatabaseService.getPaper(paperId))
        );

        // Use AnythingLLM for context-aware response
        response = await anythingLLM.generateContent(papers, 'general', message);
      }

      // Save chat history
      if (sessionId) {
        await DatabaseService.saveChatMessage(sessionId, 'user', message);
        await DatabaseService.saveChatMessage(sessionId, 'assistant', response.response);
      }

      res.json({
        success: true,
        response: response.response,
        sources: response.sources || [],
        selectedPapers: selectedPapers.length,
        recommendedPapers: recommendedPapers.slice(0, 5) // Limit to top 5 recommendations
      });

    } catch (error) {
      console.error('Error in sendMessage:', error);
      res.status(500).json({
        error: 'Failed to process message',
        details: error.message
      });
    }
  }

  /**
   * Populate content based on selected papers
   */
  static async populateContent(req, res) {
    try {
      const { section, selectedPapers = [], currentContent } = req.body;

      if (!section) {
        return res.status(400).json({ error: 'Section type is required' });
      }

      let populatedContent;

      // Get paper details if any are selected
      const papers = selectedPapers.length > 0
        ? await Promise.all(selectedPapers.map(paperId => DatabaseService.getPaper(paperId)))
        : [];

      // Generate content using AnythingLLM
      const prompt = `Generate ${section} content that incorporates insights from the selected research papers. Current content: ${currentContent || 'None'}`;

      const result = await anythingLLM.generateContent(papers, section, prompt);
      populatedContent = result.response;

      res.json({
        success: true,
        content: populatedContent,
        section: section,
        papersUsed: selectedPapers.length
      });

    } catch (error) {
      console.error('Error in populateContent:', error);
      res.status(500).json({
        error: 'Failed to populate content',
        details: error.message
      });
    }
  }

  /**
   * Generate citations based on selected papers
   */
  static async generateCitations(req, res) {
    try {
      const { selectedPapers = [], citationStyle = 'ieee' } = req.body;

      if (selectedPapers.length === 0) {
        return res.status(400).json({ error: 'No papers selected for citation' });
      }

      // Get paper details
      const papers = await Promise.all(
        selectedPapers.map(paperId => DatabaseService.getPaper(paperId))
      );

      // Generate citations using AnythingLLM
      const prompt = `Generate properly formatted ${citationStyle.toUpperCase()} citations for these research papers. Include both in-text citations and full references.`;

      const result = await anythingLLM.generateContent(papers, 'citation', prompt);

      res.json({
        success: true,
        citations: result.response,
        style: citationStyle,
        count: papers.length
      });

    } catch (error) {
      console.error('Error in generateCitations:', error);
      res.status(500).json({
        error: 'Failed to generate citations',
        details: error.message
      });
    }
  }

  /**
   * Summarize selected papers
   */
  static async summarizePapers(req, res) {
    try {
      const { selectedPapers = [], summaryType = 'general' } = req.body;

      if (selectedPapers.length === 0) {
        return res.status(400).json({ error: 'No papers selected for summarization' });
      }

      // Get paper details
      const papers = await Promise.all(
        selectedPapers.map(paperId => DatabaseService.getPaper(paperId))
      );

      let prompt;
      switch (summaryType) {
        case 'methodology':
          prompt = 'Summarize the methodologies used in these research papers.';
          break;
        case 'findings':
          prompt = 'Summarize the key findings and results from these research papers.';
          break;
        case 'comparison':
          prompt = 'Compare and contrast the approaches and findings of these research papers.';
          break;
        default:
          prompt = 'Provide a comprehensive summary of these research papers.';
      }

      const result = await anythingLLM.generateContent(papers, 'summary', prompt);

      res.json({
        success: true,
        summary: result.response,
        type: summaryType,
        papersCount: papers.length
      });

    } catch (error) {
      console.error('Error in summarizePapers:', error);
      res.status(500).json({
        error: 'Failed to summarize papers',
        details: error.message
      });
    }
  }

  /**
   * Get context-aware suggestions
   */
  static async getContextSuggestions(req, res) {
    try {
      const { currentSection, selectedPapers = [], currentContent } = req.body;

      const suggestions = [];

      if (selectedPapers.length > 0) {
        // Get paper details
        const papers = await Promise.all(
          selectedPapers.map(paperId => DatabaseService.getPaper(paperId))
        );

        const prompt = `Based on the current ${currentSection} section content: "${currentContent}", suggest improvements, additional content, or related research from the selected papers.`;

        const result = await anythingLLM.generateContent(papers, 'suggestions', prompt);

        suggestions.push({
          type: 'ai_suggestion',
          content: result.response,
          confidence: 0.9
        });
      }

      // Add generic suggestions based on section
      suggestions.push(...ChatController.getGenericSuggestions(currentSection));

      res.json({
        success: true,
        suggestions: suggestions
      });

    } catch (error) {
      console.error('Error in getContextSuggestions:', error);
      res.status(500).json({
        error: 'Failed to get suggestions',
        details: error.message
      });
    }
  }

  /**
   * Get chat history
   */
  static async getChatHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const { limit = 50 } = req.query;

      const history = await DatabaseService.getChatHistory(sessionId, limit);

      res.json({
        success: true,
        history: history
      });

    } catch (error) {
      console.error('Error in getChatHistory:', error);
      res.status(500).json({
        error: 'Failed to get chat history',
        details: error.message
      });
    }
  }

  /**
   * Clear chat history
   */
  static async clearChatHistory(req, res) {
    try {
      const { sessionId } = req.params;

      await DatabaseService.clearChatHistory(sessionId);

      res.json({
        success: true,
        message: 'Chat history cleared'
      });

    } catch (error) {
      console.error('Error in clearChatHistory:', error);
      res.status(500).json({
        error: 'Failed to clear chat history',
        details: error.message
      });
    }
  }

  // Private helper methods

  static generateGenericContent(section) {
    const genericContent = {
      abstract: "This paper presents a comprehensive analysis of the current research landscape. Our methodology incorporates established practices from leading studies in the field. The results demonstrate significant improvements over existing approaches. The findings contribute to the broader understanding of the domain and provide a foundation for future research.",

      introduction: "Recent advances in this field have shown promising developments. However, several challenges remain unaddressed. This work aims to bridge these gaps by proposing novel approaches. The main contributions include: (1) comprehensive analysis, (2) novel methodology, (3) extensive evaluation.",

      methodology: "We employed a systematic approach combining quantitative and qualitative methods. Data collection followed established protocols. Analysis was performed using standard statistical methods. Validation was conducted through multiple evaluation metrics.",

      experiments: "Our experimental setup included comprehensive testing across multiple scenarios. We compared our approach with state-of-the-art methods. Results show consistent improvements across all metrics. Detailed analysis reveals the effectiveness of our proposed method.",

      conclusion: "This work presents significant contributions to the field. The proposed approach demonstrates clear advantages over existing methods. Future work will explore additional applications and extensions. The findings have important implications for both research and practice."
    };

    return genericContent[section] || "Generic content for this section.";
  }

  static getGenericSuggestions(section) {
    const suggestions = {
      abstract: [
        { type: 'structure', content: 'Consider adding quantitative results', confidence: 0.7 },
        { type: 'content', content: 'Include key methodology highlights', confidence: 0.8 }
      ],
      introduction: [
        { type: 'structure', content: 'Add literature review subsection', confidence: 0.8 },
        { type: 'content', content: 'Clarify research objectives', confidence: 0.9 }
      ],
      methodology: [
        { type: 'structure', content: 'Include experimental setup details', confidence: 0.9 },
        { type: 'content', content: 'Add validation procedures', confidence: 0.8 }
      ]
    };

    return suggestions[section] || [
      { type: 'general', content: 'Consider expanding this section', confidence: 0.6 }
    ];
  }

  /**
   * Get paper recommendations based on message content
   */
  static async getRecommendationsForMessage(message) {
    try {
      // Extract keywords from the message
      const keywords = this.extractKeywordsFromMessage(message);

      if (keywords.length === 0) {
        return [];
      }

      // Get papers matching the keywords
      const recommendedPapers = await DatabaseService.getPapersByKeywords(keywords);

      // Sort by relevance (year and citation count)
      return recommendedPapers
        .sort((a, b) => {
          const scoreA = (a.year || 2000) * 0.1 + (a.citation_count || 0);
          const scoreB = (b.year || 2000) * 0.1 + (b.citation_count || 0);
          return scoreB - scoreA;
        })
        .slice(0, 10); // Limit to top 10

    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Extract relevant keywords from user message
   */
  static extractKeywordsFromMessage(message) {
    const academicKeywords = [
      // Machine Learning
      'machine learning', 'neural network', 'deep learning', 'algorithm', 'model',
      'artificial intelligence', 'AI', 'classification', 'regression', 'clustering',
      'supervised learning', 'unsupervised learning', 'reinforcement learning',
      'computer vision', 'natural language processing', 'nlp', 'data mining',
      'big data', 'statistics', 'probability', 'bayesian', 'optimization',

      // Quantum Computing
      'quantum computing', 'quantum', 'qubit', 'entanglement', 'superposition',
      'quantum algorithm', 'quantum gate', 'quantum circuit', 'quantum mechanics',
      'quantum information', 'quantum cryptography', 'quantum simulation',

      // Climate Change
      'climate change', 'global warming', 'carbon', 'emission', 'greenhouse',
      'environmental', 'atmosphere', 'temperature', 'climate model',
      'sustainability', 'renewable energy', 'carbon footprint', 'biodiversity',

      // General scientific terms
      'research', 'analysis', 'experiment', 'methodology', 'dataset',
      'evaluation', 'performance', 'accuracy', 'precision', 'recall',
      'validation', 'testing', 'training', 'simulation', 'modeling'
    ];

    const messageLower = message.toLowerCase();
    const foundKeywords = academicKeywords.filter(keyword =>
      messageLower.includes(keyword.toLowerCase())
    );

    return [...new Set(foundKeywords)]; // Remove duplicates
  }

  /**
   * Get paper recommendations (API endpoint)
   */
  static async getRecommendations(req, res) {
    try {
      const { message, keywords, limit = 5 } = req.body;

      let recommendedPapers = [];

      if (message) {
        recommendedPapers = await this.getRecommendationsForMessage(message);
      } else if (keywords && keywords.length > 0) {
        recommendedPapers = await DatabaseService.getPapersByKeywords(keywords);
      }

      // Limit results
      const limitedResults = recommendedPapers.slice(0, limit);

      res.json({
        success: true,
        recommendedPapers: limitedResults,
        totalFound: recommendedPapers.length,
        searchCriteria: {
          message: message,
          keywords: keywords || this.extractKeywordsFromMessage(message || '')
        }
      });

    } catch (error) {
      console.error('Error in getRecommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recommendations',
        error: error.message
      });
    }
  }

  // Legacy methods - now handled by AnythingLLMService
  static generateChatResponse(message) {
    return anythingLLM.generateContent([], 'general', message);
  }
}

module.exports = ChatController;