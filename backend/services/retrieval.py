# backend/services/retrieval.py

from os import getenv
from .embedding import EmbeddingService
from .cache import CacheService

class RAGPipeline:
    def __init__(self):
        self.embedder = EmbeddingService()
        self.cache = CacheService()
    
    def retrieve_context(self, error_text, service_name):
        """Main RAG function — degrades gracefully if vector DB is unavailable"""

        # 1. Embed the error (may return None if API fails)
        error_embedding = self.embedder.embed_text(error_text)

        # 2. Search Vector DB (returns empty if embedding is None or DB uninitialized)
        similar_code      = self.embedder.search(error_embedding, "code_files",  top_k=5)
        similar_incidents = self.embedder.search(error_embedding, "incidents",   top_k=3)
        related_commits   = self.embedder.search(error_embedding, "commits",     top_k=5)

        # 3. Check Redis cache (returns [] if Redis is down)
        common_errors  = self.cache.get_common_errors(service_name)
        recent_commits = self.cache.get_recent_commits(service_name)

        # 4. Build context
        def flatten(results):
            docs = results.get("documents", [])
            # ChromaDB returns list-of-lists when querying
            if docs and isinstance(docs[0], list):
                return docs[0]
            return docs

        context = {
            "error": error_text,
            "similar_code":      flatten(similar_code)[:3],
            "similar_incidents": flatten(similar_incidents)[:2],
            "related_commits":   flatten(related_commits)[:3],
            "common_errors":     common_errors or [],
            "recent_commits":    recent_commits or []
        }

        return context

    
    def build_prompt(self, error_text, context):
        """Format context into LLM prompt"""
        prompt = f"""You are a debugging expert. Analyze this production error and provide root cause analysis.

ERROR:
{error_text}

RELATED CODE:
{chr(10).join(context['similar_code'])}

SIMILAR PAST INCIDENTS:
{chr(10).join(context['similar_incidents'])}

RELATED COMMITS:
{chr(10).join(context['related_commits'])}

Based on the above context, provide analysis in this JSON format:
{{
  "root_cause": "Clear hypothesis about what caused the error (1-2 sentences)",
  "affected_file": "Path to the most likely file",
  "affected_line": "Line number if identifiable",
  "confidence": 0.75,
  "alternative_hypotheses": [
    {{"hypothesis": "...", "probability": 0.15}},
    {{"hypothesis": "...", "probability": 0.10}}
  ],
  "reasoning": "Why you think this is the root cause",
  "next_steps": ["Step 1 to debug", "Step 2 to verify"]
}}

Respond ONLY with valid JSON, no markdown or extra text."""
        
        return prompt