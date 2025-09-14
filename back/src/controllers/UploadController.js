const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const DatabaseService = require('../services/SimpleDatabaseService');
const AnythingLLMService = require('../services/AnythingLLMService');

class UploadController {
  /**
   * Upload single paper
   */
  static async uploadPaper(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded'
        });
      }

      const file = req.file;

      // Record upload in database
      const uploadId = await DatabaseService.recordUpload(file.filename, file.path);

      // Extract metadata and content
      const paperData = await UploadController.extractPaperData(file);

      // Add paper to database
      const paperId = await DatabaseService.addPaper({
        ...paperData,
        file_path: file.path,
        file_name: file.filename
      });

      // Update upload status
      await DatabaseService.updateUploadStatus(uploadId, 'completed');

      res.json({
        success: true,
        uploadId: uploadId,
        paperId: paperId,
        filename: file.filename,
        title: paperData.title,
        message: 'Paper uploaded and processed successfully'
      });

    } catch (error) {
      console.error('Error uploading paper:', error);

      // Update upload status with error
      if (req.uploadId) {
        await DatabaseService.updateUploadStatus(req.uploadId, 'failed', error.message);
      }

      res.status(500).json({
        error: 'Failed to upload paper',
        details: error.message
      });
    }
  }

  /**
   * Upload multiple papers
   */
  static async uploadMultiplePapers(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded'
        });
      }

      const results = [];
      const errors = [];

      for (const file of req.files) {
        try {
          // Record upload
          const uploadId = await DatabaseService.recordUpload(file.filename, file.path);

          // Extract data
          const paperData = await UploadController.extractPaperData(file);

          // Add to database
          const paperId = await DatabaseService.addPaper({
            ...paperData,
            file_path: file.path,
            file_name: file.filename
          });

          // Update status
          await DatabaseService.updateUploadStatus(uploadId, 'completed');

          results.push({
            uploadId: uploadId,
            paperId: paperId,
            filename: file.filename,
            title: paperData.title,
            success: true
          });

        } catch (error) {
          console.error(`Error processing file ${file.filename}:`, error);
          errors.push({
            filename: file.filename,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        uploaded: results,
        errors: errors,
        total_files: req.files.length,
        successful: results.length,
        failed: errors.length
      });

    } catch (error) {
      console.error('Error uploading multiple papers:', error);
      res.status(500).json({
        error: 'Failed to upload papers',
        details: error.message
      });
    }
  }

  /**
   * Process uploaded paper (extract metadata, text, etc.)
   */
  static async processPaper(req, res) {
    try {
      const { fileId } = req.params;

      const paper = await DatabaseService.getPaper(fileId);
      if (!paper) {
        return res.status(404).json({
          error: 'Paper not found'
        });
      }

      // Re-process the paper file
      const fileInfo = {
        path: paper.file_path,
        filename: paper.file_name,
        originalname: paper.file_name
      };

      const paperData = await UploadController.extractPaperData(fileInfo);

      // Update paper with new data
      await DatabaseService.updatePaper(fileId, paperData);

      res.json({
        success: true,
        paperId: fileId,
        updatedData: paperData,
        message: 'Paper reprocessed successfully'
      });

    } catch (error) {
      console.error('Error processing paper:', error);
      res.status(500).json({
        error: 'Failed to process paper',
        details: error.message
      });
    }
  }

  /**
   * Get upload status
   */
  static async getUploadStatus(req, res) {
    try {
      const { uploadId } = req.params;

      const uploadInfo = await DatabaseService.getUploadStatus(uploadId);

      if (!uploadInfo) {
        return res.status(404).json({
          error: 'Upload not found'
        });
      }

      res.json({
        success: true,
        upload: uploadInfo
      });

    } catch (error) {
      console.error('Error getting upload status:', error);
      res.status(500).json({
        error: 'Failed to get upload status',
        details: error.message
      });
    }
  }

  /**
   * Delete uploaded file
   */
  static async deleteUploadedFile(req, res) {
    try {
      const { fileId } = req.params;

      const paper = await DatabaseService.getPaper(fileId);
      if (!paper) {
        return res.status(404).json({
          error: 'Paper not found'
        });
      }

      // Delete file from filesystem
      if (paper.file_path) {
        try {
          await fs.unlink(paper.file_path);
        } catch (fsError) {
          console.warn('Could not delete file:', fsError.message);
        }
      }

      // Delete from database
      await DatabaseService.deletePaper(fileId);

      res.json({
        success: true,
        message: 'File and paper record deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({
        error: 'Failed to delete file',
        details: error.message
      });
    }
  }

  // Private helper methods

  /**
   * Extract paper data from uploaded file
   */
  static async extractPaperData(file) {
    const fileExtension = path.extname(file.originalname || file.filename).toLowerCase();

    let content = '';
    let title = '';
    let authors = '';
    let abstract = '';

    try {
      // Read file content based on type
      const fileBuffer = await fs.readFile(file.path);

      switch (fileExtension) {
        case '.pdf':
          const pdfData = await pdfParse(fileBuffer);
          content = pdfData.text;
          break;

        case '.docx':
          const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
          content = docxData.value;
          break;

        case '.doc':
          // Basic DOC support - might need additional library
          content = fileBuffer.toString('utf-8');
          break;

        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Extract metadata from content
      const metadata = UploadController.extractMetadata(content);
      title = metadata.title || path.basename(file.originalname || file.filename, fileExtension);
      authors = metadata.authors;
      abstract = metadata.abstract;

    } catch (error) {
      console.error('Error extracting file content:', error);

      // Fallback to filename as title
      title = path.basename(file.originalname || file.filename, fileExtension);
      content = 'Content extraction failed';
    }

    return {
      title: title,
      authors: authors,
      abstract: abstract,
      content_text: content,
      year: UploadController.extractYear(content),
      metadata: {
        fileType: fileExtension,
        fileSize: file.size || 0,
        extractedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Extract metadata from paper content
   */
  static extractMetadata(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let title = '';
    let authors = '';
    let abstract = '';

    // Simple heuristics for metadata extraction
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const line = lines[i];

      // Title is usually the first substantial line or all caps
      if (!title && line.length > 10 && line.length < 200) {
        if (line === line.toUpperCase() || i === 0) {
          title = line;
          continue;
        }
      }

      // Authors usually come after title, contain names
      if (!authors && line.length > 5 && line.length < 150) {
        if (line.includes(',') || /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line)) {
          authors = line;
          continue;
        }
      }

      // Abstract usually starts with "Abstract" or "ABSTRACT"
      if (line.toLowerCase().startsWith('abstract')) {
        let abstractText = line.replace(/^abstract[:\-\s]*/i, '');

        // Continue reading until we hit another section
        for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
          const nextLine = lines[j];
          if (nextLine.toLowerCase().startsWith('introduction') ||
              nextLine.toLowerCase().startsWith('keywords') ||
              nextLine.match(/^\d+\.?\s/)) {
            break;
          }
          abstractText += ' ' + nextLine;
        }

        abstract = abstractText.trim();
        break;
      }
    }

    return { title, authors, abstract };
  }

  /**
   * Extract publication year from content
   */
  static extractYear(content) {
    // Look for 4-digit years between 1990 and current year
    const currentYear = new Date().getFullYear();
    const yearMatches = content.match(/\b(19[9]\d|20[0-4]\d)\b/g);

    if (yearMatches) {
      // Return the most recent reasonable year
      const years = yearMatches.map(y => parseInt(y)).filter(y => y >= 1990 && y <= currentYear);
      return Math.max(...years);
    }

    return null;
  }
}

module.exports = UploadController;