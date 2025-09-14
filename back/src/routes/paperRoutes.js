const express = require('express');
const PaperController = require('../controllers/PaperController');
const router = express.Router();

// Get all papers in library
router.get('/', PaperController.getAllPapers);

// Get single paper by ID
router.get('/:id', PaperController.getPaperById);

// Add new paper to library
router.post('/', PaperController.addPaper);

// Update paper metadata
router.put('/:id', PaperController.updatePaper);

// Delete paper from library
router.delete('/:id', PaperController.deletePaper);

// Search papers
router.get('/search/:query', PaperController.searchPapers);

// Get papers by selection status
router.get('/selected/list', PaperController.getSelectedPapers);

// Update paper selection status
router.patch('/:id/select', PaperController.togglePaperSelection);

// Get paper embeddings for similarity
router.get('/:id/embeddings', PaperController.getPaperEmbeddings);

// Find similar papers
router.get('/:id/similar', PaperController.findSimilarPapers);

// Extract text content from paper
router.get('/:id/content', PaperController.getPaperContent);

module.exports = router;