const express = require('express');
const CitationController = require('../controllers/CitationController');
const router = express.Router();

/**
 * @route POST /api/citations/generate/:paperId
 * @desc Generate citation for a specific paper
 * @body { style: string }
 */
router.post('/generate/:paperId', CitationController.generateCitation);

/**
 * @route POST /api/citations/selected
 * @desc Generate citations for selected papers
 * @body { style: string }
 */
router.post('/selected', CitationController.generateSelectedCitations);

/**
 * @route GET /api/citations/style/:style
 * @desc Get all citations by style
 */
router.get('/style/:style', CitationController.getCitationsByStyle);

/**
 * @route POST /api/citations/bibliography
 * @desc Generate bibliography from citations
 * @body { style: string, format: string }
 */
router.post('/bibliography', CitationController.generateBibliography);

module.exports = router;