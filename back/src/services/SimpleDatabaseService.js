const fs = require('fs').promises;
const path = require('path');

class SimpleDatabaseService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.papersFile = path.join(this.dataDir, 'papers.json');
    this.chatFile = path.join(this.dataDir, 'chat_history.json');
    this.projectsFile = path.join(this.dataDir, 'projects.json');
    this.uploadsFile = path.join(this.dataDir, 'uploads.json');

    this.papers = [];
    this.chatHistory = [];
    this.projects = [];
    this.uploads = [];
    this.initialized = false;
  }

  /**
   * Initialize database and load data
   */
  async initialize() {
    try {
      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });

      // Load existing data
      await this.loadData();

      console.log('Simple database initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load data from JSON files
   */
  async loadData() {
    try {
      // Load papers
      try {
        const papersData = await fs.readFile(this.papersFile, 'utf8');
        this.papers = JSON.parse(papersData);
      } catch (error) {
        this.papers = [];
      }

      // Load chat history
      try {
        const chatData = await fs.readFile(this.chatFile, 'utf8');
        this.chatHistory = JSON.parse(chatData);
      } catch (error) {
        this.chatHistory = [];
      }

      // Load projects
      try {
        const projectsData = await fs.readFile(this.projectsFile, 'utf8');
        this.projects = JSON.parse(projectsData);
      } catch (error) {
        this.projects = [];
      }

      // Load uploads
      try {
        const uploadsData = await fs.readFile(this.uploadsFile, 'utf8');
        this.uploads = JSON.parse(uploadsData);
      } catch (error) {
        this.uploads = [];
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  /**
   * Save data to JSON files
   */
  async saveData() {
    try {
      await fs.writeFile(this.papersFile, JSON.stringify(this.papers, null, 2));
      await fs.writeFile(this.chatFile, JSON.stringify(this.chatHistory, null, 2));
      await fs.writeFile(this.projectsFile, JSON.stringify(this.projects, null, 2));
      await fs.writeFile(this.uploadsFile, JSON.stringify(this.uploads, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  // Paper operations

  /**
   * Add a new paper
   */
  async addPaper(paperData) {
    const id = Date.now() + Math.random();
    const paper = {
      id: id,
      ...paperData,
      upload_date: new Date().toISOString(),
      is_selected: false
    };

    this.papers.push(paper);
    await this.saveData();
    return id;
  }

  /**
   * Get all papers
   */
  async getAllPapers() {
    return [...this.papers];
  }

  /**
   * Get paper by ID
   */
  async getPaper(id) {
    return this.papers.find(paper => paper.id == id) || null;
  }

  /**
   * Update paper
   */
  async updatePaper(id, updates) {
    const index = this.papers.findIndex(paper => paper.id == id);
    if (index >= 0) {
      this.papers[index] = { ...this.papers[index], ...updates };
      await this.saveData();
    }
    return true;
  }

  /**
   * Delete paper
   */
  async deletePaper(id) {
    this.papers = this.papers.filter(paper => paper.id != id);
    await this.saveData();
    return true;
  }

  /**
   * Search papers
   */
  async searchPapers(query) {
    const searchTerm = query.toLowerCase();
    return this.papers.filter(paper =>
      (paper.title && paper.title.toLowerCase().includes(searchTerm)) ||
      (paper.authors && paper.authors.toLowerCase().includes(searchTerm)) ||
      (paper.abstract && paper.abstract.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get selected papers
   */
  async getSelectedPapers() {
    return this.papers.filter(paper => paper.is_selected);
  }

  /**
   * Toggle paper selection
   */
  async togglePaperSelection(id, isSelected) {
    const paper = this.papers.find(p => p.id == id);
    if (paper) {
      paper.is_selected = isSelected;
      await this.saveData();
    }
    return true;
  }

  // Chat operations

  /**
   * Save chat message
   */
  async saveChatMessage(sessionId, role, message, paperContext = null) {
    const chatMessage = {
      id: Date.now() + Math.random(),
      session_id: sessionId,
      role: role,
      message: message,
      timestamp: new Date().toISOString(),
      paper_context: paperContext
    };

    this.chatHistory.push(chatMessage);
    await this.saveData();
    return chatMessage.id;
  }

  /**
   * Get chat history
   */
  async getChatHistory(sessionId, limit = 50) {
    return this.chatHistory
      .filter(chat => chat.session_id === sessionId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-limit);
  }

  /**
   * Clear chat history
   */
  async clearChatHistory(sessionId) {
    this.chatHistory = this.chatHistory.filter(chat => chat.session_id !== sessionId);
    await this.saveData();
    return true;
  }

  // Project operations

  /**
   * Save project
   */
  async saveProject(projectData) {
    const id = Date.now() + Math.random();
    const project = {
      id: id,
      ...projectData,
      last_modified: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Check if project with same name exists
    const existingIndex = this.projects.findIndex(p => p.name === projectData.name);
    if (existingIndex >= 0) {
      this.projects[existingIndex] = { ...this.projects[existingIndex], ...projectData, last_modified: new Date().toISOString() };
    } else {
      this.projects.push(project);
    }

    await this.saveData();
    return id;
  }

  /**
   * Get project
   */
  async getProject(id) {
    return this.projects.find(project => project.id == id) || null;
  }

  /**
   * Get all projects
   */
  async getAllProjects() {
    return [...this.projects];
  }

  // Upload operations

  /**
   * Record file upload
   */
  async recordUpload(fileName, filePath) {
    const id = Date.now() + Math.random();
    const upload = {
      id: id,
      file_name: fileName,
      file_path: filePath,
      upload_status: 'completed',
      processing_status: 'pending',
      uploaded_at: new Date().toISOString()
    };

    this.uploads.push(upload);
    await this.saveData();
    return id;
  }

  /**
   * Update upload status
   */
  async updateUploadStatus(uploadId, status, errorMessage = null) {
    const upload = this.uploads.find(u => u.id == uploadId);
    if (upload) {
      upload.processing_status = status;
      if (errorMessage) {
        upload.error_message = errorMessage;
      }
      await this.saveData();
    }
    return true;
  }

  /**
   * Get upload status
   */
  async getUploadStatus(uploadId) {
    return this.uploads.find(upload => upload.id == uploadId) || null;
  }

  /**
   * Close database connection (no-op for JSON files)
   */
  close() {
    // Nothing to close for JSON files
  }
}

module.exports = new SimpleDatabaseService();