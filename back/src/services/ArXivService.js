const axios = require('axios');
const xml2js = require('xml2js');

class ArXivService {
  constructor() {
    this.baseURL = 'http://export.arxiv.org/api/query';
    this.parser = new xml2js.Parser();
  }

  /**
   * Fetch papers from ArXiv API for specific topics
   */
  async fetchPapersByTopic(topic, maxResults = 20) {
    try {
      console.log(`Fetching papers for topic: ${topic}`);

      const searchQuery = this.buildSearchQuery(topic);
      const response = await axios.get(this.baseURL, {
        params: {
          search_query: searchQuery,
          start: 0,
          max_results: maxResults,
          sortBy: 'relevance',
          sortOrder: 'descending'
        }
      });

      const result = await this.parser.parseStringPromise(response.data);
      const papers = this.parsePapers(result, topic);

      console.log(`Successfully fetched ${papers.length} papers for ${topic}`);
      return papers;

    } catch (error) {
      console.error(`Error fetching papers for ${topic}:`, error.message);
      throw new Error(`Failed to fetch papers for ${topic}: ${error.message}`);
    }
  }

  /**
   * Build search query based on topic
   */
  buildSearchQuery(topic) {
    const queries = {
      'machine learning': 'all:machine AND all:learning AND (cat:cs.LG OR cat:cs.AI OR cat:stat.ML)',
      'quantum computing': 'all:quantum AND all:computing AND (cat:quant-ph OR cat:cs.ET)',
      'climate change': 'all:climate AND all:change AND (cat:physics.ao-ph OR cat:physics.geo-ph)'
    };

    return queries[topic.toLowerCase()] || `all:"${topic}"`;
  }

  /**
   * Parse ArXiv XML response into paper objects
   */
  parsePapers(xmlResult, topic) {
    if (!xmlResult.feed || !xmlResult.feed.entry) {
      return [];
    }

    const entries = Array.isArray(xmlResult.feed.entry)
      ? xmlResult.feed.entry
      : [xmlResult.feed.entry];

    return entries.map(entry => {
      const authors = this.extractAuthors(entry.author);
      const categories = this.extractCategories(entry.category);

      return {
        id: this.extractArXivId(entry.id[0]),
        title: entry.title[0].trim(),
        authors: authors.join(', '),
        abstract: entry.summary[0].trim(),
        published: entry.published[0],
        updated: entry.updated ? entry.updated[0] : entry.published[0],
        arxivUrl: entry.id[0],
        pdfUrl: this.extractPdfUrl(entry.link),
        categories: categories,
        topic: topic,
        venue: 'arXiv',
        year: new Date(entry.published[0]).getFullYear(),
        citationCount: 0, // ArXiv doesn't provide citation counts
        keywords: this.extractKeywords(entry.summary[0], topic)
      };
    });
  }

  /**
   * Extract ArXiv ID from URL
   */
  extractArXivId(url) {
    const match = url.match(/abs\/(.+)$/);
    return match ? match[1] : url;
  }

  /**
   * Extract authors from entry
   */
  extractAuthors(authorData) {
    if (!authorData) return ['Unknown'];

    const authors = Array.isArray(authorData) ? authorData : [authorData];
    return authors.map(author => author.name[0]);
  }

  /**
   * Extract categories from entry
   */
  extractCategories(categoryData) {
    if (!categoryData) return [];

    const categories = Array.isArray(categoryData) ? categoryData : [categoryData];
    return categories.map(cat => cat.$.term);
  }

  /**
   * Extract PDF URL from links
   */
  extractPdfUrl(links) {
    if (!links) return null;

    const linkArray = Array.isArray(links) ? links : [links];
    const pdfLink = linkArray.find(link => link.$.type === 'application/pdf');
    return pdfLink ? pdfLink.$.href : null;
  }

  /**
   * Extract relevant keywords from abstract and topic
   */
  extractKeywords(abstract, topic) {
    const topicKeywords = {
      'machine learning': ['neural', 'network', 'algorithm', 'model', 'training', 'deep', 'classification', 'regression'],
      'quantum computing': ['qubit', 'quantum', 'entanglement', 'superposition', 'gate', 'circuit', 'algorithm'],
      'climate change': ['temperature', 'carbon', 'emission', 'warming', 'atmosphere', 'greenhouse', 'environmental']
    };

    const keywords = topicKeywords[topic.toLowerCase()] || [];
    const abstractLower = abstract.toLowerCase();

    return keywords.filter(keyword => abstractLower.includes(keyword));
  }

  /**
   * Fetch papers for multiple topics
   */
  async fetchPapersForAllTopics(topics = ['machine learning', 'quantum computing', 'climate change'], papersPerTopic = 20) {
    try {
      console.log('Starting to fetch papers for all topics...');
      const allPapers = [];

      for (const topic of topics) {
        const papers = await this.fetchPapersByTopic(topic, papersPerTopic);
        allPapers.push(...papers);

        // Add small delay to be respectful to ArXiv API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`Successfully fetched ${allPapers.length} total papers across ${topics.length} topics`);
      return allPapers;

    } catch (error) {
      console.error('Error fetching papers for all topics:', error.message);
      throw error;
    }
  }

  /**
   * Search papers by keywords
   */
  async searchPapers(query, maxResults = 10) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          search_query: `all:"${query}"`,
          start: 0,
          max_results: maxResults,
          sortBy: 'relevance',
          sortOrder: 'descending'
        }
      });

      const result = await this.parser.parseStringPromise(response.data);
      return this.parsePapers(result, 'search');

    } catch (error) {
      console.error('Error searching papers:', error.message);
      throw error;
    }
  }
}

module.exports = ArXivService;