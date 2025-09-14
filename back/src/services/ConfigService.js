const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

class ConfigService {
  constructor() {
    this.config = null;
    this.loadConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(process.cwd(), '../config.yaml');

      // Check if config.yaml exists, if not use environment variables
      if (fs.existsSync(configPath)) {
        const fileContents = fs.readFileSync(configPath, 'utf8');
        this.config = yaml.parse(fileContents);
        console.log('Configuration loaded from config.yaml');
      } else {
        console.log('config.yaml not found, using environment variables');
        this.config = this.getEnvConfig();
      }
    } catch (error) {
      console.error('Error loading config:', error);
      // Fallback to environment variables
      this.config = this.getEnvConfig();
    }
  }

  getEnvConfig() {
    return {
      api_key: process.env.ANYTHINGLLM_API_KEY || '',
      model_server_base_url: process.env.ANYTHINGLLM_URL || 'http://localhost:1234',
      workspace_slug: process.env.WORKSPACE_SLUG || 'papertrail-chat',
      stream: process.env.STREAM === 'true' || false,
      stream_timeout: parseInt(process.env.STREAM_TIMEOUT) || 120000,
      backend: {
        port: parseInt(process.env.PORT) || 3002,
        base_url: process.env.BACKEND_URL || 'http://localhost:3002'
      },
      ollama: {
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.2:3b'
      },
      database: {
        path: process.env.DATABASE_PATH || './data/papertrail.db'
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || './logs/papertrail.log'
      }
    };
  }

  get(key) {
    if (!this.config) {
      this.loadConfig();
    }

    return this.getNestedValue(this.config, key);
  }

  getNestedValue(obj, path) {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      result = result?.[key];
      if (result === undefined) {
        return undefined;
      }
    }

    return result;
  }

  // Specific getters for commonly used values
  getApiKey() {
    return this.get('api_key');
  }

  getModelServerBaseUrl() {
    return this.get('model_server_base_url');
  }

  getWorkspaceSlug() {
    return this.get('workspace_slug');
  }

  getStream() {
    return this.get('stream');
  }

  getStreamTimeout() {
    return this.get('stream_timeout');
  }

  getOllamaUrl() {
    return this.get('ollama.url');
  }

  getOllamaModel() {
    return this.get('ollama.model');
  }

  getBackendPort() {
    return this.get('backend.port');
  }

  getDatabasePath() {
    return this.get('database.path');
  }

  reload() {
    this.config = null;
    this.loadConfig();
  }
}

module.exports = new ConfigService();