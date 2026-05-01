import json
from services.embedding import EmbeddingService
from services.cache import CacheService

class RAGPipeline:
    def __init__(self):
        self.embedder = EmbeddingService()
        self.cache = CacheService()
    
    def retrieve_context(self, error_text, service_name):
        """Retrieve relevant context for an error"""
        
        # 1. Embed the query
        query_embedding = self.embedder.embed_text(error_text)
        
        # 2. Search collections (handling potential empty collections)
        try:
            similar_code = self.embedder.search(query_embedding, "code_files", top_k=3)
        except Exception:
            similar_code = {"documents": [[]]}
            
        try:
            similar_incidents = self.embedder.search(query_embedding, "incidents", top_k=2)
        except Exception:
            similar_incidents = {"documents": [[]]}
        
        # 3. Get recent commits from cache
        recent_commits = self.cache.get_recent_commits(service_name) or []
        
        return {
            "similar_code": similar_code.get("documents", [[]])[0] if similar_code else [],
            "similar_incidents": similar_incidents.get("documents", [[]])[0] if similar_incidents else [],
            "related_commits": recent_commits,
            "error": error_text
        }
        
    def build_prompt(self, full_text, context):
        """Build the prompt for the reasoning engine"""
        
        code_context = "\n---\n".join(context.get("similar_code", []))
        incident_context = "\n---\n".join(context.get("similar_incidents", []))
        
        prompt = f"""
You are an expert AI debugger. Analyze the following error and provide a structured JSON response.

ERROR DETAILS:
{full_text}

RELATED CODE FILES:
{code_context}

PAST SIMILAR INCIDENTS:
{incident_context}

Please provide your analysis in the exact following JSON format:
{{
  "root_cause": "Detailed explanation of the root cause",
  "culprit_file": "filename.py",
  "culprit_line": 123,
  "analysis": "Step-by-step reasoning",
  "alternative_hypotheses": ["alt 1", "alt 2"],
  "next_steps": ["step 1", "step 2"]
}}
"""
        return prompt
