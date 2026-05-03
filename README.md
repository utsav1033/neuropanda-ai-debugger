# Neuro Panda - AI Debugger

**Production error debugging powered by RAG + LLM**

Paste an error. Get root cause, related commits, and similar past incidents in seconds.

---

## 🎯 Problem

Engineering teams spend **30 mins debugging**: reading logs, searching git history, remembering "didn't we have this problem before?"

We cut that to **30 seconds** by connecting error → code → commits → incident history with AI reasoning.

---

## 🚀 Features

- **Instant Root Cause** — Error in → Root cause hypothesis in seconds
- **Incident Intelligence** — Shows similar past incidents and how they were fixed
- **Related Commits** — Links exact commits that likely caused the issue
- **Confidence Scoring** — Honest about uncertainty (e.g., "78% confident, could also be DB slowness")
- **Reasoning Chain** — See what the AI retrieved and why it reasoned that way

---

## 📋 Tech Stack

| Component | Tech |
|-----------|------|
| **Backend** | FastAPI (Python) |
| **Frontend** | Next.js (TypeScript) |
| **Vector DB** | Chroma (local) |
| **Cache** | Redis |
| **Embeddings** | Google Gemini (free) |
| **Reasoning** | Google Gemini (free) |
| **Version Control** | Git |

---

## ⚡ Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Redis (Docker or native)
- Google Gemini API key (free at https://ai.google.dev/)

### 1. Get Gemini API Key
```bash
# Visit https://ai.google.dev/
# Sign in with Google account
# Click "Create API Key"
# Copy the key
```

### 2. Clone & Setup Backend
```powershell
# Windows PowerShell

cd ai-debugger
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Create .env
@"
GOOGLE_API_KEY=your_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
CHROMA_PATH=./data/chroma_index
"@ | Out-File .env -Encoding UTF8

# Install dependencies
pip install -r requirements.txt
```

### 3. Setup Redis
```powershell
# Option A: Docker (Recommended)
docker run -d -p 6379:6379 redis:7-alpine

# Option B: Native Windows
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use Memurai: https://www.memurai.com/

# Verify
redis-cli ping
# Should output: PONG
```

### 4. Start Backend
```powershell
# Terminal 1: Backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload

# Should output: Uvicorn running on http://127.0.0.1:8000
```

### 5. Setup Frontend
```powershell
# Terminal 2: Frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Should output: ▲ Next.js running at http://localhost:3000
```

### 6. Initialize Data
```powershell
# Terminal 3: Initialize
# This indexes your repo + incidents into Chroma + Redis
curl -X POST http://127.0.0.1:8000/init

# Should output: {"status":"initialized"}
```

### 7. Test It
```powershell
# Visit http://localhost:3000
# Paste an error in the form
# Click "Analyze Error"
# See results in <3 seconds
```

---

## 📝 Usage

### Via Web Form (Easiest)

1. Visit http://localhost:3000
2. Fill in:
   - **Error Message** (required): The actual error or exception
   - **Log Excerpt**: Context from logs (optional)
   - **Code File**: Relevant code snippet (optional)
   - **Service Name** (required): Which service/API had the error
   - **Repo Link**: GitHub link to repo (optional)
3. Click "Analyze Error"
4. View results:
   - Root cause hypothesis
   - Confidence meter with uncertainty
   - Top 3 related commits (with GitHub links)
   - Similar past incidents
   - Reasoning chain (what was retrieved + why)
   - Next steps to fix

### Via API (curl)

```powershell
# Windows PowerShell
$body = @{
    error_text = "TimeoutError: POST /api/payments timed out after 30s"
    log_excerpt = "2025-04-28T14:32:15Z ERROR payment-api: connection timeout"
    code_file = "def process_payment(order): timeout_ms = 30000"
    service_name = "payment-api"
    repo_link = ""
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri http://127.0.0.1:8000/analyze_error `
  -Method POST `
  -ContentType "application/json" `
  -Body $body | Select-Object -ExpandProperty Content
```

**Response:**
```json
{
  "root_cause": "Commit abc123def changed timeout config from 5s to 30s without updating buffer pool",
  "affected_file": "services/payment/config.py",
  "affected_line": 47,
  "confidence": {
    "score": 0.78,
    "reasoning": "Found matching commits and similar incidents",
    "uncertainty": "Could also be DB slowness (40%)"
  },
  "related_commits": [
    {
      "hash": "abc123def",
      "message": "Increase timeout for payment API",
      "relevance_score": 0.95,
      "github_link": "https://github.com/user/repo/commit/abc123def"
    }
  ],
  "similar_incidents": [
    {
      "title": "Payment API timeout (March 15)",
      "fix_applied": "Reverted timeout, increased buffer pool to 200",
      "resolution_time": "45 minutes"
    }
  ],
  "reasoning_chain": {
    "retrieval": "Found 5 code files, 3 similar incidents, 5 related commits",
    "analysis": "Config change is most likely because it matches error type and timing",
    "alternatives": ["DB query slowdown (40%)", "Network issue (20%)"]
  },
  "next_steps": [
    "Revert timeout config to 5s",
    "Increase buffer pool size to 200",
    "Monitor query latency"
  ]
}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              Frontend (Next.js)                  │
│  Form: paste error + context                     │
│  Display: root cause + confidence + incidents    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│            Backend (FastAPI)                     │
│  1. Parse error                                  │
│  2. RAG: Retrieve context (code + incidents)    │
│  3. Augment: Format context for LLM              │
│  4. Reason: Call Gemini for analysis             │
│  5. Score: Calculate confidence                  │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌────────┐ ┌─────────┐ ┌────────┐
   │Vector  │ │ Redis   │ │Gemini  │
   │  DB    │ │ Cache   │ │  API   │
   │Chroma  │ │         │ │        │
   └────────┘ └─────────┘ └────────┘
```

### Data Flow

```
Error Input
    │
    ├─→ Embed error (Gemini)
    ├─→ Search Vector DB (code + incidents + commits)
    ├─→ Search Redis cache (common errors + recent commits)
    ├─→ Augment prompt with all context
    ├─→ Call Gemini LLM for reasoning
    ├─→ Calculate confidence score
    └─→ Return JSON response
```

---

## 📁 Project Structure

```
ai-debugger/
├── backend/
│   ├── main.py                 # FastAPI app & routes
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables
│   ├── services/
│   │   ├── embedding.py         # Vector embeddings (Gemini)
│   │   ├── retrieval.py         # RAG pipeline
│   │   ├── reasoning.py         # LLM reasoning (Gemini)
│   │   ├── cache.py             # Redis cache
│   │   └── confidence.py        # Confidence scoring
│   ├── utils/
│   │   └── git_loader.py        # Git repo parsing
│   ├── data/
│   │   ├── incidents.json       # Pre-written incident records
│   │   └── chroma_index/        # Vector DB (auto-created)
│   └── venv/                    # Virtual environment
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Input form + results
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.ts
│
└── README.md (this file)
```

---

## 🔧 Configuration

### Backend Environment Variables (.env)

```env
# Gemini API
GOOGLE_API_KEY=sk-xxxxxxxxxxxxx

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Chroma Vector DB
CHROMA_PATH=./data/chroma_index

# Git Repo (optional, auto-detected if not set)
GITHUB_REPO_PATH=../your-fastapi-repo
```

### Frontend Configuration

The frontend automatically connects to `http://127.0.0.1:8000` for local development.

For production, update the API URL in frontend code before deploying.

---

## 🧪 Testing

### Health Check
```powershell
curl http://127.0.0.1:8000/health
# Output: {"status":"ok"}
```

### Initialize (One-time)
```powershell
curl -X POST http://127.0.0.1:8000/init
# Output: {"status":"initialized"}
```

### Analyze Error
```powershell
# See "Usage" section above for full example
```

### Check Vector DB
```powershell
python

import chromadb
db = chromadb.PersistentClient(path="backend/data/chroma_index")
collections = db.list_collections()
print(f"Collections: {[c.name for c in collections]}")
# Should output: ['code_files', 'incidents', 'commits']

code_files = db.get_collection("code_files")
print(f"Code files indexed: {code_files.count()}")

exit()
```

### Check Redis
```powershell
redis-cli
KEYS *
# Should show service keys like: service:payment-api:common_errors
exit
```

---

## 📊 Incident Data Format

Your `backend/data/incidents.json` should follow this structure:

```json
[
  {
    "id": "incident_001",
    "title": "Payment API Timeout",
    "service": "payment-api",
    "error_message": "TimeoutError: POST /api/payments timed out after 30s",
    "log_excerpt": "2025-04-28T14:32:15Z ERROR [payment-api] connection timeout",
    "root_cause": "Commit abc123def changed timeout config from 5s to 30s without updating buffer pool",
    "affected_file": "services/payment/config.py",
    "affected_line": 47,
    "related_commit_hash": "abc123def",
    "related_commit_message": "Increase timeout for payment API",
    "fix_applied": "Reverted timeout to 5s and increased buffer pool to 200",
    "fix_commit_hash": "xyz789abc",
    "resolution_time_minutes": 45,
    "date": "2025-03-15",
    "similar_pattern": "Same root cause appeared on March 10"
  }
]
```

Add 5-8 of these based on real bugs in your repository.

---

## 🚨 Troubleshooting

### Backend won't start
```powershell
# Check Python version
python --version  # Should be 3.9+

# Check virtual environment
.\venv\Scripts\Activate.ps1

# Check dependencies
pip list | findstr fastapi

# Check port 8000 not in use
netstat -ano | findstr :8000
```

### Gemini API errors
```powershell
# Check API key in .env
type backend\.env | findstr GOOGLE_API_KEY

# Verify key is valid (visit https://ai.google.dev/)
# Check rate limit: Free tier = 1M tokens/day
```

### Redis connection refused
```powershell
# Check Redis running
redis-cli ping  # Should output: PONG

# If not running:
docker run -d -p 6379:6379 redis:7-alpine

# Check port 6379
netstat -ano | findstr :6379
```

### CORS errors in browser
```
Issue: Frontend can't reach backend
Solution:
  1. Check backend is running: http://127.0.0.1:8000/health
  2. Check CORS middleware in main.py (should allow all origins)
  3. Restart backend
```

### No results from analyze_error
```powershell
# Check Chroma indexed correctly
curl -X POST http://127.0.0.1:8000/init

# Verify incidents.json exists
ls backend\data\incidents.json

# Check Chroma collections
python -c "import chromadb; db = chromadb.PersistentClient(path='backend/data/chroma_index'); print(db.list_collections())"
```

---

## 📈 Performance

**Target metrics:**
- Analysis latency: <3 seconds
- Free tier limit: 1M tokens/day (>10k requests)
- Vector DB query: <100ms
- Redis cache hit rate: >80%

---

## 🔮 Future Roadmap

- [ ] VSCode extension for IDE integration
- [ ] Sentry/Datadog webhook integration
- [ ] Live log streaming & auto-analysis
- [ ] Runbook generation from past incidents
- [ ] Multi-tenant SaaS deployment
- [ ] Auto-remediation suggestions
- [ ] Incident correlation across services
- [ ] Team collaboration & feedback loop

---

## 📝 License

MIT

---

## 👤 Author

Built for Y Combinator Summer 2026 batch.

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 💬 Questions?

Check the [testing checklist](./testing_checklist.md) for detailed debugging steps.

For API docs, visit: http://127.0.0.1:8000/docs (when backend is running)

---

## 🎯 Next Steps

1. **Setup** — Follow "Quick Start" above
2. **Test** — Run the test commands
3. **Demo** — Record a screencast showing the flow
4. **Deploy** — Push to Render (backend) + Vercel (frontend)
5. **Ship** — Apply to YC

---

**Made with ❤️ for engineering teams at 3am**
