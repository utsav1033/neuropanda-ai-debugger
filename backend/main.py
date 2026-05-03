# In backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

from services.retrieval import RAGPipeline
from services.reasoning import ReasoningService
from services.confidence import ConfidenceScorer

load_dotenv()

app = FastAPI(title="AI Debugger")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
rag = RAGPipeline()
reasoner = ReasoningService()
scorer = ConfidenceScorer()

# Models
class DebugRequest(BaseModel):
    error_text: str
    log_excerpt: str = ""
    code_file: str = ""
    service_name: str
    repo_link: str = ""

class DebugResponse(BaseModel):
    root_cause: str
    affected_file: str
    affected_line: int
    confidence: dict
    related_commits: list
    similar_incidents: list
    reasoning_chain: dict
    next_steps: list

# Routes
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze_error")
async def analyze_error(request: DebugRequest):
    """Main endpoint"""
    
    # 1. Retrieve context (RAG)
    context = rag.retrieve_context(request.error_text, request.service_name)
    
    # 2. Build prompt
    full_text = f"{request.error_text}\n{request.log_excerpt}\n{request.code_file}"
    prompt = rag.build_prompt(full_text, context)
    
    # 3. Reason (Claude)
    analysis = reasoner.analyze_error(prompt)
    
    # 4. Score confidence
    confidence = scorer.score(analysis, context)
    confidence_formatted = scorer.format_with_uncertainty(
        confidence,
        analysis.get("alternative_hypotheses", [])
    )
    
    # 5. Format response
    return {
        "root_cause": analysis.get("root_cause", "Unable to determine"),
        "affected_file": analysis.get("culprit_file", "Unknown"),
        "affected_line": analysis.get("culprit_line", 0),
        "confidence": confidence_formatted,
        "related_commits": context.get("related_commits", [])[:3],
        "similar_incidents": context.get("similar_incidents", []),
        "reasoning_chain": {
            "retrieval": f"Found {len(context['similar_code'])} code files, {len(context['similar_incidents'])} incidents",
            "analysis": analysis.get("analysis", ""),
            "alternatives": analysis.get("alternative_hypotheses", [])
        },
        "next_steps": analysis.get("next_steps", [])
    }

@app.post("/init")
async def initialize():
    """One-time setup: index repo"""
    from utils.git_loader import GitLoader
    
    repo_path = os.getenv("GITHUB_REPO_PATH", "..")
    loader = GitLoader(repo_path)
    
    # Initialize collections
    rag.embedder.create_collections()

    # Index files
    files = loader.get_file_list()
    rag.embedder.index_code_files(files)
    
    # Index incidents
    import json
    with open("data/incidents/incidents.json") as f:
        incidents = json.load(f)
    rag.embedder.index_incidents(incidents)
    
    return {"status": "initialized"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)