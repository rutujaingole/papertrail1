const express = require('express');
const multer = require('multer');
const path = require('path');
const UploadController = require('../controllers/UploadController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept PDF, DOC, DOCX files
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

// Upload single paper
router.post('/paper', upload.single('paper'), UploadController.uploadPaper);

// Upload multiple papers
router.post('/papers', upload.array('papers', 10), UploadController.uploadMultiplePapers);

// Process uploaded paper (extract metadata, text, etc.)
router.post('/process/:fileId', UploadController.processPaper);

// Get upload status
router.get('/status/:uploadId', UploadController.getUploadStatus);

// Delete uploaded file
router.delete('/file/:fileId', UploadController.deleteUploadedFile);

module.exports = router;