# In backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from services.retrieval import RAGPipeline
from services.reasoning import ReasoningService
from services.confidence import ConfidenceScorer

load_dotenv()

# ── Globals ──────────────────────────────────────────────────
rag = RAGPipeline()
reasoner = ReasoningService()
scorer = ConfidenceScorer()

# ── Startup ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Auto-initialize Chroma on every startup (safe for Render deploys)."""
    print("🚀 NeuroPanda starting up...")
    try:
        # Test if embedding is available
        test_embed = rag.embedder.embed_text("test")

        if test_embed is not None:
            # Embedding works — index incidents
            rag.embedder.create_collections()
            incidents_path = Path("data/incidents/incidents.json")
            if incidents_path.exists():
                with open(incidents_path) as f:
                    incidents = json.load(f)
                rag.embedder.index_incidents(incidents)
                print(f"✅ Indexed {len(incidents)} incidents into ChromaDB")
        else:
            print("⚠️  Embedding unavailable — running in LLM-only mode (no vector search)")
            print("   To enable: create a new API key at aistudio.google.com/apikey")

    except Exception as e:
        print(f"⚠️  Startup indexing failed: {e}")

    yield  # App runs here

    print("👋 NeuroPanda shutting down")

# ── App ───────────────────────────────────────────────────────
app = FastAPI(title="NeuroPanda - AI Debugger", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────
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

# ── Routes ────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "app": "NeuroPanda - AI Debugger"}

@app.post("/analyze_error")
async def analyze_error(request: DebugRequest):
    """Main endpoint — RAG + Gemini reasoning"""

    # 1. Retrieve context (RAG)
    context = rag.retrieve_context(request.error_text, request.service_name)

    # 2. Build prompt
    full_text = f"{request.error_text}\n{request.log_excerpt}\n{request.code_file}"
    prompt = rag.build_prompt(full_text, context)

    # 3. Reason with Gemini
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
    """Manual re-index endpoint"""
    try:
        rag.embedder.create_collections()
        with open("data/incidents/incidents.json") as f:
            incidents = json.load(f)
        rag.embedder.index_incidents(incidents)
        return {"status": "initialized", "incidents_indexed": len(incidents)}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)