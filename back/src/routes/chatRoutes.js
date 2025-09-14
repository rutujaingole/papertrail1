const express = require('express');
const ChatController = require('../controllers/ChatController');
const router = express.Router();

// Chat with AI based on selected papers
router.post('/message', ChatController.sendMessage);

// Get chat history
router.get('/history/:sessionId', ChatController.getChatHistory);

// Clear chat history
router.delete('/history/:sessionId', ChatController.clearChatHistory);

// AI-powered content population
router.post('/populate', ChatController.populateContent);

// AI-powered citation generation
router.post('/cite', ChatController.generateCitations);

// AI-powered summarization
router.post('/summarize', ChatController.summarizePapers);

// Context-aware suggestions
router.post('/suggestions', ChatController.getContextSuggestions);

// Paper recommendations
router.post('/recommendations', ChatController.getRecommendations);

module.exports = router;