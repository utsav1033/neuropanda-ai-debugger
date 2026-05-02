# In backend/services/confidence.py

class ConfidenceScorer:
    def score(self, llm_response, retrieval_context):
        """Calculate confidence based on evidence"""
        
        score = 0.5  # Base
        
        # Boost if we found related commits
        if retrieval_context.get("related_commits"):
            score += 0.2
        
        # Boost if we found similar incidents
        if retrieval_context.get("similar_incidents"):
            score += 0.15
        
        # Boost if error message was clear
        if len(retrieval_context["error"]) > 50:
            score += 0.1
        
        # Cap at 1.0
        score = min(score, 0.95)
        
        return score
    
    def format_with_uncertainty(self, score, alternatives):
        """Return confidence + uncertainty explanation"""
        return {
            "score": round(score, 2),
            "reasoning": f"Found matching commits and {len(alternatives)} alternative causes",
            "uncertainty": f"Alternative hypotheses: {alternatives}"
        }

# Usage:
# scorer = ConfidenceScorer()
# confidence = scorer.score(llm_response, context)