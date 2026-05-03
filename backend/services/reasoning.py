# backend/services/reasoning.py

import requests
import json
from os import getenv

class ReasoningService:
    def __init__(self):
        self.api_key = getenv("GOOGLE_API_KEY")
        self.model = "gemini-2.0-flash"

    def analyze_error(self, prompt):
        """Call Gemini via REST to reason about the error"""
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models"
            f"/{self.model}:generateContent?key={self.api_key}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1}
        }

        try:
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()
            response_text = (
                response.json()["candidates"][0]["content"]["parts"][0]["text"]
            )
        except Exception as e:
            print(f"⚠️  Gemini API error: {e}")
            return self._fallback_response()

        # Parse JSON from response
        try:
            start = response_text.find('{')
            end   = response_text.rfind('}') + 1
            return json.loads(response_text[start:end])
        except Exception:
            return {"raw_response": response_text}

    def _fallback_response(self):
        return {
            "root_cause": "Unable to reach Gemini API — check your API key and network.",
            "culprit_file": "Unknown",
            "culprit_line": 0,
            "analysis": "Gemini API was unreachable during this request.",
            "alternative_hypotheses": [],
            "next_steps": ["Verify GOOGLE_API_KEY in .env", "Check API quota at aistudio.google.com"]
        }