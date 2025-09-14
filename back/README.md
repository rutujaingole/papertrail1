# PaperTrail Backend

Backend API for PaperTrail Research Copilot - integrating AnythingLLM and ONNX for intelligent research paper management.

## 🚀 Features

- **AnythingLLM Integration**: Document processing, embeddings, and RAG capabilities
- **ONNX Citation Processing**: Fast citation extraction and formatting
- **Multi-format Support**: PDF, DOC, DOCX paper uploads
- **Citation Styles**: IEEE, APA, MLA, Chicago formatting
- **Real-time Chat**: AI-powered research assistance
- **Paper Management**: Library, selection, and content synthesis
- **RESTful API**: Complete endpoints for frontend integration

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/        # Request handlers
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic & external integrations
│   │   ├── AnythingLLMService.js    # AnythingLLM integration
│   │   ├── ONNXCitationService.js   # ONNX-based citation processing
│   │   └── DatabaseService.js       # SQLite database operations
│   ├── middleware/        # Express middleware
│   ├── models/           # Data models
│   └── utils/            # Helper functions
├── config/               # Configuration files
├── tests/               # Test files
├── logs/                # Application logs
├── data/                # SQLite database files
├── uploads/             # Uploaded paper files
└── models/              # ONNX model files
```

## 🛠 Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Create directories:**
   ```bash
   mkdir -p data logs uploads models
   ```

4. **Start the server:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Server
PORT=3001
NODE_ENV=development

# AnythingLLM
ANYTHINGLLM_URL=http://localhost:3001
ANYTHINGLLM_API_KEY=your_api_key_here

# Database
DATABASE_PATH=./data/papertrail.db

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# ONNX Models
ONNX_MODELS_PATH=./models
```

## 📡 API Endpoints

### Chat & AI
- `POST /api/chat/message` - Send chat message with paper context
- `POST /api/chat/populate` - AI content population
- `POST /api/chat/cite` - Generate citations
- `POST /api/chat/summarize` - Summarize papers
- `GET /api/chat/history/:sessionId` - Get chat history

### Papers
- `GET /api/papers` - Get all papers
- `GET /api/papers/:id` - Get specific paper
- `POST /api/papers` - Add new paper
- `PUT /api/papers/:id` - Update paper
- `DELETE /api/papers/:id` - Delete paper
- `PATCH /api/papers/:id/select` - Toggle selection

### Citations
- `POST /api/citations/extract` - Extract citations from text
- `POST /api/citations/format` - Format citations (IEEE/APA/MLA)
- `POST /api/citations/bibliography` - Generate bibliography

### File Upload
- `POST /api/upload/paper` - Upload single paper
- `POST /api/upload/papers` - Upload multiple papers
- `GET /api/upload/status/:id` - Check upload status

## 🤖 AnythingLLM Integration

### Setup AnythingLLM

1. **Install AnythingLLM:**
   ```bash
   # Docker method
   docker pull mintplexlabs/anythingllm

   # Or download from: https://anythingllm.com/
   ```

2. **Start AnythingLLM:**
   ```bash
   # Default port 3001
   docker run -p 3001:3001 mintplexlabs/anythingllm
   ```

3. **Configure API:**
   - Set `ANYTHINGLLM_URL` in your .env
   - Get API key from AnythingLLM dashboard
   - Set `ANYTHINGLLM_API_KEY` in your .env

### Usage

The backend automatically:
- Creates workspaces for paper collections
- Generates embeddings for similarity search
- Provides context-aware AI responses
- Processes documents for RAG capabilities

## 🧠 ONNX Integration

### Citation Processing

The ONNX service provides fast, on-device:
- Citation extraction from papers
- Reference formatting (IEEE, APA, MLA, Chicago)
- Pattern-based text analysis
- NLP-powered author detection

### Adding Custom Models

1. **Place ONNX models in `/models/` directory:**
   - `citation-extractor.onnx`
   - `reference-formatter.onnx`

2. **Update configuration:**
   ```env
   CITATION_MODEL_PATH=./models/citation-extractor.onnx
   REFERENCE_MODEL_PATH=./models/reference-formatter.onnx
   ```

## 🗄 Database Schema

### Papers Table
```sql
CREATE TABLE papers (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT,
  abstract TEXT,
  year INTEGER,
  venue TEXT,
  doi TEXT,
  file_path TEXT,
  is_selected BOOLEAN,
  content_text TEXT,
  embeddings BLOB
);
```

### Chat History
```sql
CREATE TABLE chat_history (
  id INTEGER PRIMARY KEY,
  session_id TEXT,
  role TEXT,
  message TEXT,
  timestamp DATETIME,
  paper_context TEXT
);
```

## 🧪 Testing

```bash
# Run tests
npm test

# Health check
curl http://localhost:3001/health

# Test API endpoints
npm run test:api
```

## 🔧 Development

### Adding New Endpoints

1. **Create route** in `/src/routes/`
2. **Add controller** in `/src/controllers/`
3. **Add service logic** in `/src/services/`
4. **Update documentation**

### Integration with Frontend

The backend provides a complete API for the React frontend. Key integration points:

- **Real-time chat** with paper context
- **File upload** with processing status
- **Citation generation** in multiple formats
- **Content population** based on selected papers

## 📊 Monitoring

- **Logs**: Check `/logs/` directory
- **Health**: `GET /health` endpoint
- **Database**: SQLite browser for data inspection

## 🚀 Deployment

### Production Setup

1. **Environment variables:**
   ```bash
   NODE_ENV=production
   PORT=3001
   ```

2. **Process manager:**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start src/server.js --name papertrail-backend
   ```

3. **Reverse proxy** (nginx/apache) for SSL termination

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.