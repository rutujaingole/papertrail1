const express = require('express');
const ArXivController = require('../controllers/ArXivController');

const router = express.Router();

/**
 * @route POST /api/arxiv/populate
 * @desc Fetch papers from ArXiv and populate database
 * @body { topics: string[], papersPerTopic: number }
 */
router.post('/populate', ArXivController.populateDatabase);

/**
 * @route POST /api/arxiv/search
 * @desc Search ArXiv directly without saving
 * @body { query: string, maxResults: number }
 */
router.post('/search', ArXivController.searchArXiv);

/**
 * @route GET /api/arxiv/stats
 * @desc Get database statistics
 */
router.get('/stats', ArXivController.getDatabaseStats);

/**
 * @route GET /api/arxiv/topics/:topic
 * @desc Get papers by topic from database
 */
router.get('/topics/:topic', ArXivController.getPapersByTopic);

/**
 * @route POST /api/arxiv/recommendations
 * @desc Get paper recommendations based on keywords or prompt
 * @body { keywords: string[], prompt: string, limit: number }
 */
router.post('/recommendations', ArXivController.getRecommendations);

/**
 * @route POST /api/arxiv/clear
 * @desc Clear database (for testing)
 * @body { confirm: "yes" }
 */
router.post('/clear', ArXivController.clearDatabase);

module.exports = router;