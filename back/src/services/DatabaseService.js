const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs').promises;

class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/papertrail.db');
    this.db = null;
  }

  /**
   * Initialize database and create tables
   */
  async initialize() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      await fs.mkdir(dataDir, { recursive: true });

      // Initialize database connection
      this.db = new Database(this.dbPath);

      // Create tables
      await this.createTables();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  async createTables() {
    const tables = [
      // Papers table
      `CREATE TABLE IF NOT EXISTS papers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        arxiv_id TEXT,
        title TEXT NOT NULL,
        authors TEXT,
        abstract TEXT,
        year INTEGER,
        venue TEXT,
        journal TEXT,
        conference TEXT,
        doi TEXT,
        url TEXT,
        pdf_url TEXT,
        file_path TEXT,
        file_name TEXT,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        published_date TEXT,
        updated_date TEXT,
        categories TEXT,
        topic TEXT,
        keywords TEXT,
        citation_count INTEGER DEFAULT 0,
        is_selected BOOLEAN DEFAULT 0,
        metadata TEXT,
        content_text TEXT,
        embeddings BLOB
      )`,

      // Chat history table
      `CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        paper_context TEXT
      )`,

      // Citations table
      `CREATE TABLE IF NOT EXISTS citations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paper_id INTEGER,
        citation_text TEXT NOT NULL,
        style TEXT DEFAULT 'ieee',
        in_text_citation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paper_id) REFERENCES papers (id)
      )`,

      // Projects table
      `CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        template TEXT DEFAULT 'ieee',
        content TEXT,
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Upload history table
      `CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        upload_status TEXT DEFAULT 'pending',
        processing_status TEXT DEFAULT 'pending',
        error_message TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const tableSQL of tables) {
      try {
        this.db.exec(tableSQL);
      } catch (error) {
        console.error('Error creating table:', error);
        throw error;
      }
    }
  }

  /**
   * Execute a query that doesn't return results
   */
  runQuery(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(params);
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Execute a query that returns a single result
   */
  getQuery(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.get(params);
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Execute a query that returns multiple results
   */
  allQuery(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.all(params);
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Paper operations

  /**
   * Add a new paper to the database
   */
  async addPaper(paperData) {
    const {
      arxiv_id, title, authors, abstract, year, venue, journal,
      conference, doi, url, pdf_url, file_path, file_name,
      published_date, updated_date, categories, topic, keywords,
      citation_count, metadata, content_text
    } = paperData;

    const sql = `
      INSERT INTO papers (
        arxiv_id, title, authors, abstract, year, venue, journal, conference,
        doi, url, pdf_url, file_path, file_name, published_date, updated_date,
        categories, topic, keywords, citation_count, metadata, content_text
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await this.runQuery(sql, [
      arxiv_id, title, authors, abstract, year, venue, journal, conference,
      doi, url, pdf_url, file_path, file_name, published_date, updated_date,
      Array.isArray(categories) ? categories.join(',') : categories,
      topic, Array.isArray(keywords) ? keywords.join(',') : keywords,
      citation_count || 0, JSON.stringify(metadata || {}), content_text
    ]);

    return result.lastID;
  }

  /**
   * Get all papers
   */
  async getAllPapers() {
    const sql = 'SELECT * FROM papers ORDER BY upload_date DESC';
    return await this.allQuery(sql);
  }

  /**
   * Get paper by ID
   */
  async getPaper(id) {
    const sql = 'SELECT * FROM papers WHERE id = ?';
    return await this.getQuery(sql, [id]);
  }

  /**
   * Update paper
   */
  async updatePaper(id, updates) {
    const fields = Object.keys(updates).map(field => `${field} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    const sql = `UPDATE papers SET ${fields} WHERE id = ?`;
    return await this.runQuery(sql, values);
  }

  /**
   * Delete paper
   */
  async deletePaper(id) {
    const sql = 'DELETE FROM papers WHERE id = ?';
    return await this.runQuery(sql, [id]);
  }

  /**
   * Search papers
   */
  async searchPapers(query) {
    const sql = `
      SELECT * FROM papers
      WHERE title LIKE ? OR authors LIKE ? OR abstract LIKE ?
      ORDER BY upload_date DESC
    `;
    const searchTerm = `%${query}%`;
    return await this.allQuery(sql, [searchTerm, searchTerm, searchTerm]);
  }

  /**
   * Get selected papers
   */
  async getSelectedPapers() {
    const sql = 'SELECT * FROM papers WHERE is_selected = 1 ORDER BY upload_date DESC';
    return await this.allQuery(sql);
  }

  /**
   * Toggle paper selection
   */
  async togglePaperSelection(id, isSelected) {
    const sql = 'UPDATE papers SET is_selected = ? WHERE id = ?';
    return await this.runQuery(sql, [isSelected ? 1 : 0, id]);
  }

  /**
   * Add multiple papers (batch insert)
   */
  async addPapersBatch(papersData) {
    const sql = `
      INSERT INTO papers (
        arxiv_id, title, authors, abstract, year, venue, journal, conference,
        doi, url, pdf_url, file_path, file_name, published_date, updated_date,
        categories, topic, keywords, citation_count, metadata, content_text
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = this.db.prepare(sql);
    const insertMany = this.db.transaction((papers) => {
      const results = [];
      for (const paper of papers) {
        const result = stmt.run([
          paper.arxiv_id, paper.title, paper.authors, paper.abstract,
          paper.year, paper.venue, paper.journal, paper.conference,
          paper.doi, paper.url, paper.pdf_url, paper.file_path, paper.file_name,
          paper.published_date, paper.updated_date,
          Array.isArray(paper.categories) ? paper.categories.join(',') : paper.categories,
          paper.topic, Array.isArray(paper.keywords) ? paper.keywords.join(',') : paper.keywords,
          paper.citation_count || 0, JSON.stringify(paper.metadata || {}), paper.content_text
        ]);
        results.push(result.lastID);
      }
      return results;
    });

    return insertMany(papersData);
  }

  /**
   * Get papers by topic
   */
  async getPapersByTopic(topic) {
    const sql = 'SELECT * FROM papers WHERE topic = ? ORDER BY year DESC, citation_count DESC';
    return await this.allQuery(sql, [topic]);
  }

  /**
   * Get papers with keywords
   */
  async getPapersByKeywords(keywords) {
    const keywordList = Array.isArray(keywords) ? keywords : [keywords];
    const conditions = keywordList.map(() => 'keywords LIKE ?').join(' OR ');
    const sql = `SELECT * FROM papers WHERE ${conditions} ORDER BY year DESC`;
    const params = keywordList.map(keyword => `%${keyword}%`);
    return await this.allQuery(sql, params);
  }

  /**
   * Search papers with advanced filters
   */
  async searchPapersAdvanced(options) {
    const { query, topic, year_from, year_to, venue, limit = 50 } = options;

    let sql = 'SELECT * FROM papers WHERE 1=1';
    const params = [];

    if (query) {
      sql += ' AND (title LIKE ? OR authors LIKE ? OR abstract LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (topic) {
      sql += ' AND topic = ?';
      params.push(topic);
    }

    if (year_from) {
      sql += ' AND year >= ?';
      params.push(year_from);
    }

    if (year_to) {
      sql += ' AND year <= ?';
      params.push(year_to);
    }

    if (venue) {
      sql += ' AND venue LIKE ?';
      params.push(`%${venue}%`);
    }

    sql += ' ORDER BY year DESC, citation_count DESC LIMIT ?';
    params.push(limit);

    return await this.allQuery(sql, params);
  }

  // Citation operations

  /**
   * Add citation
   */
  async addCitation(paperId, citationText, style = 'ieee', inTextCitation = '') {
    const sql = `
      INSERT INTO citations (paper_id, citation_text, style, in_text_citation)
      VALUES (?, ?, ?, ?)
    `;
    return await this.runQuery(sql, [paperId, citationText, style, inTextCitation]);
  }

  /**
   * Get citations for paper
   */
  async getCitationsForPaper(paperId) {
    const sql = `
      SELECT c.*, p.title, p.authors
      FROM citations c
      JOIN papers p ON c.paper_id = p.id
      WHERE c.paper_id = ?
    `;
    return await this.allQuery(sql, [paperId]);
  }

  /**
   * Get all citations by style
   */
  async getCitationsByStyle(style = 'ieee') {
    const sql = `
      SELECT c.*, p.title, p.authors, p.year, p.venue
      FROM citations c
      JOIN papers p ON c.paper_id = p.id
      WHERE c.style = ?
      ORDER BY p.year DESC
    `;
    return await this.allQuery(sql, [style]);
  }

  /**
   * Generate citation for paper
   */
  async generateCitation(paperId, style = 'ieee') {
    const paper = await this.getPaper(paperId);
    if (!paper) return null;

    let citation = '';

    switch (style.toLowerCase()) {
      case 'ieee':
        citation = `${paper.authors}, "${paper.title}," ${paper.venue || 'arXiv'}, ${paper.year}.`;
        break;
      case 'apa':
        citation = `${paper.authors} (${paper.year}). ${paper.title}. ${paper.venue || 'arXiv'}.`;
        break;
      case 'mla':
        citation = `${paper.authors}. "${paper.title}." ${paper.venue || 'arXiv'}, ${paper.year}.`;
        break;
      default:
        citation = `${paper.authors}. ${paper.title}. ${paper.venue || 'arXiv'}, ${paper.year}.`;
    }

    // Save the generated citation
    await this.addCitation(paperId, citation, style);

    return citation;
  }

  // Chat operations

  /**
   * Save chat message
   */
  async saveChatMessage(sessionId, role, message, paperContext = null) {
    const sql = `
      INSERT INTO chat_history (session_id, role, message, paper_context)
      VALUES (?, ?, ?, ?)
    `;
    return await this.runQuery(sql, [sessionId, role, message, paperContext]);
  }

  /**
   * Get chat history
   */
  async getChatHistory(sessionId, limit = 50) {
    const sql = `
      SELECT * FROM chat_history
      WHERE session_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    const history = await this.allQuery(sql, [sessionId, limit]);
    return history.reverse(); // Return in chronological order
  }

  /**
   * Clear chat history
   */
  async clearChatHistory(sessionId) {
    const sql = 'DELETE FROM chat_history WHERE session_id = ?';
    return await this.runQuery(sql, [sessionId]);
  }

  // Project operations

  /**
   * Save project
   */
  async saveProject(projectData) {
    const { name, template, content } = projectData;
    const sql = `
      INSERT OR REPLACE INTO projects (name, template, content, last_modified)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;
    return await this.runQuery(sql, [name, template, JSON.stringify(content)]);
  }

  /**
   * Get project
   */
  async getProject(id) {
    const sql = 'SELECT * FROM projects WHERE id = ?';
    const project = await this.getQuery(sql, [id]);
    if (project && project.content) {
      project.content = JSON.parse(project.content);
    }
    return project;
  }

  /**
   * Get all projects
   */
  async getAllProjects() {
    const sql = 'SELECT * FROM projects ORDER BY last_modified DESC';
    const projects = await this.allQuery(sql);
    return projects.map(project => {
      if (project.content) {
        project.content = JSON.parse(project.content);
      }
      return project;
    });
  }

  // Upload operations

  /**
   * Record file upload
   */
  async recordUpload(fileName, filePath) {
    const sql = `
      INSERT INTO uploads (file_name, file_path, upload_status)
      VALUES (?, ?, 'completed')
    `;
    const result = await this.runQuery(sql, [fileName, filePath]);
    return result.lastID;
  }

  /**
   * Update upload status
   */
  async updateUploadStatus(uploadId, status, errorMessage = null) {
    const sql = `
      UPDATE uploads
      SET processing_status = ?, error_message = ?
      WHERE id = ?
    `;
    return await this.runQuery(sql, [status, errorMessage, uploadId]);
  }

  /**
   * Get upload status
   */
  async getUploadStatus(uploadId) {
    const sql = 'SELECT * FROM uploads WHERE id = ?';
    return await this.getQuery(sql, [uploadId]);
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new DatabaseService();